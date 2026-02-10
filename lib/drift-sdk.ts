"use client";

import {
  DriftClient,
  BulkAccountLoader,
  PositionDirection,
  OrderType,
  MarketType,
  PRICE_PRECISION,
  BASE_PRECISION,
  QUOTE_PRECISION,
  convertToNumber,
  calculateBidAskPrice,
  getMarketOrderParams,
  PerpMarkets,
  getMarketsAndOraclesForSubscription,
  type PerpMarketAccount,
  type PerpPosition,
} from "@drift-labs/sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

// Drift mainnet program ID
const DRIFT_PROGRAM_ID = new PublicKey(
  "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
);

// Key perp market indices on Drift mainnet
export const DRIFT_PERP_MARKETS = {
  "SOL-PERP": 0,
  "BTC-PERP": 1,
  "ETH-PERP": 2,
  "APT-PERP": 24,
  "ARB-PERP": 23,
  "DOGE-PERP": 15,
  "MATIC-PERP": 12,
  "SUI-PERP": 28,
  "1MPEPE-PERP": 22,
  "OP-PERP": 25,
  "RNDR-PERP": 26,
  "XRP-PERP": 38,
  "HNT-PERP": 33,
  "INJ-PERP": 29,
  "LINK-PERP": 35,
  "BONK-PERP": 17,
  "PYTH-PERP": 20,
  "JTO-PERP": 21,
  "SEI-PERP": 27,
  "WIF-PERP": 34,
  "JUP-PERP": 36,
  "DYM-PERP": 41,
  "W-PERP": 42,
  "TNSR-PERP": 43,
  "DRIFT-PERP": 44,
};

export type DriftMarketInfo = {
  symbol: string;
  marketIndex: number;
  oraclePrice: number;
  bidPrice: number;
  askPrice: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
  lastSlot: number;
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
  marginRatio: number | null;
  leverage: number;
  positions: DriftPositionInfo[];
};

// Adapter for wallet-adapter to Drift IWallet
export function walletAdapterToDriftWallet(wallet: {
  publicKey: PublicKey | null;
  signTransaction: ((tx: any) => Promise<any>) | undefined;
  signAllTransactions: ((txs: any[]) => Promise<any[]>) | undefined;
}) {
  return {
    publicKey: wallet.publicKey!,
    signTransaction: wallet.signTransaction!,
    signAllTransactions: wallet.signAllTransactions!,
    payer: undefined as any,
  };
}

export async function createDriftClient(
  connection: Connection,
  wallet: ReturnType<typeof walletAdapterToDriftWallet>
): Promise<DriftClient> {
  const accountLoader = new BulkAccountLoader(connection, "confirmed", 5000);

  const { oracleInfos, perpMarketIndexes, spotMarketIndexes } =
    getMarketsAndOraclesForSubscription("mainnet-beta");

  const driftClient = new DriftClient({
    connection,
    wallet,
    programID: DRIFT_PROGRAM_ID,
    env: "mainnet-beta",
    accountSubscription: {
      type: "polling",
      accountLoader,
    },
    perpMarketIndexes,
    spotMarketIndexes,
    oracleInfos,
  });

  await driftClient.subscribe();
  return driftClient;
}

export function getPerpMarketData(
  driftClient: DriftClient,
  marketIndex: number
): DriftMarketInfo | null {
  try {
    const perpMarket = driftClient.getPerpMarketAccount(marketIndex);
    if (!perpMarket) return null;

    const oracleData = driftClient.getOracleDataForPerpMarket(marketIndex);
    const oraclePrice = convertToNumber(oracleData.price, PRICE_PRECISION);

    const [bid, ask] = calculateBidAskPrice(perpMarket.amm, oracleData);
    const bidPrice = convertToNumber(bid, PRICE_PRECISION);
    const askPrice = convertToNumber(ask, PRICE_PRECISION);

    const openInterestBase = convertToNumber(
      perpMarket.amm.baseAssetAmountLong,
      BASE_PRECISION
    );
    const openInterest = openInterestBase * oraclePrice;

    // Funding rate: hourly rate from amm
    const fundingRateNum = convertToNumber(
      perpMarket.amm.lastFundingRate,
      PRICE_PRECISION
    );
    const fundingRate = fundingRateNum / oraclePrice;

    // Volume approximation from amm stats
    const volume24h = convertToNumber(
      perpMarket.amm.volume24H,
      QUOTE_PRECISION
    );

    return {
      symbol: getSymbolForIndex(marketIndex),
      marketIndex,
      oraclePrice,
      bidPrice,
      askPrice,
      volume24h,
      openInterest,
      fundingRate,
      lastSlot: perpMarket.amm.lastOracleValid ? 1 : 0,
    };
  } catch {
    return null;
  }
}

