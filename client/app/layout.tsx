import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "DICOMPUTE - Verifiable GPU Compute",
  description: "Decentralized GPU compute marketplace with on-chain proof-of-compute receipts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <Providers>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  border: "2px solid var(--border-color)",
                  borderRadius: "0",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                },
              }}
            />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
