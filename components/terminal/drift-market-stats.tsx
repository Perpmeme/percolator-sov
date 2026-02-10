"use client";

import { useDrift } from "@/components/providers/drift-provider";
import { formatUsd, formatCompact } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface DriftMarketStatsProps {
  selectedMarketIndex: number;
}

export function DriftMarketStats({ selectedMarketIndex }: DriftMarketStatsProps) {
  const { markets, isInitializing } = useDrift();

  const market = markets.find(
    (m) => m.marketIndex === selectedMarketIndex
  );

  if (isInitializing) {
    return (
      <div className="flex items-center gap-2 border-b border-border bg-card px-5 py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        <span className="font-mono text-xs text-muted-foreground">
          Loading Drift markets...
        </span>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="flex items-center gap-2 border-b border-border bg-card px-5 py-2">
        <span className="font-mono text-xs text-muted-foreground">
          Connect wallet to view market data
        </span>
      </div>
    );
  }

  const stats = [
    {
      label: "Oracle",
      value: formatUsd(market.oraclePrice),
      color: "text-foreground",
    },
    {
      label: "Bid",
      value: formatUsd(market.bidPrice),
      color: "text-long",
    },
    {
      label: "Ask",
      value: formatUsd(market.askPrice),
      color: "text-short",
    },
    {
      label: "Spread",
      value: `${((market.askPrice - market.bidPrice) / market.oraclePrice * 100).toFixed(4)}%`,
      color: "text-muted-foreground",
    },
    {
      label: "24h Vol",
      value: `$${formatCompact(market.volume24h)}`,
      color: "text-foreground",
    },
    {
      label: "Open Int.",
      value: `$${formatCompact(market.openInterest)}`,
      color: "text-foreground",
    },
    {
      label: "Funding",
      value: `${market.fundingRate >= 0 ? "+" : ""}${(market.fundingRate * 100).toFixed(4)}%`,
      color: market.fundingRate >= 0 ? "text-long" : "text-short",
    },
  ];

  return (
    <div className="flex items-center gap-5 overflow-x-auto border-b border-border bg-card px-5 py-2">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-long live-dot" />
        <span className="font-mono text-sm font-bold text-foreground">
          {market.symbol}
        </span>
      </div>

      <div className="hidden md:flex h-4 w-px bg-border" />

      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {stat.label}
          </span>
          <span className={`font-mono text-xs font-semibold ${stat.color}`}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
