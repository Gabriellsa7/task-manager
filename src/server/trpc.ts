import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

// Contexto por request. Hoje vazio; é aqui que entrariam sessão/usuário/db.
export const createTRPCContext = async () => ({});

// superjson permite trafegar Date (ex: dataCriacao) sem conversão manual.
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  // Erros de validação do zod vão estruturados por campo em `data.zodError`,
  // para o frontend exibir a mensagem ao lado do campo correspondente.
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError ? z.flattenError(error.cause) : null,
    },
  }),
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
