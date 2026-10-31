import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Tech challenge: Next.js 15 + tRPC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <TRPCReactProvider>
          <ToastProvider>
            <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
          </ToastProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
