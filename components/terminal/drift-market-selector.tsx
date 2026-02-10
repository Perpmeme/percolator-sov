"use client";

import { useState } from "react";
import { useDrift } from "@/components/providers/drift-provider";
import { Search, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { formatUsd } from "@/lib/utils";

interface DriftMarketSelectorProps {
  selectedMarketIndex: number;
  onSelect: (marketIndex: number) => void;
}

export function DriftMarketSelector({
  selectedMarketIndex,
  onSelect,
}: DriftMarketSelectorProps) {
  const { markets } = useDrift();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = markets.find((m) => m.marketIndex === selectedMarketIndex);

  const filtered = markets.filter((m) =>
    m.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-all hover:border-primary/30"
      >
        <span className="font-mono text-sm font-bold text-foreground">
          {selected?.symbol ?? "Select Market"}
        </span>
        {selected && (
          <span className="font-mono text-xs text-muted-foreground">
            {formatUsd(selected.oraclePrice)}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-card shadow-xl">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search markets..."
                  className="w-full rounded-md border border-border bg-surface py-2 pl-8 pr-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center font-mono text-xs text-muted-foreground">
                  No markets found
                </div>
              ) : (
                filtered.map((market) => (
                  <button
                    key={market.marketIndex}
                    onClick={() => {
                      onSelect(market.marketIndex);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 transition-colors hover:bg-surface ${
                      market.marketIndex === selectedMarketIndex
                        ? "bg-surface"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {market.symbol}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-foreground">
                        {formatUsd(market.oraclePrice)}
                      </span>
                      <span
                        className={`flex items-center gap-0.5 font-mono text-[10px] ${
                          market.fundingRate >= 0 ? "text-long" : "text-short"
                        }`}
                      >
                        {market.fundingRate >= 0 ? (
                          <TrendingUp className="h-2.5 w-2.5" />
                        ) : (
                          <TrendingDown className="h-2.5 w-2.5" />
                        )}
                        {(market.fundingRate * 100).toFixed(4)}%
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
