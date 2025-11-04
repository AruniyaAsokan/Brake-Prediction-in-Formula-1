import { PhysicsModel, BrakePhysicsInputs, BrakePhysicsOutputs } from './PhysicsModel';
import { LSTMModel, LSTMInputSequence, LSTMPrediction } from './LSTMModel';

export interface HybridPrediction {
  temperature: number;
  wearRate: number;
  predictedLapsRemaining: number;
  heatGeneration: number;
  coolingRate: number;
  thermalStress: number;
  confidence: number;
  physicsWeight: number;
  mlWeight: number;
  anomalyScore: number;
}

export interface HybridInputs {
  currentState: BrakePhysicsInputs;
  historicalSequence: LSTMInputSequence;
  previousTemperature?: number;
}

export class HybridDigitalTwin {
  private physicsModel: PhysicsModel;
  private lstmModel: LSTMModel;
  private adaptiveWeights = {
    physics: 0.6,
    lstm: 0.4
  };
  private calibrationFactor = 1.0;

  constructor() {
    this.physicsModel = new PhysicsModel();
    this.lstmModel = new LSTMModel();
  }

  predict(inputs: HybridInputs): HybridPrediction {
    const startTime = performance.now();

    try {
      // Get physics-based prediction
      const physicsResult = this.physicsModel.predict(
        inputs.currentState, 
        inputs.previousTemperature
      );

      // Get modern LSTM prediction with error handling
      let lstmResult;
      try {
        lstmResult = this.lstmModel.predict(inputs.historicalSequence);
        
        // Validate LSTM results
        if (!lstmResult || 
            isNaN(lstmResult.temperature) || 
            isNaN(lstmResult.wearRate) || 
            isNaN(lstmResult.predictedLapsRemaining)) {
          console.warn('LSTM returned invalid results, using physics-only prediction');
          lstmResult = {
            temperature: physicsResult.temperature,
            wearRate: physicsResult.wearRate,
            predictedLapsRemaining: physicsResult.predictedLapsRemaining,
            confidence: 0.3 // Low confidence for fallback
          };
        }
      } catch (error) {
        console.error('LSTM prediction failed:', error);
        lstmResult = {
          temperature: physicsResult.temperature,
          wearRate: physicsResult.wearRate,
          predictedLapsRemaining: physicsResult.predictedLapsRemaining,
          confidence: 0.2 // Very low confidence for error case
        };
      }

      // Calculate anomaly score (difference between physics and ML predictions)
      const tempDiff = Math.abs(physicsResult.temperature - lstmResult.temperature);
      const wearDiff = Math.abs(physicsResult.wearRate - lstmResult.wearRate);
      const anomalyScore = this.calculateAnomalyScore(tempDiff, wearDiff);

      // Adapt weights based on anomaly score and confidence
      const adaptedWeights = this.adaptWeights(anomalyScore, lstmResult.confidence);

      // Combine predictions using adaptive weights
      const hybridPrediction = this.combinePredictions(
        physicsResult, 
        lstmResult, 
        adaptedWeights
      );

      // Apply domain knowledge corrections
      const correctedPrediction = this.applyDomainCorrections(hybridPrediction, inputs);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      return {
        ...correctedPrediction,
        heatGeneration: physicsResult.heatGeneration,
        coolingRate: physicsResult.coolingRate,
        thermalStress: physicsResult.thermalStress,
        confidence: this.calculateOverallConfidence(lstmResult.confidence, anomalyScore),
        physicsWeight: adaptedWeights.physics,
        mlWeight: adaptedWeights.lstm,
        anomalyScore: anomalyScore
      };
      
    } catch (error) {
      console.error('Hybrid prediction error:', error);
      
      // Fallback to physics-only prediction
      const physicsResult = this.physicsModel.predict(
        inputs.currentState, 
        inputs.previousTemperature
      );
      
      return {
        temperature: physicsResult.temperature,
        wearRate: physicsResult.wearRate,
        predictedLapsRemaining: physicsResult.predictedLapsRemaining,
        heatGeneration: physicsResult.heatGeneration,
        coolingRate: physicsResult.coolingRate,
        thermalStress: physicsResult.thermalStress,
        confidence: 0.4, // Lower confidence for fallback
        physicsWeight: 1.0,
        mlWeight: 0.0,
        anomalyScore: 0.8 // High anomaly score for error case
      };
    }
  }

  private calculateAnomalyScore(tempDiff: number, wearDiff: number): number {
    // Normalize differences to 0-1 scale
    const normalizedTempDiff = Math.min(tempDiff / 200, 1); // 200°C max expected diff
    const normalizedWearDiff = Math.min(wearDiff / 0.1, 1); // 0.1 mm/lap max expected diff
    
    return (normalizedTempDiff + normalizedWearDiff) / 2;
  }

  private adaptWeights(anomalyScore: number, lstmConfidence: number): { physics: number; lstm: number } {
    // When anomaly score is high or LSTM confidence is low, trust physics more
    let physicsWeight = this.adaptiveWeights.physics;
    let lstmWeight = this.adaptiveWeights.lstm;

    // Increase physics weight if anomaly detected
    if (anomalyScore > 0.3) {
      physicsWeight += 0.2 * anomalyScore;
    }

    // Adjust based on LSTM confidence
    if (lstmConfidence < 0.7) {
      physicsWeight += 0.15 * (0.7 - lstmConfidence);
    }

    // Ensure weights sum to 1
    const totalWeight = physicsWeight + lstmWeight;
    physicsWeight = Math.min(0.8, physicsWeight / totalWeight);
    lstmWeight = 1 - physicsWeight;

    return { physics: physicsWeight, lstm: lstmWeight };
  }

