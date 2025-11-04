export interface TCNInputSequence {
  wheelSpeed: number[];
  brakePressure: number[];
  ambientTemp: number[];
  padThickness: number[];
  timestamp: number[];
}

export interface TCNPredict {
  temperature: number;
  wearRate: number;
  predictedLapsRemaining: number;
  confidence: number;
}

export class TCNModel {
  private channels = 32;
  private kernelSize = 3;
  private dilations = [1, 2, 4, 8];
  private convs: number[][][] = [];
  private heads: { W: number[][]; b: number[] }[] = [];

  constructor() {
    const rand = (r: number, c: number, s = 0.1) => Array.from({ length: r }, () => Array.from({ length: c }, () => (Math.random() - 0.5) * 2 * s));
    for (let d = 0; d < this.dilations.length; d++) this.convs[d] = rand(this.channels, this.kernelSize);
    this.heads.push({ W: rand(3, this.channels), b: Array.from({ length: 3 }, () => 0) });
  }

  private normalize(seq: TCNInputSequence): number[][] {
    const n = seq.wheelSpeed.length;
    const out: number[][] = new Array(n);
    for (let i = 0; i < n; i++) {
      out[i] = [
        seq.wheelSpeed[i] / 3000,
        seq.brakePressure[i] / 300,
        (seq.ambientTemp[i] + 50) / 1200,
        seq.padThickness[i] / 15,
      ];
    }
    return out;
  }

  private conv1D(signal: number[], kernel: number[], dilation: number): number[] {
    const out: number[] = new Array(signal.length).fill(0);
    const k = kernel.length;
    for (let t = 0; t < signal.length; t++) {
      let sum = 0;
      for (let i = 0; i < k; i++) {
        const idx = t - i * dilation;
        if (idx >= 0) sum += kernel[i] * signal[idx];
      }
      out[t] = Math.max(0, sum);
    }
    return out;
  }

  predict(sequence: TCNInputSequence): TCNPredict {
    if (!sequence || sequence.wheelSpeed.length === 0) {
      return { temperature: 450, wearRate: 0.1, predictedLapsRemaining: 45, confidence: 0.5 };
    }
    const X = this.normalize(sequence);
    // Collapse features to single channel by averaging as a simple stand-in
    const sig = X.map(v => (v[0] + v[1] + v[2] + v[3]) / 4);

    // Dilated stack
    let features = new Array(this.channels).fill(0).map(() => sig.slice());
    for (let l = 0; l < this.dilations.length; l++) {
      const dilation = this.dilations[l];
      const k = this.convs[l][0].length;
      for (let c = 0; c < this.channels; c++) {
        const kernel = this.convs[l][c % this.convs[l].length];
        features[c] = this.conv1D(features[c], kernel, dilation);
      }
      // Residual connection: add original signal (simple)
      for (let c = 0; c < this.channels; c++) {
        for (let t = 0; t < sig.length; t++) features[c][t] = Math.max(0, features[c][t] + sig[t] * 0.1);
      }
    }

    // Global average pooling
    const pooled = new Array(this.channels).fill(0);
    for (let c = 0; c < this.channels; c++) pooled[c] = features[c].reduce((a, b) => a + b, 0) / features[c].length;

    const head = this.heads[0];
    const y = new Array(3).fill(0);
    for (let o = 0; o < 3; o++) {
      let sum = head.b[o];
      for (let i = 0; i < pooled.length; i++) sum += head.W[o][i % head.W[o].length] * pooled[i];
      y[o] = sum;
    }

    const temperature = 25 + Math.max(0, Math.min(1, y[0])) * 1175;
    const wearRate = Math.max(0, Math.min(1, y[1])) * 0.5;
    const predictedLapsRemaining = Math.max(0, Math.min(1, y[2])) * 200;
    const confidence = 0.55;

    return { temperature, wearRate, predictedLapsRemaining, confidence };
  }
}


