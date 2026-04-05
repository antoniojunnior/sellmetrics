import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
