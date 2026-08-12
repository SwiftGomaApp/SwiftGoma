"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { LiveLocation } from "@/lib/order-tracking";
import { cn } from "@/lib/utils";

type DevRiderSimulatorProps = {
  active: boolean;
  destination: { latitude: number; longitude: number };
  onLocation: (location: LiveLocation | null) => void;
  onActiveChange: (active: boolean) => void;
  className?: string;
};

export function DevRiderSimulator({
  active,
  destination,
  onLocation,
  onActiveChange,
  className,
}: DevRiderSimulatorProps) {
  const tickRef = useRef(0);

  useEffect(() => {
    if (!active) {
      tickRef.current = 0;
      onLocation(null);
      return;
    }

    let lat = destination.latitude + 0.012;
    let lng = destination.longitude + 0.008;

    onLocation({
      latitude: lat,
      longitude: lng,
      timestamp: new Date().toISOString(),
    });

    const intervalId = window.setInterval(() => {
      tickRef.current += 1;
      lat += (destination.latitude - lat) * 0.12;
      lng += (destination.longitude - lng) * 0.12;

      onLocation({
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString(),
      });

      if (tickRef.current >= 25) {
        onActiveChange(false);
      }
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [active, destination, onActiveChange, onLocation]);

  return (
    <Button
      type="button"
      variant={active ? "secondary" : "default"}
      className={cn("w-full", className)}
      onClick={() => onActiveChange(!active)}
    >
      {active ? "Arrêter simulation" : "Simuler livreur"}
    </Button>
  );
}
