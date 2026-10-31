import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";

function isTRPCError(error: unknown): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}

export function getErrorMessage(error: unknown) {
  if (!isTRPCError(error)) return "Erro inesperado. Tente novamente.";
  if (!error.data) return "Não foi possível conectar ao servidor.";
  if (error.data.zodError) return "Dados inválidos. Verifique os campos.";
  return error.message;
}

export function getFieldErrors(error: unknown) {
  return isTRPCError(error) ? (error.data?.zodError?.fieldErrors ?? {}) : {};
}
