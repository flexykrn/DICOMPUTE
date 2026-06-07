import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain, http } from "viem";

export const xdcApothem = defineChain({
  id: 51,
  name: "XDC Apothem",
  nativeCurrency: {
    name: "XDC",
    symbol: "XDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://erpc.apothem.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Apothem",
      url: "https://explorer.apothem.network",
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: "DICOMPUTE",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "21f16978fd430146fe7e908c6d64e8b7",
  chains: [xdcApothem],
  transports: {
    [xdcApothem.id]: http(),
  },
});

export const queryClient = new QueryClient();

export { RainbowKitProvider, WagmiProvider, QueryClient, QueryClientProvider };
