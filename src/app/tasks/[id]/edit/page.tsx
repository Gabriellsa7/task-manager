import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { taskIdSchema } from "@/lib/task-schema";
import { getQueryClient, trpc } from "@/trpc/server";
import { TaskForm } from "../../task-form";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = taskIdSchema.safeParse(Number(id));
  if (!parsedId.success) notFound();

  const task = await getQueryClient()
    .fetchQuery(trpc.task.byId.queryOptions({ id: parsedId.data }))
    .catch((error) => {
      if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
      throw error;
    });

  return (
    <>
      <PageHeader title="Edit task" />
      <TaskForm task={task} />
    </>
  );
}
