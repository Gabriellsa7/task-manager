import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { caller, clearTasks } from "@/test/caller";
import { renderWithProviders } from "@/test/render";
import { TaskList } from "./task-list";

const observers = new Set<FakeIntersectionObserver>();

class FakeIntersectionObserver {
  constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {}
  observe() {
    observers.add(this);
  }
  disconnect() {
    observers.delete(this);
  }
  intersect() {
    this.callback([{ isIntersecting: true }]);
  }
}

vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);

function renderList() {
  return renderWithProviders(
    <Suspense fallback={<p>Carregando...</p>}>
      <TaskList />
    </Suspense>,
  );
}

async function createMany(count: number) {
  for (let i = 1; i <= count; i++) {
    await caller.task.create({ titulo: `Tarefa ${i}` });
  }
}

const titles = () =>
  screen.queryAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);

describe("TaskList", () => {
  beforeEach(async () => {
    observers.clear();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await clearTasks();
  });

  it("mostra mensagem quando não há tarefas", async () => {
    renderList();
    expect(await screen.findByText(/Nenhuma tarefa ainda/)).toBeInTheDocument();
  });

  it("lista as tarefas mais recentes primeiro", async () => {
    await caller.task.create({ titulo: "Primeira", descricao: "Com descrição" });
    await caller.task.create({ titulo: "Segunda" });
    renderList();

    await screen.findByText("Segunda");
    expect(titles()).toEqual(["Segunda", "Primeira"]);
    expect(screen.getByText("Com descrição")).toBeInTheDocument();
    expect(screen.getAllByText(/^Criada em/)).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
  });

  it("carrega a próxima página ao rolar até o fim", async () => {
    await createMany(15);
    renderList();

    await screen.findByText("Tarefa 15");
    expect(titles()).toHaveLength(10);

    act(() => observers.forEach((observer) => observer.intersect()));

    await waitFor(() => expect(titles()).toHaveLength(15));
    expect(titles().at(-1)).toBe("Tarefa 1");
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
  });

  it("carrega a próxima página pelo botão", async () => {
    const user = userEvent.setup();
    await createMany(12);
    renderList();

    await user.click(await screen.findByRole("button", { name: "Carregar mais" }));

    await waitFor(() => expect(titles()).toHaveLength(12));
  });

  it("exclui a tarefa após confirmação", async () => {
    const user = userEvent.setup();
    await caller.task.create({ titulo: "Manter" });
    await caller.task.create({ titulo: "Excluir esta" });
    renderList();

    const item = (await screen.findByText("Excluir esta")).closest("li")!;
    await user.click(within(item).getByRole("button", { name: "Excluir" }));

    expect(window.confirm).toHaveBeenCalledWith('Excluir a tarefa "Excluir esta"?');
    expect(await screen.findByText("Tarefa excluída com sucesso")).toBeInTheDocument();
    await waitFor(() => expect(titles()).toEqual(["Manter"]));
  });

  it("não exclui se o usuário cancelar", async () => {
    const user = userEvent.setup();
    vi.mocked(window.confirm).mockReturnValue(false);
    const task = await caller.task.create({ titulo: "Fica" });
    renderList();

    await user.click(await screen.findByRole("button", { name: "Excluir" }));

    await expect(caller.task.byId({ id: task.id })).resolves.toBeDefined();
    expect(titles()).toEqual(["Fica"]);
  });

  it("mostra erro e atualiza a lista se a tarefa já foi removida", async () => {
    const user = userEvent.setup();
    const task = await caller.task.create({ titulo: "Já removida" });
    renderList();
    await screen.findByText("Já removida");
    await caller.task.delete({ id: task.id });

    await user.click(screen.getByRole("button", { name: "Excluir" }));

    expect(
      await screen.findByText(`Tarefa ${task.id} não encontrada`),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Nenhuma tarefa ainda/)).toBeInTheDocument();
  });
});
