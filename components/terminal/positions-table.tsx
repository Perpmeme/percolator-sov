"use client";

import { useMarketData } from "@/hooks/use-market-data";
import { shortenAddress } from "@/lib/utils";
import { AccountKind } from "@/lib/percolator-sdk";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function PositionsTable() {
  const { data, isLoading } = useMarketData();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const accounts = data?.accounts ?? [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border px-4 py-2">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          All Positions ({accounts.length})
        </h2>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Idx
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Type
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Owner
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Capital
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Position
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Entry
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                PnL
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center font-mono text-xs text-muted-foreground"
                >
                  No accounts found
                </td>
              </tr>
            ) : (
              accounts.map(({ idx, account }) => {
                const posSize = Number(account.positionSize) / 1e9;
                const capital = Number(account.capital) / 1e9;
                const pnl = Number(account.pnl) / 1e9;
                const entryPrice = Number(account.entryPrice) / 1e6;

                return (
                  <tr
                    key={idx}
                    className="border-b border-border/50 transition-colors hover:bg-secondary/50"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-foreground">
                      {idx}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${
                          account.kind === AccountKind.LP
                            ? "bg-accent/10 text-accent"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {account.kind === AccountKind.LP ? "LP" : "USER"}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {shortenAddress(account.owner.toBase58())}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-foreground">
                      {capital.toFixed(4)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-xs ${
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
                        {posSize.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-foreground">
                      {entryPrice > 0 ? `$${entryPrice.toFixed(2)}` : "--"}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono text-xs ${
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
