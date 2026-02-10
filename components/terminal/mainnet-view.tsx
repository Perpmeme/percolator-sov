"use client";

import { Globe, Construction } from "lucide-react";

export function MainnetView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background p-8">
      <div className="flex items-center gap-3">
        <Globe className="h-10 w-10 text-muted-foreground" />
        <Construction className="h-10 w-10 text-accent" />
      </div>
      <h2 className="text-balance text-center font-mono text-lg font-bold text-foreground">
        Mainnet / Drift Integration
      </h2>
      <p className="max-w-md text-pretty text-center font-mono text-sm text-muted-foreground">
        The mainnet mode integrates with Drift Protocol for live perpetual
        futures trading on Solana mainnet-beta. This mode is currently under
        development.
      </p>
      <div className="mt-4 rounded-md border border-border bg-card px-6 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-mono text-xs text-muted-foreground">
              Drift SDK integration in progress
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">
              Mainnet market data feeds
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">
              Cross-margin position management
            </span>
          </div>
        </div>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        Switch to{" "}
        <span className="font-semibold text-primary">Devnet</span> to use the
        Percolator protocol terminal.
      </p>
    </div>
  );
}
