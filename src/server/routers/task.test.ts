import { beforeEach, describe, expect, it } from "vitest";
import { caller, clearTasks } from "@/test/caller";

it("starts with 25 sample tasks", async () => {
  const { items } = await caller.task.list({ limit: 50 });
  expect(items).toHaveLength(25);
});

describe("task router", () => {
  beforeEach(clearTasks);

  describe("create", () => {
    it("creates a task with id and creation date", async () => {
      const task = await caller.task.create({
        titulo: "  Learn tRPC  ",
        descricao: "Read the docs",
      });

      expect(task).toMatchObject({
        id: expect.any(Number),
        titulo: "Learn tRPC",
        descricao: "Read the docs",
      });
      expect(task.dataCriacao).toBeInstanceOf(Date);
    });

    it("drops an empty description", async () => {
      const task = await caller.task.create({ titulo: "No description", descricao: "  " });
      expect(task.descricao).toBeUndefined();
    });

    it("generates unique ids", async () => {
      const a = await caller.task.create({ titulo: "A" });
      const b = await caller.task.create({ titulo: "B" });
      expect(a.id).not.toBe(b.id);
    });

    it.each(["", "   "])("rejects an empty title (%j)", async (titulo) => {
      await expect(caller.task.create({ titulo })).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("Title is required"),
      });
    });

    it("rejects a title longer than 100 characters", async () => {
      await expect(
        caller.task.create({ titulo: "a".repeat(101) }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("byId", () => {
    it("returns the task", async () => {
      const created = await caller.task.create({ titulo: "Find me" });
      await expect(caller.task.byId({ id: created.id })).resolves.toEqual(created);
    });

    it("returns NOT_FOUND for an unknown id", async () => {
      await expect(caller.task.byId({ id: 999 })).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Task 999 not found",
      });
    });
  });

  describe("update", () => {
    it("updates title and description keeping id and creation date", async () => {
      const created = await caller.task.create({ titulo: "Old", descricao: "Desc" });

      const updated = await caller.task.update({
        id: created.id,
        titulo: "New",
        descricao: "",
      });

      expect(updated).toEqual({
        id: created.id,
        titulo: "New",
        descricao: undefined,
        dataCriacao: created.dataCriacao,
      });
      await expect(caller.task.byId({ id: created.id })).resolves.toEqual(updated);
    });

    it("returns NOT_FOUND for a missing task", async () => {
      await expect(
        caller.task.update({ id: 999, titulo: "Anything" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND", message: "Task 999 not found" });
    });

    it("rejects an empty title", async () => {
      const created = await caller.task.create({ titulo: "Valid" });
      await expect(
        caller.task.update({ id: created.id, titulo: "" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("delete", () => {
    it("removes the task", async () => {
      const created = await caller.task.create({ titulo: "Remove me" });

      await expect(caller.task.delete({ id: created.id })).resolves.toEqual({ id: created.id });
      await expect(caller.task.byId({ id: created.id })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("returns NOT_FOUND when deleting a missing task", async () => {
      await expect(caller.task.delete({ id: 999 })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("list", () => {
    async function createMany(count: number) {
      for (let i = 1; i <= count; i++) {
        await caller.task.create({ titulo: `Task ${i}` });
      }
    }

    it("returns an empty list without a next cursor", async () => {
      await expect(caller.task.list({})).resolves.toEqual({ items: [], nextCursor: null });
    });

    it("orders from newest to oldest", async () => {
      await createMany(3);
      const { items } = await caller.task.list({});
      expect(items.map((task) => task.titulo)).toEqual(["Task 3", "Task 2", "Task 1"]);
    });

    it("paginates by cursor without repeating or skipping tasks", async () => {
      await createMany(7);

      const first = await caller.task.list({ limit: 3 });
      const second = await caller.task.list({ limit: 3, cursor: first.nextCursor });
      const third = await caller.task.list({ limit: 3, cursor: second.nextCursor });

      const titles = [...first.items, ...second.items, ...third.items].map((t) => t.titulo);
      expect(titles).toEqual([7, 6, 5, 4, 3, 2, 1].map((i) => `Task ${i}`));
      expect(third.nextCursor).toBeNull();
    });

    it("keeps pagination stable when tasks are created or deleted", async () => {
      await createMany(6);
      const first = await caller.task.list({ limit: 3 });

      await caller.task.create({ titulo: "Brand new" });
      await caller.task.delete({ id: first.items[2].id });

      const second = await caller.task.list({ limit: 3, cursor: first.nextCursor });
      expect(second.items.map((t) => t.titulo)).toEqual(["Task 3", "Task 2", "Task 1"]);
    });

    it("uses 10 items per page by default", async () => {
      await createMany(12);
      const { items, nextCursor } = await caller.task.list({});
      expect(items).toHaveLength(10);
      expect(nextCursor).not.toBeNull();
    });
  });
});
