import { HybridDigitalTwin, HybridPrediction, HybridInputs } from '../models/HybridDigitalTwin';
import { LSTMModel, LSTMInputSequence, LSTMPrediction } from '../models/LSTMModel';
import { PhysicsModel } from '../models/PhysicsModel';
import { GRUModel } from '../models/GRUModel';
import { TCNModel } from '../models/TCNModel';

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
  r2: number;
  calibrationECE?: number;
  calibrationBins?: Array<{ bin: string; confidenceAvg: number; accuracy: number; count: number }>;
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
  physicsOnly: ModelPerformance;
  gru: ModelPerformance;
  tcn: ModelPerformance;
  winner: 'hybrid' | 'lstm' | 'physics' | 'gru' | 'tcn' | 'tie';
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
  private physicsModel: PhysicsModel;
  private gruModel: GRUModel;
  private tcnModel: TCNModel;
  private testScenarios: TestScenario[] = [];

  constructor() {
    this.hybridModel = new HybridDigitalTwin();
    this.lstmModel = new LSTMModel();
    this.physicsModel = new PhysicsModel();
    this.gruModel = new GRUModel();
    this.tcnModel = new TCNModel();
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
    
    // Evaluate Bi-LSTM Only
    const lstmPerformance = await this.evaluateLSTMModel();

    // Evaluate Physics Only
    const physicsPerformance = await this.evaluatePhysicsOnly();

    // Evaluate GRU baseline
    const gruPerformance = await this.evaluateGRUModel();

    // Evaluate TCN baseline
    const tcnPerformance = await this.evaluateTCNModel();

    // Compare results
    const comparison = this.compareModels(hybridPerformance, lstmPerformance, physicsPerformance, gruPerformance, tcnPerformance);

    return comparison;
  }

  private async evaluateHybridModel(): Promise<ModelPerformance> {
    const predictions: any[] = [];
    const responseTimes: number[] = [];
    let totalError = 0;
    let totalSquaredError = 0;
    const yTrue: number[] = [];
    const yPred: number[] = [];
    const confidences: number[] = [];

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
      yTrue.push(scenario.groundTruth.temperature);
      yPred.push(prediction.temperature);
      confidences.push(prediction.confidence ?? 0.6);

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
    const r2 = this.computeR2(yTrue, yPred);
    const calibration = this.computeCalibrationECE(yTrue, yPred, confidences);
    
    // Interpretability score for hybrid model (high due to physics + explainable ML)
    const interpretability = 85;

    return {
      accuracy,
      responseTime: avgResponseTime,
      interpretability,
      meanAbsoluteError: meanError,
      rootMeanSquareError: rmse,
      r2,
      calibrationECE: calibration.ece,
      calibrationBins: calibration.bins,
      predictions
    };
  }

  private async evaluateLSTMModel(): Promise<ModelPerformance> {
    const predictions: any[] = [];
    const responseTimes: number[] = [];
    let totalError = 0;
    let totalSquaredError = 0;
    const yTrue: number[] = [];
    const yPred: number[] = [];
    const confidences: number[] = [];

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
      yTrue.push(scenario.groundTruth.temperature);
      yPred.push(prediction.temperature);
      confidences.push(prediction.confidence ?? 0.5);

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
    const r2 = this.computeR2(yTrue, yPred);
    const calibration = this.computeCalibrationECE(yTrue, yPred, confidences);
    
    // Interpretability score for Bi-LSTM only (lower due to black box nature)
    const interpretability = 35;

    return {
      accuracy,
      responseTime: avgResponseTime,
      interpretability,
      meanAbsoluteError: meanError,
      rootMeanSquareError: rmse,
      r2,
      calibrationECE: calibration.ece,
      calibrationBins: calibration.bins,
      predictions
    };
  }

  private async evaluatePhysicsOnly(): Promise<ModelPerformance> {
    const predictions: any[] = [];
    const responseTimes: number[] = [];
    let totalError = 0;
    let totalSquaredError = 0;
    const yTrue: number[] = [];
    const yPred: number[] = [];

    for (const scenario of this.testScenarios) {
      const startTime = performance.now();
      const physics = this.physicsModel.predict(scenario.inputs.currentState);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);

      const error = Math.abs(physics.temperature - scenario.groundTruth.temperature) / scenario.groundTruth.temperature;
      totalError += error;
      totalSquaredError += error * error;
      yTrue.push(scenario.groundTruth.temperature);
      yPred.push(physics.temperature);

      predictions.push({
        scenario: scenario.name,
        predicted: {
          temperature: physics.temperature,
          wearRate: physics.wearRate,
          predictedLapsRemaining: physics.predictedLapsRemaining,
        },
        actual: scenario.groundTruth,
        error,
        responseTime,
      });
    }

    const meanError = totalError / this.testScenarios.length;
    const rmse = Math.sqrt(totalSquaredError / this.testScenarios.length);
    const accuracy = Math.max(0, (1 - meanError) * 100);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const r2 = this.computeR2(yTrue, yPred);

    return {
      accuracy,
      responseTime: avgResponseTime,
      interpretability: 95,
      meanAbsoluteError: meanError,
      rootMeanSquareError: rmse,
      r2,
      predictions,
    } as ModelPerformance;
  }

  private async evaluateGRUModel(): Promise<ModelPerformance> {
    const predictions: any[] = [];
    const responseTimes: number[] = [];
    let totalError = 0;
    let totalSquaredError = 0;
    const yTrue: number[] = [];
    const yPred: number[] = [];
    const confidences: number[] = [];

    for (const scenario of this.testScenarios) {
      const startTime = performance.now();
      const prediction = this.gruModel.predict(scenario.inputs.historicalSequence as any);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);

      const error = Math.abs(prediction.temperature - scenario.groundTruth.temperature) / scenario.groundTruth.temperature;
      totalError += error;
      totalSquaredError += error * error;
      yTrue.push(scenario.groundTruth.temperature);
      yPred.push(prediction.temperature);
      confidences.push(prediction.confidence ?? 0.5);

      predictions.push({
        scenario: scenario.name,
        predicted: prediction,
        actual: scenario.groundTruth,
        error,
        responseTime,
      });
    }

    const meanError = totalError / this.testScenarios.length;
    const rmse = Math.sqrt(totalSquaredError / this.testScenarios.length);
    const accuracy = Math.max(0, (1 - meanError) * 100);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const r2 = this.computeR2(yTrue, yPred);
    const calibration = this.computeCalibrationECE(yTrue, yPred, confidences);

    return {
      accuracy,
      responseTime: avgResponseTime,
      interpretability: 45,
      meanAbsoluteError: meanError,
      rootMeanSquareError: rmse,
      r2,
      calibrationECE: calibration.ece,
      calibrationBins: calibration.bins,
      predictions,
    } as ModelPerformance;
  }

  private async evaluateTCNModel(): Promise<ModelPerformance> {
    const predictions: any[] = [];
    const responseTimes: number[] = [];
    let totalError = 0;
    let totalSquaredError = 0;
    const yTrue: number[] = [];
    const yPred: number[] = [];
    const confidences: number[] = [];

    for (const scenario of this.testScenarios) {
      const startTime = performance.now();
      const prediction = this.tcnModel.predict(scenario.inputs.historicalSequence as any);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);

      const error = Math.abs(prediction.temperature - scenario.groundTruth.temperature) / scenario.groundTruth.temperature;
      totalError += error;
      totalSquaredError += error * error;
      yTrue.push(scenario.groundTruth.temperature);
      yPred.push(prediction.temperature);
      confidences.push(prediction.confidence ?? 0.5);

      predictions.push({
        scenario: scenario.name,
        predicted: prediction,
        actual: scenario.groundTruth,
        error,
        responseTime,
      });
    }

    const meanError = totalError / this.testScenarios.length;
    const rmse = Math.sqrt(totalSquaredError / this.testScenarios.length);
    const accuracy = Math.max(0, (1 - meanError) * 100);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const r2 = this.computeR2(yTrue, yPred);
    const calibration = this.computeCalibrationECE(yTrue, yPred, confidences);

    return {
      accuracy,
      responseTime: avgResponseTime,
      interpretability: 40,
      meanAbsoluteError: meanError,
      rootMeanSquareError: rmse,
      r2,
      calibrationECE: calibration.ece,
      calibrationBins: calibration.bins,
      predictions,
    } as ModelPerformance;
  }

  private compareModels(hybrid: ModelPerformance, lstm: ModelPerformance, physics: ModelPerformance, gru: ModelPerformance, tcn: ModelPerformance): ComparisonResults {
    const models = { hybrid, lstm, physics, gru, tcn } as const;

    const scores = Object.fromEntries(
      Object.entries(models).map(([k, m]) => [
        k,
        m.accuracy * 0.4 + (100 - Math.min(100, m.responseTime)) * 0.2 + m.interpretability * 0.4
      ])
    ) as Record<string, number>;

    const winnerKey = (Object.keys(scores) as Array<keyof typeof scores>).reduce((a, b) => (scores[a] >= scores[b] ? a : b));
    const winner = (winnerKey === 'hybrid' || winnerKey === 'lstm' || winnerKey === 'physics' || winnerKey === 'gru' || winnerKey === 'tcn') ? winnerKey : 'tie';

    const accuracyImprovement = ((hybrid.accuracy - lstm.accuracy) / Math.max(1e-6, lstm.accuracy)) * 100;
    const responseTimeImprovement = ((lstm.responseTime - hybrid.responseTime) / Math.max(1e-6, lstm.responseTime)) * 100;
    const interpretabilityImprovement = ((hybrid.interpretability - lstm.interpretability) / Math.max(1e-6, lstm.interpretability)) * 100;

    let summary = `Comparison Results:\n`;
    summary += `- Hybrid Digital Twin: ${hybrid.accuracy.toFixed(1)}% acc, R²=${hybrid.r2.toFixed(2)}, ${hybrid.responseTime.toFixed(1)}ms, Interp ${hybrid.interpretability}/100\n`;
    summary += `- Bi-LSTM Only: ${lstm.accuracy.toFixed(1)}% acc, R²=${lstm.r2.toFixed(2)}, ${lstm.responseTime.toFixed(1)}ms, Interp ${lstm.interpretability}/100\n`;
    summary += `- Physics Only: ${physics.accuracy.toFixed(1)}% acc, R²=${physics.r2.toFixed(2)}, ${physics.responseTime.toFixed(1)}ms, Interp ${physics.interpretability}/100\n`;
    summary += `- GRU: ${gru.accuracy.toFixed(1)}% acc, R²=${gru.r2.toFixed(2)}, ${gru.responseTime.toFixed(1)}ms, Interp ${gru.interpretability}/100\n`;
    summary += `- TCN: ${tcn.accuracy.toFixed(1)}% acc, R²=${tcn.r2.toFixed(2)}, ${tcn.responseTime.toFixed(1)}ms, Interp ${tcn.interpretability}/100\n`;
    summary += `- Winner: ${winner.toUpperCase()}\n`;
    summary += `- Vs Bi-LSTM: Accuracy ${accuracyImprovement.toFixed(1)}%, Speed ${responseTimeImprovement.toFixed(1)}%, Interpretability ${interpretabilityImprovement.toFixed(1)}%`;

    return {
      hybridTwin: hybrid,
      lstmOnly: lstm,
      physicsOnly: physics,
      gru,
      tcn,
      winner: winner as any,
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
    
    report += `### Hybrid Digital Twin (Physics + Bi-LSTM + Attention)\n`;
    report += `- **Prediction Accuracy**: ${results.hybridTwin.accuracy.toFixed(2)}%\n`;
    report += `- **Response Time**: ${results.hybridTwin.responseTime.toFixed(2)}ms\n`;
    report += `- **Interpretability Score**: ${results.hybridTwin.interpretability}/100\n`;
    report += `- **Mean Absolute Error**: ${(results.hybridTwin.meanAbsoluteError * 100).toFixed(2)}%\n`;
    report += `- **Root Mean Square Error**: ${(results.hybridTwin.rootMeanSquareError * 100).toFixed(2)}%\n\n`;
    report += `- **R²**: ${results.hybridTwin.r2.toFixed(3)}\n`;
    if (results.hybridTwin.calibrationECE !== undefined) {
      report += `- **Calibration (ECE)**: ${results.hybridTwin.calibrationECE.toFixed(3)}\n\n`;
    }
    
    report += `### Bi-LSTM-Only Model\n`;
    report += `- **Prediction Accuracy**: ${results.lstmOnly.accuracy.toFixed(2)}%\n`;
    report += `- **Response Time**: ${results.lstmOnly.responseTime.toFixed(2)}ms\n`;
    report += `- **Interpretability Score**: ${results.lstmOnly.interpretability}/100\n`;
    report += `- **Mean Absolute Error**: ${(results.lstmOnly.meanAbsoluteError * 100).toFixed(2)}%\n`;
    report += `- **Root Mean Square Error**: ${(results.lstmOnly.rootMeanSquareError * 100).toFixed(2)}%\n`;
    report += `- **R²**: ${results.lstmOnly.r2.toFixed(3)}\n`;
    if (results.lstmOnly.calibrationECE !== undefined) {
      report += `- **Calibration (ECE)**: ${results.lstmOnly.calibrationECE.toFixed(3)}\n`;
    }
    report += `\n`;

    report += `### Physics-Only Baseline\n`;
    report += `- **Prediction Accuracy**: ${results.physicsOnly.accuracy.toFixed(2)}%\n`;
    report += `- **Response Time**: ${results.physicsOnly.responseTime.toFixed(2)}ms\n`;
    report += `- **Interpretability Score**: ${results.physicsOnly.interpretability}/100\n`;
    report += `- **MAE**: ${(results.physicsOnly.meanAbsoluteError * 100).toFixed(2)}%\n`;
    report += `- **RMSE**: ${(results.physicsOnly.rootMeanSquareError * 100).toFixed(2)}%\n`;
    report += `- **R²**: ${results.physicsOnly.r2.toFixed(3)}\n\n`;

    report += `### GRU Baseline\n`;
    report += `- **Prediction Accuracy**: ${results.gru.accuracy.toFixed(2)}%\n`;
    report += `- **Response Time**: ${results.gru.responseTime.toFixed(2)}ms\n`;
    report += `- **Interpretability Score**: ${results.gru.interpretability}/100\n`;
    report += `- **MAE**: ${(results.gru.meanAbsoluteError * 100).toFixed(2)}%\n`;
    report += `- **RMSE**: ${(results.gru.rootMeanSquareError * 100).toFixed(2)}%\n`;
    report += `- **R²**: ${results.gru.r2.toFixed(3)}\n\n`;

    report += `### TCN Baseline\n`;
    report += `- **Prediction Accuracy**: ${results.tcn.accuracy.toFixed(2)}%\n`;
    report += `- **Response Time**: ${results.tcn.responseTime.toFixed(2)}ms\n`;
    report += `- **Interpretability Score**: ${results.tcn.interpretability}/100\n`;
    report += `- **MAE**: ${(results.tcn.meanAbsoluteError * 100).toFixed(2)}%\n`;
    report += `- **RMSE**: ${(results.tcn.rootMeanSquareError * 100).toFixed(2)}%\n`;
    report += `- **R²**: ${results.tcn.r2.toFixed(3)}\n\n`;
    
    report += `## Key Findings\n\n`;
    
    if (results.winner === 'hybrid') {
      report += `✅ **Hybrid Digital Twin outperforms Bi-LSTM-only model**\n`;
      report += `- ${Math.abs(results.improvements.accuracy).toFixed(1)}% better accuracy\n`;
      report += `- ${Math.abs(results.improvements.interpretability).toFixed(1)}% better interpretability\n`;
      if (results.improvements.responseTime > 0) {
        report += `- ${results.improvements.responseTime.toFixed(1)}% faster response time\n`;
      }
    } else if (results.winner === 'lstm') {
      report += `⚠️ **Bi-LSTM-only model outperforms Hybrid Digital Twin**\n`;
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

  private computeR2(yTrue: number[], yPred: number[]) {
    const n = yTrue.length;
    if (n === 0) return 0;
    const mean = yTrue.reduce((a, b) => a + b, 0) / n;
    const ssTot = yTrue.reduce((s, yi) => s + Math.pow(yi - mean, 2), 0);
    const ssRes = yTrue.reduce((s, yi, i) => s + Math.pow(yi - yPred[i], 2), 0);
    return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  }

  private computeCalibrationECE(yTrue: number[], yPred: number[], conf: number[]) {
    // For regression, define correctness within a relative error tolerance and compare to confidence
    const tol = 0.1; // 10% error threshold considered correct
    const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const out: Array<{ bin: string; confidenceAvg: number; accuracy: number; count: number }> = [];
    let ece = 0;
    for (let i = 0; i < bins.length - 1; i++) {
      const lo = bins[i];
      const hi = bins[i + 1];
      const idxs = conf.map((c, idx) => ({ c, idx })).filter(o => o.c >= lo && o.c < hi).map(o => o.idx);
      const count = idxs.length;
      const confidenceAvg = count ? idxs.reduce((s, j) => s + conf[j], 0) / count : 0;
      const acc = count ? idxs.reduce((s, j) => s + (Math.abs(yPred[j] - yTrue[j]) / Math.max(1e-6, yTrue[j]) <= tol ? 1 : 0), 0) / count : 0;
      ece += (count / Math.max(1, conf.length)) * Math.abs(acc - confidenceAvg);
      out.push({ bin: `${lo.toFixed(1)}-${hi.toFixed(1)}`, confidenceAvg, accuracy: acc, count });
    }
    return { ece, bins: out };
  }
} 