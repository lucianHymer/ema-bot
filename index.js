;(async function () {
  const weight6 = 0.2857
  const weight21 = 0.091

  class EMABot {
    constructor (current6, current21, buy, sell) {
      this.current6 = current6
      this.current21 = current21
      this.buy = buy
      this.sell = sell
    }

    addCurrentPrice (price) {
      const { next6, next21 } = this.calculateNextEMAs(price)

      if (this.flippedToGain(next6, next21)) this.buy()
      else if (this.flippedToLoss(next6, next21)) this.sell()
    }

    calculateNextEMAs (price) {
      const next6 = this.calculateEMA(weight6, price, this.current6)
      const next21 = this.calculateEMA(weight21, price, this.current21)

      return { next6, next21 }
    }

    calculateEMA (weight, price, previousEMA) {
      return weight * (price - previousEMA) + previousEMA
    }

    flippedToGain (next6, next21) {
      return this.current6 <= this.current21 && next6 > next21
    }

    flippedToLoss (next6, next21) {
      return this.current6 >= this.current21 && next6 < next21
    }
  }

  function getPrice () {}

  function delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  let price;
  const bot = new EMABot(1296.95, 1259.08, buy, sell)

  const intervalMS = 1000 * 60 * 5

  while (true) {
    const price = getPrice()
    bot.addCurrentPrice(price)
    await delay(intervalMS)
  }
})()
