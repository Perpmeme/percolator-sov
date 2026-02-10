/**
 * Drift SDK helper functions.
 * ALL imports from @drift-labs/sdk are dynamic to avoid SSR/bundling issues.
 * These functions are only called client-side after wallet connect.
 */
import { Connection, PublicKey } from "@solana/web3.js";

export type DriftMarketInfo = {
  symbol: string;
  marketIndex: number;
  oraclePrice: number;
  bidPrice: number;
  askPrice: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
};

export type DriftPositionInfo = {
  marketIndex: number;
  symbol: string;
  baseAssetAmount: number;
  quoteEntryAmount: number;
  unrealizedPnl: number;
  entryPrice: number;
  direction: "long" | "short";
  notional: number;
  liquidationPrice: number | null;
};

export type DriftAccountInfo = {
  totalCollateral: number;
  freeCollateral: number;
  unrealizedPnl: number;
  totalPositionValue: number;
  leverage: number;
  positions: DriftPositionInfo[];
};

export async function placeDriftPerpOrder(
  driftClient: any,
  marketIndex: number,
  direction: "long" | "short",
  sizeBase: number
): Promise<string> {
  const sdk = await import("@drift-labs/sdk");
  const BN = (await import("bn.js")).default;

  const orderParams = sdk.getMarketOrderParams({
    marketIndex,
    direction:
      direction === "long"
        ? sdk.PositionDirection.LONG
        : sdk.PositionDirection.SHORT,
    baseAssetAmount: new BN(sizeBase * sdk.BASE_PRECISION.toNumber()),
    marketType: sdk.MarketType.PERP,
  });

  const tx = await driftClient.placePerpOrder(orderParams);
  return tx;
}

export async function placeDriftLimitOrder(
  driftClient: any,
  marketIndex: number,
  direction: "long" | "short",
  sizeBase: number,
  price: number
): Promise<string> {
  const sdk = await import("@drift-labs/sdk");
  const BN = (await import("bn.js")).default;

  const tx = await driftClient.placePerpOrder({
    orderType: sdk.OrderType.LIMIT,
    marketIndex,
    marketType: sdk.MarketType.PERP,
    direction:
      direction === "long"
        ? sdk.PositionDirection.LONG
        : sdk.PositionDirection.SHORT,
    baseAssetAmount: new BN(sizeBase * sdk.BASE_PRECISION.toNumber()),
    price: new BN(price * sdk.PRICE_PRECISION.toNumber()),
  });
  return tx;
}

export async function closeDriftPosition(
  driftClient: any,
  marketIndex: number
): Promise<string> {
  const sdk = await import("@drift-labs/sdk");
  const BN = (await import("bn.js")).default;

  const user = driftClient.getUser();
  const position = user
    .getActivePerpPositions()
    .find((p: any) => p.marketIndex === marketIndex);
  if (!position) throw new Error("No position found for this market");

  const baseAmount = position.baseAssetAmount;
  const direction = baseAmount.gt(new BN(0))
    ? sdk.PositionDirection.SHORT
    : sdk.PositionDirection.LONG;

  const orderParams = sdk.getMarketOrderParams({
    marketIndex,
    direction,
    baseAssetAmount: baseAmount.abs(),
    marketType: sdk.MarketType.PERP,
    reduceOnly: true,
  });

  const tx = await driftClient.placePerpOrder(orderParams);
  return tx;
}

export async function depositToDrift(
  driftClient: any,
  amount: number,
  spotMarketIndex: number = 0
): Promise<string> {
  const sdk = await import("@drift-labs/sdk");
  const BN = (await import("bn.js")).default;
  const amountBN = new BN(amount * sdk.QUOTE_PRECISION.toNumber());
  const tx = await driftClient.deposit(amountBN, spotMarketIndex);
  return tx;
}

export async function withdrawFromDrift(
  driftClient: any,
  amount: number,
  spotMarketIndex: number = 0
): Promise<string> {
  const sdk = await import("@drift-labs/sdk");
  const BN = (await import("bn.js")).default;
  const amountBN = new BN(amount * sdk.QUOTE_PRECISION.toNumber());
  const tx = await driftClient.withdraw(amountBN, spotMarketIndex);
  return tx;
}
