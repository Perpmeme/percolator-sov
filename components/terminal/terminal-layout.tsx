"use client";

import { useState } from "react";
import { useNetwork } from "@/components/providers/network-context";
import { TerminalHeader } from "./header";
import { MarketStats } from "./market-stats";
import { TradeTicket } from "./trade-ticket";
import { AccountActions } from "./account-actions";
import { PositionsTable } from "./positions-table";
import { ReceiptsSidebar } from "./receipts-sidebar";
import { ProgramInfo } from "./program-info";
import { MainnetView } from "./mainnet-view";
import { PanelRight, PanelRightClose } from "lucide-react";

export function TerminalLayout() {
  const { isDevnet } = useNetwork();
  const [showReceipts, setShowReceipts] = useState(true);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TerminalHeader />

      {isDevnet ? (
        <>
          <MarketStats />

          <div className="flex flex-1 overflow-hidden">
            {/* Left: Trade + Account + Program */}
            <aside className="flex w-80 flex-shrink-0 flex-col overflow-y-auto border-r border-border bg-card">
              <TradeTicket />
              <AccountActions />
              <ProgramInfo />
            </aside>

            {/* Center: Positions */}
            <main className="flex flex-1 flex-col overflow-hidden bg-card">
              <PositionsTable />
            </main>

            {/* Right: Receipts (collapsible) */}
            {showReceipts && (
              <aside className="hidden lg:flex w-80 flex-shrink-0 overflow-hidden">
                <ReceiptsSidebar />
              </aside>
            )}
          </div>

          {/* Receipts toggle (fixed button) */}
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
      ) : (
        <MainnetView />
      )}
    </div>
  );
}
