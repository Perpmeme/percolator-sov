"use client";

import { useMarketData } from "@/hooks/use-market-data";
import { shortenAddress } from "@/lib/utils";
import {
  DEVNET_SLAB,
  DEVNET_PROGRAM_ID,
  DEVNET_MATCHER_PROGRAM_ID,
  DEVNET_ORACLE,
} from "@/lib/percolator-sdk";
import { ExternalLink, Cpu, Database } from "lucide-react";

function AddressRow({
  label,
  pubkey,
  cluster = "devnet",
}: {
  label: string;
  pubkey: string;
  cluster?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 group">
      <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-foreground/80 group-hover:text-foreground transition-colors">
          {shortenAddress(pubkey, 4)}
        </span>
        <a
          href={`https://explorer.solana.com/address/${pubkey}?cluster=${cluster}`}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 text-primary hover:text-primary/80 transition-all"
        >
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}

export function ProgramInfo() {
  const { data } = useMarketData();

  return (
    <div className="flex flex-col border-t border-border">
      {/* Program section */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Cpu className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
          Program
        </h3>
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <AddressRow label="Program" pubkey={DEVNET_PROGRAM_ID.toBase58()} />
        <AddressRow label="Matcher" pubkey={DEVNET_MATCHER_PROGRAM_ID.toBase58()} />
        <AddressRow label="Slab" pubkey={DEVNET_SLAB.toBase58()} />
        <AddressRow label="Oracle" pubkey={DEVNET_ORACLE.toBase58()} />
        {data?.config && (
          <>
            <AddressRow
              label="Collateral"
              pubkey={data.config.collateralMint.toBase58()}
            />
            <AddressRow
              label="Vault"
              pubkey={data.config.vaultPubkey.toBase58()}
            />
          </>
        )}
      </div>

      {/* Slab state */}
      {data?.header && (
        <>
          <div className="flex items-center gap-2 px-4 py-3 border-t border-b border-border">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
              Slab State
            </h3>
          </div>
          <div className="flex flex-col gap-1.5 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">Version</span>
              <span className="font-mono text-[10px] text-foreground">
                {data.header.version.toString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">Nonce</span>
              <span className="font-mono text-[10px] text-foreground">
                {data.header.nonce.toString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">Status</span>
              <span
                className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold ${
                  data.header.resolved ? "text-accent" : "text-long"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    data.header.resolved ? "bg-accent" : "bg-long"
                  }`}
                />
                {data.header.resolved ? "Resolved" : "Active"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
