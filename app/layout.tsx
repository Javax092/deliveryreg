import type { Metadata } from "next";
import { PwaRegister } from "@/components/public/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeliveryReg",
  description: "Base operacional para vendas, pedidos e unidades"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
