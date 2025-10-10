import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Gauge, Zap, RotateCcw } from "lucide-react";
import { useBrakeSystemStore } from "@/store/UpdatedBrakeSystemStore";

export const SensorPanel = () => {
  const { temperature, pressure, padThickness, wheelSpeed } = useBrakeSystemStore();

  const getSensorStatus = (type: string, value: number) => {
    switch (type) {
      case "temperature":
        return value > 800 ? "critical" : value > 650 ? "warning" : "normal";
      case "pressure":
        return value > 250 ? "warning" : "normal";
      case "thickness":
        return value < 5 ? "critical" : value < 8 ? "warning" : "normal";
      default:
        return "normal";
    }
  };

  const sensors = [
    {
      id: "temperature",
      name: "Disc Temperature", 
      icon: Thermometer,
      value: `${temperature.toFixed(3)}°C`,
      status: getSensorStatus("temperature", temperature),
      color: "bg-sensor-temp",
      description: "Monitors brake disc heat buildup"
    },
    {
      id: "thickness", 
      name: "Pad Thickness",
      icon: Gauge,
      value: `${padThickness.toFixed(3)}mm`,
      status: getSensorStatus("thickness", padThickness), 
      color: "bg-sensor-thickness",
      description: "Real-time pad wear measurement"
    },
    {
      id: "pressure",
      name: "Brake Pressure", 
      icon: Zap,
      value: `${pressure.toFixed(3)} bar`,
      status: getSensorStatus("pressure", pressure),
      color: "bg-sensor-pressure", 
      description: "Hydraulic system pressure"
    },
    {
      id: "speed",
      name: "Wheel Speed",
      icon: RotateCcw, 
      value: `${wheelSpeed.toFixed(3)} RPM`,
      status: "normal",
      color: "bg-sensor-speed",
      description: "Rotational velocity tracking"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "normal":
        return <Badge variant="outline" className="text-f1-green border-f1-green/50">Normal</Badge>;
      case "warning": 
        return <Badge variant="outline" className="text-f1-orange border-f1-orange/50">Warning</Badge>;
      case "critical":
        return <Badge variant="outline" className="text-f1-red border-f1-red/50">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border gradient-surface">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">Sensor Status</h3>
          <p className="text-sm text-muted-foreground">Real-time monitoring</p>
        </div>
        
        <div className="p-4 space-y-4">
          {sensors.map((sensor) => {
            const IconComponent = sensor.icon;
            return (
              <Card key={sensor.id} className="p-4 bg-muted/20 border-border/50 transition-smooth hover:bg-muted/30">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${sensor.color}/20`}>
                    <IconComponent className={`w-4 h-4 text-${sensor.color.replace('bg-', '')}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {sensor.name}
                      </h4>
                      {getStatusBadge(sensor.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-foreground">
                        {sensor.value}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sensor.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border gradient-surface">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">System Status</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-3 h-3 bg-f1-green rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-foreground">All Systems Operational</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Digital twin model loaded successfully. All sensors are reporting normal values.
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>• Model: F1 Brake System v1.0</div>
            <div>• Sensors: 4/4 Active</div>
            <div>• Last Update: Just now</div>
          </div>
        </div>
      </div>
    </div>
  );
};