/**
 * Lightweight Multi-Layer Perceptron (MLP) Neural Network
 * Implemented in pure TypeScript for high-performance client-side mobile execution.
 * Following NexHaul Engineering Constitution Section 6.3 & 6.6.
 */

export class NeuralNetwork {
  weightsInputHidden: number[][];
  weightsHiddenOutput: number[];
  biasHidden: number[];
  biasOutput: number;

  constructor(inputSize: number, hiddenSize: number) {
    // Initialize random weights using He/Xavier uniform initialization
    this.weightsInputHidden = Array.from({ length: inputSize }, () =>
      Array.from({ length: hiddenSize }, () => (Math.random() * 2 - 1) * Math.sqrt(2 / inputSize))
    );
    this.weightsHiddenOutput = Array.from({ length: hiddenSize }, () => 
      (Math.random() * 2 - 1) * Math.sqrt(2 / hiddenSize)
    );
    this.biasHidden = Array.from({ length: hiddenSize }, () => 0);
    this.biasOutput = 0;
  }

  relu(x: number): number {
    return Math.max(0, x);
  }

  sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-45, Math.min(45, x))));
  }

  forward(inputs: number[]): number {
    if (inputs.length !== this.weightsInputHidden.length) {
      throw new Error(`Invalid input size: expected ${this.weightsInputHidden.length}, got ${inputs.length}`);
    }

    // Hidden layer activation
    const hidden = this.biasHidden.map((b, hIdx) => {
      let sum = b;
      for (let i = 0; i < inputs.length; i++) {
        sum += inputs[i] * this.weightsInputHidden[i][hIdx];
      }
      return this.relu(sum);
    });

    // Output layer activation (probability score 0.0 to 1.0)
    let outSum = this.biasOutput;
    for (let h = 0; h < hidden.length; h++) {
      outSum += hidden[h] * this.weightsHiddenOutput[h];
    }

    return this.sigmoid(outSum);
  }

  toJSON() {
    return {
      wih: this.weightsInputHidden,
      who: this.weightsHiddenOutput,
      bh: this.biasHidden,
      bo: this.biasOutput
    };
  }

  fromJSON(data: any) {
    if (!data) return;
    if (data.wih) this.weightsInputHidden = data.wih;
    if (data.who) this.weightsHiddenOutput = data.who;
    if (data.bh) this.biasHidden = data.bh;
    if (data.bo !== undefined) this.biasOutput = data.bo;
  }
}
