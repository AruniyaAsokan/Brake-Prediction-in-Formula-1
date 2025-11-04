import { create } from 'zustand';
import { HybridDigitalTwin, HybridPrediction } from '../models/HybridDigitalTwin';
import { LSTMModel, LSTMPrediction } from '../models/LSTMModel';
import { ModelEvaluator, ComparisonResults } from '../evaluation/ModelEvaluator';
import { TestDataGenerator } from '../evaluation/generateTestData';
import { parseFastF1Csv } from '../data/fastf1Csv';
import { fetchHuggingFaceRows, hfTimelikeToSeconds, toNumberLoose, toBool } from '../data/huggingface';
import { PhysicsModel } from '../models/PhysicsModel';
import { GRUModel } from '../models/GRUModel';
import { TCNModel } from '../models/TCNModel';

// Base brake component interface
export interface BrakeComponent {
  id: string;
  name: string;
  temperature: number;
  maxTemperature: number;
  wearLevel: number;
  maxWear: number;
  pressure: number;
  maxPressure: number;
  efficiency: number;
  status: 'good' | 'warning' | 'critical' | 'failure';
  lastMaintenance: Date;
  nextMaintenance: Date;
  operatingHours: number;
  faultCodes: string[];
}

export interface BrakeSystem {
  frontLeft: BrakeComponent;
  frontRight: BrakeComponent;
  rearLeft: BrakeComponent;
  rearRight: BrakeComponent;
}

// Telemetry and lap data interfaces
export interface TelemetryData {
  timestamp: number;
  speed: number;
  brakePressure: number;
  brakeTemperature: number;
  throttlePosition: number;
  lapTime: number;
  sector: number;
  distance: number;
}

export interface LapData {
  lapNumber: number;
  lapTime: number;
  sector1Time: number;
  sector2Time: number;
  sector3Time: number;
  maxSpeed: number;
  avgBrakeTemp: number;
  maxBrakeTemp: number;
  brakingEvents: number;
  telemetry: TelemetryData[];
}

// AI/ML related interfaces
export interface Alert {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export interface ModelComparison {
  hybridPrediction: HybridPrediction;
  lstmPrediction: LSTMPrediction;
  actualValues?: {
    temperature: number;
    wearRate: number;
    predictedLapsRemaining: number;
  };
  performanceMetrics: {
    hybridAccuracy: number;
    lstmAccuracy: number;
    hybridResponseTime: number;
    lstmResponseTime: number;
    hybridInterpretability: number;
    lstmInterpretability: number;
  };
}

export interface SimulationSettings {
  trackLength: number;
  numberOfLaps: number;
  ambientTemperature: number;
  trackCondition: 'dry' | 'wet' | 'intermediate';
  aggressiveness: number; // 0-1 scale
  brakingStyle: 'conservative' | 'balanced' | 'aggressive';
}

// Main store interface
export interface BrakeSystemState {
  // Core brake system data
  brakeSystem: BrakeSystem;
  isMonitoring: boolean;
  
  // Sensor data (individual sensors)
  temperature: number;
  pressure: number;
  padThickness: number;
  wheelSpeed: number;
  ambientTemp: number;
  
  // Telemetry and lap data
  currentTelemetry: TelemetryData | null;
  lapHistory: LapData[];
  currentLap: LapData | null;
  
  // Simulation state
  isSimulating: boolean;
  simulationProgress: number;
  simulationSettings: SimulationSettings;
  currentLapNumber: number;
  alerts: Alert[];
  
  // Historical data for LSTM
  historicalData: Array<{
    timestamp: number;
    wheelSpeed: number;
    pressure: number;
    temperature: number;
    padThickness: number;
  }>;
  
  // Model instances
  hybridTwin: HybridDigitalTwin;
  lstmModel: LSTMModel;
  modelEvaluator: ModelEvaluator;
  
  // Current predictions
  currentPrediction: HybridPrediction | null;
  currentComparison: ModelComparison | null;
  
  // Evaluation results
  evaluationResults: ComparisonResults | null;
  isEvaluating: boolean;
  
  // Derived metrics (calculated from real models)
  heatGeneration: number;
  coolingRate: number;
  wearRate: number;
  predictedLapsRemaining: number;
  thermalStress: number;
  
  // Performance tracking
  accuracyHistory: Array<{ timestamp: number; hybrid: number; lstm: number }>;
  responseTimeHistory: Array<{ timestamp: number; hybrid: number; lstm: number }>;
  
  // Real-time comparison metrics (from evaluation)
  realTimeMetrics: {
    hybrid: { mae: number; rmse: number; r2: number; accuracy: number } | null;
    lstm: { mae: number; rmse: number; r2: number; accuracy: number } | null;
    gru: { mae: number; rmse: number; r2: number; accuracy: number } | null;
    tcn: { mae: number; rmse: number; r2: number; accuracy: number } | null;
  };
  
  // Physics engine
  physicsEngine: {
    gravity: number;
    airDensity: number;
    dragCoefficient: number;
    vehicleMass: number;
    wheelRadius: number;
    brakePadArea: number;
    frictionCoefficient: number;
  };
  
  // Actions - Sensor updates
  setTemperature: (temp: number) => void;
  setPressure: (pressure: number) => void;
  setPadThickness: (thickness: number) => void;
  setWheelSpeed: (speed: number) => void;
  setAmbientTemp: (temp: number) => void;
  
  // Actions - Brake system management
  updateBrakeComponent: (position: keyof BrakeSystem, updates: Partial<BrakeComponent>) => void;
  updateTelemetry: (data: TelemetryData) => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  
  // Actions - Simulation
  toggleSimulation: () => void;
  simulateRaceLap: () => void;
  updateSimulationSettings: (settings: Partial<SimulationSettings>) => void;
  setCurrentLap: (lap: number) => void;
  
  // Actions - System management
  resetSystem: () => void;
  updatePhysics: () => void;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  clearAlerts: () => void;
  
