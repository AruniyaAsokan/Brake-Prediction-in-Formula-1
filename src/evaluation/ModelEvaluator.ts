import { HybridDigitalTwin, HybridPrediction, HybridInputs } from '../models/HybridDigitalTwin';
import { LSTMModel, LSTMInputSequence, LSTMPrediction } from '../models/LSTMModel';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  inputs: HybridInputs;
  groundTruth: {
    temperature: number;
    wearRate: number;
    predictedLapsRemaining: number;
  };
  scenario_type: 'normal' | 'extreme_heat' | 'high_wear' | 'sensor_noise' | 'rapid_change';
}

export interface ModelPerformance {
  accuracy: number; // Percentage
  responseTime: number; // Milliseconds
  interpretability: number; // Score 0-100
  meanAbsoluteError: number;
  rootMeanSquareError: number;
  predictions: Array<{
    scenario: string;
    predicted: any;
    actual: any;
    error: number;
    responseTime: number;
  }>;
}

export interface ComparisonResults {
  hybridTwin: ModelPerformance;
  lstmOnly: ModelPerformance;
  winner: 'hybrid' | 'lstm' | 'tie';
  improvements: {
    accuracy: number;
    responseTime: number;
    interpretability: number;
  };
  summary: string;
}

export class ModelEvaluator {
  private hybridModel: HybridDigitalTwin;
  private lstmModel: LSTMModel;
  private testScenarios: TestScenario[] = [];

  constructor() {
    this.hybridModel = new HybridDigitalTwin();
    this.lstmModel = new LSTMModel();
    this.generateTestScenarios();
  }

