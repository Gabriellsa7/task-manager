import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { ToastProvider } from "@/components/toast";
import { TRPCProvider } from "@/trpc/client";
import { createTestClient } from "./client";

export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={createTestClient()} queryClient={queryClient}>
        <ToastProvider>{ui}</ToastProvider>
      </TRPCProvider>
    </QueryClientProvider>,
  );
}
