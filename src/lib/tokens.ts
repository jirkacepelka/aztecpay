// Token registry. Addresses here are placeholders for the Aztec testnet token
// contracts — swap for real deployed addresses per network. `usdPrice` is a
// static demo value used for the fiat estimate shown in the pay screen; wire a
// real price oracle later.

export interface TokenMeta {
  symbol: string;
  name: string;
  decimals: number;
  /** Token contract AztecAddress (0x + hex). */
  address: string;
  /** Static demo USD price per 1 whole token. */
  usdPrice: number;
}

export const TOKENS: TokenMeta[] = [
  {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    address: '0x21852de10424512d0f76da45c53b68b30f76da45c0000000000000000000000',
    usdPrice: 1269,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x2a9c3f10b7e5d84c19aa77bbccddeeff001122334455667788990011223344',
    usdPrice: 1,
  },
];

export function tokenBySymbol(symbol: string): TokenMeta | undefined {
  return TOKENS.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase());
}

export function tokenByAddress(address: string): TokenMeta | undefined {
  return TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase());
}
