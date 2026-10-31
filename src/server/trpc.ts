import { initTRPC } from "@trpc/server";
import superjson from "superjson";

// Contexto por request. Hoje vazio; é aqui que entrariam sessão/usuário/db.
export const createTRPCContext = async () => ({});

// superjson permite trafegar Date (ex: dataCriacao) sem conversão manual.
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
