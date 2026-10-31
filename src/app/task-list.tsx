"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/toast";
import { getErrorMessage } from "@/lib/errors";
import { TASK_PAGE_SIZE, type Task } from "@/lib/task-schema";
import { useTRPC } from "@/trpc/client";

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function TaskList() {
  const trpc = useTRPC();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.task.list.infiniteQueryOptions(
        { limit: TASK_PAGE_SIZE },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
      ),
    );

  const tasks = data.pages.flatMap((page) => page.items);

  const loadMoreRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchNextPage(),
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (tasks.length === 0) {
    return (
      <p className="card muted">
        Nenhuma tarefa ainda. Clique em &quot;Nova tarefa&quot; para começar.
      </p>
    );
  }

  return (
    <>
      <ul className="task-list">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
      {hasNextPage && (
        <button
          ref={loadMoreRef}
          className="btn load-more"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
        </button>
      )}
    </>
  );
}

function TaskItem({ task }: { task: Task }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const toast = useToast();

  const deleteTask = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: () => toast("success", "Tarefa excluída com sucesso"),
      onError: (error) => toast("error", getErrorMessage(error)),
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: trpc.task.list.pathKey() }),
    }),
  );

  function handleDelete() {
    if (confirm(`Excluir a tarefa "${task.titulo}"?`)) {
      deleteTask.mutate({ id: task.id });
    }
  }

  return (
    <li className="card task">
      <div className="task-body">
        <h2>{task.titulo}</h2>
        {task.descricao && <p>{task.descricao}</p>}
        <span className="muted">
          Criada em {dateFormat.format(task.dataCriacao)}
        </span>
      </div>
      <div className="task-actions">
        <Link href={`/tarefas/${task.id}/editar`} className="btn">
          Editar
        </Link>
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={deleteTask.isPending}
        >
          {deleteTask.isPending ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    </li>
  );
}
