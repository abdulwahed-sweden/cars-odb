
"use client";

import { useState, useEffect, useCallback } from "react";
import { ConnectionManager } from "@/components/car-doc/connection-manager";
import { VehicleInformation } from "@/components/car-doc/vehicle-information";
import { ScanVisualizer } from "@/components/car-doc/scan-visualizer";
import { DiagnosticResults, type DiagnosticCodeItem } from "@/components/car-doc/diagnostic-results";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { explainCode, type CodeExplanationOutput, type CodeExplanationInput } from "@/ai/flows/code-explanation";
import { RefreshCcw, Moon, Sun, Github } from "lucide-react";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
interface VehicleInfo { vin: string; make: string; model: string; year: string; }
type ModuleScanStatus = "pending" | "scanning" | "complete" | "error";
interface ModuleStatus { name: string; status: ModuleScanStatus; }

const ALL_MODULES: string[] = ['Engine Control Unit (ECU)', 'Transmission Control Module (TCM)', 'Anti-lock Braking System (ABS)', 'Body Control Module (BCM)', 'Airbag Control Unit (ACU)'];
const MOCK_CODES: Array<Omit<DiagnosticCodeItem, "id" | "explanation" | "isExplaining">> = [
  { code: "P0300", description: "Random/Multiple Cylinder Misfire Detected", severity: "high" },
  { code: "P0420", description: "Catalyst System Efficiency Below Threshold (Bank 1)", severity: "medium" },
  { code: "U0100", description: "Lost Communication With ECM/PCM \"A\"", severity: "high" },
  { code: "B1004", description: "LFC Mssg Cntr, Always use LFC Specific DTC", severity: "low" },
  { code: "C0035", description: "Left Front Wheel Speed Sensor Circuit", severity: "medium" },
];

export default function CarDocPage() {
  const [theme, setTheme] = useState("light");
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

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleConnect = (type: "usb" | "bluetooth") => {
    setConnectionStatus("connecting");
    toast({ title: "Connecting...", description: `Attempting ${type} connection.` });
    setTimeout(() => {
      // Simulate connection success/failure
      if (Math.random() > 0.2) { // 80% success rate
        setConnectionStatus("connected");
        toast({ title: "Connected!", description: `Successfully connected via ${type}.`, variant: "default" });
        // Simulate fetching vehicle info
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
  
  const resetScanState = () => {
    setIsScanning(false);
    setScanProgress(0);
    setCurrentScanningModule(null);
    setModuleStatus(ALL_MODULES.map(name => ({ name, status: "pending" })));
    setDetectedCodes([]);
    setIsScanCompleted(false);
  };

  const startFullScanSimulation = useCallback(() => {
    if (!vehicleInfo) {
      toast({ title: "Vehicle Info Missing", description: "Please provide vehicle details before scanning.", variant: "destructive" });
      return;
    }
    setIsScanning(true);
    setIsScanCompleted(false);
    setScanProgress(0);
    setDetectedCodes([]);
    setCurrentScanningModule(ALL_MODULES[0]);
    
    let currentModuleIndex = 0;
    let tempCodes: DiagnosticCodeItem[] = [];

    const newModuleStatus = ALL_MODULES.map(name => ({ name, status: 'pending' as ModuleScanStatus }));
    setModuleStatus(newModuleStatus);

    const scanInterval = setInterval(() => {
      newModuleStatus[currentModuleIndex].status = 'scanning';
      setCurrentScanningModule(ALL_MODULES[currentModuleIndex]);
      setModuleStatus([...newModuleStatus]);

      // Simulate module scan time
      setTimeout(() => {
        const moduleHasError = Math.random() < 0.1; // 10% chance of module error
        newModuleStatus[currentModuleIndex].status = moduleHasError ? 'error' : 'complete';
        setModuleStatus([...newModuleStatus]);

        // Simulate finding codes
        if (!moduleHasError && Math.random() > 0.5 && tempCodes.length < MOCK_CODES.length) {
           const newCodeIndex = tempCodes.length % MOCK_CODES.length;
           const mockCode = MOCK_CODES[newCodeIndex];
           tempCodes.push({
             id: `code-${Date.now()}-${Math.random()}`,
             ...mockCode,
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
          setCurrentScanningModule(null);
          toast({ title: "Scan Complete", description: `Found ${tempCodes.length} codes.` });
        } else {
          setCurrentScanningModule(ALL_MODULES[currentModuleIndex]);
        }
      }, 1000 + Math.random() * 1000); // Each module takes 1-2 seconds
    }, 1500); // Interval between starting module scans

    return () => clearInterval(scanInterval);
  }, [vehicleInfo, toast]);


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

  const vehicleDetailsString = vehicleInfo ? `${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year} (VIN: ${vehicleInfo.vin})` : null;

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-secondary/30 dark:bg-background transition-colors duration-300">
      <header className="w-full max-w-4xl mb-8 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-primary">CarDoc</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => window.location.reload()} aria-label="Refresh page">
            <RefreshCcw className="h-5 w-5" />
          </Button>
           <a href="https://github.com/firebase/genkit/tree/main/experimental/genkit-nextjs-starter" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" aria-label="GitHub Repository">
              <Github className="h-5 w-5" />
            </Button>
          </a>
        </div>
      </header>

      <main className="w-full max-w-4xl space-y-8">
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
                // Logic to properly stop the interval if startFullScanSimulation returns it
                toast({title: "Scan Cancelled", description: "Vehicle scan has been stopped."});
              }}
              isScanCompleted={isScanCompleted}
            />
          </>
        )}
        
        {isScanCompleted && detectedCodes.length > 0 && (
           <>
            <Separator />
            <DiagnosticResults codes={detectedCodes} onExplainCode={handleExplainCode} vehicleDetails={vehicleDetailsString} />
           </>
        )}
         {isScanCompleted && detectedCodes.length === 0 && (
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
                </CardContent>
              </Card>
           </>
        )}
      </main>
      <footer className="w-full max-w-4xl mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CarDoc. Advanced Vehicle Diagnostics.</p>
      </footer>
    </div>
  );
}
