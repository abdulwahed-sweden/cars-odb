
"use client";

import type * as React from "react";
import type { CodeExplanationOutput } from "@/ai/flows/code-explanation";
import type { VehicleInfo } from "@/app/page"; // Import VehicleInfo
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, BrainCircuit, Gauge, ListChecks, Loader2, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX, Wand2, Activity, StopCircle, CheckCircle, RefreshCw, Trash2, SlidersHorizontal, CalendarClock, Wrench } from "lucide-react";

export interface DiagnosticCodeItem {
  id: string;
  code: string;
  description: string;
  severity: "low" | "medium" | "high" | "unknown";
  category: "Engine" | "Drivetrain" | "Body" | "Chassis" | "Network" | "Unknown";
  status: "active" | "resolved" | "pending_rescan";
  explanation?: CodeExplanationOutput;
  isExplaining?: boolean;
}

interface LiveSensorDataItem {
  rpm: number | string;
  coolantTemp: number | string;
  speed: number | string;
}

interface DiagnosticResultsProps {
  codes: DiagnosticCodeItem[];
  onExplainCode: (codeId: string, code: string, vehicleDetails: string | null) => void;
  vehicleDetails: string | null;
  vehicleInfo: VehicleInfo | null; // Added for standard values
  liveSensorData: LiveSensorDataItem;
  isSimulatingSensors: boolean;
  onToggleSensorSimulation: () => void;
  onConfirmResolution: (codeId: string) => void;
  onRescanCode: (codeId: string) => void;
  onResetResolvedCodes: () => void;
  inspectionDate: Date | null;
}

