"use client";

import { Globe, ArrowRight, FlaskConical } from "lucide-react";
import { useNetwork } from "@/components/providers/network-context";

export function MainnetView() {
  const { setNetwork } = useNetwork();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-8">
      <div className="flex max-w-lg flex-col items-center gap-6">
        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-border">
          <Globe className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-balance text-center font-mono text-xl font-bold text-foreground">
            Mainnet / Drift Integration
          </h2>
          <p className="text-pretty text-center text-sm leading-relaxed text-muted-foreground">
            The mainnet mode will integrate with Drift Protocol for live
            perpetual futures trading on Solana mainnet-beta. This feature is
            under active development.
          </p>
        </div>

        {/* Roadmap items */}
        <div className="w-full rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-3">
            {[
              { label: "Drift SDK integration", active: true },
              { label: "Mainnet market data feeds", active: false },
              { label: "Cross-margin position management", active: false },
              { label: "Advanced order types", active: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    item.active ? "bg-accent live-dot" : "bg-border"
                  }`}
                />
                <span
                  className={`font-mono text-xs ${
                    item.active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
                {item.active && (
                  <span className="rounded-md bg-accent/10 border border-accent/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
                    IN PROGRESS
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Switch to devnet */}
        <button
          onClick={() => setNetwork("devnet")}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-mono text-sm font-bold text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/20 glow-primary"
        >
          <FlaskConical className="h-4 w-4" />
          Switch to Devnet Terminal
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
