import { appRouter } from "@/server/routers/_app";
import { createCallerFactory } from "@/server/trpc";

export const caller = createCallerFactory(appRouter)({});

export async function clearTasks() {
  const { items } = await caller.task.list({ limit: 50 });
  await Promise.all(items.map(({ id }) => caller.task.delete({ id })));
  if (items.length > 0) await clearTasks();
}
