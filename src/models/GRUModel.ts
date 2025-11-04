export interface SequenceInput {
  wheelSpeed: number[];
  brakePressure: number[];
  ambientTemp: number[];
  padThickness: number[];
  timestamp: number[];
}

export interface SequencePrediction {
  temperature: number;
  wearRate: number;
  predictedLapsRemaining: number;
  confidence: number;
}

export class GRUModel {
  private hiddenSize = 64;
  private inputSize = 4;
  private weights: { [k: string]: number[][] } = {};
  private biases: { [k: string]: number[] } = {};

  constructor() {
    this.init();
  }

  private init() {
    const randMat = (r: number, c: number, s = 0.1) => Array.from({ length: r }, () => Array.from({ length: c }, () => (Math.random() - 0.5) * 2 * s));
    const randArr = (n: number, s = 0.1) => Array.from({ length: n }, () => (Math.random() - 0.5) * 2 * s);

    // GRU gates: reset (r), update (z), new (n)
    this.weights["Wr"] = randMat(this.hiddenSize, this.inputSize + this.hiddenSize);
    this.weights["Wz"] = randMat(this.hiddenSize, this.inputSize + this.hiddenSize);
    this.weights["Wn"] = randMat(this.hiddenSize, this.inputSize + this.hiddenSize);
    this.biases["br"] = randArr(this.hiddenSize);
    this.biases["bz"] = randArr(this.hiddenSize);
    this.biases["bn"] = randArr(this.hiddenSize);

    // Output head
    this.weights["Wo"] = randMat(3, this.hiddenSize);
    this.biases["bo"] = randArr(3);
  }

  private sigmoid(x: number) { return 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, x)))); }
  private tanh(x: number) { return Math.tanh(Math.max(-50, Math.min(50, x))); }

  private normalize(seq: SequenceInput): number[][] {
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

  private mvMul(W: number[][], v: number[], b?: number[]) {
    const r: number[] = new Array(W.length).fill(0);
    for (let i = 0; i < W.length; i++) {
      let sum = b ? b[i] : 0;
      const Wi = W[i];
      for (let j = 0; j < Wi.length; j++) sum += Wi[j] * v[j];
      r[i] = sum;
    }
    return r;
  }

  predict(sequence: SequenceInput): SequencePrediction {
    if (!sequence || sequence.wheelSpeed.length === 0) {
      return { temperature: 450, wearRate: 0.1, predictedLapsRemaining: 45, confidence: 0.5 };
    }

    const X = this.normalize(sequence);
    let h = new Array(this.hiddenSize).fill(0);

    for (let t = 0; t < X.length; t++) {
      const xt = X[t];
      const concat = [...xt, ...h];

      const r = this.mvMul(this.weights["Wr"], concat, this.biases["br"]).map(this.sigmoid);
      const z = this.mvMul(this.weights["Wz"], concat, this.biases["bz"]).map(this.sigmoid);

      const concatReset = [...xt, ...h.map((hi, i) => r[i] * hi)];
      const n = this.mvMul(this.weights["Wn"], concatReset, this.biases["bn"]).map(this.tanh);

      const newH = new Array(this.hiddenSize);
      for (let i = 0; i < this.hiddenSize; i++) newH[i] = (1 - z[i]) * n[i] + z[i] * h[i];
      h = newH;
    }

    const y = this.mvMul(this.weights["Wo"], h, this.biases["bo"]);

    const temperature = 25 + Math.max(0, Math.min(1, y[0])) * 1175;
    const wearRate = Math.max(0, Math.min(1, y[1])) * 0.5;
    const predictedLapsRemaining = Math.max(0, Math.min(1, y[2])) * 200;
    const confidence = 0.6;

    return { temperature, wearRate, predictedLapsRemaining, confidence };
  }
}


