"use client";

import { useReceipts, type TxReceipt } from "@/components/providers/receipts-context";
import { shortenAddress } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronRight,
  ScrollText,
  FileCode2,
} from "lucide-react";
import { useState } from "react";

function StatusIcon({ status }: { status: TxReceipt["status"] }) {
  switch (status) {
    case "confirmed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-long" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-short" />;
    case "pending":
      return <Clock className="h-3.5 w-3.5 animate-pulse text-accent" />;
  }
}

function ReceiptItem({ receipt }: { receipt: TxReceipt }) {
  const [expanded, setExpanded] = useState(false);
  const { setSelectedReceipt } = useReceipts();

  const timeStr = new Date(receipt.timestamp).toLocaleTimeString();

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary/50"
      >
        <StatusIcon status={receipt.status} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-mono text-xs font-medium text-foreground">
            {receipt.type}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {timeStr}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-1.5 px-3 pb-3">
          {/* Signature */}
          {receipt.signature && receipt.signature !== "" && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">
                Sig:
              </span>
              <span className="font-mono text-[10px] text-foreground">
                {shortenAddress(receipt.signature, 8)}
              </span>
              <a
                href={`https://explorer.solana.com/tx/${receipt.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Slot */}
          {receipt.slot !== undefined && receipt.slot > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">
                Slot:
              </span>
              <span className="font-mono text-[10px] text-foreground">
                {receipt.slot}
              </span>
            </div>
          )}

          {/* Error */}
          {receipt.error && (
            <div className="rounded border border-destructive/20 bg-destructive/5 p-2">
              <span className="font-mono text-[10px] text-destructive">
                {receipt.error}
              </span>
              {receipt.hint && (
                <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                  {receipt.hint}
                </span>
              )}
            </div>
          )}

          {/* Details */}
          {receipt.details && (
            <div className="flex flex-col gap-0.5">
              {Object.entries(receipt.details).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {k}:
                  </span>
                  <span className="font-mono text-[10px] text-foreground">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Logs button */}
          {receipt.logs && receipt.logs.length > 0 && (
            <button
              onClick={() => setSelectedReceipt(receipt)}
              className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-primary hover:text-primary/80"
            >
              <FileCode2 className="h-3 w-3" />
              View {receipt.logs.length} log lines
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ReceiptsSidebar() {
  const { receipts, clearReceipts, selectedReceipt, setSelectedReceipt } =
    useReceipts();

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Receipts
          </span>
          {receipts.length > 0 && (
            <span className="rounded bg-secondary px-1 font-mono text-[10px] text-muted-foreground">
              {receipts.length}
            </span>
          )}
        </div>
        {receipts.length > 0 && (
          <button
            onClick={clearReceipts}
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Receipts list */}
      <div className="flex-1 overflow-y-auto">
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
            <ScrollText className="h-8 w-8 text-border" />
            <span className="font-mono text-xs text-muted-foreground">
              No transactions yet
            </span>
          </div>
        ) : (
          receipts.map((r) => <ReceiptItem key={r.id} receipt={r} />)
        )}
      </div>

      {/* Log viewer modal */}
      {selectedReceipt && (
        <div className="border-t border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Logs: {selectedReceipt.type}
            </span>
            <button
              onClick={() => setSelectedReceipt(null)}
              className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto bg-background p-2">
            {selectedReceipt.logs?.map((log, i) => (
              <div
                key={i}
                className="font-mono text-[10px] leading-relaxed text-muted-foreground"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
