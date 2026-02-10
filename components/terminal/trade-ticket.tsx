"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  createDevnetSDK,
  DEVNET_SLAB,
  DEVNET_ORACLE,
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
} from "lucide-react";

type TradeDirection = "long" | "short";

export function TradeTicket() {
  const wallet = useWallet();
  const { connection } = useConnection();
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
      details: {
        direction,
        size: sizeInput,
        lpIndex: DEVNET_VAMM_LP_INDEX.toString(),
      },
    };
    addReceipt(receipt);

    try {
      const sdk = createDevnetSDK();

      if (!userAccount) {
        setError("No user account found. Initialize your account first.");
        updateReceipt(receiptId, {
          status: "failed",
          error: "No user account",
        });
        setIsSubmitting(false);
        return;
      }

      // Convert size to i128 native units (lamports * 1e9)
      const sizeFloat = parseFloat(sizeInput);
      if (isNaN(sizeFloat) || sizeFloat <= 0) {
        setError("Invalid size");
        updateReceipt(receiptId, { status: "failed", error: "Invalid size" });
        setIsSubmitting(false);
        return;
      }

      const sizeNative =
        BigInt(Math.round(sizeFloat * 1e9)) *
        (direction === "short" ? -1n : 1n);

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
  }, [
    wallet,
    sizeInput,
    direction,
    userAccount,
    addReceipt,
    updateReceipt,
  ]);

  const isConnected = !!wallet.publicKey;
  const hasAccount = !!userAccount;

  return (
    <div className="flex flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-2">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Trade
        </h2>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Direction Toggle */}
        <div className="flex gap-1 rounded-md bg-secondary p-0.5">
          <button
            onClick={() => setDirection("long")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-2 font-mono text-xs font-semibold transition-colors ${
              direction === "long"
                ? "bg-long text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Long
          </button>
          <button
            onClick={() => setDirection("short")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-2 font-mono text-xs font-semibold transition-colors ${
              direction === "short"
                ? "bg-short text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownRight className="h-3.5 w-3.5" />
            Short
          </button>
        </div>

        {/* Size Input */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Size (SOL)
          </label>
          <input
            type="number"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            placeholder="0.00"
            className="rounded-md border border-border bg-input px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Quick size buttons */}
        <div className="flex gap-1.5">
          {["0.01", "0.05", "0.1", "0.5"].map((s) => (
            <button
              key={s}
              onClick={() => setSizeInput(s)}
              className="flex-1 rounded border border-border bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Account Info */}
        {isConnected && hasAccount && userAccount && (
          <div className="rounded-md border border-border bg-secondary p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Your Account #{userAccount.idx}
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">
                  Capital
                </span>
                <span className="font-mono text-xs text-foreground">
                  {(
                    Number(userAccount.account.capital) / 1e9
                  ).toFixed(4)}{" "}
                  SOL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">
                  PnL
                </span>
                <span
                  className={`font-mono text-xs ${
                    userAccount.account.pnl >= 0n
                      ? "text-long"
                      : "text-short"
                  }`}
                >
                  {(Number(userAccount.account.pnl) / 1e9).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">
                  Position
                </span>
                <span
                  className={`font-mono text-xs ${
                    userAccount.account.positionSize > 0n
                      ? "text-long"
                      : userAccount.account.positionSize < 0n
                        ? "text-short"
                        : "text-foreground"
                  }`}
                >
                  {(
                    Number(userAccount.account.positionSize) / 1e9
                  ).toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive" />
            <span className="font-mono text-[10px] text-destructive">
              {error}
            </span>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleTrade}
          disabled={!isConnected || !hasAccount || !sizeInput || isSubmitting}
          className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            direction === "long"
              ? "bg-long text-primary-foreground hover:opacity-90"
              : "bg-short text-white hover:opacity-90"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Submitting...
            </>
          ) : !isConnected ? (
            <>
              <Wallet className="h-3.5 w-3.5" />
              Connect Wallet
            </>
          ) : !hasAccount ? (
            "Init Account First"
          ) : (
            `${direction === "long" ? "Buy" : "Sell"} ${sizeInput || "0"} SOL`
          )}
        </button>
      </div>
    </div>
  );
}
