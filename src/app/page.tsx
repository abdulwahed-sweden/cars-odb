
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ConnectionManager } from "@/components/car-doc/connection-manager";
import { VehicleInformation } from "@/components/car-doc/vehicle-information";
import { ScanVisualizer } from "@/components/car-doc/scan-visualizer";
import { DiagnosticResults, type DiagnosticCodeItem } from "@/components/car-doc/diagnostic-results";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { explainCode, type CodeExplanationOutput, type CodeExplanationInput } from "@/ai/flows/code-explanation";
import { AlertTriangle } from "lucide-react"; 
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; 


type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
export interface VehicleInfo { vin: string; make: string; model: string; year: string; }
type ModuleScanStatus = "pending" | "scanning" | "complete" | "error";
interface ModuleStatus { name: string; status: ModuleScanStatus; }
interface LiveSensorData {
  rpm: number | string;
  coolantTemp: number | string;
  speed: number | string;
}

const ALL_MODULES: string[] = ['Engine Control Unit (ECU)', 'Transmission Control Module (TCM)', 'Anti-lock Braking System (ABS)', 'Body Control Module (BCM)', 'Airbag Control Unit (ACU)'];

const MOCK_CODES_TEMPLATES: Array<Omit<DiagnosticCodeItem, "id" | "explanation" | "isExplaining">> = [
  { code: "P0300", description: "Random/Multiple Cylinder Misfire Detected", severity: "high", category: "Engine", status: "active" },
  { code: "P0420", description: "Catalyst System Efficiency Below Threshold (Bank 1)", severity: "medium", category: "Engine", status: "active" },
  { code: "U0100", description: "Lost Communication With ECM/PCM \"A\"", severity: "high", category: "Network", status: "active" },
  { code: "B1004", description: "LFC Mssg Cntr, Always use LFC Specific DTC", severity: "low", category: "Body", status: "active" },
  { code: "C0035", description: "Left Front Wheel Speed Sensor Circuit", severity: "medium", category: "Chassis", status: "active" },
  { code: "P0171", description: "System Too Lean (Bank 1)", severity: "medium", category: "Engine", status: "active"},
  { code: "P0500", description: "Vehicle Speed Sensor 'A' Malfunction", severity: "medium", category: "Drivetrain", status: "active"},
  { code: "B0012", description: "Passenger Frontal Stage 2 Deployment Control", severity: "high", category: "Body", status: "active"},
];


