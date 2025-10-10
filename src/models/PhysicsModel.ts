export interface BrakePhysicsInputs {
  wheelSpeed: number; // RPM
  brakePressure: number; // bar
  ambientTemp: number; // °C
  padThickness: number; // mm
  discMass: number; // kg
  padArea: number; // cm²
  timeStep: number; // seconds
}

export interface BrakePhysicsOutputs {
  temperature: number; // °C
  wearRate: number; // mm/lap
  heatGeneration: number; // W
  coolingRate: number; // W
  predictedLapsRemaining: number;
  thermalStress: number; // MPa
}

export class PhysicsModel {
  // Material constants
  private readonly FRICTION_COEFFICIENT = 0.4;
  private readonly PAD_DENSITY = 2.3; // g/cm³
  private readonly SPECIFIC_HEAT_CAPACITY = 1200; // J/kg·K
  private readonly THERMAL_CONDUCTIVITY = 0.8; // W/m·K
  private readonly CONVECTION_COEFFICIENT = 25; // W/m²·K
  private readonly WEAR_COEFFICIENT = 2.5e-9; // Material-specific wear constant
  
  // Disc properties
  private readonly DISC_RADIUS = 0.15; // m
  private readonly DISC_THICKNESS = 0.025; // m
  private readonly DISC_MASS = 8.5; // kg
  private readonly SURFACE_AREA = 0.05; // m² (effective cooling area)

  predict(inputs: BrakePhysicsInputs, previousTemp = 25): BrakePhysicsOutputs {
    // Convert inputs to SI units
    const wheelSpeedRad = (inputs.wheelSpeed * 2 * Math.PI) / 60; // rad/s
    const pressurePa = inputs.brakePressure * 100000; // Pa
    const padAreaM2 = inputs.padArea / 10000; // m²

    // Calculate braking force
    const normalForce = pressurePa * padAreaM2;
    const frictionForce = this.FRICTION_COEFFICIENT * normalForce;
    
    // Calculate kinetic energy dissipation
    const linearVelocity = wheelSpeedRad * this.DISC_RADIUS;
    const powerDissipated = frictionForce * linearVelocity; // Watts

    // Heat generation calculation
    const heatGeneration = powerDissipated;

    // Temperature calculation using lumped capacitance method
    const thermalCapacity = this.DISC_MASS * this.SPECIFIC_HEAT_CAPACITY;
    const convectiveCooling = this.CONVECTION_COEFFICIENT * this.SURFACE_AREA * 
                             (previousTemp - inputs.ambientTemp);
    
    const netHeatRate = heatGeneration - convectiveCooling;
    const tempIncrease = (netHeatRate * inputs.timeStep) / thermalCapacity;
    const newTemperature = previousTemp + tempIncrease;

    // Pad wear calculation using Archard's wear equation
    // Wear = K × N × s / H (where K=wear coefficient, N=normal force, s=sliding distance, H=hardness)
    const slidingDistance = linearVelocity * inputs.timeStep;
    const hardnessTemp = 150 - (newTemperature - 25) * 0.1; // Temperature-dependent hardness
    const wearVolume = this.WEAR_COEFFICIENT * normalForce * slidingDistance / Math.max(hardnessTemp, 50);
    const wearDepth = wearVolume / padAreaM2; // meters
    const wearRateMm = (wearDepth * 1000) / inputs.timeStep; // mm/s

    // Convert wear rate to mm/lap (assuming 90-second lap)
    const wearPerLap = Math.max(0.001, wearRateMm * 90);

    // Predict remaining laps with better calculation
    const usableThickness = Math.max(0, inputs.padThickness - 2); // 2mm minimum
    const predictedLaps = Math.max(0, Math.min(200, usableThickness / wearPerLap));

    // Thermal stress calculation (simplified)
    const thermalExpansion = 12e-6 * (newTemperature - 25); // Linear expansion
    const thermalStress = thermalExpansion * 200e9 / 1e6; // Convert to MPa

    // Cooling rate calculation
    const coolingRate = convectiveCooling;

    return {
      temperature: Math.max(inputs.ambientTemp, newTemperature),
      wearRate: Math.max(0.001, Math.min(0.1, wearPerLap)), // Clamp between 0.001-0.1 mm/lap
      heatGeneration: Math.max(0, Math.min(5000, heatGeneration)), // Clamp between 0-5000W
      coolingRate: Math.max(0, Math.min(1000, coolingRate)), // Clamp between 0-1000W
      predictedLapsRemaining: Math.round(predictedLaps), // Round to whole number
      thermalStress: Math.max(0, thermalStress)
    };
  }

  // Simulate multiple time steps for more accurate results
  simulateOverTime(
    inputs: BrakePhysicsInputs, 
    duration: number, 
    initialTemp = 25
  ): BrakePhysicsOutputs[] {
    const results: BrakePhysicsOutputs[] = [];
    let currentTemp = initialTemp;
    const steps = Math.floor(duration / inputs.timeStep);

    for (let i = 0; i < steps; i++) {
      const result = this.predict(inputs, currentTemp);
      results.push(result);
      currentTemp = result.temperature;
    }

    return results;
  }

  // Get steady-state prediction (after thermal equilibrium)
  getSteadyState(inputs: BrakePhysicsInputs): BrakePhysicsOutputs {
    let currentTemp = 25;
    let previousTemp = 0;
    let iterations = 0;
    const maxIterations = 100;

    // Iterate until temperature converges
    while (Math.abs(currentTemp - previousTemp) > 0.1 && iterations < maxIterations) {
      previousTemp = currentTemp;
      const result = this.predict(inputs, currentTemp);
      currentTemp = result.temperature;
      iterations++;
    }

    return this.predict(inputs, currentTemp);
  }
}