  private combinePredictions(
    physics: BrakePhysicsOutputs, 
    lstm: LSTMPrediction, 
    weights: { physics: number; lstm: number }
  ): { temperature: number; wearRate: number; predictedLapsRemaining: number } {
    
    // Weighted combination
    const temperature = (physics.temperature * weights.physics) + 
                       (lstm.temperature * weights.lstm);
    
    const wearRate = (physics.wearRate * weights.physics) + 
                    (lstm.wearRate * weights.lstm);
    
    const predictedLapsRemaining = (physics.predictedLapsRemaining * weights.physics) + 
                                  (lstm.predictedLapsRemaining * weights.lstm);

    return {
      temperature: temperature * this.calibrationFactor,
      wearRate,
      predictedLapsRemaining
    };
  }

  private applyDomainCorrections(
    prediction: { temperature: number; wearRate: number; predictedLapsRemaining: number },
    inputs: HybridInputs
  ): { temperature: number; wearRate: number; predictedLapsRemaining: number } {
    
    // Apply physical constraints
    let { temperature, wearRate, predictedLapsRemaining } = prediction;

    // Temperature bounds
    temperature = Math.max(inputs.currentState.ambientTemp, Math.min(1200, temperature));

    // Wear rate bounds
    wearRate = Math.max(0, Math.min(1.0, wearRate)); // Max 1mm/lap

    // Laps remaining bounds
    const maxPossibleLaps = inputs.currentState.padThickness / 0.001; // Minimum 0.001 mm/lap
    predictedLapsRemaining = Math.max(0, Math.min(maxPossibleLaps, predictedLapsRemaining));

    // Cross-validation: if wear rate is high, remaining laps should be low
    if (wearRate > 0.1 && predictedLapsRemaining > 50) {
      predictedLapsRemaining = Math.min(predictedLapsRemaining, inputs.currentState.padThickness / wearRate);
    }

    return { temperature, wearRate, predictedLapsRemaining };
  }

  private calculateOverallConfidence(lstmConfidence: number, anomalyScore: number): number {
    // Confidence decreases with anomaly score
    const anomalyPenalty = Math.max(0, anomalyScore * 0.3);
    return Math.max(0.5, Math.min(0.95, lstmConfidence - anomalyPenalty));
  }

  // Calibrate the model using real-world data
  calibrate(realWorldData: { predicted: number; actual: number }[]): void {
    if (realWorldData.length === 0) return;

    let totalError = 0;
    for (const point of realWorldData) {
      totalError += Math.abs(point.predicted - point.actual) / point.actual;
    }

    const meanError = totalError / realWorldData.length;
    
    // Adjust calibration factor
    this.calibrationFactor = 1 / (1 + meanError);
    
    // Adapt base weights based on performance
    const errorThreshold = 0.1; // 10% error threshold
    if (meanError > errorThreshold) {
      // Increase physics weight if predictions are poor
      this.adaptiveWeights.physics = Math.min(0.8, this.adaptiveWeights.physics + 0.1);
      this.adaptiveWeights.lstm = 1 - this.adaptiveWeights.physics;
    }

    console.log(`Hybrid model calibrated. Calibration factor: ${this.calibrationFactor.toFixed(3)}`);
  }

  // Get model interpretability information
  getInterpretability(prediction: HybridPrediction): {
    physicsContribution: string[];
    mlContribution: string[];
    confidenceFactors: string[];
    anomalyExplanation: string;
  } {
    const physicsContrib = [
      `Heat generation: ${prediction.heatGeneration.toFixed(1)}W from brake force × velocity`,
      `Cooling rate: ${prediction.coolingRate.toFixed(1)}W from convective heat transfer`,
      `Wear calculation: Based on Archard's equation with pressure and temperature`,
      `Thermal stress: ${prediction.thermalStress.toFixed(1)}MPa from thermal expansion`
    ];

    const mlContrib = [
      `Pattern recognition: Historical sequence analysis`,
      `Non-linear relationships: Learned from training data`,
      `Temporal dependencies: Bi-LSTM memory of past ${this.lstmModel.getModelInfo().sequenceLength} steps`
    ];

    const confidenceFactors = [
      `Bi-LSTM confidence: ${(prediction.confidence * 100).toFixed(1)}%`,
      `Physics weight: ${(prediction.physicsWeight * 100).toFixed(1)}%`,
      `ML weight: ${(prediction.mlWeight * 100).toFixed(1)}%`,
      `Anomaly score: ${(prediction.anomalyScore * 100).toFixed(1)}%`
    ];

    let anomalyExplanation = '';
    if (prediction.anomalyScore > 0.3) {
      anomalyExplanation = 'High anomaly detected: Physics and ML models disagree significantly. ' +
                          'This may indicate unusual operating conditions or sensor issues.';
    } else if (prediction.anomalyScore > 0.15) {
      anomalyExplanation = 'Moderate anomaly detected: Some disagreement between models. Monitor closely.';
    } else {
      anomalyExplanation = 'Low anomaly score: Physics and ML models are in agreement.';
    }

    return {
      physicsContribution: physicsContrib,
      mlContribution: mlContrib,
      confidenceFactors,
      anomalyExplanation
    };
  }

  // Get performance metrics
  getModelInfo() {
    return {
      physicsModel: 'First-principles brake thermodynamics and wear model',
      lstmModel: this.lstmModel.getModelInfo(),
      adaptiveWeights: this.adaptiveWeights,
      calibrationFactor: this.calibrationFactor
    };
  }
}