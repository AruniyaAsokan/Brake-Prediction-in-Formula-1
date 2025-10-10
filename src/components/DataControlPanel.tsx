import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, AlertTriangle } from "lucide-react";
import { useBrakeSystemStore } from "@/store/UpdatedBrakeSystemStore";

export const DataControlPanel = () => {
  const {
    temperature,
    pressure,
    padThickness,
    wheelSpeed,
    isSimulating,
    currentLapNumber,
    alerts,
    setTemperature,
    setPressure,
    setPadThickness,
    setWheelSpeed,
    toggleSimulation,
    resetSystem,
    setCurrentLap,
  } = useBrakeSystemStore();

  return (
    <div className="space-y-4">
      {/* Stage 2: Simulation Controls */}
      <Card className="p-4 bg-card gradient-surface border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-foreground">Stage 2: Simulation Controls</h3>
          <Badge variant="outline" className="text-f1-blue border-f1-blue whitespace-nowrap">
            Real-time
          </Badge>
        </div>
        
        {/* Alerts Display */}
        {alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border flex items-start space-x-2 ${
                  alert.type === 'critical' 
                    ? 'bg-destructive/10 border-destructive/50' 
                    : alert.type === 'warning'
                    ? 'bg-f1-orange/10 border-f1-orange/50'
                    : 'bg-f1-blue/10 border-f1-blue/50'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                  alert.type === 'critical' ? 'text-destructive' : 
                  alert.type === 'warning' ? 'text-f1-orange' : 'text-f1-blue'
                }`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Simulation Controls */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleSimulation}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulating ? "Pause" : "Start"} Simulation</span>
          </Button>
          <Button
            onClick={resetSystem}
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button>
        </div>
      </Card>

      {/* Manual Controls */}
      <Card className="p-4 bg-card gradient-surface border-border">
        <h4 className="text-md font-medium text-foreground mb-4">Manual Controls</h4>
        
        <div className="space-y-4">
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                Brake Temperature
              </label>
              <span className="text-sm text-sensor-temp font-semibold">
                {temperature.toFixed(3)}°C
              </span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={(value) => setTemperature(value[0])}
              max={1200}
              min={200}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>200°C</span>
              <span>1200°C</span>
            </div>
          </div>

          {/* Brake Pressure */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                Brake Pressure
              </label>
              <span className="text-sm text-sensor-pressure font-semibold">
                {pressure.toFixed(3)} bar
              </span>
            </div>
            <Slider
              value={[pressure]}
              onValueChange={(value) => setPressure(value[0])}
              max={300}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 bar</span>
              <span>300 bar</span>
            </div>
          </div>

          {/* Pad Thickness */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                Pad Thickness
              </label>
              <span className="text-sm text-sensor-thickness font-semibold">
                {padThickness.toFixed(3)}mm
              </span>
            </div>
            <Slider
              value={[padThickness]}
              onValueChange={(value) => setPadThickness(value[0])}
              max={15}
              min={2}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2mm</span>
              <span>15mm</span>
            </div>
          </div>

          {/* Wheel Speed */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">
                Wheel Speed
              </label>
              <span className="text-sm text-sensor-speed font-semibold">
                {wheelSpeed.toFixed(3)} RPM
              </span>
            </div>
            <Slider
              value={[wheelSpeed]}
              onValueChange={(value) => setWheelSpeed(value[0])}
              max={3000}
              min={0}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 RPM</span>
              <span>3000 RPM</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Lap Control for Stage 4 */}
      <Card className="p-4 bg-card gradient-surface border-border">
        <h4 className="text-md font-medium text-foreground mb-4">Race Replay (Stage 4)</h4>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">
              Current Lap
            </label>
            <span className="text-sm text-f1-blue font-semibold">
              Lap {currentLapNumber} / 50
            </span>
          </div>
          <Slider
            value={[currentLapNumber]}
            onValueChange={(value) => setCurrentLap(value[0])}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Lap 1</span>
            <span>Lap 50</span>
          </div>
        </div>
      </Card>
    </div>
  );
};