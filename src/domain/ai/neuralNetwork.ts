/**
 * Multi-Layer Perceptron (MLP) Neural Network with Backpropagation
 * Implemented in pure TypeScript for high-performance client-side execution.
 * Following NexHaul Engineering Constitution Sections 6.1, 6.3, & 6.6.
 * 
 * Supports both single-hidden-layer and deep multi-layer topologies,
 * LeakyReLU, Tanh, and Sigmoid activations, He/Xavier weight initialization,
 * and online reinforcement learning via backpropagation.
 */

export interface NeuralLayer {
  weights: number[][]; // [inputDim][outputDim]
  biases: number[];    // [outputDim]
  activation: 'leaky_relu' | 'tanh' | 'sigmoid';
}

export class NeuralNetwork {
  inputSize: number;
  layers: NeuralLayer[];
  
  // Backward compatibility fields for legacy serializers / single-layer consumers
  weightsInputHidden: number[][];
  weightsHiddenOutput: number[];
  biasHidden: number[];
  biasOutput: number;

  // Training & Telemetry Stats
  trainingIterations: number = 0;
  totalLoss: number = 0;
  lastConfidence: number = 0.5;

  constructor(inputSize: number = 8, hiddenSizesOrSize: number | number[] = [12, 8]) {
    this.inputSize = inputSize;
    const hiddenSizes = Array.isArray(hiddenSizesOrSize) ? hiddenSizesOrSize : [hiddenSizesOrSize];
    this.layers = [];

    // Construct layer topology
    const layerDims = [inputSize, ...hiddenSizes, 1];
    for (let l = 0; l < layerDims.length - 1; l++) {
      const inDim = layerDims[l];
      const outDim = layerDims[l + 1];
      const isOutput = l === layerDims.length - 2;
      const isPenultimate = l === layerDims.length - 3;
      
      const activation: 'leaky_relu' | 'tanh' | 'sigmoid' = isOutput 
        ? 'sigmoid' 
        : isPenultimate && hiddenSizes.length > 1
        ? 'tanh' 
        : 'leaky_relu';

      // Xavier/Glorot uniform initialization
      const limit = Math.sqrt(6 / (inDim + outDim));
      const weights = Array.from({ length: inDim }, () =>
        Array.from({ length: outDim }, () => (Math.random() * 2 - 1) * limit)
      );
      // Small positive bias in hidden layers to avoid dead neurons
      const biases = Array.from({ length: outDim }, () => (isOutput ? 0.0 : 0.05));

      this.layers.push({ weights, biases, activation });
    }

    // Initialize legacy compatibility fields referencing layer 0 and layer 1
    this.weightsInputHidden = this.layers[0]?.weights || [];
    this.biasHidden = this.layers[0]?.biases || [];
    const lastLayer = this.layers[this.layers.length - 1];
    this.weightsHiddenOutput = lastLayer?.weights?.map(w => w[0]) || [];
    this.biasOutput = lastLayer?.biases?.[0] ?? 0;
  }

  leakyRelu(x: number): number {
    return x > 0 ? x : 0.01 * x;
  }

  leakyReluDerivative(y: number): number {
    return y > 0 ? 1.0 : 0.01;
  }

  tanh(x: number): number {
    const clamped = Math.max(-20, Math.min(20, x));
    return Math.tanh(clamped);
  }

  tanhDerivative(y: number): number {
    return 1.0 - y * y;
  }

  sigmoid(x: number): number {
    const clamped = Math.max(-45, Math.min(45, x));
    return 1 / (1 + Math.exp(-clamped));
  }

  sigmoidDerivative(y: number): number {
    return y * (1.0 - y);
  }

  /**
   * Forward inference pass through all network layers.
   * Returns a scalar score between 0.0 and 1.0.
   */
  forward(inputs: number[]): number {
    const expectedIn = this.layers[0]?.weights?.length ?? this.inputSize;
    if (!inputs || inputs.length !== expectedIn) {
      inputs = this.normalizeInputVector(inputs || [], expectedIn);
    }

    let current = inputs;
    for (let l = 0; l < this.layers.length; l++) {
      const layer = this.layers[l];
      if (!layer || !layer.weights || !layer.biases) continue;
      const next: number[] = [];
      const numInputs = Math.min(current.length, layer.weights.length);

      for (let j = 0; j < layer.biases.length; j++) {
        let sum = layer.biases[j] ?? 0;
        for (let i = 0; i < numInputs; i++) {
          const row = layer.weights[i];
          if (row && row[j] !== undefined) {
            sum += current[i] * row[j];
          }
        }

        if (layer.activation === 'sigmoid') {
          next.push(this.sigmoid(sum));
        } else if (layer.activation === 'tanh') {
          next.push(this.tanh(sum));
        } else {
          next.push(this.leakyRelu(sum));
        }
      }
      current = next;
    }

    this.lastConfidence = current[0] ?? 0.5;
    return this.lastConfidence;
  }

