"use client";

import useSWR from "swr";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  DEVNET_SLAB,
  PercolatorSDK,
  DEVNET_PROGRAM_ID,
  type MarketConfig,
  type EngineState,
  type SlabHeader,
  type RiskParams,
  type Account,
} from "@/lib/percolator-sdk";
import { useNetwork } from "@/components/providers/network-context";

export interface MarketData {
  header: SlabHeader;
  config: MarketConfig;
  engine: EngineState;
  params: RiskParams;
  accounts: { idx: number; account: Account }[];
}

export function useMarketData() {
  const { connection } = useConnection();
  const { isDevnet } = useNetwork();

  return useSWR<MarketData | null>(
    isDevnet ? ["market-data", DEVNET_SLAB.toBase58()] : null,
    async () => {
      const sdk = new PercolatorSDK(connection, DEVNET_PROGRAM_ID);
      const data = await sdk.fetchSlabData(DEVNET_SLAB);
      const header = sdk.parseSlabHeader(data);
      const config = sdk.parseMarketConfig(data);
      const engine = sdk.parseEngineState(data);
      const params = sdk.parseRiskParams(data);
      const accounts = sdk.parseAllAccounts(data);

      return { header, config, engine, params, accounts };
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );
}

export function useUserAccount(walletPubkey: PublicKey | null) {
  const { connection } = useConnection();
  const { isDevnet } = useNetwork();

  return useSWR(
    walletPubkey && isDevnet
      ? ["user-account", walletPubkey.toBase58(), DEVNET_SLAB.toBase58()]
      : null,
    async () => {
      if (!walletPubkey) return null;
      const sdk = new PercolatorSDK(connection, DEVNET_PROGRAM_ID);
      const data = await sdk.fetchSlabData(DEVNET_SLAB);
      return sdk.findUserAccount(data, walletPubkey);
    },
    {
      refreshInterval: 5000,
      dedupingInterval: 2000,
    }
  );
}
