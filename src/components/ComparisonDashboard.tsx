import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useBrakeSystemStore } from "@/store/UpdatedBrakeSystemStore";
import { Brain, Eye, Clock, Target } from "lucide-react";

export const ComparisonDashboard = () => {
  const { currentComparison, realTimeMetrics } = useBrakeSystemStore();

  // Prefer real-time metrics; fallback to currentComparison
  const hybridAccuracy = realTimeMetrics.hybrid?.accuracy ?? currentComparison?.performanceMetrics?.hybridAccuracy ?? 85;
  const lstmAccuracy = realTimeMetrics.lstm?.accuracy ?? currentComparison?.performanceMetrics?.lstmAccuracy ?? 70;
  const hybridResponseTime = currentComparison?.performanceMetrics?.hybridResponseTime ?? 12;
  const lstmResponseTime = currentComparison?.performanceMetrics?.lstmResponseTime ?? 45;

  return (
    <Card className="p-4 bg-card gradient-surface border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">Stage 5: Model Comparison</h3>
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-f1-blue" />
          <span className="text-sm text-f1-blue">AI Analysis</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Accuracy Comparison */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-f1-green" />
            <span className="text-sm font-medium text-foreground">Prediction Accuracy</span>
          </div>
          
          <div className="space-y-3">
            {/* Digital Twin */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Digital Twin (Physics + Bi-LSTM)</span>
                <Badge variant="outline" className="bg-f1-green/10 text-f1-green border-f1-green/50">
                  {hybridAccuracy.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={hybridAccuracy} className="h-2" />
            </div>

            {/* Bi-LSTM Only */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Bi-LSTM Only (Black Box)</span>
                <Badge variant="outline" className="bg-f1-orange/10 text-f1-orange border-f1-orange/50">
                  {lstmAccuracy.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={lstmAccuracy} className="h-2" />
            </div>
          </div>
        </div>

        {/* Response Time Comparison */}  
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-f1-blue" />
            <span className="text-sm font-medium text-foreground">Response Time</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/20 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-f1-green">{hybridResponseTime.toFixed(1)}ms</div>
              <div className="text-xs text-muted-foreground">Digital Twin</div>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-f1-orange">{lstmResponseTime.toFixed(1)}ms</div>
              <div className="text-xs text-muted-foreground">Bi-LSTM Only</div>
            </div>
          </div>
        </div>

        {/* Interpretability */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            <Eye className="w-4 h-4 text-f1-silver" />
            <span className="text-sm font-medium text-foreground">Interpretability</span>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-f1-green/10 border border-f1-green/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">Digital Twin</span>
                <Badge variant="outline" className="text-f1-green border-f1-green/50">
                  High
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Physics-based + Visual feedback. Fully explainable predictions with 3D model interaction.
              </p>
            </div>

            <div className="p-3 bg-f1-orange/10 border border-f1-orange/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">Bi-LSTM Only</span>
                <Badge variant="outline" className="text-f1-orange border-f1-orange/50">
                  Low
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Black box model. No visibility into decision-making process or underlying physics.
              </p>
            </div>
          </div>
        </div>

        {/* Key Advantages */}
        <div className="pt-3 border-t border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-2">Digital Twin Advantages</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>• {(hybridAccuracy - lstmAccuracy).toFixed(1)}% higher accuracy</div>
            <div>• {Math.round((lstmResponseTime - hybridResponseTime) / hybridResponseTime * 100)}% faster response</div>
            <div>• Real-time 3D visualization</div>
            <div>• Physics-based interpretability</div>
            <div>• Proactive failure prediction</div>
          </div>
          
        </div>
      </div>
    </Card>
  );
};