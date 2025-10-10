import { LSTMTrainingData } from '../models/LSTMModel';

export interface BrakeDataPoint {
  timestamp: number;
  wheelSpeed: number;
  brakePressure: number;
  ambientTemp: number;
  padThickness: number;
  actualTemperature: number;
  actualWearRate: number;
  lapNumber: number;
  trackCondition: 'dry' | 'wet' | 'mixed';
}

export class TestDataGenerator {
  
  static generateRaceData(
    numLaps: number = 50, 
    samplesPerLap: number = 10
  ): BrakeDataPoint[] {
    const data: BrakeDataPoint[] = [];
    let currentPadThickness = 15.0; // Start with new pads
    let baseTemp = 25;
    
    for (let lap = 1; lap <= numLaps; lap++) {
      const trackCondition = this.getTrackCondition(lap);
      
      for (let sample = 0; sample < samplesPerLap; sample++) {
        const timeInLap = sample / samplesPerLap;
        
        // Generate realistic brake data based on lap position
        const { wheelSpeed, brakePressure } = this.getBrakingProfile(timeInLap, lap, trackCondition);
        
        // Calculate temperature based on realistic F1 physics
        // F1 brake discs can reach 1200°C under heavy braking
        const heatInput = (brakePressure / 100) * (wheelSpeed / 1000) * 120; // Increased heat generation
        const cooling = 0.02 * (baseTemp - 25); // Reduced cooling rate for more realistic buildup
        baseTemp = Math.max(25, baseTemp + (heatInput - cooling) * 0.3); // Increased heat accumulation
        
        // Add realistic noise and ensure we can reach high temperatures
        const temperature = Math.min(1200, baseTemp + (Math.random() - 0.5) * 30);
        
        // Calculate wear
        const wearRate = (brakePressure / 200) * (temperature / 500) * 0.008;
        currentPadThickness -= wearRate / samplesPerLap;
        
        data.push({
          timestamp: lap * 90 + (sample * 90 / samplesPerLap), // 90 seconds per lap
          wheelSpeed: wheelSpeed + (Math.random() - 0.5) * 50, // Add noise
          brakePressure: brakePressure + (Math.random() - 0.5) * 10,
          ambientTemp: 25 + Math.sin(lap * 0.1) * 10 + (Math.random() - 0.5) * 5,
          padThickness: currentPadThickness,
          actualTemperature: temperature,
          actualWearRate: wearRate,
          lapNumber: lap,
          trackCondition
        });
      }
    }
    
    return data;
  }
  
  private static getTrackCondition(lap: number): 'dry' | 'wet' | 'mixed' {
    if (lap < 10) return 'dry';
    if (lap > 40) return 'mixed';
    if (lap % 7 === 0) return 'wet'; // Occasional wet conditions
    return 'dry';
  }
  
  private static getBrakingProfile(
    timeInLap: number, 
    lap: number, 
    trackCondition: 'dry' | 'wet' | 'mixed'
  ): { wheelSpeed: number; brakePressure: number } {
    
    // Define braking zones in a typical lap
    const brakingZones = [
      { start: 0.15, end: 0.25, intensity: 0.8 }, // Turn 1
      { start: 0.35, end: 0.45, intensity: 0.6 }, // Turn 2
      { start: 0.65, end: 0.75, intensity: 0.9 }, // Heavy braking zone
      { start: 0.85, end: 0.95, intensity: 0.7 }  // Final turn
    ];
    
    let brakingIntensity = 0.1; // Base braking
    
    // Check if we're in a braking zone
    for (const zone of brakingZones) {
      if (timeInLap >= zone.start && timeInLap <= zone.end) {
        brakingIntensity = zone.intensity;
        break;
      }
    }
    
    // Adjust for track conditions
    if (trackCondition === 'wet') {
      brakingIntensity *= 0.7; // Lighter braking in wet
    } else if (trackCondition === 'mixed') {
      brakingIntensity *= 0.85;
    }
    
    // Adjust for tire degradation over laps
    const tireDegradation = 1 + (lap - 1) * 0.005;
    brakingIntensity *= tireDegradation;
    
    // Calculate speed and pressure
    const maxSpeed = 2800;
    const baseSpeed = maxSpeed * (0.4 + 0.6 * (1 - brakingIntensity));
    const wheelSpeed = baseSpeed + Math.sin(timeInLap * 4 * Math.PI) * 200; // Speed variation
    
    const maxPressure = 280;
    const brakePressure = maxPressure * brakingIntensity;
    
    return {
      wheelSpeed: Math.max(500, wheelSpeed),
      brakePressure: Math.max(20, brakePressure)
    };
  }
  
