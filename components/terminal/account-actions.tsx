"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  createDevnetSDK,
  DEVNET_SLAB,
  DEVNET_ORACLE,
} from "@/lib/percolator-sdk";
import { useUserAccount } from "@/hooks/use-market-data";
import {
  useReceipts,
  type TxReceipt,
} from "@/components/providers/receipts-context";
import {
  UserPlus,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Loader2,
} from "lucide-react";

type ActionType = "init" | "deposit" | "withdraw" | "crank";

export function AccountActions() {
  const wallet = useWallet();
  const { data: userAccount, mutate } = useUserAccount(
    wallet.publicKey ?? null
  );
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
          case "init": {
            // Fee is new_account_fee from params (read from slab), we pass 0 for devnet
            tx = await sdk.buildInitUserTx(wallet.publicKey, DEVNET_SLAB, 0n);
            break;
          }
          case "deposit": {
            if (!userAccount) throw new Error("No user account");
            const amt = BigInt(
              Math.round(parseFloat(amountInput) * 1e9)
            );
            tx = await sdk.buildDepositTx(
              wallet.publicKey,
              DEVNET_SLAB,
              userAccount.idx,
              amt
            );
            break;
          }
          case "withdraw": {
            if (!userAccount) throw new Error("No user account");
            const amt = BigInt(
              Math.round(parseFloat(amountInput) * 1e9)
            );
            tx = await sdk.buildWithdrawTx(
              wallet.publicKey,
              DEVNET_SLAB,
              userAccount.idx,
              amt
            );
            break;
          }
          case "crank": {
            tx = await sdk.buildCrankTx(
              wallet.publicKey,
              DEVNET_SLAB,
              DEVNET_ORACLE,
              400_000
            );
            break;
          }
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
    <div className="flex flex-col gap-3 border-t border-border p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Account Actions
      </h3>

      {/* Amount input for deposit/withdraw */}
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Amount (SOL)
        </label>
        <input
          type="number"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          placeholder="0.00"
          className="rounded-md border border-border bg-input px-3 py-1.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        {!hasAccount && (
          <button
            onClick={() => executeAction("init")}
            disabled={!isConnected || activeAction !== null}
            className="col-span-2 flex items-center justify-center gap-1.5 rounded-md border border-primary bg-primary/10 px-3 py-2 font-mono text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {activeAction === "init" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserPlus className="h-3.5 w-3.5" />
            )}
            Init Account
          </button>
        )}
        <button
          onClick={() => executeAction("deposit")}
          disabled={!isConnected || !hasAccount || !amountInput || activeAction !== null}
          className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
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
          className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {activeAction === "withdraw" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowUpFromLine className="h-3.5 w-3.5" />
          )}
          Withdraw
        </button>
        <button
          onClick={() => executeAction("crank")}
          disabled={!isConnected || activeAction !== null}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
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