export function DiagnosticResults({ 
  codes, 
  onExplainCode, 
  vehicleDetails,
  vehicleInfo,
  liveSensorData,
  isSimulatingSensors,
  onToggleSensorSimulation,
  onConfirmResolution,
  onRescanCode,
  onResetResolvedCodes,
  inspectionDate,
}: DiagnosticResultsProps) {
  const getSeverityBadge = (severity: DiagnosticCodeItem["severity"]) => {
    switch (severity) {
      case "low":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white whitespace-nowrap"><ShieldCheck className="mr-1 h-3 w-3" />Low</Badge>;
      case "medium":
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-black whitespace-nowrap"><ShieldAlert className="mr-1 h-3 w-3" />Medium</Badge>;
      case "high":
        return <Badge variant="destructive" className="whitespace-nowrap"><ShieldX className="mr-1 h-3 w-3" />High</Badge>;
      default:
        return <Badge variant="secondary" className="whitespace-nowrap"><ShieldQuestion className="mr-1 h-3 w-3" />Unknown</Badge>;
    }
  };

  const getCategoryBadge = (category: DiagnosticCodeItem["category"]) => {
    let colorClass = "bg-gray-500 hover:bg-gray-600"; // Default for Unknown
    if (category === "Engine") colorClass = "bg-red-500 hover:bg-red-600";
    else if (category === "Drivetrain") colorClass = "bg-blue-500 hover:bg-blue-600";
    else if (category === "Body") colorClass = "bg-purple-500 hover:bg-purple-600";
    else if (category === "Chassis") colorClass = "bg-indigo-500 hover:bg-indigo-600";
    else if (category === "Network") colorClass = "bg-teal-500 hover:bg-teal-600";
    
    return <Badge className={`${colorClass} text-white text-xs whitespace-nowrap`}>{category}</Badge>;
  };

  const sensorDisplayData = [
    { name: "Engine RPM", value: liveSensorData.rpm, unit: "RPM", icon: <Gauge className="mx-auto mb-1 h-8 w-8 text-accent" /> },
    { name: "Coolant Temp", value: liveSensorData.coolantTemp, unit: "°C", icon: <Gauge className="mx-auto mb-1 h-8 w-8 text-accent" /> },
    { name: "Vehicle Speed", value: liveSensorData.speed, unit: "km/h", icon: <Gauge className="mx-auto mb-1 h-8 w-8 text-accent" /> },
  ];

  const activeCodesCount = codes.filter(c => c.status === 'active').length;
  const resolvedCodesCount = codes.filter(c => c.status === 'resolved').length;

  return (
    <div className="w-full max-w-3xl space-y-6">
      {inspectionDate && vehicleInfo && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock /> Inspection Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><strong>Date:</strong> {inspectionDate.toLocaleDateString()} {inspectionDate.toLocaleTimeString()}</p>
            <p><strong>Vehicle:</strong> {vehicleInfo.make} {vehicleInfo.model} ({vehicleInfo.year})</p>
            <p><strong>VIN:</strong> {vehicleInfo.vin}</p>
            <Separator className="my-2"/>
            <p><strong>Total Codes Found:</strong> {codes.length}</p>
            <p><strong>Active Codes:</strong> {activeCodesCount}</p>
            <p><strong>Resolved Codes:</strong> {resolvedCodesCount}</p>
          </CardContent>
        </Card>
      )}

      {codes.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                <AlertTriangle /> Diagnostic Trouble Codes ({codes.length})
                </CardTitle>
                {resolvedCodesCount > 0 && (
                    <Button onClick={onResetResolvedCodes} size="sm" variant="outline">
                        <Trash2 className="mr-2 h-4 w-4" /> Clear {resolvedCodesCount} Resolved Code(s)
                    </Button>
                )}
            </div>
            <CardDescription>Review the detected codes and their explanations. Categorized for clarity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {codes.map((item) => (
                <AccordionItem value={item.id} key={item.id} className={item.status === 'resolved' ? 'opacity-70' : ''}>
                  <AccordionTrigger className="hover:bg-muted/50 px-3 rounded-md text-left">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                           <span className="font-mono text-accent">{item.code}</span>
                           {getCategoryBadge(item.category)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 sm:mt-0 self-start sm:self-center">
                        {item.status === 'resolved' && <Badge variant="default" className="bg-green-100 text-green-700 border-green-300 whitespace-nowrap"><CheckCircle className="mr-1 h-3 w-3 text-green-500"/>Resolved</Badge>}
                        {item.status === 'pending_rescan' && <Badge variant="outline" className="whitespace-nowrap"><Loader2 className="mr-1 h-3 w-3 animate-spin"/>Re-scanning</Badge>}
                        {getSeverityBadge(item.severity)}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pt-2 pb-4 space-y-3">
                    {item.explanation && (
                      <div className="space-y-2 p-3 bg-secondary/50 rounded-md">
                        <h4 className="font-semibold text-foreground flex items-center gap-1"><BrainCircuit size={16}/> AI Explanation:</h4>
                        <p><strong>Explanation:</strong> {item.explanation.explanation}</p>
                        <p><strong>Severity Assessment:</strong> {item.explanation.severity}</p>
                        <p><strong>Possible Causes:</strong> {item.explanation.possibleCauses}</p>
                      </div>
                    )}
                     <div className="flex flex-wrap gap-2 items-center">
                        {!item.explanation && (
                            <Button
                                onClick={() => onExplainCode(item.id, item.code, vehicleDetails)}
                                disabled={item.isExplaining || item.status === 'pending_rescan'}
                                size="sm"
                                variant="outline"
                            >
                                {item.isExplaining ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                <Wand2 className="mr-2 h-4 w-4" />
                                )}
                                Explain with AI
                            </Button>
                        )}
                        {item.status === 'active' && (
                            <>
                            <Button onClick={() => onConfirmResolution(item.id)} size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved
                            </Button>
                            <Button onClick={() => onRescanCode(item.id)} size="sm" variant="outline">
                                <RefreshCw className="mr-2 h-4 w-4" /> Re-scan Code
                            </Button>
                            </>
                        )}
                         {item.status === 'resolved' && (
                             <Button onClick={() => onRescanCode(item.id)} size="sm" variant="outline" title="Mark as active and re-scan">
                                <Wrench className="mr-2 h-4 w-4" /> Re-check / Mark Active
                            </Button>
                         )}
                     </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge /> Live Sensor Data
          </CardTitle>
          <CardDescription>
            {isSimulatingSensors ? "Simulating real-time sensor readings." : "Monitor real-time sensor readings from your vehicle."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
            {sensorDisplayData.map(sensor => (
              <div key={sensor.name} className="p-4 border rounded-lg bg-muted/30">
                {sensor.icon}
                <p className="text-sm text-muted-foreground">{sensor.name}</p>
                <p className="text-xl font-semibold">{sensor.value} <span className="text-xs">{sensor.unit}</span></p>
              </div>
            ))}
          </div>
           <p className="text-xs text-muted-foreground mt-4 text-center">
             {isSimulatingSensors ? "Values are simulated and update dynamically." : "Click below to start live data simulation."}
           </p>
        </CardContent>
        <CardFooter className="justify-center">
            <Button onClick={onToggleSensorSimulation} variant="outline">
            {isSimulatingSensors ? (
                <>
                <StopCircle className="mr-2 h-4 w-4" /> Stop Simulation
                </>
            ) : (
                <>
                <Activity className="mr-2 h-4 w-4" /> Start Sensor Simulation
                </>
            )}
            </Button>
        </CardFooter>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal /> Standard Values (Reference)
          </CardTitle>
          <CardDescription>
            Typical operating ranges for {vehicleInfo ? `${vehicleInfo.make} ${vehicleInfo.model}` : 'your vehicle'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm list-disc list-inside">
            <li><strong>Engine RPM (Idle):</strong> 650 - 850 RPM</li>
            <li><strong>Coolant Temperature (Operating):</strong> 85 - 95 °C (185 - 203 °F)</li>
            <li><strong>Battery Voltage (Engine Off):</strong> 12.4 - 12.7 V</li>
            <li><strong>Battery Voltage (Engine On/Charging):</strong> 13.7 - 14.7 V</li>
            <li><strong>Fuel Trim (Short Term & Long Term):</strong> Typically within +/- 10%</li>
            {/* Add more based on vehicle type or common sensors */}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Note: These are general reference values. Specific ranges may vary by vehicle make, model, and year. Consult your vehicle's service manual for precise information.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks /> Maintenance Recommendations
          </CardTitle>
          <CardDescription>Prioritized list of maintenance tasks based on diagnostics. (Placeholder)</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <ul className="space-y-2 text-sm">
              {codes.filter(c => c.status === 'active').length > 0 ? 
                codes.filter(c => c.status === 'active').slice(0,3).map(c => (
                  <li key={`rec-${c.id}`} className="p-3 border rounded-md bg-muted/30">Inspect systems related to code {c.code} ({c.description.split(' ').slice(0,5).join(' ')}...).</li>
                ))
                : <li className="p-3 border rounded-md bg-muted/30 text-center">No active codes requiring immediate attention.</li>
              }
              <li className="p-3 border rounded-md bg-muted/30">Perform regular oil change (if due).</li>
              <li className="p-3 border rounded-md bg-muted/30">Check tire pressure and tread.</li>
            </ul>
          </ScrollArea>
           <p className="text-xs text-muted-foreground mt-4 text-center">Actual maintenance recommendations would be dynamically generated here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