  static convertToLSTMTrainingData(
    raceData: BrakeDataPoint[], 
    sequenceLength: number = 10
  ): LSTMTrainingData[] {
    const trainingData: LSTMTrainingData[] = [];
    
    for (let i = sequenceLength; i < raceData.length; i++) {
      const sequence = raceData.slice(i - sequenceLength, i);
      const target = raceData[i];
      
      const lstmData: LSTMTrainingData = {
        inputs: {
          wheelSpeed: sequence.map(d => d.wheelSpeed),
          brakePressure: sequence.map(d => d.brakePressure),
          ambientTemp: sequence.map(d => d.ambientTemp),
          padThickness: sequence.map(d => d.padThickness),
          timestamp: sequence.map(d => d.timestamp)
        },
        outputs: {
          temperature: target.actualTemperature,
          wearRate: target.actualWearRate,
          predictedLapsRemaining: Math.max(0, target.padThickness / target.actualWearRate)
        }
      };
      
      trainingData.push(lstmData);
    }
    
    return trainingData;
  }
  
  // Generate specific test scenarios for edge cases
  static generateEdgeCaseScenarios(): BrakeDataPoint[] {
    const scenarios: BrakeDataPoint[] = [];
    
    // Scenario 1: Brake fade (overheating)
    for (let i = 0; i < 20; i++) {
      scenarios.push({
        timestamp: i * 5,
        wheelSpeed: 2500 + i * 50, // Increasing speed
        brakePressure: 250 + i * 5, // Increasing pressure
        ambientTemp: 35,
        padThickness: 6 - i * 0.1,
        actualTemperature: 600 + i * 30, // Rapid heating
        actualWearRate: 0.2 + i * 0.02,
        lapNumber: 1,
        trackCondition: 'dry'
      });
    }
    
    // Scenario 2: Cold start (low temperature)
    for (let i = 0; i < 15; i++) {
      scenarios.push({
        timestamp: 1000 + i * 5,
        wheelSpeed: 800 + i * 100,
        brakePressure: 50 + i * 10,
        ambientTemp: 5, // Cold conditions
        padThickness: 14 - i * 0.05,
        actualTemperature: 5 + i * 15, // Gradual warming
        actualWearRate: 0.01 + i * 0.005,
        lapNumber: 1,
        trackCondition: 'dry'
      });
    }
    
    // Scenario 3: Sensor malfunction (erratic readings)
    for (let i = 0; i < 10; i++) {
      scenarios.push({
        timestamp: 2000 + i * 5,
        wheelSpeed: 1500 + (Math.random() - 0.5) * 500, // Erratic
        brakePressure: 120 + (Math.random() - 0.5) * 100,
        ambientTemp: 25 + (Math.random() - 0.5) * 20,
        padThickness: 8 - i * 0.1,
        actualTemperature: 450, // Actual value
        actualWearRate: 0.1,
        lapNumber: 1,
        trackCondition: 'dry'
      });
    }
    
    return scenarios;
  }
  
  // Generate validation data with known ground truth
  static generateValidationSet(numSamples: number = 100): Array<{
    inputs: any;
    groundTruth: any;
    scenario: string;
  }> {
    const validationSet = [];
    
    for (let i = 0; i < numSamples; i++) {
      const scenario = i % 5; // 5 different scenario types
      
      switch (scenario) {
        case 0: // Normal conditions
          validationSet.push(this.generateNormalScenario(i));
          break;
        case 1: // High temperature
          validationSet.push(this.generateHighTempScenario(i));
          break;
        case 2: // High wear
          validationSet.push(this.generateHighWearScenario(i));
          break;
        case 3: // Variable conditions
          validationSet.push(this.generateVariableScenario(i));
          break;
        case 4: // Edge case
          validationSet.push(this.generateEdgeScenario(i));
          break;
        default:
          validationSet.push(this.generateNormalScenario(i));
          break;
      }
    }
    
    return validationSet;
  }
  
