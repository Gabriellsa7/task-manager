import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { button } from "@/components/styles";
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
      <PageHeader title="Tasks">
        <Link href="/tasks/new" className={button.primary}>
          New task
        </Link>
      </PageHeader>
      <TaskList />
    </HydrateClient>
  );
}
