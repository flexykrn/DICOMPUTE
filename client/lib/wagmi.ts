import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";

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
      http: ["https://rpc.apothem.network"],
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
  projectId: "YOUR_WALLET_CONNECT_PROJECT_ID", // Replace with actual project ID from walletconnect.com
  chains: [xdcApothem],
  ssr: true,
});

export const queryClient = new QueryClient();

export { WagmiProvider, RainbowKitProvider, QueryClientProvider };
