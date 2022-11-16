export default class TradingWallet {
  #balance: {
    ETH: number;
    USDC: number;
  };
  #transactionPrice: number;

  constructor() {
    this.#balance = {
      ETH: 0,
      USDC: 100.0,
    };
    this.#transactionPrice = 0.25;
  }

  openLong(price: number) {
    this.closeShort(price);
    const toLong = this.#balance.USDC * 0.9;
    this.#balance.ETH = toLong / price;
    this.#balance.USDC -= toLong + this.#transactionPrice;
    console.log(
      `openLong,${this.#totalBalance(price)},${this.#balance.ETH},${
        this.#balance.USDC
      },${price}`
    );
  }

  closeLong(price: number) {
    this.#balance.USDC += this.#balance.ETH * price - this.#transactionPrice;
    this.#balance.ETH = 0;
    console.log(
      `closeLong,${this.#totalBalance(price)},${this.#balance.ETH},${
        this.#balance.USDC
      },${price}`
    );
  }

  #totalBalance(price: number) {
    return this.#balance.ETH * price + this.#balance.USDC;
  }

  openShort(price: number) {
    this.closeLong(price);
    // TODO
  }

  closeShort(price: number) {
    // TODO
  }
}
