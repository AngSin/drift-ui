import {Connection} from "@solana/web3.js";

export const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed',
);
export const FAST_POLLING_INTERVAL = 2_000;
export const SLOW_POLLING_INTERVAL = 5_000;