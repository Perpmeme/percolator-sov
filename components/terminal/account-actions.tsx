"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  createDevnetSDK,
  DEVNET_SLAB,
  DEVNET_ORACLE,
} from "@/lib/percolator-sdk";
import { useUserAccount } from "@/hooks/use-market-data";
import { useReceipts, type TxReceipt } from "@/components/providers/receipts-context";
import {
  UserPlus,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Loader2,
  Settings,
} from "lucide-react";

type ActionType = "init" | "deposit" | "withdraw" | "crank";

export function AccountActions() {
  const wallet = useWallet();
  const { data: userAccount, mutate } = useUserAccount(wallet.publicKey ?? null);
  const { addReceipt, updateReceipt } = useReceipts();

  const [amountInput, setAmountInput] = useState("");
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);

  const executeAction = useCallback(
    async (action: ActionType) => {
      if (!wallet.publicKey) return;
      setActiveAction(action);

      const receiptId = `${action}-${Date.now()}`;
      const receipt: TxReceipt = {
        id: receiptId,
        timestamp: Date.now(),
        type: action.toUpperCase(),
        signature: "",
        status: "pending",
        details: action !== "crank" ? { amount: amountInput } : undefined,
      };
      addReceipt(receipt);

      try {
        const sdk = createDevnetSDK();
        let tx;

        switch (action) {
          case "init":
            tx = await sdk.buildInitUserTx(wallet.publicKey, DEVNET_SLAB, 0n);
            break;
          case "deposit": {
            if (!userAccount) throw new Error("No user account");
            const dAmt = BigInt(Math.round(parseFloat(amountInput) * 1e9));
            tx = await sdk.buildDepositTx(wallet.publicKey, DEVNET_SLAB, userAccount.idx, dAmt);
            break;
          }
          case "withdraw": {
            if (!userAccount) throw new Error("No user account");
            const wAmt = BigInt(Math.round(parseFloat(amountInput) * 1e9));
            tx = await sdk.buildWithdrawTx(wallet.publicKey, DEVNET_SLAB, userAccount.idx, wAmt);
            break;
          }
          case "crank":
            tx = await sdk.buildCrankTx(wallet.publicKey, DEVNET_SLAB, DEVNET_ORACLE, 400_000);
            break;
        }

        const result = await sdk.sendTransaction(wallet, tx);
        updateReceipt(receiptId, {
          signature: result.signature,
          slot: result.slot,
          status: result.err ? "failed" : "confirmed",
          error: result.err ?? undefined,
          hint: result.hint,
          logs: result.logs,
        });

        if (!result.err) {
          setAmountInput("");
          mutate();
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        updateReceipt(receiptId, { status: "failed", error: msg });
      } finally {
        setActiveAction(null);
      }
    },
    [wallet, amountInput, userAccount, addReceipt, updateReceipt, mutate]
  );

  const isConnected = !!wallet.publicKey;
  const hasAccount = !!userAccount;

  return (
    <div className="flex flex-col border-t border-border">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
          Account
        </h3>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Init button when no account */}
        {!hasAccount && isConnected && (
          <button
            onClick={() => executeAction("init")}
            disabled={activeAction !== null}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 font-mono text-xs font-bold text-primary uppercase tracking-wider transition-all hover:border-primary/60 hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {activeAction === "init" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Initialize Account
          </button>
        )}

        {/* Amount input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Amount
            </label>
            <span className="font-mono text-[11px] text-muted-foreground">SOL</span>
          </div>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => executeAction("deposit")}
            disabled={!isConnected || !hasAccount || !amountInput || activeAction !== null}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-xs font-semibold text-foreground transition-all hover:border-long/50 hover:bg-long/5 hover:text-long disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {activeAction === "deposit" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowDownToLine className="h-3.5 w-3.5" />
            )}
            Deposit
          </button>
          <button
            onClick={() => executeAction("withdraw")}
            disabled={!isConnected || !hasAccount || !amountInput || activeAction !== null}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-xs font-semibold text-foreground transition-all hover:border-accent/50 hover:bg-accent/5 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {activeAction === "withdraw" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowUpFromLine className="h-3.5 w-3.5" />
            )}
            Withdraw
          </button>
        </div>

        {/* Crank */}
        <button
          onClick={() => executeAction("crank")}
          disabled={!isConnected || activeAction !== null}
          className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-xs font-semibold text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {activeAction === "crank" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          Keeper Crank
        </button>
      </div>
    </div>
  );
}
