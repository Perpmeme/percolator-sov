"use client";

import { useNetwork } from "@/components/providers/network-context";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Activity, FlaskConical, Globe } from "lucide-react";

export function TerminalHeader() {
  const { network, setNetwork, isDevnet, isMainnet } = useNetwork();

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-mono text-sm font-bold tracking-tight text-foreground">
            PERCOLATOR
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="font-mono text-xs text-muted-foreground">
          SOL-PERP
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Network switcher */}
        <div className="flex items-center rounded-md bg-secondary p-0.5">
          <button
            onClick={() => setNetwork("devnet")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
              isDevnet
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FlaskConical className="h-3 w-3" />
            Devnet
          </button>
          <button
            onClick={() => setNetwork("mainnet")}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
              isMainnet
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3 w-3" />
            Mainnet
          </button>
        </div>

        <WalletMultiButton />
      </div>
    </header>
  );
}
