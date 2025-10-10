import { Html } from "@react-three/drei";
import { useState } from "react";

interface SensorLabelProps {
  position: [number, number, number];
  sensorType: "temperature" | "thickness" | "pressure" | "speed";
  label: string;
  description: string;
  isHovered: boolean;
  onHover: () => void;
  onHoverEnd: () => void;
}

const sensorColors = {
  temperature: "#EF4444", // Red
  thickness: "#F97316",   // Orange  
  pressure: "#3B82F6",    // Blue
  speed: "#22C55E",       // Green
};

export const SensorLabel = ({
  position,
  sensorType,
  label,
  description,
  isHovered,
  onHover,
  onHoverEnd
}: SensorLabelProps) => {
  return (
    <group position={position}>
      {/* Sensor Point */}
      <mesh
        onPointerOver={onHover}
        onPointerOut={onHoverEnd}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshPhysicalMaterial
          color={sensorColors[sensorType]}
          emissive={sensorColors[sensorType]}
          emissiveIntensity={isHovered ? 0.5 : 0.2}
          transparent
        />
      </mesh>

      {/* Connection Line */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1, 8]} />
        <meshBasicMaterial 
          color={sensorColors[sensorType]} 
          transparent 
          opacity={0.6}
        />
      </mesh>

      {/* HTML Label */}
      <Html position={[0, 1, 0]} center>
        <div 
          className={`
            bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 
            transition-all duration-300 min-w-48 max-w-64
            ${isHovered ? 'scale-110 shadow-lg' : 'scale-100'}
          `}
          style={{
            borderColor: sensorColors[sensorType],
            boxShadow: isHovered ? `0 0 20px ${sensorColors[sensorType]}40` : 'none'
          }}
        >
          <div className="flex items-center space-x-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: sensorColors[sensorType] }}
            />
            <span className="text-sm font-medium text-foreground">
              {label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
          {isHovered && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                Sensor Type: {sensorType.charAt(0).toUpperCase() + sensorType.slice(1)}
              </span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};