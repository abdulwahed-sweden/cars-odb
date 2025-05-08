
"use client";

import type * as React from "react";
import type { CodeExplanationOutput } from "@/ai/flows/code-explanation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, BrainCircuit, Gauge, ListChecks, Loader2, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX, Wand2 } from "lucide-react";

export interface DiagnosticCodeItem {
  id: string;
  code: string;
  description: string;
  severity: "low" | "medium" | "high" | "unknown";
  explanation?: CodeExplanationOutput;
  isExplaining?: boolean;
}

interface DiagnosticResultsProps {
  codes: DiagnosticCodeItem[];
  onExplainCode: (codeId: string, code: string, vehicleDetails: string | null) => void;
  vehicleDetails: string | null;
}

export function DiagnosticResults({ codes, onExplainCode, vehicleDetails }: DiagnosticResultsProps) {
  const getSeverityBadge = (severity: DiagnosticCodeItem["severity"]) => {
    switch (severity) {
      case "low":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><ShieldCheck className="mr-1 h-3 w-3" />Low</Badge>;
      case "medium":
        return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-black"><ShieldAlert className="mr-1 h-3 w-3" />Medium</Badge>;
      case "high":
        return <Badge variant="destructive"><ShieldX className="mr-1 h-3 w-3" />High</Badge>;
      default:
        return <Badge variant="secondary"><ShieldQuestion className="mr-1 h-3 w-3" />Unknown</Badge>;
    }
  };

  if (codes.length === 0) {
    return (
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle /> Diagnostic Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No diagnostic codes found or scan not yet performed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle /> Diagnostic Trouble Codes ({codes.length})
          </CardTitle>
          <CardDescription>Review the detected codes and their explanations.</CardDescription>
        </CardHeader>
        <CardContent>
          {codes.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {codes.map((item) => (
                <AccordionItem value={item.id} key={item.id}>
                  <AccordionTrigger className="hover:bg-muted/50 px-3 rounded-md">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1 text-left">
                        <span className="font-mono text-accent">{item.code}</span>
                        <p className="text-sm text-muted-foreground truncate max-w-xs sm:max-w-sm md:max-w-md">{item.description}</p>
                      </div>
                      {getSeverityBadge(item.severity)}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pt-2 pb-4 space-y-3">
                    {item.explanation ? (
                      <div className="space-y-2 p-3 bg-secondary/50 rounded-md">
                        <h4 className="font-semibold text-foreground">AI Explanation:</h4>
                        <p><strong>Explanation:</strong> {item.explanation.explanation}</p>
                        <p><strong>Severity:</strong> {item.explanation.severity}</p>
                        <p><strong>Possible Causes:</strong> {item.explanation.possibleCauses}</p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => onExplainCode(item.id, item.code, vehicleDetails)}
                        disabled={item.isExplaining}
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        {item.isExplaining ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        Explain with AI
                      </Button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground text-center py-4">No codes detected.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge /> Live Sensor Data
          </CardTitle>
          <CardDescription>Monitor real-time sensor readings from your vehicle. (Placeholder)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
            {[
              { name: "Engine RPM", value: "---", unit: "RPM", icon: <Gauge className="mx-auto mb-1 h-8 w-8 text-accent" /> },
              { name: "Coolant Temp", value: "--", unit: "°C", icon: <Gauge className="mx-auto mb-1 h-8 w-8 text-accent" /> },
              { name: "Vehicle Speed", value: "--", unit: "km/h", icon: <Gauge className="mx-auto mb-1 h-8 w-8 text-accent" /> },
            ].map(sensor => (
              <div key={sensor.name} className="p-4 border rounded-lg bg-muted/30">
                {sensor.icon}
                <p className="text-sm text-muted-foreground">{sensor.name}</p>
                <p className="text-xl font-semibold">{sensor.value} <span className="text-xs">{sensor.unit}</span></p>
              </div>
            ))}
          </div>
           <p className="text-xs text-muted-foreground mt-4 text-center">Actual sensor data and gauges would be displayed here.</p>
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
              <li className="p-3 border rounded-md bg-muted/30">Inspect catalytic converter (related to P0420).</li>
              <li className="p-3 border rounded-md bg-muted/30">Check ignition coils and spark plugs (related to P0300).</li>
              <li className="p-3 border rounded-md bg-muted/30">Verify ECM/PCM communication wiring (related to U0100).</li>
              <li className="p-3 border rounded-md bg-muted/30">Perform regular oil change.</li>
            </ul>
          </ScrollArea>
           <p className="text-xs text-muted-foreground mt-4 text-center">Actual maintenance recommendations would be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

