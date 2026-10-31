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

// Fuso fixo para servidor e browser formatarem igual e evitar erro de hidratação.
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function TaskList() {
  const trpc = useTRPC();
  // Os dados já chegam do SSR, então não há suspense no primeiro render.
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.task.list.infiniteQueryOptions(
        { limit: TASK_PAGE_SIZE },
        { getNextPageParam: (lastPage) => lastPage.nextCursor },
      ),
    );

  const tasks = data.pages.flatMap((page) => page.items);

  // Infinite scroll: quando o botão "Carregar mais" se aproxima da área visível,
  // a próxima página é buscada automaticamente. O botão continua clicável como
  // alternativa (acessibilidade / browsers sem IntersectionObserver).
  const loadMoreRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !hasNextPage || isFetchingNextPage) return;

    // Recriado a cada página carregada: se o botão ainda estiver visível (tela
    // grande), o observer dispara de novo e continua preenchendo a tela.
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
      // Recarrega a lista mesmo em erro (ex: tarefa já removida em outra aba).
      // Retornar a promise mantém o botão em "Excluindo..." até a lista atualizar.
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
