"use client";

import type { ReactNode } from "react";
import { WagmiProvider, RainbowKitProvider, QueryClientProvider, queryClient, config } from "@/lib/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
