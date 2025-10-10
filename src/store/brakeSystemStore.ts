import { create } from 'zustand';

export interface Alert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
}

export interface BrakeSystemState {
  // Sensor data
  temperature: number;
  pressure: number;
  padThickness: number;
  wheelSpeed: number;
  
  // Simulation state
  isSimulating: boolean;
  currentLap: number;
  alerts: Alert[];
  
  // Physics calculations
  heatGeneration: number;
  coolingRate: number;
  wearRate: number;
  predictedLapsRemaining: number;
  
  // LSTM comparison data
  lstmAccuracy: number;
  twinAccuracy: number;
  lstmResponseTime: number;
  twinResponseTime: number;
  
  // Actions
  setTemperature: (temp: number) => void;
  setPressure: (pressure: number) => void;
  setPadThickness: (thickness: number) => void;
  setWheelSpeed: (speed: number) => void;
  toggleSimulation: () => void;
  resetSystem: () => void;
  setCurrentLap: (lap: number) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  clearAlerts: () => void;
  updatePhysics: () => void;
  simulateRaceLap: (lap: number) => void;
}

export const useBrakeSystemStore = create<BrakeSystemState>((set, get) => ({
  // Initial sensor values
  temperature: 450,
  pressure: 120,
  padThickness: 12.5,
  wheelSpeed: 1500,
  
  // Initial simulation state
  isSimulating: false,
  currentLap: 1,
  alerts: [],
  
  // Initial physics values
  heatGeneration: 0,
  coolingRate: 0,
  wearRate: 0,
  predictedLapsRemaining: 45,
  
  // Initial LSTM comparison
  lstmAccuracy: 78.5,
  twinAccuracy: 94.2,
  lstmResponseTime: 45,
  twinResponseTime: 12,
  
  setTemperature: (temp) => {
    set({ temperature: temp });
    get().updatePhysics();
  },
  
  setPressure: (pressure) => {
    set({ pressure });
    get().updatePhysics();
  },
  
  setPadThickness: (thickness) => {
    set({ padThickness: thickness });
    get().updatePhysics();
  },
  
  setWheelSpeed: (speed) => {
    set({ wheelSpeed: speed });
    get().updatePhysics();
  },
  
  toggleSimulation: () => {
    const newState = !get().isSimulating;
    set({ isSimulating: newState });
    
    if (newState) {
      // Start simulation loop
      const simulate = () => {
        const state = get();
        if (!state.isSimulating) return;
        
        // Simulate realistic changes over time
        const tempChange = (Math.random() - 0.5) * 20;
        const pressureChange = (Math.random() - 0.5) * 10;
        const wearChange = Math.random() * 0.02;
        
        set({
          temperature: Math.max(200, Math.min(1200, state.temperature + tempChange)),
          pressure: Math.max(0, Math.min(300, state.pressure + pressureChange)),
          padThickness: Math.max(2, state.padThickness - wearChange),
          wheelSpeed: Math.max(0, Math.min(3000, state.wheelSpeed + (Math.random() - 0.5) * 100))
        });
        
        get().updatePhysics();
        setTimeout(simulate, 500); // Update every 500ms
      };
      simulate();
    }
  },
  
  resetSystem: () => {
    set({
      temperature: 450,
      pressure: 120,
      padThickness: 12.5,
      wheelSpeed: 1500,
      currentLap: 1,
      alerts: [],
      isSimulating: false,
    });
  },
  
  setCurrentLap: (lap) => {
    set({ currentLap: lap });
    get().simulateRaceLap(lap);
  },
  
  addAlert: (alert) => {
    const newAlert: Alert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    set((state) => ({
      alerts: [...state.alerts.slice(-4), newAlert], // Keep only last 5 alerts
    }));
  },
  
  clearAlerts: () => {
    set({ alerts: [] });
  },
  
  updatePhysics: () => {
    const state = get();
    
    // Heat generation calculation: brake force × velocity
    const heatGen = (state.pressure / 100) * (state.wheelSpeed / 1000) * 50;
    
    // Cooling rate (Newton's law): proportional to temperature difference
    const ambientTemp = 25;
    const coolingRate = 0.05 * (state.temperature - ambientTemp);
    
    // Pad wear rate calculation
    const wearRate = (state.pressure / 200) * (state.temperature / 500) * 0.01;
    
    // Predicted laps remaining
    const currentWear = 15 - state.padThickness;
    const maxWear = 10; // mm before replacement needed
    const remainingWear = maxWear - currentWear;
    const predictedLaps = Math.max(0, Math.floor(remainingWear / wearRate));
    
    set({
      heatGeneration: heatGen,
      coolingRate,
      wearRate,
      predictedLapsRemaining: predictedLaps,
    });
    
    // Generate alerts based on physics
    get().clearAlerts();
    
    if (state.temperature > 800) {
      get().addAlert({
        message: 'Brake Temperature Critical - Risk of Brake Fade',
        severity: 'critical',
      });
    } else if (state.temperature > 650) {
      get().addAlert({
        message: 'Brake Temperature High - Monitor Closely',
        severity: 'warning',
      });
    }
    
    if (state.padThickness < 5) {
      get().addAlert({
        message: 'Brake Pads Critically Worn - Immediate Replacement Required',
        severity: 'critical',
      });
    } else if (state.padThickness < 8) {
      get().addAlert({
        message: 'Brake Pads Low - Schedule Replacement Soon', 
        severity: 'warning',
      });
    }
    
    if (predictedLaps < 5) {
      get().addAlert({
        message: `Pads will wear out in ~${predictedLaps} laps`,
        severity: 'warning',
      });
    }
    
    if (state.pressure > 250) {
      get().addAlert({
        message: 'Brake Pressure Excessive - Check System',
        severity: 'warning',
      });
    }
  },
  
  simulateRaceLap: (lap) => {
    // Simulate realistic brake data based on lap number
    const baseTemp = 400 + (lap * 8) + Math.random() * 100;
    const basePressure = 100 + Math.random() * 80;
    const baseThickness = Math.max(2, 15 - (lap * 0.2) - Math.random() * 0.5);
    const baseSpeed = 1000 + Math.random() * 1500;
    
    set({
      temperature: Math.min(1200, baseTemp),
      pressure: Math.min(300, basePressure),
      padThickness: baseThickness,
      wheelSpeed: baseSpeed,
    });
    
    get().updatePhysics();
  },
}));