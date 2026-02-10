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
  X,
} from "lucide-react";
import { useState } from "react";

function StatusBadge({ status }: { status: TxReceipt["status"] }) {
  const config = {
    confirmed: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      className: "text-long bg-long/10 border-long/20",
      label: "Confirmed",
    },
    failed: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      className: "text-short bg-short/10 border-short/20",
      label: "Failed",
    },
    pending: {
      icon: <Clock className="h-3.5 w-3.5 animate-pulse" />,
      className: "text-accent bg-accent/10 border-accent/20",
      label: "Pending",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function ReceiptItem({ receipt }: { receipt: TxReceipt }) {
  const [expanded, setExpanded] = useState(false);
  const { setSelectedReceipt } = useReceipts();

  const timeStr = new Date(receipt.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-surface-elevated/50"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-foreground">
              {receipt.type}
            </span>
            <StatusBadge status={receipt.status} />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {timeStr}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 px-4 pb-3">
          {/* Signature */}
          {receipt.signature && receipt.signature !== "" && (
            <div className="flex items-center gap-2 rounded-md bg-surface p-2">
              <span className="font-mono text-[10px] text-muted-foreground">Sig</span>
              <span className="flex-1 font-mono text-[10px] text-foreground truncate">
                {shortenAddress(receipt.signature, 8)}
              </span>
              <a
                href={`https://explorer.solana.com/tx/${receipt.signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Slot */}
          {receipt.slot !== undefined && receipt.slot > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">Slot</span>
              <span className="font-mono text-[10px] text-foreground">
                {receipt.slot.toLocaleString()}
              </span>
            </div>
          )}

          {/* Error */}
          {receipt.error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5">
              <span className="font-mono text-[10px] leading-relaxed text-destructive">
                {receipt.error}
              </span>
              {receipt.hint && (
                <span className="mt-1 block font-mono text-[10px] leading-relaxed text-muted-foreground">
                  Hint: {receipt.hint}
                </span>
              )}
            </div>
          )}

          {/* Details */}
          {receipt.details && (
            <div className="flex flex-col gap-1 rounded-md bg-surface p-2">
              {Object.entries(receipt.details).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground capitalize">
                    {k}
                  </span>
                  <span className="font-mono text-[10px] text-foreground">{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Logs */}
          {receipt.logs && receipt.logs.length > 0 && (
            <button
              onClick={() => setSelectedReceipt(receipt)}
              className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <FileCode2 className="h-3.5 w-3.5" />
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
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
            Receipts
          </span>
          {receipts.length > 0 && (
            <span className="rounded-md bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
              {receipts.length}
            </span>
          )}
        </div>
        {receipts.length > 0 && (
          <button
            onClick={clearReceipts}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface border border-border">
              <ScrollText className="h-6 w-6 text-border" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-xs text-muted-foreground">
                No transactions yet
              </span>
              <span className="text-[11px] text-muted-foreground/60">
                Submit a trade or action to see receipts
              </span>
            </div>
          </div>
        ) : (
          receipts.map((r) => <ReceiptItem key={r.id} receipt={r} />)
        )}
      </div>

      {/* Log viewer panel */}
      {selectedReceipt && (
        <div className="border-t border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-foreground">
              Logs: {selectedReceipt.type}
            </span>
            <button
              onClick={() => setSelectedReceipt(null)}
              className="rounded-md p-1 text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto bg-background p-3">
            {selectedReceipt.logs?.map((log, i) => (
              <div
                key={i}
                className="font-mono text-[10px] leading-5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="mr-2 inline-block w-5 text-right text-muted-foreground/40">
                  {i + 1}
                </span>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