  // Actions - AI/ML
  updatePredictions: () => void;
  runModelEvaluation: () => Promise<void>;
  generateTrainingData: () => void;
  calibrateModels: () => void;
  evaluateOnCurrentTelemetry: () => Promise<void>;
  
  // Actions - Calculations
  calculateBrakingDistance: (initialSpeed: number, finalSpeed: number) => number;
  calculateBrakeForce: (pressure: number, temperature: number) => number;
  calculateWearRate: (temperature: number, pressure: number, duration: number) => number;
  
  // Actions - Data export
  exportData: (format: 'csv' | 'json') => string;

  // Actions - Real telemetry ingestion
  ingestFastF1Csv: (csv: string, ambient?: number, padStart?: number) => void;
  loadHuggingFaceTelemetry: (datasetId?: string, length?: number) => Promise<void>;
  loadLocalHFDump: (path?: string) => Promise<void>;
}

// Helper functions
const createInitialBrakeComponent = (id: string, name: string): BrakeComponent => ({
  id,
  name,
  temperature: 25,
  maxTemperature: 1200, // F1 brake discs can handle up to 1200°C
  wearLevel: 0,
  maxWear: 100,
  pressure: 0,
  maxPressure: 120,
  efficiency: 100,
  status: 'good',
  lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  operatingHours: 0,
  faultCodes: []
});

// Initial state values
const initialBrakeSystem: BrakeSystem = {
  frontLeft: createInitialBrakeComponent('fl', 'Front Left'),
  frontRight: createInitialBrakeComponent('fr', 'Front Right'),
  rearLeft: createInitialBrakeComponent('rl', 'Rear Left'),
  rearRight: createInitialBrakeComponent('rr', 'Rear Right'),
};

const initialSimulationSettings: SimulationSettings = {
  trackLength: 5000,
  numberOfLaps: 10,
  ambientTemperature: 25,
  trackCondition: 'dry',
  aggressiveness: 0.7,
  brakingStyle: 'balanced'
};

const initialPhysicsEngine = {
  gravity: 9.81,
  airDensity: 1.225,
  dragCoefficient: 0.3,
  vehicleMass: 740,
  wheelRadius: 0.33,
  brakePadArea: 0.032,
  frictionCoefficient: 0.4
};

// Store implementation
export const useBrakeSystemStore = create<BrakeSystemState>((set, get) => ({
  // Core brake system state
  brakeSystem: initialBrakeSystem,
  isMonitoring: false,
  
  // Individual sensor values
  temperature: 450,
  pressure: 120,
  padThickness: 12.5,
  wheelSpeed: 1500,
  ambientTemp: 25,
  
  // Telemetry state
  currentTelemetry: null,
  lapHistory: [],
  currentLap: null,
  
  // Simulation state
  isSimulating: false,
  simulationProgress: 0,
  simulationSettings: initialSimulationSettings,
  currentLapNumber: 1,
  alerts: [],
  
  // Historical data
  historicalData: [],
  
  // Model instances - Initialize with try-catch to handle missing dependencies
  hybridTwin: (() => {
    try {
      return new HybridDigitalTwin();
    } catch {
      return null as any; // Fallback if class not available
    }
  })(),
  lstmModel: (() => {
    try {
      return new LSTMModel();
    } catch {
      return null as any; // Fallback if class not available
    }
  })(),
  modelEvaluator: (() => {
    try {
      return new ModelEvaluator();
    } catch {
      return null as any; // Fallback if class not available
    }
  })(),
  
  // Prediction state
  currentPrediction: null,
  currentComparison: null,
  
  // Evaluation state
  evaluationResults: null,
  isEvaluating: false,
  
  // Derived metrics
  heatGeneration: 0,
  coolingRate: 0,
  wearRate: 0,
  predictedLapsRemaining: 45,
  thermalStress: 0,
  
  // Performance tracking
  accuracyHistory: [],
  responseTimeHistory: [],
  
  // Real-time comparison metrics
  realTimeMetrics: {
    hybrid: null,
    lstm: null,
    gru: null,
    tcn: null,
  },
  
  // Physics engine
  physicsEngine: initialPhysicsEngine,
  
  // Sensor update actions
  setTemperature: (temp) => {
    set({ temperature: temp });
    get().updatePredictions();
  },
  
  setPressure: (pressure) => {
    set({ pressure });
    get().updatePredictions();
  },
  
  setPadThickness: (thickness) => {
    set({ padThickness: thickness });
    get().updatePredictions();
  },
  
  setWheelSpeed: (speed) => {
    set({ wheelSpeed: speed });
    get().updatePredictions();
  },
  
  setAmbientTemp: (temp) => {
    set({ ambientTemp: temp });
    get().updatePredictions();
  },
  
  // Brake system management actions
  updateBrakeComponent: (position, updates) => {
    set((state) => ({
      brakeSystem: {
        ...state.brakeSystem,
        [position]: { ...state.brakeSystem[position], ...updates }
      }
    }));
  },

  updateTelemetry: (data) => {
    set((state) => {
      const newLap = state.currentLap ? {
        ...state.currentLap,
        telemetry: [...state.currentLap.telemetry, data]
      } : null;

      return {
        currentTelemetry: data,
        currentLap: newLap
      };
    });
  },

  startMonitoring: () => {
    set({ isMonitoring: true });
  },

  stopMonitoring: () => {
    set({ isMonitoring: false });
  },

  // Simulation actions
  toggleSimulation: () => {
    const newState = !get().isSimulating;
    set({ isSimulating: newState });
    
    if (newState) {
      // Start realistic simulation loop
      const simulate = () => {
        const state = get();
        if (!state.isSimulating) return;
        
        try {
          // Use test data generator for realistic simulation if available
          const raceData = TestDataGenerator?.generateRaceData?.(1, 10) || [];
          const currentSample = raceData[Math.floor(Math.random() * raceData.length)] || {
            actualTemperature: 450 + (Math.random() - 0.5) * 100,
            brakePressure: 120 + (Math.random() - 0.5) * 20,
            actualWearRate: 0.1,
            wheelSpeed: 1500 + (Math.random() - 0.5) * 200,
            padThickness: state.padThickness
          };
          
          // Apply realistic changes with better wear progression
          const wearIncrement = (currentSample.actualWearRate || 0.01) * 0.01; // More noticeable wear progression
          set({
            temperature: currentSample.actualTemperature + (Math.random() - 0.5) * 50,
            pressure: currentSample.brakePressure + (Math.random() - 0.5) * 20,
            padThickness: Math.max(2, state.padThickness - wearIncrement),
            wheelSpeed: currentSample.wheelSpeed + (Math.random() - 0.5) * 200
          });
          
          // Update historical data
          const newDataPoint = {
            timestamp: Date.now(),
            wheelSpeed: get().wheelSpeed,
            pressure: get().pressure,
            temperature: get().temperature,
            padThickness: get().padThickness
          };
          
          set(state => ({
            historicalData: [...state.historicalData.slice(-49), newDataPoint]
          }));
          
          get().updatePredictions();
          
          // Update real-time metrics periodically during simulation
          if (state.historicalData.length >= 20) {
            get().evaluateOnCurrentTelemetry();
          }
        } catch (error) {
          console.error('Simulation error:', error);
        }
        
        setTimeout(simulate, 1000);
      };
      simulate();
    }
  },

  simulateRaceLap: () => {
    const state = get();
    set({ isSimulating: true, simulationProgress: 0 });

    const simulateStep = (progress: number) => {
      if (progress >= 100) {
        const lapData: LapData = {
          lapNumber: state.lapHistory.length + 1,
          lapTime: 85000 + Math.random() * 5000,
          sector1Time: 28000 + Math.random() * 2000,
          sector2Time: 29000 + Math.random() * 2000,
          sector3Time: 28000 + Math.random() * 2000,
          maxSpeed: 320 + Math.random() * 20,
          avgBrakeTemp: 450 + Math.random() * 100,
          maxBrakeTemp: 650 + Math.random() * 100,
          brakingEvents: 8 + Math.floor(Math.random() * 4),
          telemetry: []
        };

        set((currentState) => ({
          lapHistory: [...currentState.lapHistory, lapData],
          currentLap: lapData,
          isSimulating: false,
          simulationProgress: 100
        }));
        return;
      }

      const tempIncrease = Math.sin((progress / 100) * Math.PI * 2) * 50 + 50;
      
      set((currentState) => ({
        simulationProgress: progress,
        temperature: Math.min(25 + tempIncrease * 8, 1200), // Allow higher temperatures
        brakeSystem: {
          ...currentState.brakeSystem,
          frontLeft: {
            ...currentState.brakeSystem.frontLeft,
            temperature: Math.min(25 + tempIncrease * 8, 1200)
          },
          frontRight: {
            ...currentState.brakeSystem.frontRight,
            temperature: Math.min(25 + tempIncrease * 8, 1200)
          },
          rearLeft: {
            ...currentState.brakeSystem.rearLeft,
            temperature: Math.min(25 + tempIncrease * 6, 1000) // Rear brakes typically run cooler
          },
          rearRight: {
            ...currentState.brakeSystem.rearRight,
            temperature: Math.min(25 + tempIncrease * 6, 1000)
          }
        }
      }));

      setTimeout(() => simulateStep(progress + 2), 100);
    };

    simulateStep(0);
  },

  updateSimulationSettings: (settings) => {
    set((state) => ({
      simulationSettings: { ...state.simulationSettings, ...settings }
    }));
  },

  setCurrentLap: (lap) => {
    set({ currentLapNumber: lap });
    
    try {
      // Simulate lap-based changes if TestDataGenerator is available
      const raceData = TestDataGenerator?.generateRaceData?.(lap, 1) || [];
      if (raceData.length > 0) {
        const lapData = raceData[raceData.length - 1];
        set({
          temperature: lapData.actualTemperature || 450,
          pressure: lapData.brakePressure || 120,
          padThickness: lapData.padThickness || get().padThickness,
          wheelSpeed: lapData.wheelSpeed || 1500
        });
      }
    } catch (error) {
      console.error('Error updating lap data:', error);
    }
    
    get().updatePredictions();
  },

  // System management actions
  resetSystem: () => {
    set({
      // Reset brake system
      brakeSystem: initialBrakeSystem,
      isMonitoring: false,
      
      // Reset sensor values
      temperature: 450,
      pressure: 120,
      padThickness: 12.5,
      wheelSpeed: 1500,
      ambientTemp: 25,
      
      // Reset telemetry
      currentTelemetry: null,
      lapHistory: [],
      currentLap: null,
      
      // Reset simulation
      isSimulating: false,
      simulationProgress: 0,
      currentLapNumber: 1,
      alerts: [],
      
      // Reset AI/ML data
      historicalData: [],
      currentPrediction: null,
      currentComparison: null,
      accuracyHistory: [],
      responseTimeHistory: []
    });
  },

  updatePhysics: () => {
    const state = get();
    
    const updateComponentStatus = (component: BrakeComponent): BrakeComponent => {
      let status: BrakeComponent['status'] = 'good';
      
      if (component.temperature > 1000) {
        status = 'critical';
      } else if (component.temperature > 800) {
        status = 'warning';
      }
      
      if (component.wearLevel > component.maxWear * 0.9) {
        status = 'critical';
      } else if (component.wearLevel > component.maxWear * 0.75 && status !== 'critical') {
        status = 'warning';
      }

      const efficiency = Math.max(0, 100 - component.wearLevel - (component.temperature > 400 ? (component.temperature - 400) / 10 : 0));
      
      return {
        ...component,
        status,
        efficiency: Math.round(efficiency * 100) / 100
      };
    };

    set((currentState) => ({
      brakeSystem: {
        frontLeft: updateComponentStatus(currentState.brakeSystem.frontLeft),
        frontRight: updateComponentStatus(currentState.brakeSystem.frontRight),
        rearLeft: updateComponentStatus(currentState.brakeSystem.rearLeft),
        rearRight: updateComponentStatus(currentState.brakeSystem.rearRight)
      }
    }));
  },

  addAlert: (alert) => {
    const newAlert: Alert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
    };
    set((state) => ({
      alerts: [...state.alerts.slice(-4), newAlert],
    }));
  },
  
  clearAlerts: () => {
    set({ alerts: [] });
  },
  
  // AI/ML actions
  updatePredictions: () => {
    const state = get();
    
    try {
      // Only proceed if models are available
      if (!state.hybridTwin || !state.lstmModel) {
        console.warn('AI models not available, skipping predictions');
        return;
      }
      
      // Prepare inputs for hybrid model with better data validation
      const hybridInputs = {
        currentState: {
          wheelSpeed: Math.max(0, state.wheelSpeed || 1500),
          brakePressure: Math.max(0, state.pressure || 120),
          ambientTemp: Math.max(-50, state.ambientTemp || 25),
          padThickness: Math.max(0.1, state.padThickness || 12.5),
          discMass: 8.5,
          padArea: 120 + (Math.random() - 0.5) * 60,
          timeStep: 1
        },
        historicalSequence: {
          wheelSpeed: state.historicalData.slice(-10).map(d => Math.max(0, d.wheelSpeed || 1500)),
          brakePressure: state.historicalData.slice(-10).map(d => Math.max(0, d.pressure || 120)),
          ambientTemp: state.historicalData.slice(-10).map(d => Math.max(-50, state.ambientTemp || 25)),
          padThickness: state.historicalData.slice(-10).map(d => Math.max(0.1, d.padThickness || 12.5)),
          timestamp: state.historicalData.slice(-10).map(d => d.timestamp || Date.now())
        },
        previousTemperature: Math.max(25, state.temperature || 450)
      };
      
      // Ensure we have enough historical data with proper padding
      if (hybridInputs.historicalSequence.wheelSpeed.length < 5) {
        const currentValues = {
          wheelSpeed: hybridInputs.currentState.wheelSpeed,
          brakePressure: hybridInputs.currentState.brakePressure,
          ambientTemp: hybridInputs.currentState.ambientTemp,
          padThickness: hybridInputs.currentState.padThickness,
          timestamp: Date.now()
        };
        
        while (hybridInputs.historicalSequence.wheelSpeed.length < 10) {
          hybridInputs.historicalSequence.wheelSpeed.unshift(currentValues.wheelSpeed);
          hybridInputs.historicalSequence.brakePressure.unshift(currentValues.brakePressure);
          hybridInputs.historicalSequence.ambientTemp.unshift(currentValues.ambientTemp);
          hybridInputs.historicalSequence.padThickness.unshift(currentValues.padThickness);
          hybridInputs.historicalSequence.timestamp.unshift(currentValues.timestamp - (10 - hybridInputs.historicalSequence.wheelSpeed.length) * 1000);
        }
      }
      
      // Get predictions from both models with error handling
      const hybridStart = performance.now();
      let hybridPrediction;
      let hybridTime = 0;
      
      try {
        hybridPrediction = state.hybridTwin.predict(hybridInputs);
        hybridTime = performance.now() - hybridStart;
        
        // Validate hybrid prediction
        if (!hybridPrediction || 
            isNaN(hybridPrediction.temperature) || 
            isNaN(hybridPrediction.wearRate) || 
            isNaN(hybridPrediction.predictedLapsRemaining)) {
          throw new Error('Invalid hybrid prediction');
        }
      } catch (error) {
        console.error('Hybrid prediction failed:', error);
        hybridPrediction = {
          temperature: 450,
          wearRate: 0.1,
          predictedLapsRemaining: 45,
          heatGeneration: 1000,
          coolingRate: 500,
          thermalStress: 50,
          confidence: 0.3,
          physicsWeight: 1.0,
          mlWeight: 0.0,
          anomalyScore: 0.8
        };
        hybridTime = performance.now() - hybridStart;
      }
      
      const lstmStart = performance.now();
      let lstmPrediction;
      let lstmTime = 0;
      
      try {
        lstmPrediction = state.lstmModel.predict(hybridInputs.historicalSequence);
        lstmTime = performance.now() - lstmStart;
        
        // Validate LSTM prediction
        if (!lstmPrediction || 
            isNaN(lstmPrediction.temperature) || 
            isNaN(lstmPrediction.wearRate) || 
            isNaN(lstmPrediction.predictedLapsRemaining)) {
          throw new Error('Invalid LSTM prediction');
        }
      } catch (error) {
        console.error('LSTM prediction failed:', error);
        lstmPrediction = {
          temperature: 450,
          wearRate: 0.1,
          predictedLapsRemaining: 45,
          confidence: 0.2
        };
        lstmTime = performance.now() - lstmStart;
      }
      
      // Dynamic real-time accuracy vs physics proxy
      const physicsNow = new PhysicsModel();
      const physEstimate = physicsNow.predict({
        wheelSpeed: hybridInputs.currentState.wheelSpeed,
        brakePressure: hybridInputs.currentState.brakePressure,
        ambientTemp: hybridInputs.currentState.ambientTemp,
        padThickness: hybridInputs.currentState.padThickness,
        discMass: hybridInputs.currentState.discMass,
        padArea: hybridInputs.currentState.padArea,
        timeStep: 1
      }, hybridInputs.previousTemperature);

      const relErr = (pred: number, truth: number) => Math.abs(pred - truth) / Math.max(1, Math.abs(truth));
      const toAcc = (e: number) => Math.max(50, Math.min(98, (1 - e) * 100));
      const hybridAccuracy = toAcc(relErr(hybridPrediction.temperature, physEstimate.temperature));
      const lstmAccuracy = toAcc(relErr(lstmPrediction.temperature, physEstimate.temperature));
      
      // Create comparison
      const comparison: ModelComparison = {
        hybridPrediction,
        lstmPrediction,
        performanceMetrics: {
          hybridAccuracy,
          lstmAccuracy,
          hybridResponseTime: hybridTime,
          lstmResponseTime: lstmTime,
          hybridInterpretability: 85,
          lstmInterpretability: 75 // Improved with modern LSTM
        }
      };
      
      // Update state with new predictions
      set({
        currentPrediction: hybridPrediction,
        currentComparison: comparison,
        heatGeneration: hybridPrediction.heatGeneration || 1000,
        coolingRate: hybridPrediction.coolingRate || 500,
        wearRate: hybridPrediction.wearRate || 0.1,
        predictedLapsRemaining: hybridPrediction.predictedLapsRemaining || 45,
        thermalStress: hybridPrediction.thermalStress || 50
      });
      
      // Update performance history
      const timestamp = Date.now();
      set(state => ({
        accuracyHistory: [
          ...state.accuracyHistory.slice(-19),
          { timestamp, hybrid: hybridAccuracy, lstm: lstmAccuracy }
        ],
        responseTimeHistory: [
          ...state.responseTimeHistory.slice(-19),
          { timestamp, hybrid: hybridTime, lstm: lstmTime }
        ]
      }));
      
      // Generate realistic alerts based on predictions and current state
      get().clearAlerts();
      
      const currentTemp = state.temperature;
      const currentPressure = state.pressure;
      const currentPadThickness = state.padThickness;
      const currentLap = state.currentLapNumber;
      const remainingLaps = hybridPrediction.predictedLapsRemaining;
      
      // Temperature-based alerts with realistic F1 scenarios
      if (currentTemp > 1100) {
        get().addAlert({
          message: `CRITICAL: Brake disc at ${currentTemp.toFixed(0)}°C - IMMEDIATE COOLING REQUIRED! Risk of complete brake failure.`,
          type: 'critical',
        });
      } else if (currentTemp > 1000) {
        get().addAlert({
          message: `HIGH TEMP: ${currentTemp.toFixed(0)}°C - Brake fade imminent. Reduce pressure by 30% immediately.`,
          type: 'critical',
        });
      } else if (currentTemp > 900) {
        get().addAlert({
          message: `ELEVATED: ${currentTemp.toFixed(0)}°C - Monitor closely. Consider reducing brake pressure by 15%.`,
          type: 'warning',
        });
      } else if (currentTemp > 800) {
        get().addAlert({
          message: `RISING: ${currentTemp.toFixed(0)}°C - Temperature trending up. Normal F1 operating range.`,
          type: 'info',
        });
      }
      
      // Pad life alerts with realistic race scenarios
      if (remainingLaps < 3) {
        get().addAlert({
          message: `FINAL LAPS: Only ${remainingLaps.toFixed(1)} laps left! Use 50% brake pressure to finish race.`,
          type: 'critical',
        });
      } else if (remainingLaps < 8) {
        get().addAlert({
          message: `LOW PAD LIFE: ${remainingLaps.toFixed(1)} laps remaining. Reduce to 65% brake pressure for final push.`,
          type: 'warning',
        });
      } else if (remainingLaps < 15) {
        get().addAlert({
          message: `MODERATE WEAR: ${remainingLaps.toFixed(1)} laps left. Consider 75% brake pressure to preserve pads.`,
          type: 'info',
        });
      }
      
      // Pressure-based alerts for realistic F1 scenarios
      if (currentPressure > 250) {
        get().addAlert({
          message: `HIGH PRESSURE: ${currentPressure.toFixed(0)} bar - Aggressive braking detected. Monitor pad wear.`,
          type: 'warning',
        });
      } else if (currentPressure < 50 && currentLap > 5) {
        get().addAlert({
          message: `LOW PRESSURE: ${currentPressure.toFixed(0)} bar - Conservative braking. Good for pad preservation.`,
          type: 'info',
        });
      }
      
      // Pad thickness alerts
      if (currentPadThickness < 3) {
        get().addAlert({
          message: `CRITICAL PAD: ${currentPadThickness.toFixed(1)}mm remaining - Change required after race!`,
          type: 'critical',
        });
      } else if (currentPadThickness < 5) {
        get().addAlert({
          message: `LOW PAD: ${currentPadThickness.toFixed(1)}mm remaining - Monitor closely for final laps.`,
          type: 'warning',
        });
      } else if (currentPadThickness < 8) {
        get().addAlert({
          message: `MODERATE PAD: ${currentPadThickness.toFixed(1)}mm remaining - Good condition for remaining race.`,
          type: 'info',
        });
      }
      
      // Race strategy alerts
      if (currentLap < 5) {
        get().addAlert({
          message: `EARLY RACE: Fresh pads, optimal conditions. Use 85% brake pressure for maximum performance.`,
          type: 'info',
        });
      } else if (currentLap > 35) {
        get().addAlert({
          message: `FINAL STAGE: ${50 - currentLap} laps to go. Balance performance with pad conservation.`,
          type: 'info',
        });
      }
      
      // Model anomaly detection
      if (hybridPrediction.anomalyScore > 0.5) {
        get().addAlert({
          message: `ANOMALY: Unusual sensor readings detected. Check brake system integrity.`,
          type: 'warning',
        });
      } else if (hybridPrediction.anomalyScore > 0.3) {
        get().addAlert({
          message: `VARIANCE: Minor deviation from expected patterns. Continue monitoring.`,
          type: 'info',
        });
      }
      
    } catch (error) {
      console.error('Error updating predictions:', error);
      get().addAlert({
        message: 'Model Update Error - Check System',
        type: 'warning',
      });
    }
  },
  
  runModelEvaluation: async () => {
    set({ isEvaluating: true });
    
    try {
      if (!get().modelEvaluator) {
        throw new Error('Model evaluator not available');
      }
      
      const results = await get().modelEvaluator.evaluateModels();
      set({ 
        evaluationResults: results,
        isEvaluating: false 
      });
      
      console.log('Model Evaluation Completed:', results);
      
      get().addAlert({
        message: `Evaluation Complete: ${results.winner.toUpperCase()} model performs better`,
        type: 'info',
      });
      
    } catch (error) {
      console.error('Evaluation error:', error);
      set({ isEvaluating: false });
      
      get().addAlert({
        message: 'Model Evaluation Failed',
        type: 'warning',
      });
    }
  },
  
  generateTrainingData: () => {
    try {
      if (!TestDataGenerator) {
        throw new Error('TestDataGenerator not available');
      }
      
      // Generate comprehensive training data
      const raceData = TestDataGenerator.generateRaceData(50, 10);
      const lstmTrainingData = TestDataGenerator.convertToLSTMTrainingData(raceData);
      
      // Train the LSTM model
      get().lstmModel.train(lstmTrainingData);
      
      get().addAlert({
        message: `Training Data Generated: ${lstmTrainingData.length} samples`,
        type: 'info',
      });
      
      console.log('Generated training data:', {
        raceDataPoints: raceData.length,
        lstmTrainingSamples: lstmTrainingData.length,
        summary: TestDataGenerator.generateDataSummary(raceData)
      });
      
    } catch (error) {
      console.error('Error generating training data:', error);
      get().addAlert({
        message: 'Training Data Generation Failed',
        type: 'warning',
      });
    }
  },
  
  calibrateModels: () => {
    try {
      if (!TestDataGenerator) {
        throw new Error('TestDataGenerator not available');
      }
      
      // Generate calibration data
      const calibrationData = TestDataGenerator.generateCalibrationData();
      
      // Calibrate hybrid model
      get().hybridTwin.calibrate(calibrationData);
      
      get().addAlert({
        message: `Models Calibrated with ${calibrationData.length} data points`,
        type: 'info',
      });
      
    } catch (error) {
      console.error('Error calibrating models:', error);
      get().addAlert({
        message: 'Model Calibration Failed',
        type: 'warning',
      });
    }
  },
  
  // Calculation actions
  calculateBrakingDistance: (initialSpeed, finalSpeed) => {
    const state = get();
    const { vehicleMass, frictionCoefficient, gravity } = state.physicsEngine;
    
    const initialVelocity = initialSpeed / 3.6;
    const finalVelocity = finalSpeed / 3.6;
    
    const maxDeceleration = frictionCoefficient * gravity;
    const distance = (initialVelocity * initialVelocity - finalVelocity * finalVelocity) / (2 * maxDeceleration);
    
    return Math.max(0, distance);
  },

  calculateBrakeForce: (pressure, temperature) => {
    const state = get();
    const { brakePadArea, frictionCoefficient } = state.physicsEngine;
    
    const tempFactor = temperature > 400 ? Math.max(0.7, 1 - (temperature - 400) / 1000) : 1;
    const effectiveFriction = frictionCoefficient * tempFactor;
    
    return pressure * brakePadArea * effectiveFriction * 1000;
  },

  calculateWearRate: (temperature, pressure, duration) => {
    let wearRate = 0.01;
    
    if (temperature > 300) {
      wearRate *= Math.pow(1.5, (temperature - 300) / 100);
    }
    
    wearRate *= (1 + pressure / 100);
    const durationMinutes = duration / 60000;
    
    return wearRate * durationMinutes;
  },
  
  exportData: (format: 'csv' | 'json') => {
    try {
      const state = get();
      
      if (format === 'csv') {
        // Export historical data as CSV
        let csv = 'timestamp,wheelSpeed,pressure,temperature,padThickness,ambientTemp,heatGeneration,coolingRate,wearRate,predictedLapsRemaining\n';
        for (const point of state.historicalData) {
          csv += `${point.timestamp},${point.wheelSpeed},${point.pressure},${point.temperature},${point.padThickness},${state.ambientTemp},${state.heatGeneration},${state.coolingRate},${state.wearRate},${state.predictedLapsRemaining}\n`;
        }
        
        // Add brake system components data
        csv += '\n\nBrake System Components\n';
        csv += 'component,id,temperature,pressure,wearLevel,efficiency,status\n';
        Object.entries(state.brakeSystem).forEach(([position, component]) => {
          csv += `${position},${component.id},${component.temperature},${component.pressure},${component.wearLevel},${component.efficiency},${component.status}\n`;
        });
        
        return csv;
      } else {
        // Export comprehensive data as JSON
        return JSON.stringify({
          timestamp: Date.now(),
          brakeSystem: state.brakeSystem,
          sensorData: {
            temperature: state.temperature,
            pressure: state.pressure,
            padThickness: state.padThickness,
            wheelSpeed: state.wheelSpeed,
            ambientTemp: state.ambientTemp
          },
          derivedMetrics: {
            heatGeneration: state.heatGeneration,
            coolingRate: state.coolingRate,
            wearRate: state.wearRate,
            predictedLapsRemaining: state.predictedLapsRemaining,
            thermalStress: state.thermalStress
          },
          currentPrediction: state.currentPrediction,
          currentComparison: state.currentComparison,
          historicalData: state.historicalData,
          lapHistory: state.lapHistory,
          currentLap: state.currentLap,
          evaluationResults: state.evaluationResults,
          accuracyHistory: state.accuracyHistory,
          responseTimeHistory: state.responseTimeHistory,
          simulationSettings: state.simulationSettings,
          physicsEngine: state.physicsEngine,
          alerts: state.alerts,
          systemStatus: {
            isSimulating: state.isSimulating,
            isMonitoring: state.isMonitoring,
            isEvaluating: state.isEvaluating,
            currentLapNumber: state.currentLapNumber,
            simulationProgress: state.simulationProgress
          }
        }, null, 2);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      return 'Export failed';
    }
  },

  ingestFastF1Csv: (csv, ambient = 25, padStart = 10) => {
    try {
      const parsed = parseFastF1Csv(csv, ambient, padStart);
      const hist = parsed.timestamp.map((t: number, i: number) => ({
        timestamp: t * 1000,
        wheelSpeed: parsed.wheelSpeed[i],
        pressure: parsed.brakePressure[i],
        temperature: get().temperature,
        padThickness: parsed.padThickness[i],
      }));

      set({
        historicalData: hist.slice(-100),
        wheelSpeed: parsed.wheelSpeed.at(-1) || get().wheelSpeed,
        pressure: parsed.brakePressure.at(-1) || get().pressure,
        padThickness: parsed.padThickness.at(-1) || get().padThickness,
        ambientTemp: ambient,
      });

      get().updatePredictions();
      get().addAlert({ message: `Loaded FastF1 CSV with ${hist.length} rows`, type: 'info' });
    } catch (e) {
      console.error('FastF1 CSV ingest error', e);
      get().addAlert({ message: 'FastF1 CSV ingest failed', type: 'warning' });
    }
  },

  loadHuggingFaceTelemetry: async (datasetId = 'Draichi/Formula1-2024-Miami-Verstappen-telemetry', length = 100) => {
    try {
      const resp = await fetchHuggingFaceRows(datasetId, 'train', length);
      const rows = resp.rows || [];

      const wheelSpeed: number[] = [];
      const brakePressure: number[] = [];
      const ambientTemp: number[] = [];
      const padThickness: number[] = [];
      const timestamp: number[] = [];

      let pad = get().padThickness || 10;
      let lastSec = 0;
      for (const r of rows) {
        const c = r.content || {};
        const sec = hfTimelikeToSeconds(c['Time'] ?? c['SessionTime'] ?? 0);
        const dt = Math.max(0, sec - lastSec);
        lastSec = sec;

        const speedKmh = toNumberLoose(c['Speed']);
        const speedMs = speedKmh / 3.6;
        const wheelRpm = speedMs > 0 ? (speedMs / (2 * Math.PI * 0.33)) * 60 : 0;

        const brakeFlag = toBool(c['Brake']);
        const pressureBar = brakeFlag ? Math.min(300, 50 + speedMs * 20) : 0;

        const wearMm = Math.max(0, pressureBar) * 1e-5 * Math.max(0.02, dt);
        pad = Math.max(1.5, pad - wearMm);

        wheelSpeed.push(wheelRpm);
        brakePressure.push(pressureBar);
        ambientTemp.push(get().ambientTemp || 25);
        padThickness.push(pad);
        timestamp.push(sec * 1000);
      }

      const hist = timestamp.map((t, i) => ({
        timestamp: t,
        wheelSpeed: wheelSpeed[i],
        pressure: brakePressure[i],
        temperature: get().temperature,
        padThickness: padThickness[i],
      }));

      set({
        historicalData: hist.slice(-100),
        wheelSpeed: wheelSpeed.at(-1) || get().wheelSpeed,
        pressure: brakePressure.at(-1) || get().pressure,
        padThickness: padThickness.at(-1) || get().padThickness,
      });

      get().updatePredictions();
      get().addAlert({ message: `Loaded HF telemetry (${datasetId}) with ${rows.length} rows`, type: 'info' });

      // Trigger quick real-data comparison across models using physics as proxy ground truth
      await get().evaluateOnCurrentTelemetry();
    } catch (e: any) {
      console.error('HF telemetry load error', e);
      get().addAlert({ message: `Hugging Face telemetry load failed: ${e?.message || e}`, type: 'warning' });
    }
  },

  // Evaluate models on the last N real telemetry points using physics as proxy ground truth
  evaluateOnCurrentTelemetry: async () => {
    try {
      const state = get();
      const data = state.historicalData.slice(-50);
      if (data.length < 10) {
        get().addAlert({ message: 'Not enough telemetry points to evaluate (need ≥10)', type: 'info' });
        return;
      }

      const physics = new PhysicsModel();
      const gru = new GRUModel();
      const tcn = new TCNModel();

      let tempTrue: number[] = [];
      let wearTrue: number[] = [];
      let lapsTrue: number[] = [];

      let hybridPred: number[] = [];
      let lstmPred: number[] = [];
      let gruPred: number[] = [];
      let tcnPred: number[] = [];
      let physPred: number[] = [];

      let prevTemp = Math.max(25, state.temperature || 450);

      for (let i = 9; i < data.length; i++) {
        const window = data.slice(i - 9, i + 1);
        const seq = {
          wheelSpeed: window.map(d => Math.max(0, d.wheelSpeed)),
          brakePressure: window.map(d => Math.max(0, d.pressure)),
          ambientTemp: window.map(() => Math.max(-50, state.ambientTemp || 25)),
          padThickness: window.map(d => Math.max(0.1, d.padThickness)),
          timestamp: window.map(d => d.timestamp),
        };

        const last = window[window.length - 1];
        const currentState = {
          wheelSpeed: Math.max(0, last.wheelSpeed),
          brakePressure: Math.max(0, last.pressure),
          ambientTemp: Math.max(-50, state.ambientTemp || 25),
          padThickness: Math.max(0.1, last.padThickness),
          discMass: 8.5,
          padArea: 150,
          timeStep: 1,
        };

        const phys = physics.predict(currentState as any, prevTemp);
        prevTemp = phys.temperature;

        const hyb = state.hybridTwin.predict({ currentState: currentState as any, historicalSequence: seq, previousTemperature: prevTemp });
        const lstm = state.lstmModel.predict(seq);
        const gp = gru.predict(seq as any);
        const tp = tcn.predict(seq as any);

        tempTrue.push(phys.temperature);
        wearTrue.push(phys.wearRate);
        lapsTrue.push(phys.predictedLapsRemaining);
        physPred.push(phys.temperature);
        hybridPred.push(hyb.temperature);
        lstmPred.push(lstm.temperature);
        gruPred.push(gp.temperature);
        tcnPred.push(tp.temperature);
      }

      const mae = (y: number[], p: number[]) => y.reduce((s, v, i) => s + Math.abs(v - p[i]), 0) / y.length;
      const rmse = (y: number[], p: number[]) => Math.sqrt(y.reduce((s, v, i) => s + Math.pow(v - p[i], 2), 0) / y.length);
      const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
      const r2 = (y: number[], p: number[]) => {
        const m = mean(y);
        const ssTot = y.reduce((s, v) => s + Math.pow(v - m, 2), 0);
        const ssRes = y.reduce((s, v, i) => s + Math.pow(v - p[i], 2), 0);
        return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
      };

      const targets = tempTrue;
      const avgTarget = mean(targets);
      const toAcc = (err: number, avg: number) => Math.max(50, Math.min(98, (1 - err / Math.max(1, avg)) * 100));
      
      const results = {
        physicsOnly: { mae: 0, rmse: 0, r2: 1, accuracy: 100 },
        hybrid: {
          mae: mae(targets, hybridPred),
          rmse: rmse(targets, hybridPred),
          r2: r2(targets, hybridPred),
          accuracy: toAcc(mae(targets, hybridPred), avgTarget),
        },
        lstm: {
          mae: mae(targets, lstmPred),
          rmse: rmse(targets, lstmPred),
          r2: r2(targets, lstmPred),
          accuracy: toAcc(mae(targets, lstmPred), avgTarget),
        },
        gru: {
          mae: mae(targets, gruPred),
          rmse: rmse(targets, gruPred),
          r2: r2(targets, gruPred),
          accuracy: toAcc(mae(targets, gruPred), avgTarget),
        },
        tcn: {
          mae: mae(targets, tcnPred),
          rmse: rmse(targets, tcnPred),
          r2: r2(targets, tcnPred),
          accuracy: toAcc(mae(targets, tcnPred), avgTarget),
        },
      };

      set({
        realTimeMetrics: {
          hybrid: results.hybrid,
          lstm: results.lstm,
          gru: results.gru,
          tcn: results.tcn,
        },
      });

      get().addAlert({
        message: `Real-data comparison (temperature): Hybrid MAE=${results.hybrid.mae.toFixed(1)}, Bi-LSTM=${results.lstm.mae.toFixed(1)}, GRU=${results.gru.mae.toFixed(1)}, TCN=${results.tcn.mae.toFixed(1)}`,
        type: 'info',
      });

    } catch (e) {
      console.error('Real-data evaluation error', e);
      get().addAlert({ message: 'Real-data evaluation failed', type: 'warning' });
    }
  },

  loadLocalHFDump: async (path = '/hf-miami.json') => {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); // expect array of objects with Time/Speed/Brake

      const toBool = (v: any) => (typeof v === 'boolean' ? v : String(v ?? '').toLowerCase() === 'true' || String(v ?? '') === '1');
      const toNum = (v: any) => { const n = Number(String(v ?? '').replace(/,/g, '')); return isFinite(n) ? n : 0; };
      const timeToSec = (s: any) => {
        const str = String(s || '').trim();
        const m = /^(\d+)\s+days\s+(\d{2}):(\d{2}):(\d{2}\.\d+)/.exec(str);
        if (m) return Number(m[1]) * 86400 + Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4]);
        if (str.includes(':')) {
          const p = str.split(':');
          if (p.length === 3) return Number(p[0]) * 3600 + Number(p[1]) * 60 + Number(p[2]);
        }
        const v = Number(str); return isFinite(v) ? v : 0;
      };

      const wheelSpeed: number[] = [];
      const brakePressure: number[] = [];
      const ambientTemp: number[] = [];
      const padThickness: number[] = [];
      const timestamp: number[] = [];

      let pad = get().padThickness || 10;
      let lastSec = 0;
      for (const c of data) {
        const sec = timeToSec(c['Time'] ?? c['SessionTime'] ?? 0);
        const dt = Math.max(0, sec - lastSec);
        lastSec = sec;
        const speedMs = toNum(c['Speed']) / 3.6;
        const wheelRpm = speedMs > 0 ? (speedMs / (2 * Math.PI * 0.33)) * 60 : 0;
        const pressureBar = toBool(c['Brake']) ? Math.min(300, 50 + speedMs * 20) : 0;
        const wearMm = Math.max(0, pressureBar) * 1e-5 * Math.max(0.02, dt);
        pad = Math.max(1.5, pad - wearMm);
        wheelSpeed.push(wheelRpm);
        brakePressure.push(pressureBar);
        ambientTemp.push(get().ambientTemp || 25);
        padThickness.push(pad);
        timestamp.push(sec * 1000);
      }

      const hist = timestamp.map((t, i) => ({
        timestamp: t,
        wheelSpeed: wheelSpeed[i],
        pressure: brakePressure[i],
        temperature: get().temperature,
        padThickness: padThickness[i],
      }));

      set({
        historicalData: hist.slice(-100),
        wheelSpeed: wheelSpeed.at(-1) || get().wheelSpeed,
        pressure: brakePressure.at(-1) || get().pressure,
        padThickness: padThickness.at(-1) || get().padThickness,
      });

      get().updatePredictions();
      get().addAlert({ message: `Loaded local HF dump (${path}) with ${data.length} rows`, type: 'info' });
    } catch (e: any) {
      console.error('Local HF dump load error', e);
      get().addAlert({ message: `Local HF dump failed: ${e?.message || e}`, type: 'warning' });
    }
  },
}));