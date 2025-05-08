
"use client";

import type * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Info, Edit3, Save } from "lucide-react";

interface VehicleInfo {
  vin: string;
  make: string;
  model: string;
  year: string;
}

interface VehicleInformationProps {
  initialInfo: VehicleInfo | null;
  onSave: (info: VehicleInfo) => void;
  isEditable: boolean;
}

export function VehicleInformation({ initialInfo, onSave, isEditable }: VehicleInformationProps) {
  const [info, setInfo] = useState<VehicleInfo>(initialInfo || { vin: "", make: "", model: "", year: "" });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialInfo) {
      setInfo(initialInfo);
    }
    // Automatically enter edit mode if initialInfo is null and component is meant to be editable,
    // or if there's no VIN (implying data needs to be entered).
    if (isEditable && (!initialInfo || !initialInfo.vin)) {
        setIsEditing(true);
    }
  }, [initialInfo, isEditable]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(info);
    setIsEditing(false);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  if (!isEditable && !initialInfo) {
    return null; // Don't render if not editable and no info to display
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car /> Vehicle Information
        </CardTitle>
        <CardDescription>
          {isEditing ? "Enter your vehicle's details." : "Detected vehicle details."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div>
              <Label htmlFor="vin">VIN</Label>
              <Input id="vin" name="vin" value={info.vin} onChange={handleChange} placeholder="Vehicle Identification Number" />
            </div>
            <div>
              <Label htmlFor="make">Make</Label>
              <Input id="make" name="make" value={info.make} onChange={handleChange} placeholder="e.g., Toyota" />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" value={info.model} onChange={handleChange} placeholder="e.g., Camry" />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input id="year" name="year" value={info.year} onChange={handleChange} placeholder="e.g., 2023" type="number" />
            </div>
          </>
        ) : (
          <>
            <p><strong className="text-foreground/80">VIN:</strong> {info.vin || "N/A"}</p>
            <p><strong className="text-foreground/80">Make:</strong> {info.make || "N/A"}</p>
            <p><strong className="text-foreground/80">Model:</strong> {info.model || "N/A"}</p>
            <p><strong className="text-foreground/80">Year:</strong> {info.year || "N/A"}</p>
          </>
        )}
        {!info.vin && !isEditing && (
           <div className="flex items-center gap-2 text-muted-foreground p-3 rounded-md border border-dashed">
             <Info size={18} />
             <p>No vehicle information detected. Connect to OBD or enter manually.</p>
           </div>
        )}
      </CardContent>
      {isEditable && (
        <CardFooter>
          {isEditing ? (
            <Button onClick={handleSave} className="w-full">
              <Save className="mr-2 h-4 w-4" /> Save Information
            </Button>
          ) : (
            <Button onClick={handleEditToggle} variant="outline" className="w-full">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Information
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