  /**
   * Online reinforcement backpropagation pass.
   * Updates weights using gradient descent towards the target score.
   */
  train(inputs: number[], target: number, learningRate: number = 0.04): { loss: number; output: number } {
    const expectedIn = this.layers[0]?.weights?.length ?? this.inputSize;
    inputs = this.normalizeInputVector(inputs || [], expectedIn);
    target = Math.max(0.01, Math.min(0.99, target));

    // 1. Forward pass storing activations
    const layerOutputs: number[][] = [inputs];
    let current = inputs;

    for (let l = 0; l < this.layers.length; l++) {
      const layer = this.layers[l];
      if (!layer || !layer.weights || !layer.biases) continue;
      const next: number[] = [];
      const numInputs = Math.min(current.length, layer.weights.length);

      for (let j = 0; j < layer.biases.length; j++) {
        let sum = layer.biases[j] ?? 0;
        for (let i = 0; i < numInputs; i++) {
          const row = layer.weights[i];
          if (row && row[j] !== undefined) {
            sum += current[i] * row[j];
          }
        }

        if (layer.activation === 'sigmoid') {
          next.push(this.sigmoid(sum));
        } else if (layer.activation === 'tanh') {
          next.push(this.tanh(sum));
        } else {
          next.push(this.leakyRelu(sum));
        }
      }
      layerOutputs.push(next);
      current = next;
    }

    const output = current[0];
    const loss = 0.5 * Math.pow(target - output, 2);
    this.totalLoss = this.totalLoss * 0.95 + loss * 0.05;
    this.trainingIterations++;

    // 2. Backward pass: Calculate layer error deltas
    const deltas: number[][] = [];
    const numLayers = this.layers.length;

    // Output layer error delta
    const outDelta = (target - output) * this.sigmoidDerivative(output);
    deltas[numLayers - 1] = [outDelta];

    // Backpropagate deltas to hidden layers
    for (let l = numLayers - 2; l >= 0; l--) {
      const layer = this.layers[l];
      const nextLayer = this.layers[l + 1];
      const nextDeltas = deltas[l + 1];
      const currentOutputs = layerOutputs[l + 1];
      const layerDelta: number[] = [];

      for (let i = 0; i < layer.biases.length; i++) {
        let errorSum = 0;
        for (let j = 0; j < nextDeltas.length; j++) {
          errorSum += nextDeltas[j] * nextLayer.weights[i][j];
        }

        let derivative = 1.0;
        const val = currentOutputs[i];
        if (layer.activation === 'tanh') {
          derivative = this.tanhDerivative(val);
        } else if (layer.activation === 'sigmoid') {
          derivative = this.sigmoidDerivative(val);
        } else {
          derivative = this.leakyReluDerivative(val);
        }

        layerDelta.push(errorSum * derivative);
      }
      deltas[l] = layerDelta;
    }

    // 3. Update weights and biases with momentum/weight decay
    for (let l = 0; l < numLayers; l++) {
      const layer = this.layers[l];
      const prevOutputs = layerOutputs[l];
      const layerDelta = deltas[l];

      for (let i = 0; i < prevOutputs.length; i++) {
        for (let j = 0; j < layerDelta.length; j++) {
          const grad = layerDelta[j] * prevOutputs[i];
          layer.weights[i][j] = layer.weights[i][j] * (1 - 0.0001) + learningRate * grad;
        }
      }

      for (let j = 0; j < layerDelta.length; j++) {
        layer.biases[j] += learningRate * layerDelta[j];
      }
    }

    // Sync legacy compatibility fields
    this.weightsInputHidden = this.layers[0]?.weights || [];
    this.biasHidden = this.layers[0]?.biases || [];
    const lastLayer = this.layers[this.layers.length - 1];
    this.weightsHiddenOutput = lastLayer?.weights?.map(w => w[0]) || [];
    this.biasOutput = lastLayer?.biases?.[0] ?? 0;

    return { loss, output };
  }

  normalizeInputVector(inputs: number[], targetSize: number): number[] {
    const result = Array(targetSize).fill(0.5);
    for (let i = 0; i < Math.min(inputs.length, targetSize); i++) {
      const v = inputs[i];
      result[i] = Number.isFinite(v) ? Math.max(-10, Math.min(10, v)) : 0.5;
    }
    return result;
  }

  toJSON() {
    return {
      version: 2,
      inputSize: this.inputSize,
      trainingIterations: this.trainingIterations,
      totalLoss: this.totalLoss,
      lastConfidence: this.lastConfidence,
      layers: this.layers.map(l => ({
        weights: l.weights,
        biases: l.biases,
        activation: l.activation
      })),
      wih: this.layers[0]?.weights || [],
      who: this.layers[this.layers.length - 1]?.weights?.map(w => w[0]) || [],
      bh: this.layers[0]?.biases || [],
      bo: this.layers[this.layers.length - 1]?.biases?.[0] ?? 0
    };
  }