  private static generateNormalScenario(seed: number) {
    const wheelSpeed = 1200 + (seed % 800);
    const brakePressure = 80 + (seed % 60);
    const padThickness = 5 + (seed % 8);
    const ambientTemp = 20 + (seed % 15);
    
    // Physics-based ground truth
    const heatGen = (brakePressure / 100) * (wheelSpeed / 1000) * 40;
    const cooling = 0.04 * (400 - ambientTemp);
    const temperature = ambientTemp + (heatGen - cooling) * 0.8;
    const wearRate = (brakePressure / 200) * (temperature / 500) * 0.01;
    
    return {
      inputs: { wheelSpeed, brakePressure, ambientTemp, padThickness },
      groundTruth: { 
        temperature: Math.max(ambientTemp, temperature), 
        wearRate,
        predictedLapsRemaining: Math.max(0, padThickness / Math.max(0.001, wearRate))
      },
      scenario: 'normal'
    };
  }
  
  private static generateHighTempScenario(seed: number) {
    const wheelSpeed = 2000 + (seed % 500);
    const brakePressure = 200 + (seed % 80);
    const padThickness = 3 + (seed % 5);
    const ambientTemp = 30 + (seed % 10);
    
    const heatGen = (brakePressure / 100) * (wheelSpeed / 1000) * 150; // Increased for high temp scenarios
    const cooling = 0.02 * (800 - ambientTemp); // Reduced cooling for heat buildup
    const temperature = ambientTemp + (heatGen - cooling) * 2.0; // Increased heat accumulation
    const wearRate = (brakePressure / 150) * (temperature / 400) * 0.015;
    
    return {
      inputs: { wheelSpeed, brakePressure, ambientTemp, padThickness },
      groundTruth: { 
        temperature: Math.max(ambientTemp, Math.min(1200, temperature)), 
        wearRate,
        predictedLapsRemaining: Math.max(0, padThickness / Math.max(0.001, wearRate))
      },
      scenario: 'high_temp'
    };
  }
  
  private static generateHighWearScenario(seed: number) {
    const wheelSpeed = 1500 + (seed % 600);
    const brakePressure = 180 + (seed % 70);
    const padThickness = 2 + (seed % 3); // Very low pad thickness
    const ambientTemp = 25 + (seed % 10);
    
    const heatGen = (brakePressure / 100) * (wheelSpeed / 1000) * 45;
    const cooling = 0.045 * (500 - ambientTemp);
    const temperature = ambientTemp + (heatGen - cooling) * 0.9;
    const wearRate = (brakePressure / 180) * (temperature / 450) * 0.02;
    
    return {
      inputs: { wheelSpeed, brakePressure, ambientTemp, padThickness },
      groundTruth: { 
        temperature: Math.max(ambientTemp, temperature), 
        wearRate,
        predictedLapsRemaining: Math.max(0, padThickness / Math.max(0.001, wearRate))
      },
      scenario: 'high_wear'
    };
  }
  
  private static generateVariableScenario(seed: number) {
    // Highly variable conditions
    const wheelSpeed = 1000 + Math.sin(seed) * 800 + (seed % 200);
    const brakePressure = 100 + Math.cos(seed) * 50 + (seed % 40);
    const padThickness = 4 + (seed % 7);
    const ambientTemp = 15 + Math.sin(seed * 0.5) * 15 + (seed % 20);
    
    const heatGen = (brakePressure / 100) * (wheelSpeed / 1000) * 42;
    const cooling = 0.04 * (450 - ambientTemp);
    const temperature = ambientTemp + (heatGen - cooling) * 0.85;
    const wearRate = (brakePressure / 190) * (temperature / 480) * 0.012;
    
    return {
      inputs: { wheelSpeed, brakePressure, ambientTemp, padThickness },
      groundTruth: { 
        temperature: Math.max(ambientTemp, temperature), 
        wearRate,
        predictedLapsRemaining: Math.max(0, padThickness / Math.max(0.001, wearRate))
      },
      scenario: 'variable'
    };
  }
  
