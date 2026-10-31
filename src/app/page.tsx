import Link from "next/link";
import { TASK_PAGE_SIZE } from "@/lib/task-schema";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";
import { TaskList } from "./task-list";

export const dynamic = "force-dynamic";

export default async function Home() {
  await getQueryClient().prefetchInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(
      { limit: TASK_PAGE_SIZE },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );

  return (
    <HydrateClient>
      <div className="header">
        <h1>Tasks</h1>
        <Link href="/tasks/new" className="btn btn-primary">
          New task
        </Link>
      </div>
      <TaskList />
    </HydrateClient>
  );
}