  fromJSON(data: any) {
    if (!data) return;
    if (data.trainingIterations) this.trainingIterations = data.trainingIterations;
    if (data.totalLoss) this.totalLoss = data.totalLoss;
    if (data.lastConfidence !== undefined) this.lastConfidence = data.lastConfidence;

    if (data.layers && Array.isArray(data.layers) && data.layers.length > 0) {
      const loadedIn = data.layers[0]?.weights?.length;
      if (loadedIn === this.inputSize) {
        this.layers = data.layers;
        this.weightsInputHidden = this.layers[0]?.weights || [];
        this.biasHidden = this.layers[0]?.biases || [];
        const last = this.layers[this.layers.length - 1];
        this.weightsHiddenOutput = last?.weights?.map((w: any) => Array.isArray(w) ? w[0] : w) || [];
        this.biasOutput = last?.biases?.[0] ?? 0;
        return;
      }
    }

    if (data.wih && data.who && Array.isArray(data.wih) && Array.isArray(data.who)) {
      if (data.wih.length === this.inputSize) {
        this.layers = [
          {
            weights: data.wih,
            biases: data.bh || Array(data.wih[0]?.length || 6).fill(0),
            activation: 'leaky_relu'
          },
          {
            weights: data.who.map((w: any) => Array.isArray(w) ? w : [w]),
            biases: [data.bo ?? 0],
            activation: 'sigmoid'
          }
        ];
        this.weightsInputHidden = data.wih;
        this.weightsHiddenOutput = data.who;
        this.biasHidden = data.bh || [];
        this.biasOutput = data.bo ?? 0;
      }
    }
  }
}

/**
 * Singleton Dispatch Neural Network with 8 logistics inputs and deep 12->8 topology.
 */
let dispatchNetworkInstance: NeuralNetwork | null = null;

export function getDispatchNeuralNetwork(savedWeights?: any): NeuralNetwork {
  if (!dispatchNetworkInstance) {
    dispatchNetworkInstance = new NeuralNetwork(8, [12, 8]);
    seedDispatchModelPrior(dispatchNetworkInstance);
  }
  if (savedWeights) {
    dispatchNetworkInstance.fromJSON(savedWeights);
    // Self-healing: if loaded model has collapsed outputs (stuck around ~0.55), re-seed priors
    const testScoreHigh = dispatchNetworkInstance.forward([0.9, 0.95, 0.95, 0.8, 0.95, 0.9, 1.0, 0.8]);
    const testScoreLow = dispatchNetworkInstance.forward([0.1, 0.1, 0.1, 0.2, 0.2, 0.05, 0.1, 0.1]);
    if (Math.abs(testScoreHigh - testScoreLow) < 0.15) {
      seedDispatchModelPrior(dispatchNetworkInstance);
    }
  }
  return dispatchNetworkInstance;
}

/**
 * Seeds the neural model with multi-epoch prior training favoring profitability, low deadhead, and rested drivers.
 */
function seedDispatchModelPrior(net: NeuralNetwork): void {
  const trainingSet = [
    { input: [0.90, 0.95, 0.98, 0.85, 0.95, 0.92, 1.0, 0.85], target: 0.96 }, // High profit, zero deadhead
    { input: [0.75, 0.80, 0.88, 0.75, 0.90, 0.82, 0.8, 0.70], target: 0.88 }, // Solid commercial load
    { input: [0.55, 0.55, 0.65, 0.60, 0.75, 0.60, 0.6, 0.50], target: 0.65 }, // Average load
    { input: [0.35, 0.35, 0.45, 0.45, 0.50, 0.35, 0.4, 0.30], target: 0.42 }, // Marginal yield load
    { input: [0.20, 0.15, 0.25, 0.30, 0.30, 0.15, 0.2, 0.20], target: 0.22 }, // High deadhead / low margin
    { input: [0.05, 0.05, 0.08, 0.15, 0.15, 0.02, 0.1, 0.10], target: 0.06 }  // Non-viable load
  ];

  for (let epoch = 0; epoch < 40; epoch++) {
    for (const sample of trainingSet) {
      net.train(sample.input, sample.target, 0.08);
    }
  }
}

/**
 * Trains the neural network on historical central logs (S.logs) using Experience Replay.
 * Only trains on logs with actual feature vector recordings to prevent model corruption.
 */
export function trainOnHistoricalLogs(net: NeuralNetwork, S: any): number {
  if (!S) return 0;
  const logs = [ ...(S.logs || []), ...(S.aiState?.logs || []) ];
  if (logs.length === 0) return 0;

  let trainedCount = 0;
  for (const log of logs) {
    if (!log.features || !Array.isArray(log.features) || log.features.length !== net.inputSize) {
      continue;
    }

    const text = (log.msg + ' ' + (log.title || '') + ' ' + (log.message || '')).toLowerCase();
    
    let target = 0.5;
    if (text.includes('completed') || text.includes('success') || text.includes('profit') || text.includes('won') || text.includes('bonus')) {
      target = 0.92;
    } else if (text.includes('blocked') || text.includes('failed') || text.includes('fine') || text.includes('collision') || text.includes('expired')) {
      target = 0.12;
    } else {
      continue;
    }

    net.train(log.features, target, 0.02);
    trainedCount++;
    if (trainedCount >= 15) break;
  }

  return trainedCount;
}
