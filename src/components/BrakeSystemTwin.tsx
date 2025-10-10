import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { BrakeSystem3D } from "./BrakeSystem3D";
import { SensorPanel } from "./SensorPanel";
import { DataControlPanel } from "./DataControlPanel";
import { PhysicsPanel } from "./PhysicsPanel";
import { ComparisonDashboard } from "./ComparisonDashboard";
import { ModelComparisonGraph } from "./ModelComparisonGraph";
import { FastF1Integration } from "./FastF1Integration";
import { BrakeSystemInitializer } from "./BrakeSystemInitializer";
import { Suspense } from "react";

export const BrakeSystemTwin = () => {
  return (
    <>
      <BrakeSystemInitializer />
      <div className="space-y-8">
      {/* Main Grid */}
      <div className="grid lg:grid-cols-7 gap-8 h-[70vh]">
        {/* 3D Viewport */}
        <div className="lg:col-span-5 bg-card rounded-xl border border-border overflow-hidden gradient-surface">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">
              3D Brake System Model
            </h2>
            <p className="text-sm text-muted-foreground">
              Interactive view with sensor locations
            </p>
          </div>
          <div className="h-[calc(100%-5rem)]">
            <Suspense fallback={
              <div className="h-full flex items-center justify-center bg-background/20">
                <div className="text-center">
                  <div className="text-lg font-medium text-foreground mb-2">Loading 3D Model...</div>
                  <div className="text-sm text-muted-foreground">Initializing brake system visualization</div>
                </div>
              </div>
            }>
              <Canvas
                camera={{ position: [5, 5, 8], fov: 45 }}
                shadows
                className="bg-background/20"
              >
                <Environment preset="warehouse" />
                <ambientLight intensity={0.4} />
                <directionalLight 
                  position={[10, 10, 5]} 
                  intensity={1} 
                  castShadow
                  shadow-mapSize={[1024, 1024]}
                />
                <pointLight position={[-10, -10, -10]} intensity={0.2} color="#ff0000" />
                
                <BrakeSystem3D />
                
                <ContactShadows 
                  position={[0, -2, 0]} 
                  opacity={0.4} 
                  scale={20} 
                  blur={2} 
                  far={4} 
                />
                <OrbitControls 
                  enablePan={true} 
                  enableZoom={true} 
                  enableRotate={true}
                  minDistance={3}
                  maxDistance={20}
                />
              </Canvas>
            </Suspense>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-4 overflow-y-auto max-h-[70vh]">
          <SensorPanel />
          <DataControlPanel />
        </div>
      </div>

        {/* Bottom Panels */}
        <div className="grid lg:grid-cols-3 gap-8">
          <PhysicsPanel />
          <ComparisonDashboard />
          <FastF1Integration />
        </div>

        {/* Model Comparison Graph for Reviewers */}
        <div className="mt-8">
          <ModelComparisonGraph />
        </div>
    </div>
    </>
  );
};