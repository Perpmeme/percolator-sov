"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useNetwork } from "./network-context";

// Lazy import Drift SDK to avoid SSR issues and bundle errors
type DriftClientType = any;

type DriftAccountInfo = {
  totalCollateral: number;
  freeCollateral: number;
  unrealizedPnl: number;
  totalPositionValue: number;
  leverage: number;
  positions: Array<{
    marketIndex: number;
    symbol: string;
    baseAssetAmount: number;
    quoteEntryAmount: number;
    unrealizedPnl: number;
    entryPrice: number;
    direction: "long" | "short";
    notional: number;
    liquidationPrice: number | null;
  }>;
};

type DriftMarketInfo = {
  symbol: string;
  marketIndex: number;
  oraclePrice: number;
  bidPrice: number;
  askPrice: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
};

type DriftContextValue = {
  client: DriftClientType | null;
  isInitializing: boolean;
  error: string | null;
  account: DriftAccountInfo | null;
  markets: DriftMarketInfo[];
  refreshAccount: () => void;
  refreshMarkets: () => void;
};

const DriftContext = createContext<DriftContextValue>({
  client: null,
  isInitializing: false,
  error: null,
  account: null,
  markets: [],
  refreshAccount: () => {},
  refreshMarkets: () => {},
});

export function useDrift() {
  return useContext(DriftContext);
}

