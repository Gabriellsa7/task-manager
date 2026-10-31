import { z } from "zod";

// Schemas compartilhados entre backend (input do tRPC) e frontend (validação do
// formulário), garantindo as mesmas regras nos dois lados.

export const taskIdSchema = z.number().int().positive();

export const taskInputSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "O título é obrigatório")
    .max(100, "O título deve ter no máximo 100 caracteres"),
  descricao: z
    .string()
    .trim()
    .max(500, "A descrição deve ter no máximo 500 caracteres")
    .optional(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;

export type Task = {
  id: number;
  titulo: string;
  descricao?: string;
  dataCriacao: Date;
};