export default function CarDocPage() {
  const { toast } = useToast();

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanningModule, setCurrentScanningModule] = useState<string | null>(null);
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus[]>(
    ALL_MODULES.map(name => ({ name, status: "pending" }))
  );
  const [detectedCodes, setDetectedCodes] = useState<DiagnosticCodeItem[]>([]);
  const [isScanCompleted, setIsScanCompleted] = useState(false);
  const [inspectionDate, setInspectionDate] = useState<Date | null>(null);

  const [liveSensorData, setLiveSensorData] = useState<LiveSensorData>({ rpm: '---', coolantTemp: '--', speed: '--' });
  const [isSimulatingSensors, setIsSimulatingSensors] = useState(false);
  const sensorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanIntervalId = useRef<NodeJS.Timeout | null>(null);
  const scanCurrentModuleIndexRef = useRef<number>(0);


  useEffect(() => {
    return () => {
      if (sensorIntervalRef.current) {
        clearInterval(sensorIntervalRef.current);
      }
      if (scanIntervalId.current) {
        clearInterval(scanIntervalId.current);
      }
    };
  }, []);

  const handleToggleSensorSimulation = () => {
    if (isSimulatingSensors) {
      if (sensorIntervalRef.current) {
        clearInterval(sensorIntervalRef.current);
        sensorIntervalRef.current = null;
      }
      setIsSimulatingSensors(false);
      setLiveSensorData({ rpm: '---', coolantTemp: '--', speed: '--' });
      toast({ title: "Sensor Simulation Stopped"});
    } else {
      setIsSimulatingSensors(true);
      toast({ title: "Sensor Simulation Started", description: "Generating live data..."});
      setLiveSensorData({ rpm: 750, coolantTemp: 60, speed: 0 }); // Initial realistic values
      sensorIntervalRef.current = setInterval(() => {
        setLiveSensorData(prevData => {
          let currentRpm = typeof prevData.rpm === 'number' ? prevData.rpm : 750;
          let newRpm: number;
          let currentSpeed = typeof prevData.speed === 'number' ? prevData.speed : 0;
          let newSpeed: number;
          let currentCoolantTemp = typeof prevData.coolantTemp === 'number' ? prevData.coolantTemp : 60;
          let newCoolantTemp: number;

          // Speed simulation
          const accelerationChance = 0.6; 
          const decelerationChance = 0.3;
          const randomFactor = Math.random();

          if (currentSpeed < 5) { // Starting from standstill
            newSpeed = currentSpeed + Math.random() * 3; // Gentle start
          } else if (randomFactor < accelerationChance && currentSpeed < 120) { // Accelerate
            newSpeed = currentSpeed + Math.random() * 5;
          } else if (randomFactor < accelerationChance + decelerationChance && currentSpeed > 0) { // Decelerate
            newSpeed = currentSpeed - Math.random() * 7;
          } else { // Maintain speed with slight variation
            newSpeed = currentSpeed + (Math.random() * 2 - 1);
          }
          newSpeed = Math.max(0, Math.min(newSpeed, 130)); // Clamp speed

          // RPM simulation based on speed
          if (newSpeed < 1) { // Idle
            newRpm = 650 + Math.random() * 200; // 650-850 RPM
          } else if (newSpeed < 30) {
            newRpm = 1000 + newSpeed * 30 + (Math.random() * 200 - 100); // 1000-1900 RPM
          } else if (newSpeed < 70) {
            newRpm = 1500 + newSpeed * 20 + (Math.random() * 300 - 150); // 1500-2900 RPM
          } else {
            newRpm = 2000 + newSpeed * 15 + (Math.random() * 400 - 200); // 2000-3950 RPM
          }
          newRpm = Math.min(Math.max(newRpm, 600), 4500); // Clamp RPM

          // Coolant temperature simulation
          if (currentCoolantTemp < 88) {
            newCoolantTemp = currentCoolantTemp + (Math.random() * 0.5 + 0.1); // Slower warm-up
          } else { // Around operating temperature
            newCoolantTemp = currentCoolantTemp + (Math.random() * 0.4 - 0.2); // Smaller fluctuations
          }
          newCoolantTemp = Math.min(Math.max(newCoolantTemp, 20), 98); // Clamp coolant temp

          return {
            rpm: Math.round(newRpm),
            coolantTemp: parseFloat(newCoolantTemp.toFixed(1)),
            speed: Math.round(newSpeed),
          };
        });
      }, 1500); // Update interval
    }
  };

  const resetScanState = useCallback(() => {
    setIsScanning(false);
    setScanProgress(0);
    setCurrentScanningModule(null);
    setModuleStatus(ALL_MODULES.map(name => ({ name, status: "pending" })));
    setDetectedCodes([]);
    setIsScanCompleted(false);
    setInspectionDate(null);
    scanCurrentModuleIndexRef.current = 0;
    
    if (scanIntervalId.current) {
        clearInterval(scanIntervalId.current);
        scanIntervalId.current = null;
    }

    if (isSimulatingSensors) {
        if (sensorIntervalRef.current) {
            clearInterval(sensorIntervalRef.current);
            sensorIntervalRef.current = null;
        }
        setIsSimulatingSensors(false);
        setLiveSensorData({ rpm: '---', coolantTemp: '--', speed: '--' });
    }
  }, [isSimulatingSensors]);


  const handleConnect = (type: "usb" | "bluetooth") => {
    setConnectionStatus("connecting");
    toast({ title: "Connecting...", description: `Attempting ${type} connection.` });
    setTimeout(() => {
      if (Math.random() > 0.2) {
        setConnectionStatus("connected");
        toast({ title: "Connected!", description: `Successfully connected via ${type}.`, variant: "default" });
        setTimeout(() => {
          setVehicleInfo({ vin: "JN1AZ0000FAKEVIN", make: "Nissan", model: "Altima", year: "2022" });
        }, 500);
      } else {
        setConnectionStatus("error");
        toast({ title: "Connection Failed", description: `Could not connect via ${type}.`, variant: "destructive" });
      }
    }, 2000);
  };

  const handleDisconnect = () => {
    setConnectionStatus("disconnected");
    setVehicleInfo(null);
    resetScanState();
    toast({ title: "Disconnected", description: "OBD connection closed." });
  };

  const handleSaveVehicleInfo = (info: VehicleInfo) => {
    setVehicleInfo(info);
    toast({ title: "Vehicle Info Saved", description: `${info.make} ${info.model} (${info.year}) details updated.` });
  };
  
  const cancelScan = useCallback(() => {
    setIsScanning(false);
    if (scanIntervalId.current) {
      clearInterval(scanIntervalId.current);
      scanIntervalId.current = null;
    }
    // Keep current codes and inspection date, but allow re-scan.
    toast({title: "Scan Cancelled", description: "Vehicle scan has been stopped."});
  }, [toast]);


  const startFullScanSimulation = useCallback(() => {
    if (!vehicleInfo) {
      toast({ title: "Vehicle Info Missing", description: "Please provide vehicle details before scanning.", variant: "destructive" });
      return;
    }

    if (isSimulatingSensors) {
        if (sensorIntervalRef.current) {
            clearInterval(sensorIntervalRef.current);
            sensorIntervalRef.current = null;
        }
        setIsSimulatingSensors(false);
        setLiveSensorData({ rpm: '---', coolantTemp: '--', speed: '--' });
        toast({ title: "Sensor Simulation Stopped", description: "Starting full vehicle scan."});
    }

    resetScanState(); // Ensure clean state before new scan
    setIsScanning(true);
    scanCurrentModuleIndexRef.current = 0;
    
    const initialModuleStatuses = ALL_MODULES.map(name => ({ name, status: 'pending' as ModuleScanStatus }));
    setModuleStatus(initialModuleStatuses);
    
    let tempCodesHolder: DiagnosticCodeItem[] = []; // Use a local variable to accumulate codes before setting state once

    scanIntervalId.current = setInterval(() => {
      if (!isScanningRef.current || scanCurrentModuleIndexRef.current >= ALL_MODULES.length) {
        if (scanIntervalId.current) clearInterval(scanIntervalId.current);
        if(isScanningRef.current && scanCurrentModuleIndexRef.current >= ALL_MODULES.length){ // Natural completion
            setIsScanning(false);
            setIsScanCompleted(true);
            setInspectionDate(new Date());
            setCurrentScanningModule(null);
            setDetectedCodes(tempCodesHolder);
            toast({ title: "Scan Complete", description: `Found ${tempCodesHolder.length} codes. Inspection date logged.` });
        }
        return;
      }

      const moduleIndexForThisScan = scanCurrentModuleIndexRef.current;
      
      setCurrentScanningModule(ALL_MODULES[moduleIndexForThisScan]);
      setModuleStatus(prevModules => 
        prevModules.map((mod, index) => 
          index === moduleIndexForThisScan ? { ...mod, status: 'scanning' } : mod
        )
      );

      setTimeout(() => {
        if (!isScanningRef.current) return; // Check if scan was cancelled during timeout

        const moduleHasError = Math.random() < 0.1; 
        
        setModuleStatus(prevModules => 
          prevModules.map((mod, index) => 
            index === moduleIndexForThisScan ? { ...mod, status: moduleHasError ? 'error' : 'complete' } : mod
          )
        );

        if (!moduleHasError && Math.random() > 0.6 && tempCodesHolder.length < 5) {
           const mockCodeTemplate = MOCK_CODES_TEMPLATES[tempCodesHolder.length % MOCK_CODES_TEMPLATES.length];
           tempCodesHolder.push({
             id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
             ...mockCodeTemplate,
           });
        }
        
        scanCurrentModuleIndexRef.current++;
        const overallProgress = Math.round((scanCurrentModuleIndexRef.current / ALL_MODULES.length) * 100);
        setScanProgress(overallProgress);

        if (scanCurrentModuleIndexRef.current >= ALL_MODULES.length) {
          if (scanIntervalId.current) clearInterval(scanIntervalId.current);
          setIsScanning(false);
          setIsScanCompleted(true);
          setInspectionDate(new Date());
          setCurrentScanningModule(null);
          setDetectedCodes(tempCodesHolder); // Set codes once at the end
          toast({ title: "Scan Complete", description: `Found ${tempCodesHolder.length} codes. Inspection date logged.` });
        }
      }, 1000 + Math.random() * 1000); 
    }, 1500);

    return () => {
        if(scanIntervalId.current) clearInterval(scanIntervalId.current);
    }

  }, [vehicleInfo, toast, isSimulatingSensors, resetScanState]);
  
  // Ref to keep track of isScanning state for intervals/timeouts
  const isScanningRef = useRef(isScanning);
  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);


  const handleExplainCode = async (codeId: string, code: string, vehicleDetailsStr: string | null) => {
    setDetectedCodes(prev => prev.map(c => c.id === codeId ? { ...c, isExplaining: true } : c));
    toast({ title: "AI Explaining Code", description: `Fetching explanation for ${code}...` });
    try {
      const input: CodeExplanationInput = {
        code,
        vehicleDetails: vehicleDetailsStr || "Not specified"
      };
      const explanationResult = await explainCode(input);
      setDetectedCodes(prev => prev.map(c => c.id === codeId ? { ...c, explanation: explanationResult, isExplaining: false } : c));
      toast({ title: "Explanation Received", description: `AI explanation for ${code} loaded.`, variant: "default" });
    } catch (error) {
      console.error("Error explaining code:", error);
      setDetectedCodes(prev => prev.map(c => c.id === codeId ? { ...c, isExplaining: false } : c));
      toast({ title: "AI Explanation Failed", description: `Could not get explanation for ${code}.`, variant: "destructive" });
    }
  };

  const handleConfirmCodeResolution = (codeId: string) => {
    setDetectedCodes(prev => prev.map(c => c.id === codeId ? { ...c, status: "resolved" } : c));
    toast({ title: "Code Resolved", description: `Code marked as resolved.` });
  };

  const handleRescanSpecificCode = (codeId: string) => {
    const codeToRescan = detectedCodes.find(c => c.id === codeId);
    if (!codeToRescan) return;

    setDetectedCodes(prev => prev.map(c => c.id === codeId ? { ...c, status: "pending_rescan", explanation: undefined, isExplaining: false } : c));
    toast({ title: "Re-scan Initiated", description: `Re-scanning for code ${codeToRescan.code}... (simulation)` });
    
    setTimeout(() => {
      const isStillActive = Math.random() > 0.4; 
      setDetectedCodes(prev => prev.map(c => {
        if (c.id === codeId) {
          const newStatus = isStillActive ? "active" : "resolved";
          toast({ title: "Re-scan Complete", description: `Code ${c.code} is now ${newStatus}.` });
          return { ...c, status: newStatus };
        }
        return c;
      }));
    }, 2500);
  };

  const handleResetResolvedCodes = () => {
    const activeCodes = detectedCodes.filter(code => code.status !== "resolved");
    if (activeCodes.length === detectedCodes.length) {
        toast({ title: "No Resolved Codes", description: "There are no resolved codes to clear from the current list.", variant: "default"});
    } else {
        setDetectedCodes(activeCodes);
        toast({ title: "Resolved Codes Cleared", description: "Previously resolved codes have been cleared from this view." });
    }
  };

  const vehicleDetailsString = vehicleInfo ? `${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year} (VIN: ${vehicleInfo.vin})` : null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <ConnectionManager status={connectionStatus} onConnect={handleConnect} onDisconnect={handleDisconnect} />

      {connectionStatus === 'connected' && (
        <>
          <Separator />
          <VehicleInformation 
            initialInfo={vehicleInfo} 
            onSave={handleSaveVehicleInfo} 
            isEditable={true} 
          />
        </>
      )}

      {vehicleInfo && connectionStatus === 'connected' && (
        <>
          <Separator />
          <ScanVisualizer
            isScanning={isScanning}
            scanProgress={scanProgress}
            currentScanningModule={currentScanningModule}
            moduleStatus={moduleStatus}
            detectedCodesCount={detectedCodes.filter(c => c.status !== 'resolved').length} // Show active codes count
            onStartScan={startFullScanSimulation}
            onCancelScan={cancelScan}
            isScanCompleted={isScanCompleted}
            inspectionDate={inspectionDate}
          />
        </>
      )}
      
      {isScanCompleted && (detectedCodes.length > 0 || connectionStatus === 'connected') && (
         <>
          <Separator />
          <DiagnosticResults 
            codes={detectedCodes} 
            onExplainCode={handleExplainCode} 
            vehicleDetails={vehicleDetailsString}
            vehicleInfo={vehicleInfo}
            liveSensorData={liveSensorData}
            isSimulatingSensors={isSimulatingSensors}
            onToggleSensorSimulation={handleToggleSensorSimulation}
            onConfirmResolution={handleConfirmCodeResolution}
            onRescanCode={handleRescanSpecificCode}
            onResetResolvedCodes={handleResetResolvedCodes}
            inspectionDate={inspectionDate}
          />
         </>
      )}
       {isScanCompleted && detectedCodes.length === 0 && connectionStatus === 'connected' && (
         <>
          <Separator />
           <Card className="w-full max-w-lg shadow-lg mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle /> Diagnostic Scan Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-4">Scan completed, but no diagnostic codes were found.</p>
                 <DiagnosticResults // Still show this for sensor data and other info
                    codes={[]} 
                    onExplainCode={handleExplainCode} 
                    vehicleDetails={vehicleDetailsString}
                    vehicleInfo={vehicleInfo}
                    liveSensorData={liveSensorData}
                    isSimulatingSensors={isSimulatingSensors}
                    onToggleSensorSimulation={handleToggleSensorSimulation}
                    onConfirmResolution={handleConfirmCodeResolution}
                    onRescanCode={handleRescanSpecificCode}
                    onResetResolvedCodes={handleResetResolvedCodes}
                    inspectionDate={inspectionDate}
                  />
              </CardContent>
            </Card>
         </>
      )}
    </div>
  );
}


    