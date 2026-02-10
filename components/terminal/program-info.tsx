"use client";

import { useMarketData } from "@/hooks/use-market-data";
import { shortenAddress } from "@/lib/utils";
import { DEVNET_SLAB, DEVNET_PROGRAM_ID, DEVNET_MATCHER_PROGRAM_ID, DEVNET_ORACLE } from "@/lib/percolator-sdk";
import { ExternalLink, Cpu, Database, Eye } from "lucide-react";

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[10px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-mono text-[10px] text-foreground">{value}</span>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
          >
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export function ProgramInfo() {
  const { data } = useMarketData();

  const explorerBase = "https://explorer.solana.com";
  const cluster = "?cluster=devnet";

  return (
    <div className="flex flex-col gap-3 border-t border-border p-4">
      <div className="flex items-center gap-1.5">
        <Cpu className="h-3 w-3 text-muted-foreground" />
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Program Info
        </h3>
      </div>

      <div className="flex flex-col gap-1.5">
        <InfoRow
          label="Program"
          value={shortenAddress(DEVNET_PROGRAM_ID.toBase58(), 4)}
          href={`${explorerBase}/address/${DEVNET_PROGRAM_ID.toBase58()}${cluster}`}
        />
        <InfoRow
          label="Matcher"
          value={shortenAddress(DEVNET_MATCHER_PROGRAM_ID.toBase58(), 4)}
          href={`${explorerBase}/address/${DEVNET_MATCHER_PROGRAM_ID.toBase58()}${cluster}`}
        />
        <InfoRow
          label="Slab"
          value={shortenAddress(DEVNET_SLAB.toBase58(), 4)}
          href={`${explorerBase}/address/${DEVNET_SLAB.toBase58()}${cluster}`}
        />
        <InfoRow
          label="Oracle"
          value={shortenAddress(DEVNET_ORACLE.toBase58(), 4)}
          href={`${explorerBase}/address/${DEVNET_ORACLE.toBase58()}${cluster}`}
        />
        {data?.config && (
          <>
            <InfoRow
              label="Collateral"
              value={shortenAddress(data.config.collateralMint.toBase58(), 4)}
              href={`${explorerBase}/address/${data.config.collateralMint.toBase58()}${cluster}`}
            />
            <InfoRow
              label="Vault"
              value={shortenAddress(data.config.vaultPubkey.toBase58(), 4)}
              href={`${explorerBase}/address/${data.config.vaultPubkey.toBase58()}${cluster}`}
            />
          </>
        )}
      </div>

      {data?.header && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Database className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Slab State
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <InfoRow label="Version" value={data.header.version.toString()} />
            <InfoRow label="Nonce" value={data.header.nonce.toString()} />
            <InfoRow
              label="Resolved"
              value={data.header.resolved ? "Yes" : "No"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
