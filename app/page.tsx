"use client";

import { NetworkProvider } from "@/components/providers/network-context";
import { ReceiptsProvider } from "@/components/providers/receipts-context";
import { DriftProvider } from "@/components/providers/drift-provider";
import { TerminalLayout } from "@/components/terminal/terminal-layout";

export default function Home() {
  return (
    <NetworkProvider>
      <DriftProvider>
        <ReceiptsProvider>
          <TerminalLayout />
        </ReceiptsProvider>
      </DriftProvider>
    </NetworkProvider>
  );
}
