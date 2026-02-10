"use client";

import { useNetwork } from "@/components/providers/network-context";
import { TerminalHeader } from "./header";
import { MarketStats } from "./market-stats";
import { TradeTicket } from "./trade-ticket";
import { AccountActions } from "./account-actions";
import { PositionsTable } from "./positions-table";
import { ReceiptsSidebar } from "./receipts-sidebar";
import { ProgramInfo } from "./program-info";
import { MainnetView } from "./mainnet-view";

export function TerminalLayout() {
  const { isDevnet } = useNetwork();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top header bar */}
      <TerminalHeader />

      {isDevnet ? (
        <>
          {/* Market stats bar */}
          <MarketStats />

          {/* Main content area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left panel: trade ticket + account actions + program info */}
            <div className="flex w-72 flex-shrink-0 flex-col overflow-y-auto border-r border-border bg-card">
              <TradeTicket />
              <AccountActions />
              <ProgramInfo />
            </div>

            {/* Center: positions table */}
            <div className="flex flex-1 flex-col overflow-hidden bg-card">
              <PositionsTable />
            </div>

            {/* Right panel: receipts sidebar */}
            <div className="w-72 flex-shrink-0 overflow-hidden">
              <ReceiptsSidebar />
            </div>
          </div>
        </>
      ) : (
        <MainnetView />
      )}
    </div>
  );
}
