import { beforeEach, describe, expect, it } from "vitest";
import { caller, clearTasks } from "@/test/caller";

it("começa com 25 tarefas de exemplo", async () => {
  const { items } = await caller.task.list({ limit: 50 });
  expect(items).toHaveLength(25);
});

describe("task router", () => {
  beforeEach(clearTasks);

  describe("create", () => {
    it("cria uma tarefa com id e data de criação", async () => {
      const task = await caller.task.create({
        titulo: "  Estudar tRPC  ",
        descricao: "Ler a documentação",
      });

      expect(task).toMatchObject({
        id: expect.any(Number),
        titulo: "Estudar tRPC",
        descricao: "Ler a documentação",
      });
      expect(task.dataCriacao).toBeInstanceOf(Date);
    });

    it("descarta descrição vazia", async () => {
      const task = await caller.task.create({ titulo: "Sem descrição", descricao: "  " });
      expect(task.descricao).toBeUndefined();
    });

    it("gera ids únicos", async () => {
      const a = await caller.task.create({ titulo: "A" });
      const b = await caller.task.create({ titulo: "B" });
      expect(a.id).not.toBe(b.id);
    });

    it.each(["", "   "])("rejeita título vazio (%j)", async (titulo) => {
      await expect(caller.task.create({ titulo })).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("O título é obrigatório"),
      });
    });

    it("rejeita título com mais de 100 caracteres", async () => {
      await expect(
        caller.task.create({ titulo: "a".repeat(101) }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("byId", () => {
    it("retorna a tarefa", async () => {
      const created = await caller.task.create({ titulo: "Buscar" });
      await expect(caller.task.byId({ id: created.id })).resolves.toEqual(created);
    });

    it("retorna NOT_FOUND para id inexistente", async () => {
      await expect(caller.task.byId({ id: 999 })).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Tarefa 999 não encontrada",
      });
    });
  });

  describe("update", () => {
    it("atualiza título e descrição mantendo id e data de criação", async () => {
      const created = await caller.task.create({ titulo: "Antigo", descricao: "Desc" });

      const updated = await caller.task.update({
        id: created.id,
        titulo: "Novo",
        descricao: "",
      });

      expect(updated).toEqual({
        id: created.id,
        titulo: "Novo",
        descricao: undefined,
        dataCriacao: created.dataCriacao,
      });
      await expect(caller.task.byId({ id: created.id })).resolves.toEqual(updated);
    });

    it("retorna NOT_FOUND para tarefa inexistente", async () => {
      await expect(
        caller.task.update({ id: 999, titulo: "Qualquer" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND", message: "Tarefa 999 não encontrada" });
    });

    it("rejeita título vazio", async () => {
      const created = await caller.task.create({ titulo: "Válido" });
      await expect(
        caller.task.update({ id: created.id, titulo: "" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("delete", () => {
    it("remove a tarefa", async () => {
      const created = await caller.task.create({ titulo: "Remover" });

      await expect(caller.task.delete({ id: created.id })).resolves.toEqual({ id: created.id });
      await expect(caller.task.byId({ id: created.id })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("retorna NOT_FOUND ao remover tarefa inexistente", async () => {
      await expect(caller.task.delete({ id: 999 })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("list", () => {
    async function createMany(count: number) {
      for (let i = 1; i <= count; i++) {
        await caller.task.create({ titulo: `Tarefa ${i}` });
      }
    }

    it("retorna lista vazia sem cursor seguinte", async () => {
      await expect(caller.task.list({})).resolves.toEqual({ items: [], nextCursor: null });
    });

    it("ordena das mais recentes para as mais antigas", async () => {
      await createMany(3);
      const { items } = await caller.task.list({});
      expect(items.map((task) => task.titulo)).toEqual(["Tarefa 3", "Tarefa 2", "Tarefa 1"]);
    });

    it("pagina por cursor sem repetir nem pular tarefas", async () => {
      await createMany(7);

      const first = await caller.task.list({ limit: 3 });
      const second = await caller.task.list({ limit: 3, cursor: first.nextCursor });
      const third = await caller.task.list({ limit: 3, cursor: second.nextCursor });

      const titles = [...first.items, ...second.items, ...third.items].map((t) => t.titulo);
      expect(titles).toEqual([7, 6, 5, 4, 3, 2, 1].map((i) => `Tarefa ${i}`));
      expect(third.nextCursor).toBeNull();
    });

    it("mantém a paginação estável quando tarefas são criadas ou removidas", async () => {
      await createMany(6);
      const first = await caller.task.list({ limit: 3 });

      await caller.task.create({ titulo: "Nova" });
      await caller.task.delete({ id: first.items[2].id });

      const second = await caller.task.list({ limit: 3, cursor: first.nextCursor });
      expect(second.items.map((t) => t.titulo)).toEqual(["Tarefa 3", "Tarefa 2", "Tarefa 1"]);
    });

    it("usa 10 itens por página por padrão", async () => {
      await createMany(12);
      const { items, nextCursor } = await caller.task.list({});
      expect(items).toHaveLength(10);
      expect(nextCursor).not.toBeNull();
    });
  });
});
