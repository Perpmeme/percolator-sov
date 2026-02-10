"use client";

import { useMarketData } from "@/hooks/use-market-data";
import { formatTokenAmount, formatPriceE6, bpsToPercent } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={`font-mono text-xs font-medium ${color ?? "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function MarketStats() {
  const { data, isLoading, error } = useMarketData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center border-b border-border bg-card px-4 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          Loading market data...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center border-b border-border bg-card px-4 py-2">
        <span className="font-mono text-xs text-destructive">
          Failed to load market data
        </span>
      </div>
    );
  }

  const { engine, params, config } = data;

  const markPrice = config.lastEffectivePriceE6 > 0n
    ? formatPriceE6(config.lastEffectivePriceE6)
    : config.authorityPriceE6 > 0n
    ? formatPriceE6(config.authorityPriceE6)
    : "--";

  const fundingRate =
    engine.fundingRateBpsPerSlotLast !== 0n
      ? `${(Number(engine.fundingRateBpsPerSlotLast) / 100).toFixed(4)}%/slot`
      : "0.00%";

  return (
    <div className="flex items-center gap-6 overflow-x-auto border-b border-border bg-card px-4 py-2">
      <StatItem
        label="Mark Price"
        value={markPrice}
        color="text-primary"
      />
      <div className="h-6 w-px bg-border" />
      <StatItem
        label="Open Interest"
        value={formatTokenAmount(engine.totalOpenInterest, 9, 2)}
      />
      <StatItem
        label="Vault"
        value={`${formatTokenAmount(engine.vault, 9, 4)} SOL`}
      />
      <StatItem
        label="Insurance"
        value={formatTokenAmount(engine.insuranceFund.balance, 9, 4)}
      />
      <div className="h-6 w-px bg-border" />
      <StatItem label="Funding" value={fundingRate} />
      <StatItem
        label="Maint. Margin"
        value={bpsToPercent(params.maintenanceMarginBps)}
      />
      <StatItem
        label="Init. Margin"
        value={bpsToPercent(params.initialMarginBps)}
      />
      <StatItem
        label="Trading Fee"
        value={bpsToPercent(params.tradingFeeBps)}
      />
      <div className="h-6 w-px bg-border" />
      <StatItem
        label="Accounts"
        value={`${engine.numUsedAccounts}`}
      />
      <StatItem
        label="Last Crank"
        value={`Slot ${engine.lastCrankSlot.toString()}`}
      />
    </div>
  );
}
