import Link from "next/link";
import { TASK_PAGE_SIZE } from "@/lib/task-schema";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";
import { TaskList } from "./task-list";

// Os dados vivem em memória e mudam a cada request: sem isso o Next geraria a
// página estaticamente no build e a lista ficaria congelada.
export const dynamic = "force-dynamic";

export default async function Home() {
  // SSR: a primeira página de tarefas é buscada no servidor (chamando o router
  // direto, sem HTTP) e enviada ao client já hidratada no cache do React Query.
  await getQueryClient().prefetchInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(
      { limit: TASK_PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <HydrateClient>
      <div className="header">
        <h1>Tarefas</h1>
        <Link href="/tarefas/nova" className="btn btn-primary">
          Nova tarefa
        </Link>
      </div>
      <TaskList />
    </HydrateClient>
  );
}
