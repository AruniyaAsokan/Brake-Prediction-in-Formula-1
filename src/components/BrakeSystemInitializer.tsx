import { useEffect } from "react";
import { useBrakeSystemStore } from "@/store/UpdatedBrakeSystemStore";

export const BrakeSystemInitializer = () => {
  const { 
    startMonitoring,
    updatePhysics
  } = useBrakeSystemStore();

  useEffect(() => {
    console.log("Initializing F1 Brake System Digital Twin...");
    
    try {
      // Start monitoring
      startMonitoring();
      
      // Update physics calculations once
      updatePhysics();
      
      console.log("F1 Brake System Digital Twin initialized successfully!");
    } catch (error) {
      console.error("Error initializing brake system:", error);
    }
  }, []); // Run only once on mount

  return null;
};