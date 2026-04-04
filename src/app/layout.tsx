import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Sellmetrics - Amazon Cockpit",
  description: "Dashboards financeiros profissionais para vendedores Amazon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.variable} font-sans antialiased h-full`}>
        {children}
      </body>
    </html>
  );
}
