"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { SolanaProvider, type NetworkMode } from "./solana-provider";

interface NetworkContextValue {
  network: NetworkMode;
  setNetwork: (network: NetworkMode) => void;
  isDevnet: boolean;
  isMainnet: boolean;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx)
    throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<NetworkMode>("devnet");

  const setNetwork = useCallback((n: NetworkMode) => {
    setNetworkState(n);
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        network,
        setNetwork,
        isDevnet: network === "devnet",
        isMainnet: network === "mainnet",
      }}
    >
      <SolanaProvider network={network}>{children}</SolanaProvider>
    </NetworkContext.Provider>
  );
}
