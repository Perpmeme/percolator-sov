"use client";

import { useNetwork } from "@/components/providers/network-context";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Activity,
  FlaskConical,
  Globe,
  Wifi,
  WifiOff,
} from "lucide-react";
import { shortenAddress } from "@/lib/utils";

export function TerminalHeader() {
  const { network, setNetwork, isDevnet, isMainnet } = useNetwork();
  const { publicKey, connected } = useWallet();

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-5 py-2.5">
      {/* Left: branding */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-sm font-bold tracking-tight text-foreground leading-none">
              PERCOLATOR
            </span>
            <span className="font-mono text-[10px] text-muted-foreground leading-none mt-0.5">
              SOL-PERP TERMINAL
            </span>
          </div>
        </div>

        <div className="hidden md:flex h-5 w-px bg-border" />

        {/* Connection status */}
        <div className="hidden md:flex items-center gap-2">
          {connected ? (
            <>
              <Wifi className="h-3 w-3 text-long" />
              <span className="font-mono text-[11px] text-muted-foreground">
                {publicKey ? shortenAddress(publicKey.toBase58(), 4) : ""}
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[11px] text-muted-foreground">
                Not connected
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: network toggle + wallet */}
      <div className="flex items-center gap-3">
        {/* Network toggle */}
        <div className="flex items-center rounded-lg bg-surface p-1 border border-border">
          <button
            onClick={() => setNetwork("devnet")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
              isDevnet
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Devnet</span>
          </button>
          <button
            onClick={() => setNetwork("mainnet")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
              isMainnet
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mainnet</span>
          </button>
        </div>

        <WalletMultiButton />
      </div>
    </header>
  );
}
