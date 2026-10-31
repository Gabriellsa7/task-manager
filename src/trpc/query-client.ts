import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import superjson from "superjson";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Evita refetch imediato no client logo após receber dados do SSR.
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        // Inclui queries pendentes para permitir streaming do servidor.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
