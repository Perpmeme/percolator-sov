"use client";

import { useMarketData } from "@/hooks/use-market-data";
import { shortenAddress } from "@/lib/utils";
import { AccountKind } from "@/lib/percolator-sdk";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  LayoutList,
} from "lucide-react";

export function PositionsTable() {
  const { data, isLoading } = useMarketData();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
          <span className="font-mono text-xs text-muted-foreground">
            Loading positions...
          </span>
        </div>
      </div>
    );
  }

  const accounts = data?.accounts ?? [];

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <LayoutList className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
            Positions
          </h2>
          <span className="rounded-md bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            {accounts.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-long live-dot" />
          <span className="font-mono text-[10px] text-muted-foreground">Auto-refresh 5s</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border">
              {["Idx", "Type", "Owner", "Capital", "Position", "Entry", "PnL"].map(
                (col, i) => (
                  <th
                    key={col}
                    className={`px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground ${
                      i >= 3 ? "text-right" : "text-left"
                    }`}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <LayoutList className="h-8 w-8 text-border" />
                    <span className="font-mono text-xs text-muted-foreground">
                      No accounts found on this slab
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              accounts.map(({ idx, account }) => {
                const posSize = Number(account.positionSize) / 1e9;
                const capital = Number(account.capital) / 1e9;
                const pnl = Number(account.pnl) / 1e9;
                const entryPrice = Number(account.entryPrice) / 1e6;
                const isLp = account.kind === AccountKind.LP;

                return (
                  <tr
                    key={idx}
                    className="border-b border-border/40 transition-colors hover:bg-surface-elevated/50 group"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs font-medium text-foreground">
                      {idx}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                          isLp
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : "bg-primary/10 text-primary border border-primary/20"
                        }`}
                      >
                        {isLp ? "LP" : "USER"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        {shortenAddress(account.owner.toBase58())}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-medium text-foreground">
                      {capital.toFixed(4)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-xs font-medium ${
                          posSize > 0
                            ? "text-long"
                            : posSize < 0
                              ? "text-short"
                              : "text-muted-foreground"
                        }`}
                      >
                        {posSize > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : posSize < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {Math.abs(posSize).toFixed(4)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-foreground">
                      {entryPrice > 0 ? `$${entryPrice.toFixed(2)}` : "--"}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono text-xs font-medium ${
                        pnl > 0
                          ? "text-long"
                          : pnl < 0
                            ? "text-short"
                            : "text-muted-foreground"
                      }`}
                    >
                      {pnl >= 0 ? "+" : ""}
                      {pnl.toFixed(4)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
