
"use client";

import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Usb, Bluetooth, PlugZap, Unplug, Loader2 } from "lucide-react";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface ConnectionManagerProps {
  status: ConnectionStatus;
  onConnect: (type: "usb" | "bluetooth") => void;
  onDisconnect: () => void;
}

export function ConnectionManager({ status, onConnect, onDisconnect }: ConnectionManagerProps) {
  const isLoading = status === "connecting";

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === 'connected' ? <PlugZap className="text-green-500" /> : <Unplug className="text-destructive" />}
          Connection Management
        </CardTitle>
        <CardDescription>Connect to your vehicle's OBD system.</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "connected" ? (
          <div className="space-y-4">
            <p className="text-center text-green-600 dark:text-green-400 font-medium">
              Successfully connected to OBD system.
            </p>
            <Button onClick={onDisconnect} variant="destructive" className="w-full">
              <Unplug className="mr-2 h-4 w-4" /> Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => onConnect("usb")}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Usb className="mr-2 h-4 w-4" />
                )}
                Connect via USB
              </Button>
              <Button
                onClick={() => onConnect("bluetooth")}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bluetooth className="mr-2 h-4 w-4" />
                )}
                Connect via Bluetooth
              </Button>
            </div>
            {status === "connecting" && (
              <p className="text-center text-muted-foreground">Attempting to connect...</p>
            )}
            {status === "error" && (
              <p className="text-center text-destructive">
                Connection failed. Please try again.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
