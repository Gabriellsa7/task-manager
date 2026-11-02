import "server-only";

import type { Task, TaskInput } from "@/lib/task-schema";

const store = ((globalThis as { taskStore?: { tasks: Map<number, Task>; nextId: number } })
  .taskStore ??= { tasks: new Map(), nextId: 1 });

const normalize = (input: TaskInput) => ({
  title: input.title,
  description: input.description || undefined,
});

export function listTasks({ limit, cursor }: { limit: number; cursor?: number | null }) {
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
  const task: Task = { id: store.nextId++, ...normalize(input), createdAt: new Date() };
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

if (store.tasks.size === 0 && store.nextId === 1) {
  for (let i = 1; i <= 25; i++) {
    createTask({
      title: `Sample task ${i}`,
      description: i % 3 === 0 ? undefined : `Description for sample task ${i}`,
    });
  }
}
