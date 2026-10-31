import "server-only";

import type { Task, TaskInput } from "@/lib/task-schema";

// Armazenamento em memória. Fica em globalThis para sobreviver ao hot reload em
// dev, quando o Next reavalia os módulos (sem isso a lista "zeraria" a cada edição).
const store = ((globalThis as { taskStore?: { tasks: Map<number, Task>; nextId: number } })
  .taskStore ??= { tasks: new Map(), nextId: 1 });

// Descrição vazia vira undefined para não guardar strings em branco.
const normalize = (input: TaskInput) => ({
  titulo: input.titulo,
  descricao: input.descricao || undefined,
});

export function listTasks({ limit, cursor }: { limit: number; cursor?: number | null }) {
  // Id é incremental, então ordenar por id desc = mais recentes primeiro.
  // O cursor é o último id recebido: estável mesmo se tarefas forem criadas/removidas
  // entre uma página e outra (ao contrário de um offset).
  const sorted = [...store.tasks.values()]
    .filter((task) => cursor == null || task.id < cursor)
    .sort((a, b) => b.id - a.id);

  const items = sorted.slice(0, limit);
  const nextCursor = sorted.length > limit ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

export function getTask(id: number) {
  return store.tasks.get(id);
}

export function createTask(input: TaskInput) {
  const task: Task = { id: store.nextId++, ...normalize(input), dataCriacao: new Date() };
  store.tasks.set(task.id, task);
  return task;
}

export function updateTask(id: number, input: TaskInput) {
  const task = store.tasks.get(id);
  if (!task) return undefined;
  const updated = { ...task, ...normalize(input) };
  store.tasks.set(id, updated);
  return updated;
}

export function deleteTask(id: number) {
  return store.tasks.delete(id);
}
