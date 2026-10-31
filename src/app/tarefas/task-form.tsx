"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useToast } from "@/components/toast";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";
import { type Task, taskInputSchema } from "@/lib/task-schema";
import { useTRPC } from "@/trpc/client";

type FieldErrors = Partial<Record<string, string[]>>;

// Mesmo formulário para criar e editar: com `task` ele entra em modo edição.
export function TaskForm({ task }: { task?: Task }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();

  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descricao, setDescricao] = useState(task?.descricao ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});

  const callbacks = {
    onSuccess: async () => {
      // Invalida todas as queries de tarefas (lista e detalhe) antes de voltar.
      await queryClient.invalidateQueries({ queryKey: trpc.task.pathKey() });
      toast(
        "success",
        task ? "Tarefa atualizada com sucesso" : "Tarefa criada com sucesso",
      );
      router.push("/");
    },
    onError: (error: unknown) => {
      setErrors(getFieldErrors(error));
      toast("error", getErrorMessage(error));
    },
  };
  const createTask = useMutation(trpc.task.create.mutationOptions(callbacks));
  const updateTask = useMutation(trpc.task.update.mutationOptions(callbacks));
  // isSuccess mantém o form travado enquanto a navegação de volta acontece.
  const isSaving =
    createTask.isPending ||
    updateTask.isPending ||
    createTask.isSuccess ||
    updateTask.isSuccess;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Validação no client com o mesmo schema do backend: impede o envio
    // (ex: título vazio) sem precisar de uma ida ao servidor.
    const parsed = taskInputSchema.safeParse({ titulo, descricao });
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setErrors({});
    if (task) updateTask.mutate({ id: task.id, ...parsed.data });
    else createTask.mutate(parsed.data);
  }

  return (
    // noValidate: as mensagens de validação são as nossas, não as do browser.
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="titulo">Título *</label>
        <input
          id="titulo"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          aria-invalid={!!errors.titulo}
          aria-describedby="titulo-error"
          autoFocus
        />
        <FieldError id="titulo-error" messages={errors.titulo} />
      </div>

      <div className="field">
        <label htmlFor="descricao">Descrição</label>
        <textarea
          id="descricao"
          rows={4}
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          aria-invalid={!!errors.descricao}
          aria-describedby="descricao-error"
        />
        <FieldError id="descricao-error" messages={errors.descricao} />
      </div>

      <div className="form-actions">
        <Link href="/" className="btn">
          Cancelar
        </Link>
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  return (
    <span id={id} className="field-error">
      {messages?.[0]}
    </span>
  );
}
