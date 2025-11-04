import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrakeSystemStore } from "@/store/UpdatedBrakeSystemStore";
import { Database, Play, Link as LinkIcon } from "lucide-react";

export const FastF1Integration = () => {
  const { currentLapNumber, simulateRaceLap, loadHuggingFaceTelemetry } = useBrakeSystemStore();

  const sampleRaces = [
    { name: "Monaco GP 2024", laps: 78, car: "VER" },
    { name: "Silverstone GP 2024", laps: 52, car: "HAM" },
    { name: "Spa GP 2024", laps: 44, car: "LEC" },
  ];

  const handleLoadRace = (race: typeof sampleRaces[0]) => {
    // Simulate loading FastF1 data
    console.log(`Loading ${race.name} data for ${race.car}...`);
    simulateRaceLap(1);
  };

  

  return (
    <Card className="p-4 bg-card gradient-surface border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">Stage 4: Dataset</h3>
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-f1-blue" />
          <span className="text-sm text-f1-blue">Race Data</span>
        </div>
      </div>

      <div className="space-y-4">

        {/* Load directly from Hugging Face */}
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
          <div className="flex items-center space-x-2">
            <LinkIcon className="w-4 h-4 text-f1-green" />
            <div>
              <div className="text-sm font-medium text-foreground">Load Miami VER Telemetry (Hugging Face)</div>
              <div className="text-xs text-muted-foreground">Draichi/Formula1-2024-Miami-Verstappen-telemetry</div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => loadHuggingFaceTelemetry('Draichi/Formula1-2024-Miami-Verstappen-telemetry', 100)}>
            Fetch
          </Button>
        </div>

        {/* Sample Race Data */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground mb-2">Available Race Data</h4>
          {sampleRaces.map((race, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
              <div>
                <div className="text-sm font-medium text-foreground">{race.name}</div>
                <div className="text-xs text-muted-foreground">
                  {race.laps} laps • Driver: {race.car}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-f1-green border-f1-green/50">
                  Available
                </Badge>
                <Button
                  onClick={() => handleLoadRace(race)}
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  <Play className="w-3 h-3" />
                  <span>Load</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Dataset Info & Validation (Real Data) */}
        <div className="pt-3 border-t border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-2">Dataset & Validation</h4>
          <div className="p-3 bg-f1-green/10 border border-f1-green/50 rounded-lg">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Source: Hugging Face – Draichi/Formula1-2024-Miami-Verstappen-telemetry</div>
              <div>• Fields used: Time (Timedelta), Speed (km/h), Brake (bool), RPM, nGear, Throttle</div>
              <div>• Mapping: wheelSpeed (from Speed via tyre radius), brakePressure (estimated from Brake + Speed), ambient set from UI</div>
              <div>• Sanity checks: non-negative speeds, Time monotonic, Speed 0–350 km/h, boolean Brake</div>
              <div>• Model metrics shown in Comparison: RMSE/MAE/R² + calibration on real rows</div>
            </div>
          </div>
        </div>

        {/* Real-time Comparison & Metrics (formulas) */}
        <div className="pt-3 border-t border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-2">Real-time Model Comparison (Temperature)</h4>
          <div className="p-3 bg-muted/20 border border-border/50 rounded-lg text-xs text-muted-foreground space-y-2">
            <div>
              <span className="text-foreground font-medium">Formulas:</span>
              <div>• MAE = (1/N) Σ |ŷ - y|</div>
              <div>• RMSE = √[(1/N) Σ (ŷ - y)²]</div>
              <div>• R² = 1 - Σ(ŷ - y)² / Σ(y - ȳ)²</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-foreground">
              <div className="p-2 rounded bg-card/60 border border-border/50">
                <div className="text-[11px] text-muted-foreground mb-1">Physics (proxy truth)</div>
                <div className="text-sm font-medium">—</div>
              </div>
              <div className="p-2 rounded bg-card/60 border border-border/50">
                <div className="text-[11px] text-muted-foreground mb-1">Hybrid (Physics + Bi-LSTM)</div>
                <DynamicMetric label="Hybrid" />
              </div>
              <div className="p-2 rounded bg-card/60 border border-border/50">
                <div className="text-[11px] text-muted-foreground mb-1">Bi-LSTM</div>
                <DynamicMetric label="Bi-LSTM" />
              </div>
              <div className="p-2 rounded bg-card/60 border border-border/50">
                <div className="text-[11px] text-muted-foreground mb-1">GRU</div>
                <DynamicMetric label="GRU" />
              </div>
              <div className="p-2 rounded bg-card/60 border border-border/50">
                <div className="text-[11px] text-muted-foreground mb-1">TCN</div>
                <DynamicMetric label="TCN" />
              </div>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Current Lap:</span>
            <span className="text-sm font-semibold text-f1-blue">Lap {currentLapNumber}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Use the lap slider in the Data Control Panel to replay race data lap-by-lap.
          </div>
        </div>
      </div>
    </Card>
  );
};

function DynamicMetric({ label }: { label: string }) {
  const { realTimeMetrics } = useBrakeSystemStore();
  const m = label === 'Hybrid' ? realTimeMetrics.hybrid : 
            label === 'Bi-LSTM' ? realTimeMetrics.lstm :
            label === 'GRU' ? realTimeMetrics.gru :
            label === 'TCN' ? realTimeMetrics.tcn : null;
  
  if (!m) return <div className="text-sm font-medium">—</div>;
  
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{m.accuracy.toFixed(1)}% acc</div>
      <div className="text-[10px] text-muted-foreground">MAE: {m.mae.toFixed(1)}</div>
      <div className="text-[10px] text-muted-foreground">R²: {m.r2.toFixed(3)}</div>
    </div>
  );
}