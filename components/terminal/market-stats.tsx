"use client";

import { useMarketData } from "@/hooks/use-market-data";
import { formatTokenAmount, formatPriceE6, bpsToPercent } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function Stat({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "primary" | "default" | "muted";
}) {
  const colorClass =
    variant === "primary"
      ? "text-primary"
      : variant === "muted"
        ? "text-muted-foreground"
        : "text-foreground";

  return (
    <div className="flex flex-col items-start gap-0.5 px-3 py-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className={`font-mono text-[13px] font-semibold leading-none ${colorClass}`}>
        {value}
      </span>
    </div>
  );
}

function Separator() {
  return <div className="h-8 w-px bg-border flex-shrink-0" />;
}

export function MarketStats() {
  const { data, isLoading, error } = useMarketData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center border-b border-border bg-surface px-5 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          Loading market data...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center border-b border-border bg-surface px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-destructive live-dot" />
          <span className="font-mono text-xs text-destructive">
            Failed to load market data -- check RPC connection
          </span>
        </div>
      </div>
    );
  }

  const { engine, params, config } = data;

  const markPrice =
    config.lastEffectivePriceE6 > 0n
      ? formatPriceE6(config.lastEffectivePriceE6)
      : config.authorityPriceE6 > 0n
        ? formatPriceE6(config.authorityPriceE6)
        : "--";

  const fundingRate =
    engine.fundingRateBpsPerSlotLast !== 0n
      ? `${(Number(engine.fundingRateBpsPerSlotLast) / 100).toFixed(4)}%`
      : "0.00%";

  return (
    <div className="flex items-center overflow-x-auto border-b border-border bg-surface">
      <div className="flex items-center gap-0 px-2 py-1">
        <div className="flex items-center gap-1.5 px-3">
          <span className="h-1.5 w-1.5 rounded-full bg-long live-dot" />
          <span className="font-mono text-[10px] text-muted-foreground">LIVE</span>
        </div>

        <Stat label="Mark Price" value={markPrice} variant="primary" />
        <Separator />
        <Stat
          label="Open Interest"
          value={formatTokenAmount(engine.totalOpenInterest, 9, 2)}
        />
        <Stat
          label="Vault"
          value={`${formatTokenAmount(engine.vault, 9, 4)}`}
        />
        <Stat
          label="Insurance"
          value={formatTokenAmount(engine.insuranceFund.balance, 9, 4)}
        />
        <Separator />
        <Stat label="Funding Rate" value={fundingRate} />
        <Stat label="Init Margin" value={bpsToPercent(params.initialMarginBps)} variant="muted" />
        <Stat label="Maint Margin" value={bpsToPercent(params.maintenanceMarginBps)} variant="muted" />
        <Stat label="Fee" value={bpsToPercent(params.tradingFeeBps)} variant="muted" />
        <Separator />
        <Stat label="Accounts" value={`${engine.numUsedAccounts}`} variant="muted" />
        <Stat
          label="Last Crank"
          value={`Slot ${engine.lastCrankSlot.toString().slice(-6)}`}
          variant="muted"
        />
      </div>
    </div>
  );
}
