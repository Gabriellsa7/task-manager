import { TRPCClientError } from "@trpc/client";
import { beforeEach, describe, expect, it } from "vitest";
import { clearTasks } from "@/test/caller";
import { createTestClient } from "@/test/client";
import { getErrorMessage, getFieldErrors } from "./errors";

const client = createTestClient();

async function catchError(promise: Promise<unknown>) {
  return promise.then(
    () => expect.fail("should have failed"),
    (error: unknown) => error,
  );
}

describe("errors over HTTP", () => {
  beforeEach(clearTasks);

  it("sends validation errors per field", async () => {
    const error = await catchError(client.task.create.mutate({ titulo: "" }));

    expect(getErrorMessage(error)).toBe("Invalid data. Please check the fields.");
    expect(getFieldErrors(error)).toEqual({ titulo: ["Title is required"] });
  });

  it("uses the server message for a missing task", async () => {
    const error = await catchError(
      client.task.update.mutate({ id: 999, titulo: "Anything" }),
    );

    expect(error).toBeInstanceOf(TRPCClientError);
    expect((error as TRPCClientError<never>).data).toMatchObject({
      code: "NOT_FOUND",
      httpStatus: 404,
    });
    expect(getErrorMessage(error)).toBe("Task 999 not found");
    expect(getFieldErrors(error)).toEqual({});
  });

  it("transports dataCriacao as a Date", async () => {
    const task = await client.task.create.mutate({ titulo: "With date" });
    expect(task.dataCriacao).toBeInstanceOf(Date);
  });
});

describe("getErrorMessage", () => {
  it("handles network failures", () => {
    const error = TRPCClientError.from(new TypeError("Failed to fetch"));
    expect(getErrorMessage(error)).toBe("Could not connect to the server.");
  });

  it("handles non-tRPC errors", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("Unexpected error. Please try again.");
    expect(getFieldErrors(new Error("boom"))).toEqual({});
  });
});