export function DriftProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useNetwork();

  const [client, setClient] = useState<DriftClientType>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<DriftAccountInfo | null>(null);
  const [markets, setMarkets] = useState<DriftMarketInfo[]>([]);

  // Initialize / teardown DriftClient when wallet connects on mainnet
  useEffect(() => {
    if (network !== "mainnet") {
      if (client) {
        try { client.unsubscribe(); } catch {}
        setClient(null);
      }
      setAccount(null);
      setMarkets([]);
      setError(null);
      return;
    }

    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      setClient(null);
      setAccount(null);
      setError(null);
      return;
    }

    // Validate RPC before attempting Drift init -- public endpoints get 403'd
    const rpcUrl = connection.rpcEndpoint;
    const isPublicRpc =
      rpcUrl.includes("api.mainnet-beta.solana.com") ||
      rpcUrl.includes("solana.publicnode.com") ||
      !process.env.NEXT_PUBLIC_MAINNET_RPC_URL;

    if (isPublicRpc) {
      setError(
        "Mainnet requires a private RPC endpoint. Set NEXT_PUBLIC_MAINNET_RPC_URL (Helius, QuickNode, Alchemy, etc.)."
      );
      setIsInitializing(false);
      return;
    }

    let cancelled = false;
    setIsInitializing(true);
    setError(null);

    (async () => {
      try {
        // Dynamic import to avoid SSR/bundling issues
        const driftSdk = await import("@drift-labs/sdk");
        const BN = (await import("bn.js")).default;

        const accountLoader = new driftSdk.BulkAccountLoader(
          connection,
          "confirmed",
          5000
        );

        const { oracleInfos, perpMarketIndexes, spotMarketIndexes } =
          driftSdk.getMarketsAndOraclesForSubscription("mainnet-beta");

        const driftWallet = {
          publicKey: wallet.publicKey!,
          signTransaction: wallet.signTransaction!,
          signAllTransactions: wallet.signAllTransactions!,
          payer: undefined as any,
        };

        const driftClient = new driftSdk.DriftClient({
          connection,
          wallet: driftWallet,
          programID: new (await import("@solana/web3.js")).PublicKey(
            "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
          ),
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

        if (cancelled) {
          try { driftClient.unsubscribe(); } catch {}
          return;
        }

        setClient(driftClient);
        setIsInitializing(false);
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message ?? String(err);
          if (msg.includes("403")) {
            setError(
              "RPC access denied (403). Set NEXT_PUBLIC_MAINNET_RPC_URL to a valid Solana mainnet RPC endpoint (e.g. Helius, QuickNode, Alchemy)."
            );
          } else {
            setError(`Drift init failed: ${msg}`);
          }
          setIsInitializing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey?.toBase58(), network]);

  // Refresh account data
  const refreshAccount = useCallback(async () => {
    if (!client) return;
    try {
      const driftSdk = await import("@drift-labs/sdk");
      const user = client.getUser();
      if (!user) { setAccount(null); return; }

      const totalCollateral = driftSdk.convertToNumber(
        user.getTotalCollateral(),
        driftSdk.QUOTE_PRECISION
      );
      const freeCollateral = driftSdk.convertToNumber(
        user.getFreeCollateral(),
        driftSdk.QUOTE_PRECISION
      );
      const unrealizedPnl = driftSdk.convertToNumber(
        user.getUnrealizedPNL(true),
        driftSdk.QUOTE_PRECISION
      );
      const totalPositionValue = driftSdk.convertToNumber(
        user.getTotalPerpPositionValue(undefined, true),
        driftSdk.QUOTE_PRECISION
      );
      const leverage = user.getLeverage().toNumber() / 10000;

      const perpPositions = user.getActivePerpPositions();
      const mainnetMarkets = driftSdk.PerpMarkets["mainnet-beta"] ?? [];

      const positions = perpPositions.map((pos: any) => {
        const baseAmount = driftSdk.convertToNumber(pos.baseAssetAmount, driftSdk.BASE_PRECISION);
        const direction: "long" | "short" = baseAmount >= 0 ? "long" : "short";
        const absBase = Math.abs(baseAmount);

        const oracleData = client.getOracleDataForPerpMarket(pos.marketIndex);
        const oraclePrice = driftSdk.convertToNumber(oracleData.price, driftSdk.PRICE_PRECISION);
        const notional = absBase * oraclePrice;

        const quoteEntry = driftSdk.convertToNumber(pos.quoteEntryAmount, driftSdk.QUOTE_PRECISION);
        const entryPrice = absBase > 0 ? Math.abs(quoteEntry) / absBase : 0;
        const unrealizedPnl = (baseAmount * oraclePrice) + quoteEntry;

        const market = mainnetMarkets.find((m: any) => m.marketIndex === pos.marketIndex);
        const symbol = market?.symbol ?? `PERP-${pos.marketIndex}`;

        return {
          marketIndex: pos.marketIndex,
          symbol,
          baseAssetAmount: baseAmount,
          quoteEntryAmount: quoteEntry,
          unrealizedPnl,
          entryPrice,
          direction,
          notional,
          liquidationPrice: null,
        };
      });

      setAccount({
        totalCollateral,
        freeCollateral,
        unrealizedPnl,
        totalPositionValue,
        leverage,
        positions,
      });
    } catch {
      setAccount(null);
    }
  }, [client]);

  // Refresh market data
  const refreshMarkets = useCallback(async () => {
    if (!client) return;
    try {
      const driftSdk = await import("@drift-labs/sdk");
      const mainnetMarkets = driftSdk.PerpMarkets["mainnet-beta"] ?? [];
      const results: DriftMarketInfo[] = [];

      for (const market of mainnetMarkets) {
        try {
          const perpMarket = client.getPerpMarketAccount(market.marketIndex);
          if (!perpMarket) continue;

          const oracleData = client.getOracleDataForPerpMarket(market.marketIndex);
          const oraclePrice = driftSdk.convertToNumber(oracleData.price, driftSdk.PRICE_PRECISION);

          const [bid, ask] = driftSdk.calculateBidAskPrice(perpMarket.amm, oracleData);
          const bidPrice = driftSdk.convertToNumber(bid, driftSdk.PRICE_PRECISION);
          const askPrice = driftSdk.convertToNumber(ask, driftSdk.PRICE_PRECISION);

          const oiBase = driftSdk.convertToNumber(
            perpMarket.amm.baseAssetAmountLong,
            driftSdk.BASE_PRECISION
          );

          const fundingRateNum = driftSdk.convertToNumber(
            perpMarket.amm.lastFundingRate,
            driftSdk.PRICE_PRECISION
          );

          results.push({
            symbol: market.symbol,
            marketIndex: market.marketIndex,
            oraclePrice,
            bidPrice,
            askPrice,
            volume24h: 0,
            openInterest: oiBase * oraclePrice,
            fundingRate: oraclePrice > 0 ? fundingRateNum / oraclePrice : 0,
          });
        } catch {
          // Skip markets that fail to load
        }
      }

      setMarkets(results);
    } catch {
      setMarkets([]);
    }
  }, [client]);

  // Auto-poll account & market data every 5s when client is ready
  useEffect(() => {
    if (!client) return;
    refreshAccount();
    refreshMarkets();

    const interval = setInterval(() => {
      refreshAccount();
      refreshMarkets();
    }, 5000);

    return () => clearInterval(interval);
  }, [client, refreshAccount, refreshMarkets]);

  return (
    <DriftContext.Provider
      value={{
        client,
        isInitializing,
        error,
        account,
        markets,
        refreshAccount,
        refreshMarkets,
      }}
    >
      {children}
    </DriftContext.Provider>
  );
}
