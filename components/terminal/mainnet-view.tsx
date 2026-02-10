"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDrift } from "@/components/providers/drift-provider";
import { DriftMarketSelector } from "./drift-market-selector";
import { DriftMarketStats } from "./drift-market-stats";
import { DriftTradeTicket } from "./drift-trade-ticket";
import { DriftPositions, DriftAccountActions } from "./drift-positions";
import { ReceiptsSidebar } from "./receipts-sidebar";
import {
  Loader2,
  Wallet,
  AlertCircle,
  PanelRight,
  PanelRightClose,
} from "lucide-react";

export function MainnetView() {
  const wallet = useWallet();
  const { isInitializing, error } = useDrift();
  const [selectedMarketIndex, setSelectedMarketIndex] = useState(0); // SOL-PERP
  const [showReceipts, setShowReceipts] = useState(true);

  // Not connected state
  if (!wallet.publicKey) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-8">
        <div className="flex max-w-md flex-col items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-border">
            <Wallet className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-balance text-center font-mono text-lg font-bold text-foreground">
              Connect Wallet for Mainnet
            </h2>
            <p className="text-pretty text-center text-sm leading-relaxed text-muted-foreground">
              Connect your Solana wallet to access live Drift perpetual futures trading on mainnet-beta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Initializing Drift client
  if (isInitializing) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="font-mono text-sm text-muted-foreground">
            Initializing Drift Protocol...
          </span>
          <span className="font-mono text-xs text-muted-foreground/60">
            Subscribing to market accounts and oracles
          </span>
        </div>
      </div>
    );
  }

  // Error state -- show helpful setup guide
  if (error) {
    const isRpcIssue = error.includes("RPC") || error.includes("403");
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-8">
        <div className="flex max-w-lg flex-col items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-balance text-center font-mono text-lg font-bold text-foreground">
              {isRpcIssue ? "Mainnet RPC Required" : "Drift Initialization Failed"}
            </h2>
            <p className="text-pretty text-center text-sm leading-relaxed text-muted-foreground">
              {error}
            </p>
          </div>
          {isRpcIssue && (
            <div className="w-full rounded-lg border border-border bg-surface p-4">
              <p className="mb-3 font-mono text-xs font-bold text-foreground">Setup Guide</p>
              <ol className="flex flex-col gap-2 font-mono text-xs text-muted-foreground">
                <li>{"1. Get a free RPC endpoint from Helius, QuickNode, or Alchemy"}</li>
                <li>{"2. Set the environment variable:"}</li>
                <li className="ml-4 rounded bg-background px-2 py-1 font-mono text-primary">
                  {"NEXT_PUBLIC_MAINNET_RPC_URL=https://your-rpc-url"}
                </li>
                <li>{"3. Reload the page to connect to Drift Protocol"}</li>
              </ol>
              <p className="mt-3 text-[11px] text-muted-foreground/60">
                {"The Devnet tab works without any configuration."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full trading terminal
  return (
    <>
      {/* Market stats bar */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-1.5">
        <DriftMarketSelector
          selectedMarketIndex={selectedMarketIndex}
          onSelect={setSelectedMarketIndex}
        />
      </div>
      <DriftMarketStats selectedMarketIndex={selectedMarketIndex} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: Trade + Deposit/Withdraw */}
        <aside className="flex w-80 flex-shrink-0 flex-col overflow-y-auto border-r border-border bg-card">
          <DriftTradeTicket selectedMarketIndex={selectedMarketIndex} />
          <DriftAccountActions />
        </aside>

        {/* Center: Positions */}
        <main className="flex flex-1 flex-col overflow-hidden bg-card">
          <DriftPositions />
        </main>

        {/* Right: Receipts (collapsible) */}
        {showReceipts && (
          <aside className="hidden lg:flex w-80 flex-shrink-0 overflow-hidden">
            <ReceiptsSidebar />
          </aside>
        )}
      </div>

      {/* Receipts toggle */}
      <button
        onClick={() => setShowReceipts(!showReceipts)}
        className="fixed bottom-4 right-4 z-50 hidden lg:flex items-center gap-1.5 rounded-lg bg-card border border-border px-3 py-2 font-mono text-[11px] text-muted-foreground shadow-lg transition-all hover:text-foreground hover:border-primary/30"
      >
        {showReceipts ? (
          <>
            <PanelRightClose className="h-3.5 w-3.5" />
            Hide Receipts
          </>
        ) : (
          <>
            <PanelRight className="h-3.5 w-3.5" />
            Show Receipts
          </>
        )}
      </button>
    </>
  );
}
