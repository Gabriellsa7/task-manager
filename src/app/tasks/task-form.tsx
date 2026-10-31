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
      await queryClient.invalidateQueries({ queryKey: trpc.task.pathKey() });
      toast(
        "success",
        task ? "Task updated successfully" : "Task created successfully",
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
  const isSaving =
    createTask.isPending ||
    updateTask.isPending ||
    createTask.isSuccess ||
    updateTask.isSuccess;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

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
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="titulo">Title *</label>
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
        <label htmlFor="descricao">Description</label>
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
          Cancel
        </Link>
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
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
