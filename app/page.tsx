"use client";

import { NetworkProvider } from "@/components/providers/network-context";
import { ReceiptsProvider } from "@/components/providers/receipts-context";
import { TerminalLayout } from "@/components/terminal/terminal-layout";

export default function Home() {
  return (
    <NetworkProvider>
      <ReceiptsProvider>
        <TerminalLayout />
      </ReceiptsProvider>
    </NetworkProvider>
  );
}
