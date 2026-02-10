"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface TxReceipt {
  id: string;
  timestamp: number;
  type: string;
  signature: string;
  status: "pending" | "confirmed" | "failed";
  slot?: number;
  error?: string;
  hint?: string;
  logs?: string[];
  details?: Record<string, string>;
}

interface ReceiptsContextValue {
  receipts: TxReceipt[];
  addReceipt: (receipt: TxReceipt) => void;
  updateReceipt: (id: string, updates: Partial<TxReceipt>) => void;
  clearReceipts: () => void;
  selectedReceipt: TxReceipt | null;
  setSelectedReceipt: (receipt: TxReceipt | null) => void;
}

const ReceiptsContext = createContext<ReceiptsContextValue | null>(null);

export function useReceipts() {
  const ctx = useContext(ReceiptsContext);
  if (!ctx)
    throw new Error("useReceipts must be used within ReceiptsProvider");
  return ctx;
}

export function ReceiptsProvider({ children }: { children: ReactNode }) {
  const [receipts, setReceipts] = useState<TxReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<TxReceipt | null>(
    null
  );

  const addReceipt = useCallback((receipt: TxReceipt) => {
    setReceipts((prev) => [receipt, ...prev]);
  }, []);

  const updateReceipt = useCallback(
    (id: string, updates: Partial<TxReceipt>) => {
      setReceipts((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
    },
    []
  );

  const clearReceipts = useCallback(() => {
    setReceipts([]);
    setSelectedReceipt(null);
  }, []);

  return (
    <ReceiptsContext.Provider
      value={{
        receipts,
        addReceipt,
        updateReceipt,
        clearReceipts,
        selectedReceipt,
        setSelectedReceipt,
      }}
    >
      {children}
    </ReceiptsContext.Provider>
  );
}
