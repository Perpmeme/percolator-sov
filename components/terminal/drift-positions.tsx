"use client";

import { useState, useCallback } from "react";
import { useDrift } from "@/components/providers/drift-provider";
import { useReceipts, type TxReceipt } from "@/components/providers/receipts-context";
import { closeDriftPosition, depositToDrift, withdrawFromDrift } from "@/lib/drift-sdk";
import {
  BarChart3,
  X,
  TrendingUp,
  TrendingDown,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { formatUsd } from "@/lib/utils";

export function DriftPositions() {
  const { client, account, refreshAccount } = useDrift();
  const { addReceipt, updateReceipt } = useReceipts();
  const [closingIndex, setClosingIndex] = useState<number | null>(null);

  const handleClose = useCallback(
    async (marketIndex: number) => {
      if (!client) return;
      setClosingIndex(marketIndex);
      const receiptId = `drift-close-${Date.now()}`;
      const receipt: TxReceipt = {
        id: receiptId,
        timestamp: Date.now(),
        type: `Close Position`,
        signature: "",
        status: "pending",
        details: { marketIndex },
      };
      addReceipt(receipt);

      try {
        const txSig = await closeDriftPosition(client, marketIndex);
        updateReceipt(receiptId, { signature: txSig, status: "confirmed" });
        refreshAccount();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        updateReceipt(receiptId, { status: "failed", error: msg });
      } finally {
        setClosingIndex(null);
      }
    },
    [client, addReceipt, updateReceipt, refreshAccount]
  );

  const positions = account?.positions ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
          Positions
        </h2>
        <span className="ml-auto rounded-md bg-surface border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {positions.length} open
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 gap-3">
            <BarChart3 className="h-8 w-8 text-border" />
            <span className="font-mono text-xs text-muted-foreground">
              No open positions
            </span>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                {["Market", "Side", "Size", "Entry", "Mark", "PnL", "Liq. Price", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-3 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr
                  key={pos.marketIndex}
                  className="border-b border-border/50 transition-colors hover:bg-surface/50"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-semibold text-foreground">
                    {pos.symbol}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        pos.direction === "long"
                          ? "bg-long/10 text-long border border-long/20"
                          : "bg-short/10 text-short border border-short/20"
                      }`}
                    >
                      {pos.direction === "long" ? (
                        <TrendingUp className="h-2.5 w-2.5" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5" />
                      )}
                      {pos.direction}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-foreground">
                    {Math.abs(pos.baseAssetAmount).toFixed(4)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {formatUsd(pos.entryPrice)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-foreground">
                    {formatUsd(pos.notional / Math.abs(pos.baseAssetAmount || 1))}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 font-mono text-xs font-medium ${
                      pos.unrealizedPnl >= 0 ? "text-long" : "text-short"
                    }`}
                  >
                    {pos.unrealizedPnl >= 0 ? "+" : ""}
                    {formatUsd(pos.unrealizedPnl)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {pos.liquidationPrice ? formatUsd(pos.liquidationPrice) : "--"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <button
                      onClick={() => handleClose(pos.marketIndex)}
                      disabled={closingIndex === pos.marketIndex}
                      className="flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 font-mono text-[10px] text-muted-foreground transition-all hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
                    >
                      {closingIndex === pos.marketIndex ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function DriftAccountActions() {
  const { client, refreshAccount } = useDrift();
  const { addReceipt, updateReceipt } = useReceipts();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = useCallback(async () => {
    if (!client || !depositAmount) return;
    setLoading("deposit");
    setError(null);
    const receiptId = `drift-deposit-${Date.now()}`;
    addReceipt({
      id: receiptId,
      timestamp: Date.now(),
      type: "Drift Deposit",
      signature: "",
      status: "pending",
      details: { amount: depositAmount },
    });

    try {
      const amt = parseFloat(depositAmount);
      if (isNaN(amt) || amt <= 0) throw new Error("Invalid amount");
      const txSig = await depositToDrift(client, amt);
      updateReceipt(receiptId, { signature: txSig, status: "confirmed" });
      setDepositAmount("");
      refreshAccount();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      updateReceipt(receiptId, { status: "failed", error: msg });
    } finally {
      setLoading(null);
    }
  }, [client, depositAmount, addReceipt, updateReceipt, refreshAccount]);

  const handleWithdraw = useCallback(async () => {
    if (!client || !withdrawAmount) return;
    setLoading("withdraw");
    setError(null);
    const receiptId = `drift-withdraw-${Date.now()}`;
    addReceipt({
      id: receiptId,
      timestamp: Date.now(),
      type: "Drift Withdraw",
      signature: "",
      status: "pending",
      details: { amount: withdrawAmount },
    });

    try {
      const amt = parseFloat(withdrawAmount);
      if (isNaN(amt) || amt <= 0) throw new Error("Invalid amount");
      const txSig = await withdrawFromDrift(client, amt);
      updateReceipt(receiptId, { signature: txSig, status: "confirmed" });
      setWithdrawAmount("");
      refreshAccount();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      updateReceipt(receiptId, { status: "failed", error: msg });
    } finally {
      setLoading(null);
    }
  }, [client, withdrawAmount, addReceipt, updateReceipt, refreshAccount]);

  return (
    <div className="flex flex-col border-t border-border">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <ArrowDownToLine className="h-4 w-4 text-primary" />
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
          Deposit / Withdraw USDC
        </h2>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* Deposit */}
        <div className="flex gap-2">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="USDC amount"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleDeposit}
            disabled={!client || !depositAmount || loading === "deposit"}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-mono text-xs font-bold text-primary-foreground transition-all hover:shadow-lg disabled:opacity-30"
          >
            {loading === "deposit" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowDownToLine className="h-3.5 w-3.5" />
            )}
            Deposit
          </button>
        </div>

        {/* Withdraw */}
        <div className="flex gap-2">
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="USDC amount"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleWithdraw}
            disabled={!client || !withdrawAmount || loading === "withdraw"}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs font-bold text-foreground transition-all hover:border-primary/50 disabled:opacity-30"
          >
            {loading === "withdraw" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowUpFromLine className="h-3.5 w-3.5" />
            )}
            Withdraw
          </button>
        </div>

        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>
    </div>
  );
}
