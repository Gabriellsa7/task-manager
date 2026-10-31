import { createTRPCRouter, publicProcedure } from "../trpc";
import { taskRouter } from "./task";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ status: "ok" as const })),
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
