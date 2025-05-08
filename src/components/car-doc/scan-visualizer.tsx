
"use client";

import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScanLine, Loader2, FileCheck2, FileX2, CheckCircle2, AlertTriangle, PlayCircle, XCircle } from "lucide-react";

interface ModuleStatusItem {
  name: string;
  status: "pending" | "scanning" | "complete" | "error";
}

interface ScanVisualizerProps {
  isScanning: boolean;
  scanProgress: number;
  currentScanningModule: string | null;
  moduleStatus: ModuleStatusItem[];
  detectedCodesCount: number;
  onStartScan: () => void;
  onCancelScan: () => void;
  isScanCompleted: boolean;
}

export function ScanVisualizer({
  isScanning,
  scanProgress,
  currentScanningModule,
  moduleStatus,
  detectedCodesCount,
  onStartScan,
  onCancelScan,
  isScanCompleted
}: ScanVisualizerProps) {
  
  const getStatusIcon = (status: ModuleStatusItem["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-4 w-4 text-muted-foreground" />;
      case "scanning":
        return <Loader2 className="h-4 w-4 animate-spin text-accent" />;
      case "complete":
        return <FileCheck2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <FileX2 className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine /> Vehicle Scan
        </CardTitle>
        <CardDescription>
          {isScanCompleted ? "Scan complete. View results below." : "Scan your vehicle for diagnostic codes."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {isScanning ? (currentScanningModule ? `Scanning: ${currentScanningModule}` : "Initializing scan...") : (isScanCompleted ? "Scan Finished" : "Ready to scan")}
            </span>
            <span className="text-sm font-medium text-accent">{scanProgress}%</span>
          </div>
          <Progress value={scanProgress} aria-label="Scan progress" />
        </div>

        <div className="flex justify-between items-center text-sm">
          <span>Detected Codes:</span>
          <span className="font-semibold text-accent">{detectedCodesCount}</span>
        </div>
        
        <ScrollArea className="h-40 w-full rounded-md border p-2">
          <ul className="space-y-1">
            {moduleStatus.map((mod, index) => (
              <li key={index} className="flex items-center justify-between p-1.5 text-sm rounded-md hover:bg-muted/50">
                <span className="truncate">{mod.name}</span>
                {getStatusIcon(mod.status)}
              </li>
            ))}
          </ul>
        </ScrollArea>

        {!isScanCompleted ? (
            isScanning ? (
              <Button onClick={onCancelScan} variant="destructive" className="w-full">
                <XCircle className="mr-2 h-4 w-4" /> Cancel Scan
              </Button>
            ) : (
              <Button onClick={onStartScan} className="w-full">
                <PlayCircle className="mr-2 h-4 w-4" /> Start Scan
              </Button>
            )
        ) : (
            <div className="flex items-center justify-center p-3 bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-300 rounded-md">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                <p className="font-medium">Scan Completed Successfully!</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
