import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
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

  // Busca a tarefa no servidor para o formulário já abrir preenchido.
  const task = await getQueryClient()
    .fetchQuery(trpc.task.byId.queryOptions({ id: parsedId.data }))
    .catch((error) => {
      if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
      throw error;
    });

  return (
    <>
      <div className="header">
        <h1>Editar tarefa</h1>
      </div>
      <TaskForm task={task} />
    </>
  );
}
