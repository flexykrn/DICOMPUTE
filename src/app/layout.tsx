import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoCap Compute - Decentralized GPU Marketplace",
  description: "Rent GPU power. Earn XDC. Decentralized compute marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
