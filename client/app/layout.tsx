import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

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
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                border: "2px solid #000",
                borderRadius: "0",
                background: "#fff",
                color: "#000",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
