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
import type { DriftClient } from "@drift-labs/sdk";
import {
  createDriftClient,
  walletAdapterToDriftWallet,
  getUserAccountData,
  getAllPerpMarkets,
  type DriftAccountInfo,
  type DriftMarketInfo,
} from "@/lib/drift-sdk";
import { useNetwork } from "./network-context";

type DriftContextValue = {
  client: DriftClient | null;
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

  const [client, setClient] = useState<DriftClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<DriftAccountInfo | null>(null);
  const [markets, setMarkets] = useState<DriftMarketInfo[]>([]);

  // Initialize / teardown DriftClient when wallet connects on mainnet
  useEffect(() => {
    if (network !== "mainnet") {
      if (client) {
        client.unsubscribe().catch(() => {});
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

    let cancelled = false;
    setIsInitializing(true);
    setError(null);

    const driftWallet = walletAdapterToDriftWallet(wallet);

    createDriftClient(connection, driftWallet)
      .then((dc) => {
        if (cancelled) {
          dc.unsubscribe().catch(() => {});
          return;
        }
        setClient(dc);
        setIsInitializing(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Failed to initialize Drift client");
          setIsInitializing(false);
        }
      });

    return () => {
      cancelled = true;
      if (client) client.unsubscribe().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.publicKey?.toBase58(), network]);

  // Refresh account data
  const refreshAccount = useCallback(() => {
    if (!client) return;
    try {
      const data = getUserAccountData(client);
      setAccount(data);
    } catch {
      setAccount(null);
    }
  }, [client]);

  // Refresh market data
  const refreshMarkets = useCallback(() => {
    if (!client) return;
    try {
      const data = getAllPerpMarkets(client);
      setMarkets(data);
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
