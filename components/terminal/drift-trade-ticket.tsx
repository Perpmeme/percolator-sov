"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDrift } from "@/components/providers/drift-provider";
import { useReceipts, type TxReceipt } from "@/components/providers/receipts-context";
import {
  placeDriftPerpOrder,
  placeDriftLimitOrder,
} from "@/lib/drift-sdk";
import {
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Wallet,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { formatUsd } from "@/lib/utils";

type TradeDirection = "long" | "short";
type OrderKind = "market" | "limit";

interface DriftTradeTicketProps {
  selectedMarketIndex: number;
}

export function DriftTradeTicket({ selectedMarketIndex }: DriftTradeTicketProps) {
  const wallet = useWallet();
  const { client, account, markets } = useDrift();
  const { addReceipt, updateReceipt } = useReceipts();

  const [direction, setDirection] = useState<TradeDirection>("long");
  const [orderKind, setOrderKind] = useState<OrderKind>("market");
  const [sizeInput, setSizeInput] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMarket = markets.find(
    (m) => m.marketIndex === selectedMarketIndex
  );

  const handleTrade = useCallback(async () => {
    if (!wallet.publicKey || !client || !sizeInput) return;

    setError(null);
    setIsSubmitting(true);

    const receiptId = `drift-trade-${Date.now()}`;
    const receipt: TxReceipt = {
      id: receiptId,
      timestamp: Date.now(),
      type: `Drift ${direction.toUpperCase()} ${orderKind}`,
      signature: "",
      status: "pending",
      details: {
        direction,
        size: sizeInput,
        market: selectedMarket?.symbol ?? `PERP-${selectedMarketIndex}`,
        orderKind,
      },
    };
    addReceipt(receipt);

    try {
      const sizeFloat = parseFloat(sizeInput);
      if (isNaN(sizeFloat) || sizeFloat <= 0) {
        setError("Enter a valid size");
        updateReceipt(receiptId, { status: "failed", error: "Invalid size" });
        setIsSubmitting(false);
        return;
      }

      let txSig: string;
      if (orderKind === "limit") {
        const price = parseFloat(limitPrice);
        if (isNaN(price) || price <= 0) {
          setError("Enter a valid limit price");
          updateReceipt(receiptId, { status: "failed", error: "Invalid limit price" });
          setIsSubmitting(false);
          return;
        }
        txSig = await placeDriftLimitOrder(
          client,
          selectedMarketIndex,
          direction,
          sizeFloat,
          price
        );
      } else {
        txSig = await placeDriftPerpOrder(
          client,
          selectedMarketIndex,
          direction,
          sizeFloat
        );
      }

      updateReceipt(receiptId, {
        signature: txSig,
        status: "confirmed",
      });
      setSizeInput("");
      setLimitPrice("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      updateReceipt(receiptId, { status: "failed", error: msg });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    wallet,
    client,
    sizeInput,
    direction,
    orderKind,
    limitPrice,
    selectedMarketIndex,
    selectedMarket,
    addReceipt,
    updateReceipt,
  ]);

  const isConnected = !!wallet.publicKey;
  const hasClient = !!client;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
          Trade
        </h2>
        {selectedMarket && (
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {formatUsd(selectedMarket.oraclePrice)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Direction toggle */}
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

        {/* Order kind toggle */}
        <div className="flex rounded-lg bg-surface p-1 border border-border">
          <button
            onClick={() => setOrderKind("market")}
            className={`flex flex-1 items-center justify-center rounded-md py-1.5 font-mono text-[11px] font-semibold transition-all ${
              orderKind === "market"
                ? "bg-secondary text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Market
          </button>
          <button
            onClick={() => setOrderKind("limit")}
            className={`flex flex-1 items-center justify-center rounded-md py-1.5 font-mono text-[11px] font-semibold transition-all ${
              orderKind === "limit"
                ? "bg-secondary text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Limit
          </button>
        </div>

        {/* Size */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Size (Base)
            </label>
            <span className="font-mono text-[11px] text-muted-foreground">
              {selectedMarket?.symbol ?? "PERP"}
            </span>
          </div>
          <input
            type="number"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>

        {/* Quick size */}
        <div className="grid grid-cols-4 gap-1.5">
          {["0.1", "0.5", "1", "5"].map((s) => (
            <button
              key={s}
              onClick={() => setSizeInput(s)}
              className="rounded-md border border-border bg-surface py-1.5 font-mono text-[11px] text-muted-foreground transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Limit price (if limit order) */}
        {orderKind === "limit" && (
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Limit Price (USD)
            </label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={selectedMarket ? formatUsd(selectedMarket.oraclePrice) : "0.00"}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
        )}

        {/* Account summary */}
        {isConnected && account && (
          <div className="rounded-lg border border-border bg-surface p-3.5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Drift Account
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-long" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Collateral</span>
                <span className="font-mono text-xs font-medium text-foreground">
                  {formatUsd(account.totalCollateral)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Free</span>
                <span className="font-mono text-xs font-medium text-foreground">
                  {formatUsd(account.freeCollateral)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Unrealized PnL</span>
                <span
                  className={`font-mono text-xs font-medium ${
                    account.unrealizedPnl >= 0 ? "text-long" : "text-short"
                  }`}
                >
                  {account.unrealizedPnl >= 0 ? "+" : ""}
                  {formatUsd(account.unrealizedPnl)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Leverage</span>
                <span className="font-mono text-xs font-medium text-foreground">
                  {account.leverage.toFixed(2)}x
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
          disabled={!isConnected || !hasClient || !sizeInput || isSubmitting}
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
          ) : !hasClient ? (
            "Initializing Drift..."
          ) : (
            `${direction === "long" ? "Buy" : "Sell"} ${sizeInput || "0"} ${selectedMarket?.symbol ?? "PERP"}`
          )}
        </button>
      </div>
    </div>
  );
}
