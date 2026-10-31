import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { POST } from "@/app/api/trpc/[trpc]/route";
import type { AppRouter } from "@/server/routers/_app";

export function createTestClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "http://localhost/api/trpc",
        transformer: superjson,
        fetch: (input, init) => POST(new Request(input, init)),
      }),
    ],
  });
}
