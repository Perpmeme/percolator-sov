import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a bigint from native units (e.g. lamports) to a display string.
 * decimals: number of decimal places in the token (e.g. 9 for SOL)
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 9,
  displayDecimals: number = 4
): string {
  const isNeg = amount < 0n;
  const abs = isNeg ? -amount : amount;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const frac = abs % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, displayDecimals);
  const sign = isNeg ? "-" : "";
  return `${sign}${whole.toLocaleString()}.${fracStr}`;
}

/**
 * Format a price from e6 format to a display string.
 */
export function formatPriceE6(priceE6: bigint, decimals: number = 2): string {
  const isNeg = priceE6 < 0n;
  const abs = isNeg ? -priceE6 : priceE6;
  const whole = abs / 1_000_000n;
  const frac = abs % 1_000_000n;
  const fracStr = frac.toString().padStart(6, "0").slice(0, decimals);
  const sign = isNeg ? "-" : "";
  return `${sign}$${whole.toLocaleString()}.${fracStr}`;
}

/**
 * Shorten a public key for display.
 */
export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format basis points to percentage string.
 */
export function bpsToPercent(bps: bigint): string {
  const pct = Number(bps) / 100;
  return `${pct.toFixed(2)}%`;
}
