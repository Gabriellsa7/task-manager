import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gerenciador de Tarefas",
  description: "Desafio técnico: Next.js 15 + tRPC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <TRPCReactProvider>
          <ToastProvider>
            <main className="container">{children}</main>
          </ToastProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
