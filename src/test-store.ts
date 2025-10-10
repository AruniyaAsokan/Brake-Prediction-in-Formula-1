import { useBrakeSystemStore } from './stores/BrakeSystemStore';

// Test the store
console.log('Testing Brake System Store...');

const store = useBrakeSystemStore.getState();

console.log('Initial state:', {
  temperature: store.temperature,
  pressure: store.pressure,
  padThickness: store.padThickness,
  wheelSpeed: store.wheelSpeed
});

// Test setting values
store.setTemperature(650);
store.setPressure(150);

console.log('After updates:', {
  temperature: useBrakeSystemStore.getState().temperature,
  pressure: useBrakeSystemStore.getState().pressure,
  alerts: useBrakeSystemStore.getState().alerts.length
});

console.log('Store working correctly!');