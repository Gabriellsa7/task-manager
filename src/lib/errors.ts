import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";

function isTRPCError(error: unknown): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}

export function getErrorMessage(error: unknown) {
  if (!isTRPCError(error)) return "Unexpected error. Please try again.";
  if (!error.data) return "Could not connect to the server.";
  if (error.data.zodError) return "Invalid data. Please check the fields.";
  return error.message;
}

export function getFieldErrors(error: unknown) {
  return isTRPCError(error) ? (error.data?.zodError?.fieldErrors ?? {}) : {};
}
