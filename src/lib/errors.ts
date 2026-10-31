import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";

function isTRPCError(error: unknown): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}

// Converte qualquer erro vindo do tRPC em uma mensagem amigável para o usuário.
export function getErrorMessage(error: unknown) {
  if (!isTRPCError(error)) return "Erro inesperado. Tente novamente.";
  // Sem `data` o erro não veio do servidor (ex: falha de rede).
  if (!error.data) return "Não foi possível conectar ao servidor.";
  if (error.data.zodError) return "Dados inválidos. Verifique os campos.";
  return error.message;
}

// Erros de validação do backend, indexados por campo (ver errorFormatter em server/trpc.ts).
export function getFieldErrors(error: unknown) {
  return isTRPCError(error) ? (error.data?.zodError?.fieldErrors ?? {}) : {};
}
