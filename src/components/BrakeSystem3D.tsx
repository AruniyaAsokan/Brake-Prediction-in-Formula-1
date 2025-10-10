import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import { Mesh } from "three";
import { SensorLabel } from "./SensorLabel";
import { useBrakeSystemStore } from "@/store/UpdatedBrakeSystemStore";

export const BrakeSystem3D = () => {
  const brakeDiscRef = useRef<Mesh>(null);
  const caliperRef = useRef<Mesh>(null);
  const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);
  
  // Get real-time data from store
  const { temperature, pressure, padThickness, wheelSpeed, isSimulating } = useBrakeSystemStore();

  useFrame((state) => {
    // Dynamic rotation based on wheel speed
    if (brakeDiscRef.current && isSimulating) {
      brakeDiscRef.current.rotation.z += (wheelSpeed / 100000);
    } else if (brakeDiscRef.current) {
      brakeDiscRef.current.rotation.z += 0.002;
    }

    // Caliper vibration during braking
    if (caliperRef.current && pressure > 100) {
      const vibration = Math.sin(state.clock.elapsedTime * 20) * 0.002 * (pressure / 300);
      caliperRef.current.position.y = vibration;
    }
  });

  // Calculate dynamic colors based on temperature
  const getDiscColor = () => {
    if (temperature > 800) return "#FF4444"; // Glowing red
    if (temperature > 650) return "#FF8844"; // Orange-red
    if (temperature > 500) return "#FFAA44"; // Orange
    return "#8B8B8B"; // Normal silver
  };

  const getDiscEmissive = () => {
    if (temperature > 800) return "#FF2222";
    if (temperature > 650) return "#FF4422";
    if (temperature > 500) return "#FF6622";
    return "#000000";
  };

  const getEmissiveIntensity = () => {
    if (temperature > 800) return 0.8;
    if (temperature > 650) return 0.4;
    if (temperature > 500) return 0.2;
    return 0;
  };

  return (
    <group>
      {/* Brake Disc - Dynamic heating visualization */}
      <mesh ref={brakeDiscRef} position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, 0.2, 32]} />
        <meshPhysicalMaterial 
          color={getDiscColor()}
          emissive={getDiscEmissive()}
          emissiveIntensity={getEmissiveIntensity()}
          metalness={0.8} 
          roughness={0.2}
          clearcoat={0.1}
        />
        {/* Disc holes for ventilation */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[
            Math.cos((i / 12) * Math.PI * 2) * 1.5,
            0,
            Math.sin((i / 12) * Math.PI * 2) * 1.5
          ]}>
            <cylinderGeometry args={[0.15, 0.15, 0.25, 8]} />
            <meshPhysicalMaterial color="#2A2A2A" />
          </mesh>
        ))}
      </mesh>

      {/* Brake Caliper - Dynamic pressure response */}
      <mesh ref={caliperRef} position={[2.5, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.8, 1.2]} />
        <meshPhysicalMaterial 
          color={pressure > 200 ? "#FF2222" : "#FF0000"}
          emissive={pressure > 200 ? "#FF0000" : "#000000"}
          emissiveIntensity={pressure > 200 ? 0.3 : 0}
          metalness={0.6} 
          roughness={0.3}
        />
      </mesh>

      {/* Brake Pads - Dynamic thickness visualization */}
      <mesh position={[1.8, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[padThickness / 40, 0.4, 0.8]} />
        <meshPhysicalMaterial 
          color={padThickness < 5 ? "#FF4444" : padThickness < 8 ? "#FF8844" : "#4A4A4A"} 
          roughness={0.8} 
        />
      </mesh>
      <mesh position={[1.8, -0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[padThickness / 40, 0.4, 0.8]} />
        <meshPhysicalMaterial 
          color={padThickness < 5 ? "#FF4444" : padThickness < 8 ? "#FF8844" : "#4A4A4A"} 
          roughness={0.8} 
        />
      </mesh>

      {/* Brake Ducts */}
      <mesh position={[-3, 1, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <cylinderGeometry args={[0.4, 0.6, 2, 8]} />
        <meshPhysicalMaterial color="#1A1A1A" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Hub/Wheel mounting */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} />
        <meshPhysicalMaterial color="#2A2A2A" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Sensor Labels */}
      <SensorLabel
        position={[0, -2.5, 0]}
        sensorType="temperature"
        label="Brake Disc Temperature"
        description="Stage 1: Temperature sensor monitoring heat buildup"
        isHovered={hoveredSensor === "temperature"}
        onHover={() => setHoveredSensor("temperature")}
        onHoverEnd={() => setHoveredSensor(null)}
      />

      <SensorLabel
        position={[1.8, -1.5, 0]}
        sensorType="thickness"
        label="Brake Pad Thickness"
        description="Stage 2: Real-time pad wear measurement"
        isHovered={hoveredSensor === "thickness"}
        onHover={() => setHoveredSensor("thickness")}
        onHoverEnd={() => setHoveredSensor(null)}
      />

      <SensorLabel
        position={[3.5, 0, 0]}
        sensorType="pressure"
        label="Brake Pressure"
        description="Stage 3: Hydraulic pressure monitoring with physics"
        isHovered={hoveredSensor === "pressure"}
        onHover={() => setHoveredSensor("pressure")}
        onHoverEnd={() => setHoveredSensor(null)}
      />

      <SensorLabel
        position={[0, 0, 3]}
        sensorType="speed"
        label="Wheel Speed"
        description="Stage 4: RPM sensor for race replay simulation"
        isHovered={hoveredSensor === "speed"}
        onHover={() => setHoveredSensor("speed")}
        onHoverEnd={() => setHoveredSensor(null)}
      />
    </group>
  );
};