import { TRPCClientError } from "@trpc/client";
import { beforeEach, describe, expect, it } from "vitest";
import { clearTasks } from "@/test/caller";
import { createTestClient } from "@/test/client";
import { getErrorMessage, getFieldErrors } from "./errors";

const client = createTestClient();

async function catchError(promise: Promise<unknown>) {
  return promise.then(
    () => expect.fail("deveria ter falhado"),
    (error: unknown) => error,
  );
}

describe("erros via HTTP", () => {
  beforeEach(clearTasks);

  it("envia os erros de validação por campo", async () => {
    const error = await catchError(client.task.create.mutate({ titulo: "" }));

    expect(getErrorMessage(error)).toBe("Dados inválidos. Verifique os campos.");
    expect(getFieldErrors(error)).toEqual({ titulo: ["O título é obrigatório"] });
  });

  it("usa a mensagem do servidor para tarefa inexistente", async () => {
    const error = await catchError(
      client.task.update.mutate({ id: 999, titulo: "Qualquer" }),
    );

    expect(error).toBeInstanceOf(TRPCClientError);
    expect((error as TRPCClientError<never>).data).toMatchObject({
      code: "NOT_FOUND",
      httpStatus: 404,
    });
    expect(getErrorMessage(error)).toBe("Tarefa 999 não encontrada");
    expect(getFieldErrors(error)).toEqual({});
  });

  it("trafega dataCriacao como Date", async () => {
    const task = await client.task.create.mutate({ titulo: "Com data" });
    expect(task.dataCriacao).toBeInstanceOf(Date);
  });
});

describe("getErrorMessage", () => {
  it("trata falha de rede", () => {
    const error = TRPCClientError.from(new TypeError("Failed to fetch"));
    expect(getErrorMessage(error)).toBe("Não foi possível conectar ao servidor.");
  });

  it("trata erros que não são do tRPC", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("Erro inesperado. Tente novamente.");
    expect(getFieldErrors(new Error("boom"))).toEqual({});
  });
});
