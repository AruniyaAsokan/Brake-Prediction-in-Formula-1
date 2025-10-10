import { Card } from "@/components/ui/card";
import { useBrakeSystemStore } from "@/store/UpdatedBrakeSystemStore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, BarChart3 } from "lucide-react";

export const ModelComparisonGraph = () => {
  const {
    accuracyHistory,
    responseTimeHistory,
  } = useBrakeSystemStore();

  // Prepare data for charts
  const accuracyData = accuracyHistory.map((point, index) => ({
    time: index,
    hybrid: point.hybrid,
    lstm: point.lstm,
    timestamp: new Date(point.timestamp).toLocaleTimeString()
  }));

  const responseTimeData = responseTimeHistory.map((point, index) => ({
    time: index,
    hybrid: point.hybrid,
    lstm: point.lstm,
    timestamp: new Date(point.timestamp).toLocaleTimeString()
  }));

  return (
    
    <div className="space-y-6">
    
      

    </div>
    
  );
};
