import {BN, convertToNumber, PerpMarkets, ZERO} from "@drift-labs/sdk-browser";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";

export const shortenAddress = (address: string) => address.slice(0, 4).concat('...').concat(address.slice(-4));

export const capitalize = (str: string) => str.charAt(0).toUpperCase().concat(str.slice(1));

export function decimalStrToBN(decimalStr: string, decimals: number): BN {
  if (!decimalStr || isNaN(parseFloat(decimalStr))) {
    return ZERO;
  }
  const safeStr = String(Number(decimalStr));
  const parts = safeStr.split('.');
  const integerPart = parts[0];
  const fractionalPart = parts[1] || '';
  const integerBN = new BN(integerPart).mul(new BN(10).pow(new BN(decimals)));
  let fractionalBN = ZERO;
  if (fractionalPart.length > 0) {
    const trimmedFractional = fractionalPart.substring(0, decimals);
    const paddedFractional = trimmedFractional.padEnd(decimals, '0');
    fractionalBN = new BN(paddedFractional);
  }
  if (safeStr.startsWith('-')) {
    return integerBN.add(fractionalBN).neg();
  } else {
    return integerBN.add(fractionalBN);
  }
}

export function formatBigNum(balanceBn: BN | undefined, decimals: number): string {
  if (!balanceBn) return '0.00';
  return convertToNumber(balanceBn, new BN(10).pow(new BN(decimals))).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

export const getMarketSymbol = (marketIndex: number): string =>
  PerpMarkets[WalletAdapterNetwork.Mainnet].find((m) => m.marketIndex === marketIndex)!.symbol;