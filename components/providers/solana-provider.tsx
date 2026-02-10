"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { type ReactNode, useMemo } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";

export type NetworkMode = "mainnet" | "devnet";

interface SolanaProviderProps {
  children: ReactNode;
  network: NetworkMode;
}

export function SolanaProvider({ children, network }: SolanaProviderProps) {
  const endpoint = useMemo(() => {
    if (network === "mainnet") {
      return (
        process.env.NEXT_PUBLIC_MAINNET_RPC_URL ??
        "https://api.mainnet-beta.solana.com"
      );
    }
    return (
      process.env.NEXT_PUBLIC_DEVNET_RPC_URL ??
      "https://api.devnet.solana.com"
    );
  }, [network]);

  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
