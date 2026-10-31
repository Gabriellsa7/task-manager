import { HydrateClient, trpc, getQueryClient } from "@/trpc/server";
import { HealthStatus } from "./health-status";

export default async function Home() {
  // Pré-carrega no servidor; o client recebe o cache já hidratado.
  await getQueryClient().prefetchQuery(trpc.health.queryOptions());

  return (
    <HydrateClient>
      <h1>Gerenciador de Tarefas</h1>
      <HealthStatus />
    </HydrateClient>
  );
}