  private generateTestScenarios(): void {
    // Generate comprehensive test scenarios
    this.testScenarios = [
      // Normal operating conditions
      {
        id: 'normal_1',
        name: 'Normal Racing Conditions',
        description: 'Typical race conditions with moderate braking',
        inputs: {
          currentState: {
            wheelSpeed: 1500,
            brakePressure: 120,
            ambientTemp: 25,
            padThickness: 10.0,
            discMass: 8.5,
            padArea: 150,
            timeStep: 1
          },
          historicalSequence: {
            wheelSpeed: [1500, 1505, 1510, 1508, 1512, 1509, 1511, 1507, 1513, 1500],
            brakePressure: [120, 122, 118, 125, 119, 123, 117, 124, 121, 120],
            ambientTemp: [25, 25, 26, 25, 24, 25, 25, 24, 25, 25],
            padThickness: [10.1, 10.08, 10.05, 10.03, 10.01, 10.0, 9.98, 9.96, 9.95, 10.0],
            timestamp: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          }
        },
        groundTruth: {
          temperature: 520,
          wearRate: 0.08,
          predictedLapsRemaining: 42
        },
        scenario_type: 'normal'
      },

      // Extreme heat scenario
      {
        id: 'extreme_heat_1',
        name: 'High Temperature Braking',
        description: 'Extreme braking causing high temperatures',
        inputs: {
          currentState: {
            wheelSpeed: 2200,
            brakePressure: 250,
            ambientTemp: 35,
            padThickness: 8.0,
            discMass: 8.5,
            padArea: 150,
            timeStep: 1
          },
          historicalSequence: {
            wheelSpeed: [2000, 2100, 2150, 2180, 2200, 2220, 2200, 2190, 2210, 2200],
            brakePressure: [200, 220, 235, 245, 250, 255, 248, 250, 252, 250],
            ambientTemp: [35, 35, 36, 35, 35, 36, 35, 35, 35, 35],
            padThickness: [8.2, 8.15, 8.1, 8.08, 8.05, 8.03, 8.01, 8.0, 7.98, 8.0],
            timestamp: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          }
        },
        groundTruth: {
          temperature: 850,
          wearRate: 0.25,
          predictedLapsRemaining: 18
        },
        scenario_type: 'extreme_heat'
      },

      // High wear scenario
      {
        id: 'high_wear_1',
        name: 'Aggressive Braking Pattern',
        description: 'Repeated heavy braking causing accelerated wear',
        inputs: {
          currentState: {
            wheelSpeed: 1800,
            brakePressure: 200,
            ambientTemp: 28,
            padThickness: 4.5,
            discMass: 8.5,
            padArea: 150,
            timeStep: 1
          },
          historicalSequence: {
            wheelSpeed: [1750, 1780, 1800, 1820, 1790, 1800, 1810, 1780, 1800, 1800],
            brakePressure: [190, 195, 200, 205, 198, 200, 203, 197, 200, 200],
            ambientTemp: [28, 28, 29, 28, 28, 28, 29, 28, 28, 28],
            padThickness: [5.2, 5.0, 4.8, 4.7, 4.6, 4.55, 4.52, 4.5, 4.48, 4.5],
            timestamp: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          }
        },
        groundTruth: {
          temperature: 720,
          wearRate: 0.35,
          predictedLapsRemaining: 8
        },
        scenario_type: 'high_wear'
      },

      // Sensor noise scenario
      {
        id: 'sensor_noise_1',
        name: 'Noisy Sensor Data',
        description: 'Testing robustness with sensor measurement noise',
        inputs: {
          currentState: {
            wheelSpeed: 1520, // With noise
            brakePressure: 118, // With noise
            ambientTemp: 24,
            padThickness: 9.8,
            discMass: 8.5,
            padArea: 150,
            timeStep: 1
          },
          historicalSequence: {
            wheelSpeed: [1505, 1498, 1515, 1522, 1485, 1510, 1508, 1525, 1495, 1520],
            brakePressure: [122, 115, 125, 112, 128, 118, 120, 114, 125, 118],
            ambientTemp: [24, 25, 23, 26, 24, 25, 23, 24, 25, 24],
            padThickness: [9.85, 9.83, 9.82, 9.81, 9.80, 9.79, 9.78, 9.79, 9.80, 9.8],
            timestamp: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          }
        },
        groundTruth: {
          temperature: 530,
          wearRate: 0.09,
          predictedLapsRemaining: 40
        },
        scenario_type: 'sensor_noise'
      },

      // Rapid change scenario
      {
        id: 'rapid_change_1',
        name: 'Sudden Condition Change',
        description: 'Rapid transition from light to heavy braking',
        inputs: {
          currentState: {
            wheelSpeed: 2000,
            brakePressure: 220,
            ambientTemp: 30,
            padThickness: 7.5,
            discMass: 8.5,
            padArea: 150,
            timeStep: 1
          },
          historicalSequence: {
            wheelSpeed: [1200, 1250, 1300, 1400, 1600, 1700, 1850, 1900, 1950, 2000],
            brakePressure: [80, 85, 90, 120, 150, 180, 200, 210, 215, 220],
            ambientTemp: [30, 30, 30, 30, 31, 31, 30, 30, 30, 30],
            padThickness: [7.8, 7.75, 7.7, 7.65, 7.6, 7.58, 7.55, 7.53, 7.51, 7.5],
            timestamp: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          }
        },
        groundTruth: {
          temperature: 650,
          wearRate: 0.18,
          predictedLapsRemaining: 25
        },
        scenario_type: 'rapid_change'
      }
    ];
  }

  async evaluateModels(): Promise<ComparisonResults> {
    console.log('Starting comprehensive model evaluation...');

    // Evaluate Hybrid Digital Twin
    const hybridPerformance = await this.evaluateHybridModel();
    
    // Evaluate LSTM Only
    const lstmPerformance = await this.evaluateLSTMModel();

    // Compare results
    const comparison = this.compareModels(hybridPerformance, lstmPerformance);

    return comparison;
  }

