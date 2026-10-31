import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { caller, clearTasks } from "@/test/caller";
import { renderWithProviders } from "@/test/render";
import { TaskForm } from "./task-form";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("TaskForm", () => {
  beforeEach(async () => {
    push.mockClear();
    await clearTasks();
  });

  it("impede o envio com título vazio", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskForm />);

    await user.type(screen.getByLabelText("Título *"), "   ");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("O título é obrigatório")).toBeInTheDocument();
    expect(screen.getByLabelText("Título *")).toHaveAttribute("aria-invalid", "true");
    expect(push).not.toHaveBeenCalled();
    await expect(caller.task.list({})).resolves.toMatchObject({ items: [] });
  });

  it("cria a tarefa e volta para a listagem", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskForm />);

    await user.type(screen.getByLabelText("Título *"), "Comprar pão");
    await user.type(screen.getByLabelText("Descrição"), "Na padaria");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Tarefa criada com sucesso")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
    expect(push).toHaveBeenCalledWith("/");

    const { items } = await caller.task.list({});
    expect(items).toMatchObject([{ titulo: "Comprar pão", descricao: "Na padaria" }]);
  });

  it("abre preenchido e salva a edição", async () => {
    const user = userEvent.setup();
    const task = await caller.task.create({ titulo: "Antigo", descricao: "Desc" });
    renderWithProviders(<TaskForm task={task} />);

    const titulo = screen.getByLabelText("Título *");
    expect(titulo).toHaveValue("Antigo");
    expect(screen.getByLabelText("Descrição")).toHaveValue("Desc");

    await user.clear(titulo);
    await user.type(titulo, "Novo");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Tarefa atualizada com sucesso")).toBeInTheDocument();
    await expect(caller.task.byId({ id: task.id })).resolves.toMatchObject({
      titulo: "Novo",
    });
  });

  it("mostra o erro do servidor quando a tarefa não existe mais", async () => {
    const user = userEvent.setup();
    const task = await caller.task.create({ titulo: "Removida" });
    renderWithProviders(<TaskForm task={task} />);
    await caller.task.delete({ id: task.id });

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText(`Tarefa ${task.id} não encontrada`),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
    });
    expect(push).not.toHaveBeenCalled();
  });
});