  private static generateEdgeScenario(seed: number) {
    // Edge cases: very low or very high values
    const isExtreme = seed % 2 === 0;
    
    const wheelSpeed = isExtreme ? 500 + (seed % 300) : 2500 + (seed % 500);
    const brakePressure = isExtreme ? 20 + (seed % 30) : 250 + (seed % 50);
    const padThickness = isExtreme ? 1 + (seed % 2) : 12 + (seed % 3);
    const ambientTemp = isExtreme ? -5 + (seed % 15) : 40 + (seed % 15);
    
    const heatGen = (brakePressure / 100) * (wheelSpeed / 1000) * (isExtreme ? 60 : 120);
    const baseTemp = ambientTemp + heatGen * (isExtreme ? 0.8 : 1.5);
    const cooling = 0.02 * (Math.max(400, baseTemp) - ambientTemp);
    const temperature = baseTemp - cooling;
    const wearRate = (brakePressure / 200) * (Math.max(100, temperature) / 500) * (isExtreme ? 0.005 : 0.025);
    
    return {
      inputs: { wheelSpeed, brakePressure, ambientTemp, padThickness },
      groundTruth: { 
        temperature: Math.max(ambientTemp, Math.min(1200, temperature)), 
        wearRate: Math.max(0, wearRate),
        predictedLapsRemaining: Math.max(0, padThickness / Math.max(0.001, wearRate))
      },
      scenario: 'edge_case'
    };
  }
  
  // Generate real-world calibration data
  static generateCalibrationData(numPoints: number = 50): Array<{
    predicted: number;
    actual: number;
    scenario: string;
  }> {
    const calibrationData = [];
    
    for (let i = 0; i < numPoints; i++) {
      const baseTemp = 300 + (i * 10);
      
      // Simulate model prediction with some systematic bias
      const predicted = baseTemp * (1 + Math.sin(i * 0.3) * 0.1);
      
      // Simulate actual measured value
      const actual = baseTemp + (Math.random() - 0.5) * 50; // Real-world noise
      
      calibrationData.push({
        predicted,
        actual,
        scenario: `calibration_${i}`
      });
    }
    
    return calibrationData;
  }
  
  // Export data to different formats
  static exportToCSV(data: BrakeDataPoint[]): string {
    const headers = [
      'timestamp', 'wheelSpeed', 'brakePressure', 'ambientTemp', 
      'padThickness', 'actualTemperature', 'actualWearRate', 
      'lapNumber', 'trackCondition'
    ];
    
    let csv = headers.join(',') + '\n';
    
    for (const point of data) {
      const row = [
        point.timestamp,
        point.wheelSpeed,
        point.brakePressure,
        point.ambientTemp,
        point.padThickness,
        point.actualTemperature,
        point.actualWearRate,
        point.lapNumber,
        point.trackCondition
      ];
      csv += row.join(',') + '\n';
    }
    
    return csv;
  }
  
  static exportToJSON(data: BrakeDataPoint[]): string {
    return JSON.stringify(data, null, 2);
  }
  
  // Generate summary statistics
  static generateDataSummary(data: BrakeDataPoint[]): {
    totalSamples: number;
    lapRange: { min: number; max: number };
    temperatureRange: { min: number; max: number; mean: number };
    pressureRange: { min: number; max: number; mean: number };
    speedRange: { min: number; max: number; mean: number };
    wearStats: { min: number; max: number; mean: number; totalWear: number };
    trackConditions: Record<string, number>;
  } {
    const temperatures = data.map(d => d.actualTemperature);
    const pressures = data.map(d => d.brakePressure);
    const speeds = data.map(d => d.wheelSpeed);
    const wearRates = data.map(d => d.actualWearRate);
    const laps = data.map(d => d.lapNumber);
    
    const trackConditions: Record<string, number> = {};
    data.forEach(d => {
      trackConditions[d.trackCondition] = (trackConditions[d.trackCondition] || 0) + 1;
    });
    
    return {
      totalSamples: data.length,
      lapRange: { 
        min: Math.min(...laps), 
        max: Math.max(...laps) 
      },
      temperatureRange: { 
        min: Math.min(...temperatures), 
        max: Math.max(...temperatures),
        mean: temperatures.reduce((a, b) => a + b, 0) / temperatures.length
      },
      pressureRange: { 
        min: Math.min(...pressures), 
        max: Math.max(...pressures),
        mean: pressures.reduce((a, b) => a + b, 0) / pressures.length
      },
      speedRange: { 
        min: Math.min(...speeds), 
        max: Math.max(...speeds),
        mean: speeds.reduce((a, b) => a + b, 0) / speeds.length
      },
      wearStats: { 
        min: Math.min(...wearRates), 
        max: Math.max(...wearRates),
        mean: wearRates.reduce((a, b) => a + b, 0) / wearRates.length,
        totalWear: wearRates.reduce((a, b) => a + b, 0)
      },
      trackConditions
    };
  }
}