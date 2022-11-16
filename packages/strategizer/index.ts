import TradingWallet from "trading-wallet";
import * as fs from "node:fs/promises";

enum Move {
  openLong,
  closeLong,
  openShort,
  closeShort,
  none,
}

type LongAndShortTerm = {
  longTerm: number;
  shortTerm: number;
};

type EMAValues = LongAndShortTerm;

type EMAStrategySpecs = {
  numPeriods: LongAndShortTerm;
  initialValues: EMAValues;
};

type EMAWeights = LongAndShortTerm;

class EMACalculator {
  #weights: EMAWeights;

  constructor(specs: EMAStrategySpecs) {
    this.#weights = {
      shortTerm: this.#calculateWeightForNumPeriods(specs.numPeriods.shortTerm),
      longTerm: this.#calculateWeightForNumPeriods(specs.numPeriods.longTerm),
    };
  }

  calculateNextEMAs(previous: EMAValues, price: number): EMAValues {
    return {
      longTerm: this.#calculateEMA(
        this.#weights.longTerm,
        price,
        previous.longTerm
      ),
      shortTerm: this.#calculateEMA(
        this.#weights.shortTerm,
        price,
        previous.shortTerm
      ),
    };
  }

  #calculateEMA(weight: number, price: number, previous: number) {
    return weight * (price - previous) + previous;
  }

  #calculateWeightForNumPeriods(numPeriods: number) {
    return 2 / (numPeriods + 1);
  }
}

class EMAMoveCalculator {
  #previous: LongAndShortTerm;
  #current: LongAndShortTerm;
  #price: number;

  constructor(previous: EMAValues, current: EMAValues, price: number) {
    this.#previous = previous;
    this.#current = current;
    this.#price = price;
  }

  calculate() {
    if (this.#isFlippedToGain()) return Move.openLong;
    else if (this.#isPriceBelowEMA()) return Move.closeLong;
    else if (this.#isFlippedToLoss()) return Move.openShort;
    else if (this.#isPriceAboveEMA()) return Move.closeShort;
    else return Move.none;
  }

  #isFlippedToGain() {
    return (
      this.#previous.shortTerm <= this.#previous.longTerm &&
      this.#current.shortTerm > this.#current.longTerm
    );
  }

  #isFlippedToLoss() {
    return (
      this.#previous.shortTerm >= this.#previous.longTerm &&
      this.#current.shortTerm < this.#current.longTerm
    );
  }

  #isPriceBelowEMA() {
    return this.#price < this.#current.shortTerm;
  }

  #isPriceAboveEMA() {
    return this.#price > this.#current.shortTerm;
  }
}

class EMAStrategy {
  #emaCalculator: EMACalculator;
  #previous: EMAValues;

  constructor(specs: EMAStrategySpecs) {
    this.#emaCalculator = new EMACalculator(specs);
    this.#previous = specs.initialValues;
  }

  addCurrentPrice(price: number): Move {
    const current = this.#emaCalculator.calculateNextEMAs(
      this.#previous,
      price
    );

    const move = new EMAMoveCalculator(
      this.#previous,
      current,
      price
    ).calculate();

    this.#previous = current;

    return move;
  }
}

class StrategyRunner {
  #strategy: EMAStrategy;
  #tradingWallet: TradingWallet;
  #isShort: boolean;
  #isLong: boolean;

  constructor(strategy: EMAStrategy, tradingWallet: TradingWallet) {
    this.#strategy = strategy;
    this.#tradingWallet = tradingWallet;
    this.#isLong = false;
    this.#isShort = false;
  }

  runForNewPrice(price: number) {
    switch (this.#strategy.addCurrentPrice(price)) {
      case Move.openLong:
        this.#tradingWallet.openLong(price);
        this.#isLong = true;
        break;
      case Move.closeLong:
        if (this.#isLong) {
          this.#tradingWallet.closeLong(price);
          this.#isLong = false;
        }
        break;
      case Move.openShort:
        this.#tradingWallet.openShort(price);
        this.#isShort = true;
        break;
      case Move.closeShort:
        if (this.#isShort) {
          this.#tradingWallet.closeShort(price);
          this.#isShort = false;
        }
        break;
    }
  }
}

const emaStrategy = new EMAStrategy({
  numPeriods: { shortTerm: 6, longTerm: 12 },
  initialValues: { shortTerm: 1273.07, longTerm: 1270.86 },
});

const tradingWallet = new TradingWallet();
const strategyRunner = new StrategyRunner(emaStrategy, tradingWallet);

let lastTime = 0;
const duration = 1000 * 60 * 5;
fs.readFile("/home/lucian/output/prices.csv").then((buffer) => {
  buffer
    .toString()
    .split("\n")
    .map((line) => {
      const [time, price] = line.split(",");
      const thisTime = new Date(time).valueOf();
      if (thisTime - lastTime < duration) return;
      lastTime = thisTime;
      strategyRunner.runForNewPrice(parseFloat(price));
    });
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
