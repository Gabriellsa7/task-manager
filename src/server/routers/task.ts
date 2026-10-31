import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { taskIdSchema, taskInputSchema } from "@/lib/task-schema";
import * as taskStore from "../task-store";
import { createTRPCRouter, publicProcedure } from "../trpc";

const notFound = (id: number) =>
  new TRPCError({ code: "NOT_FOUND", message: `Tarefa ${id} não encontrada` });

export const taskRouter = createTRPCRouter({
  // Paginado por cursor para suportar o infinite scroll no frontend.
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
        cursor: taskIdSchema.nullish(),
      }),
    )
    .query(({ input }) => taskStore.listTasks(input)),

  byId: publicProcedure
    .input(z.object({ id: taskIdSchema }))
    .query(({ input }) => {
      const task = taskStore.getTask(input.id);
      if (!task) throw notFound(input.id);
      return task;
    }),

  create: publicProcedure
    .input(taskInputSchema)
    .mutation(({ input }) => taskStore.createTask(input)),

  update: publicProcedure
    .input(taskInputSchema.extend({ id: taskIdSchema }))
    .mutation(({ input: { id, ...data } }) => {
      const task = taskStore.updateTask(id, data);
      if (!task) throw notFound(id);
      return task;
    }),

  delete: publicProcedure
    .input(z.object({ id: taskIdSchema }))
    .mutation(({ input }) => {
      if (!taskStore.deleteTask(input.id)) throw notFound(input.id);
      return { id: input.id };
    }),
});