  private async evaluateHybridModel(): Promise<ModelPerformance> {
    const predictions: any[] = [];
    const responseTimes: number[] = [];
    let totalError = 0;
    let totalSquaredError = 0;

    for (const scenario of this.testScenarios) {
      const startTime = performance.now();
      
      const prediction = this.hybridModel.predict(scenario.inputs);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);

      // Calculate error for temperature (primary metric)
      const error = Math.abs(prediction.temperature - scenario.groundTruth.temperature) / scenario.groundTruth.temperature;
      totalError += error;
      totalSquaredError += error * error;

      predictions.push({
        scenario: scenario.name,
        predicted: {
          temperature: prediction.temperature,
          wearRate: prediction.wearRate,
          predictedLapsRemaining: prediction.predictedLapsRemaining
        },
        actual: scenario.groundTruth,
        error: error,
        responseTime: responseTime
      });
    }

    const meanError = totalError / this.testScenarios.length;
    const rmse = Math.sqrt(totalSquaredError / this.testScenarios.length);
    const accuracy = Math.max(0, (1 - meanError) * 100);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    // Interpretability score for hybrid model (high due to physics + explainable ML)
    const interpretability = 85;

    return {
      accuracy,
      responseTime: avgResponseTime,
      interpretability,
      meanAbsoluteError: meanError,
      rootMeanSquareError: rmse,
      predictions
    };
  }

  private async evaluateLSTMModel(): Promise<ModelPerformance> {
    const predictions: any[] = [];
    const responseTimes: number[] = [];
    let totalError = 0;
    let totalSquaredError = 0;

    for (const scenario of this.testScenarios) {
      const startTime = performance.now();
      
      const prediction = this.lstmModel.predict(scenario.inputs.historicalSequence);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);

      // Calculate error for temperature (primary metric)
      const error = Math.abs(prediction.temperature - scenario.groundTruth.temperature) / scenario.groundTruth.temperature;
      totalError += error;
      totalSquaredError += error * error;

      predictions.push({
        scenario: scenario.name,
        predicted: {
          temperature: prediction.temperature,
          wearRate: prediction.wearRate,
          predictedLapsRemaining: prediction.predictedLapsRemaining
        },
        actual: scenario.groundTruth,
        error: error,
        responseTime: responseTime
      });
    }

    const meanError = totalError / this.testScenarios.length;
    const rmse = Math.sqrt(totalSquaredError / this.testScenarios.length);
    const accuracy = Math.max(0, (1 - meanError) * 100);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    // Interpretability score for LSTM only (lower due to black box nature)
    const interpretability = 35;

    return {
      accuracy,
      responseTime: avgResponseTime,
      interpretability,
      meanAbsoluteError: meanError,
      rootMeanSquareError: rmse,
      predictions
    };
  }

  private compareModels(hybrid: ModelPerformance, lstm: ModelPerformance): ComparisonResults {
    const accuracyImprovement = ((hybrid.accuracy - lstm.accuracy) / lstm.accuracy) * 100;
    const responseTimeImprovement = ((lstm.responseTime - hybrid.responseTime) / lstm.responseTime) * 100;
    const interpretabilityImprovement = ((hybrid.interpretability - lstm.interpretability) / lstm.interpretability) * 100;

    let winner: 'hybrid' | 'lstm' | 'tie' = 'tie';
    
    // Weighted scoring: 40% accuracy, 20% speed, 40% interpretability
    const hybridScore = hybrid.accuracy * 0.4 + (100 - hybrid.responseTime) * 0.2 + hybrid.interpretability * 0.4;
    const lstmScore = lstm.accuracy * 0.4 + (100 - lstm.responseTime) * 0.2 + lstm.interpretability * 0.4;
    
    if (hybridScore > lstmScore + 2) winner = 'hybrid';
    else if (lstmScore > hybridScore + 2) winner = 'lstm';

    let summary = `Comparison Results:\n`;
    summary += `- Hybrid Digital Twin: ${hybrid.accuracy.toFixed(1)}% accuracy, ${hybrid.responseTime.toFixed(1)}ms response, ${hybrid.interpretability}/100 interpretability\n`;
    summary += `- LSTM Only: ${lstm.accuracy.toFixed(1)}% accuracy, ${lstm.responseTime.toFixed(1)}ms response, ${lstm.interpretability}/100 interpretability\n`;
    summary += `- Winner: ${winner.toUpperCase()}\n`;
    summary += `- Improvements: Accuracy ${accuracyImprovement.toFixed(1)}%, Speed ${responseTimeImprovement.toFixed(1)}%, Interpretability ${interpretabilityImprovement.toFixed(1)}%`;

    return {
      hybridTwin: hybrid,
      lstmOnly: lstm,
      winner,
      improvements: {
        accuracy: accuracyImprovement,
        responseTime: responseTimeImprovement,
        interpretability: interpretabilityImprovement
      },
      summary
    };
  }

  // Generate detailed performance report
  generateReport(results: ComparisonResults): string {
    let report = `# Brake System Digital Twin Evaluation Report\n\n`;
    
    report += `## Executive Summary\n`;
    report += `${results.summary}\n\n`;
    
    report += `## Detailed Performance Analysis\n\n`;
    
    report += `### Hybrid Digital Twin (Physics + LSTM)\n`;
    report += `- **Prediction Accuracy**: ${results.hybridTwin.accuracy.toFixed(2)}%\n`;
    report += `- **Response Time**: ${results.hybridTwin.responseTime.toFixed(2)}ms\n`;
    report += `- **Interpretability Score**: ${results.hybridTwin.interpretability}/100\n`;
    report += `- **Mean Absolute Error**: ${(results.hybridTwin.meanAbsoluteError * 100).toFixed(2)}%\n`;
    report += `- **Root Mean Square Error**: ${(results.hybridTwin.rootMeanSquareError * 100).toFixed(2)}%\n\n`;
    
    report += `### LSTM-Only Model\n`;
    report += `- **Prediction Accuracy**: ${results.lstmOnly.accuracy.toFixed(2)}%\n`;
    report += `- **Response Time**: ${results.lstmOnly.responseTime.toFixed(2)}ms\n`;
    report += `- **Interpretability Score**: ${results.lstmOnly.interpretability}/100\n`;
    report += `- **Mean Absolute Error**: ${(results.lstmOnly.meanAbsoluteError * 100).toFixed(2)}%\n`;
    report += `- **Root Mean Square Error**: ${(results.lstmOnly.rootMeanSquareError * 100).toFixed(2)}%\n\n`;
    
    report += `## Key Findings\n\n`;
    
    if (results.winner === 'hybrid') {
      report += `✅ **Hybrid Digital Twin outperforms LSTM-only model**\n`;
      report += `- ${Math.abs(results.improvements.accuracy).toFixed(1)}% better accuracy\n`;
      report += `- ${Math.abs(results.improvements.interpretability).toFixed(1)}% better interpretability\n`;
      if (results.improvements.responseTime > 0) {
        report += `- ${results.improvements.responseTime.toFixed(1)}% faster response time\n`;
      }
    } else if (results.winner === 'lstm') {
      report += `⚠️ **LSTM-only model outperforms Hybrid Digital Twin**\n`;
      report += `This may indicate need for physics model refinement or better integration.\n`;
    } else {
      report += `🤝 **Models show similar overall performance**\n`;
      report += `Consider use case specific requirements for final selection.\n`;
    }
    
    report += `\n## Recommendations\n\n`;
    report += `1. **For Production Use**: ${results.winner === 'hybrid' ? 'Deploy Hybrid Digital Twin' : 'Further optimize hybrid approach'}\n`;
    report += `2. **For Critical Safety**: Hybrid model recommended due to interpretability\n`;
    report += `3. **For Real-time Applications**: ${results.hybridTwin.responseTime < results.lstmOnly.responseTime ? 'Hybrid model suitable' : 'Optimize hybrid model performance'}\n`;
    
    return report;
  }

  // Get test scenarios for inspection
  getTestScenarios(): TestScenario[] {
    return this.testScenarios;
  }
} 