export function getUserAccountData(
  driftClient: DriftClient
): DriftAccountInfo | null {
  try {
    const user = driftClient.getUser();
    if (!user) return null;

    const totalCollateral = convertToNumber(
      user.getTotalCollateral(),
      QUOTE_PRECISION
    );
    const freeCollateral = convertToNumber(
      user.getFreeCollateral(),
      QUOTE_PRECISION
    );
    const unrealizedPnl = convertToNumber(
      user.getUnrealizedPNL(true),
      QUOTE_PRECISION
    );
    const totalPositionValue = convertToNumber(
      user.getTotalPerpPositionValue(undefined, true),
      QUOTE_PRECISION
    );

    const leverage = user.getLeverage().toNumber() / 10000;

    const marginRatio = totalPositionValue > 0
      ? totalCollateral / totalPositionValue
      : null;

    const perpPositions = user.getActivePerpPositions();
    const positions: DriftPositionInfo[] = perpPositions.map((pos: PerpPosition) => {
      const baseAmount = convertToNumber(pos.baseAssetAmount, BASE_PRECISION);
      const direction: "long" | "short" = baseAmount >= 0 ? "long" : "short";
      const absBase = Math.abs(baseAmount);

      const oracleData = driftClient.getOracleDataForPerpMarket(
        pos.marketIndex
      );
      const oraclePrice = convertToNumber(oracleData.price, PRICE_PRECISION);
      const notional = absBase * oraclePrice;

      const quoteEntry = convertToNumber(
        pos.quoteEntryAmount,
        QUOTE_PRECISION
      );
      const entryPrice = absBase > 0 ? Math.abs(quoteEntry) / absBase : 0;

      const unrealizedPnl = convertToNumber(
        user.getPerpPositionValue(pos.marketIndex, oracleData, true),
        QUOTE_PRECISION
      ) - Math.abs(quoteEntry);

      let liquidationPrice: number | null = null;
      try {
        const liqPrice = user.liquidationPrice(pos.marketIndex);
        if (liqPrice) {
          liquidationPrice = convertToNumber(liqPrice, PRICE_PRECISION);
        }
      } catch {
        // No liquidation price available
      }

      return {
        marketIndex: pos.marketIndex,
        symbol: getSymbolForIndex(pos.marketIndex),
        baseAssetAmount: baseAmount,
        quoteEntryAmount: quoteEntry,
        unrealizedPnl,
        entryPrice,
        direction,
        notional,
        liquidationPrice,
      };
    });

    return {
      totalCollateral,
      freeCollateral,
      unrealizedPnl,
      totalPositionValue,
      marginRatio,
      leverage,
      positions,
    };
  } catch {
    return null;
  }
}

export async function placeDriftPerpOrder(
  driftClient: DriftClient,
  marketIndex: number,
  direction: "long" | "short",
  sizeBase: number
): Promise<string> {
  const orderParams = getMarketOrderParams({
    marketIndex,
    direction:
      direction === "long" ? PositionDirection.LONG : PositionDirection.SHORT,
    baseAssetAmount: new BN(sizeBase * BASE_PRECISION.toNumber()),
    marketType: MarketType.PERP,
  });

  const tx = await driftClient.placePerpOrder(orderParams);
  return tx;
}

export async function placeDriftLimitOrder(
  driftClient: DriftClient,
  marketIndex: number,
  direction: "long" | "short",
  sizeBase: number,
  price: number
): Promise<string> {
  const tx = await driftClient.placePerpOrder({
    orderType: OrderType.LIMIT,
    marketIndex,
    marketType: MarketType.PERP,
    direction:
      direction === "long" ? PositionDirection.LONG : PositionDirection.SHORT,
    baseAssetAmount: new BN(sizeBase * BASE_PRECISION.toNumber()),
    price: new BN(price * PRICE_PRECISION.toNumber()),
  });
  return tx;
}

export async function closeDriftPosition(
  driftClient: DriftClient,
  marketIndex: number
): Promise<string> {
  const user = driftClient.getUser();
  const position = user
    .getActivePerpPositions()
    .find((p: PerpPosition) => p.marketIndex === marketIndex);
  if (!position) throw new Error("No position found for this market");

  const baseAmount = position.baseAssetAmount;
  const direction = baseAmount.gt(new BN(0))
    ? PositionDirection.SHORT
    : PositionDirection.LONG;

  const orderParams = getMarketOrderParams({
    marketIndex,
    direction,
    baseAssetAmount: baseAmount.abs(),
    marketType: MarketType.PERP,
    reduceOnly: true,
  });

  const tx = await driftClient.placePerpOrder(orderParams);
  return tx;
}

export async function depositToDrift(
  driftClient: DriftClient,
  amount: number,
  spotMarketIndex: number = 0 // USDC
): Promise<string> {
  const amountBN = new BN(amount * QUOTE_PRECISION.toNumber());
  const tx = await driftClient.deposit(amountBN, spotMarketIndex);
  return tx;
}

export async function withdrawFromDrift(
  driftClient: DriftClient,
  amount: number,
  spotMarketIndex: number = 0 // USDC
): Promise<string> {
  const amountBN = new BN(amount * QUOTE_PRECISION.toNumber());
  const tx = await driftClient.withdraw(amountBN, spotMarketIndex);
  return tx;
}

function getSymbolForIndex(marketIndex: number): string {
  const mainnetMarkets = PerpMarkets["mainnet-beta"];
  const market = mainnetMarkets?.find((m) => m.marketIndex === marketIndex);
  return market?.symbol ?? `PERP-${marketIndex}`;
}

export function getAllPerpMarkets(
  driftClient: DriftClient
): DriftMarketInfo[] {
  const results: DriftMarketInfo[] = [];
  // Iterate known market indices
  for (const [, index] of Object.entries(DRIFT_PERP_MARKETS)) {
    const data = getPerpMarketData(driftClient, index);
    if (data) results.push(data);
  }
  return results;
}
