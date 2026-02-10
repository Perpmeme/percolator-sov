"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  createDevnetSDK,
  DEVNET_SLAB,
  DEVNET_VAMM_LP_INDEX,
  DEVNET_MATCHER_PROGRAM_ID,
  DEVNET_VAMM_MATCHER_CONTEXT,
} from "@/lib/percolator-sdk";
import { useUserAccount } from "@/hooks/use-market-data";
import { useReceipts, type TxReceipt } from "@/components/providers/receipts-context";
import {
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Wallet,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type TradeDirection = "long" | "short";

export function TradeTicket() {
  const wallet = useWallet();
  const { data: userAccount } = useUserAccount(wallet.publicKey ?? null);
  const { addReceipt, updateReceipt } = useReceipts();

  const [direction, setDirection] = useState<TradeDirection>("long");
  const [sizeInput, setSizeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrade = useCallback(async () => {
    if (!wallet.publicKey || !sizeInput) return;

    setError(null);
    setIsSubmitting(true);

    const receiptId = `trade-${Date.now()}`;
    const receipt: TxReceipt = {
      id: receiptId,
      timestamp: Date.now(),
      type: `Trade ${direction.toUpperCase()}`,
      signature: "",
      status: "pending",
      details: { direction, size: sizeInput, lpIndex: DEVNET_VAMM_LP_INDEX.toString() },
    };
    addReceipt(receipt);

    try {
      const sdk = createDevnetSDK();

      if (!userAccount) {
        setError("No user account found. Initialize your account first.");
        updateReceipt(receiptId, { status: "failed", error: "No user account" });
        setIsSubmitting(false);
        return;
      }

      const sizeFloat = parseFloat(sizeInput);
      if (isNaN(sizeFloat) || sizeFloat <= 0) {
        setError("Enter a valid size");
        updateReceipt(receiptId, { status: "failed", error: "Invalid size" });
        setIsSubmitting(false);
        return;
      }

      const sizeNative =
        BigInt(Math.round(sizeFloat * 1e9)) * (direction === "short" ? -1n : 1n);

      const tx = await sdk.buildTradeCpiTx(
        wallet.publicKey,
        DEVNET_SLAB,
        DEVNET_VAMM_LP_INDEX,
        userAccount.idx,
        sizeNative,
        DEVNET_MATCHER_PROGRAM_ID,
        DEVNET_VAMM_MATCHER_CONTEXT
      );

      const result = await sdk.sendTransaction(wallet, tx);

      updateReceipt(receiptId, {
        signature: result.signature,
        slot: result.slot,
        status: result.err ? "failed" : "confirmed",
        error: result.err ?? undefined,
        hint: result.hint,
        logs: result.logs,
      });

      if (result.err) {
        setError(result.hint ?? result.err);
      } else {
        setSizeInput("");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      updateReceipt(receiptId, { status: "failed", error: msg });
    } finally {
      setIsSubmitting(false);
    }
  }, [wallet, sizeInput, direction, userAccount, addReceipt, updateReceipt]);

  const isConnected = !!wallet.publicKey;
  const hasAccount = !!userAccount;

  return (
    <div className="flex flex-col">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
          Trade
        </h2>
      </div>

      <div className="flex flex-col gap-5 p-4">
        {/* Direction Toggle */}
        <div className="flex rounded-lg bg-surface p-1 border border-border">
          <button
            onClick={() => setDirection("long")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
              direction === "long"
                ? "bg-long text-primary-foreground shadow-sm glow-long"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            Long
          </button>
          <button
            onClick={() => setDirection("short")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
              direction === "short"
                ? "bg-short text-destructive-foreground shadow-sm glow-short"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownRight className="h-4 w-4" />
            Short
          </button>
        </div>

        {/* Size Input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Size
            </label>
            <span className="font-mono text-[11px] text-muted-foreground">SOL</span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
        </div>

        {/* Quick size */}
        <div className="grid grid-cols-4 gap-1.5">
          {["0.01", "0.05", "0.1", "0.5"].map((s) => (
            <button
              key={s}
              onClick={() => setSizeInput(s)}
              className="rounded-md border border-border bg-surface py-1.5 font-mono text-[11px] text-muted-foreground transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Account summary card */}
        {isConnected && hasAccount && userAccount && (
          <div className="rounded-lg border border-border bg-surface p-3.5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Account #{userAccount.idx}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-long" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Capital</span>
                <span className="font-mono text-xs font-medium text-foreground">
                  {(Number(userAccount.account.capital) / 1e9).toFixed(4)} SOL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">PnL</span>
                <span
                  className={`font-mono text-xs font-medium ${
                    userAccount.account.pnl >= 0n ? "text-long" : "text-short"
                  }`}
                >
                  {userAccount.account.pnl >= 0n ? "+" : ""}
                  {(Number(userAccount.account.pnl) / 1e9).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Position</span>
                <span
                  className={`inline-flex items-center gap-1 font-mono text-xs font-medium ${
                    userAccount.account.positionSize > 0n
                      ? "text-long"
                      : userAccount.account.positionSize < 0n
                        ? "text-short"
                        : "text-muted-foreground"
                  }`}
                >
                  {userAccount.account.positionSize > 0n && (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {userAccount.account.positionSize < 0n && (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {(Number(userAccount.account.positionSize) / 1e9).toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive" />
            <span className="text-xs text-destructive leading-relaxed">{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleTrade}
          disabled={!isConnected || !hasAccount || !sizeInput || isSubmitting}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
            direction === "long"
              ? "bg-long text-primary-foreground hover:shadow-lg hover:shadow-long/20 glow-long"
              : "bg-short text-destructive-foreground hover:shadow-lg hover:shadow-short/20 glow-short"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : !isConnected ? (
            <>
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </>
          ) : !hasAccount ? (
            "Initialize Account First"
          ) : (
            `${direction === "long" ? "Buy" : "Sell"} ${sizeInput || "0"} SOL-PERP`
          )}
        </button>
      </div>
    </div>
  );
}
