import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBrakeSystemStore } from "@/store/UpdatedBrakeSystemStore";
import { Flame, Snowflake, Wrench, Calculator } from "lucide-react";

export const PhysicsPanel = () => {
  const {
    heatGeneration,
    coolingRate,
    wearRate,
    predictedLapsRemaining,
    temperature,
    padThickness,
  } = useBrakeSystemStore();

  return (
    <Card className="p-4 bg-card gradient-surface border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">Stage 3: Physics Simulation</h3>
        <div className="flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-f1-blue" />
          <span className="text-sm text-f1-blue">Real-time</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Heat Generation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-sensor-temp" />
              <span className="text-sm font-medium text-foreground">Heat Generation</span>
            </div>
            <span className="text-sm font-semibold text-sensor-temp">
              {(heatGeneration / 1000).toFixed(3)} kW
            </span>
          </div>
          <Progress value={(heatGeneration / 5000) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Formula: Brake Force × Velocity × Efficiency
          </p>
        </div>

        {/* Cooling Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Snowflake className="w-4 h-4 text-f1-blue" />
              <span className="text-sm font-medium text-foreground">Cooling Rate</span>
            </div>
            <span className="text-sm font-semibold text-f1-blue">
              {coolingRate.toFixed(3)} W
            </span>
          </div>
          <Progress value={(coolingRate / 1000) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Newton's Law: k(T - T_ambient)
          </p>
        </div>

        {/* Wear Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-sensor-thickness" />
              <span className="text-sm font-medium text-foreground">Pad Wear Rate</span>
            </div>
            <span className="text-sm font-semibold text-sensor-thickness">
              {wearRate.toFixed(4)} mm/lap
            </span>
          </div>
          <Progress value={Math.min(100, (wearRate / 0.1) * 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Based on pressure, temperature & material properties
          </p>
        </div>

        {/* Predictions */}
        <div className="pt-3 border-t border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-3">Predictive Analytics</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/20 p-3 rounded-lg">
              <div className="text-lg font-bold text-foreground">
                {Math.round(predictedLapsRemaining)}
              </div>
              <div className="text-xs text-muted-foreground">Laps Remaining</div>
            </div>
            
            <div className="bg-muted/20 p-3 rounded-lg">
              <div className="text-lg font-bold text-foreground">
                {((15 - padThickness) / 13 * 100).toFixed(3)}%
              </div>
              <div className="text-xs text-muted-foreground">Pad Wear</div>
            </div>
          </div>

          {/* Temperature Status */}
          <div className="mt-3 p-2 rounded-lg border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Thermal Status:</span>
              <span className={`text-sm font-medium ${
                temperature > 1000 ? 'text-destructive' :
                temperature > 800 ? 'text-f1-orange' : 'text-f1-green'
              }`}>
                {temperature > 1000 ? 'Critical' :
                 temperature > 800 ? 'Warning' : 'Normal'}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Current: {temperature.toFixed(1)}°C
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};