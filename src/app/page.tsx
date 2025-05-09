
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

// Updated MOCK_CODES with category and status
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

  useEffect(() => {
    return () => {
      if (sensorIntervalRef.current) {
        clearInterval(sensorIntervalRef.current);
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
      setLiveSensorData({ rpm: 750, coolantTemp: 60, speed: 0 });
      sensorIntervalRef.current = setInterval(() => {
        setLiveSensorData(prevData => {
          let currentRpm = typeof prevData.rpm === 'number' ? prevData.rpm : 750;
          let rpmChange = Math.random() * 200 - 100;
          let newRpm = currentRpm + rpmChange;
          
          let currentSpeed = typeof prevData.speed === 'number' ? prevData.speed : 0;
          let speedChange = Math.random() * 8 - 3;
          let newSpeed = currentSpeed + speedChange;
          newSpeed = Math.max(0, newSpeed);
          newSpeed = Math.min(newSpeed, 130);

          if (newSpeed < 1) {
            newRpm = 650 + Math.random() * 200;
          } else {
            if (newSpeed > 80 && newRpm < 2500) newRpm += Math.random() * 300;
            else if (newSpeed > 50 && newRpm < 2000) newRpm += Math.random() * 200;
            else if (newSpeed < 30 && newRpm > 3000) newRpm -= Math.random() * 300;
          }
          newRpm = Math.min(Math.max(newRpm, 650), 4500);

          let currentCoolantTemp = typeof prevData.coolantTemp === 'number' ? prevData.coolantTemp : 60;
          let coolantTempChange;
          if (currentCoolantTemp < 88) {
            coolantTempChange = Math.random() * 0.8 + 0.2;
          } else {
            coolantTempChange = Math.random() * 0.6 - 0.3;
          }
          let newCoolantTemp = currentCoolantTemp + coolantTempChange;
          newCoolantTemp = Math.min(Math.max(newCoolantTemp, 50), 98);

          return {
            rpm: Math.round(newRpm),
            coolantTemp: parseFloat(newCoolantTemp.toFixed(1)),
            speed: Math.round(newSpeed),
          };
        });
      }, 1500);
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
    
    let currentModuleIndex = 0;
    let tempCodes: DiagnosticCodeItem[] = [];

    const newModuleStatus = ALL_MODULES.map(name => ({ name, status: 'pending' as ModuleScanStatus }));
    setModuleStatus(newModuleStatus);

    const scanInterval = setInterval(() => {
      newModuleStatus[currentModuleIndex].status = 'scanning';
      setCurrentScanningModule(ALL_MODULES[currentModuleIndex]);
      setModuleStatus([...newModuleStatus]);

      setTimeout(() => {
        const moduleHasError = Math.random() < 0.1; 
        newModuleStatus[currentModuleIndex].status = moduleHasError ? 'error' : 'complete';
        setModuleStatus([...newModuleStatus]);

        // Simulate finding a few codes
        if (!moduleHasError && Math.random() > 0.6 && tempCodes.length < 5) { // Limit to 5 codes for demo
           const mockCodeTemplate = MOCK_CODES_TEMPLATES[tempCodes.length % MOCK_CODES_TEMPLATES.length];
           tempCodes.push({
             id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
             ...mockCodeTemplate,
           });
           setDetectedCodes([...tempCodes]);
        }

        currentModuleIndex++;
        const overallProgress = Math.round((currentModuleIndex / ALL_MODULES.length) * 100);
        setScanProgress(overallProgress);

        if (currentModuleIndex >= ALL_MODULES.length) {
          clearInterval(scanInterval);
          setIsScanning(false);
          setIsScanCompleted(true);
          setInspectionDate(new Date()); // Log inspection date
          setCurrentScanningModule(null);
          toast({ title: "Scan Complete", description: `Found ${tempCodes.length} codes. Inspection date logged.` });
        } else {
          setCurrentScanningModule(ALL_MODULES[currentModuleIndex]);
        }
      }, 1000 + Math.random() * 1000); 
    }, 1500); 

    return () => clearInterval(scanInterval);
  }, [vehicleInfo, toast, isSimulatingSensors, resetScanState]);


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
      const isStillActive = Math.random() > 0.4; // 40% chance it gets resolved by "re-scan"
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
    // This will remove resolved codes from the current view or mark them differently.
    // For this simulation, we'll filter them out. In a real app, they might be archived.
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
            detectedCodesCount={detectedCodes.length}
            onStartScan={startFullScanSimulation}
            onCancelScan={() => {
              setIsScanning(false);
              // Keep current codes and inspection date, but allow re-scan.
              // resetScanState(); // Full reset might not be desired on simple cancel
              toast({title: "Scan Cancelled", description: "Vehicle scan has been stopped."});
            }}
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
                  <AlertTriangle /> Diagnostic Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-4">Scan completed, but no diagnostic codes were found.</p>
                 <DiagnosticResults 
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

