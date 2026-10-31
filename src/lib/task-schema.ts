import { z } from "zod";

export const taskIdSchema = z.number().int().positive();

export const taskInputSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters"),
  descricao: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;

export type Task = {
  id: number;
  titulo: string;
  descricao?: string;
  dataCriacao: Date;
};

export const TASK_PAGE_SIZE = 10;
