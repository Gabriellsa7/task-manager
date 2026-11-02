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
    <Suspense fallback={<p>Loading...</p>}>
      <TaskList />
    </Suspense>,
  );
}

async function createMany(count: number) {
  for (let i = 1; i <= count; i++) {
    await caller.task.create({ title: `Task ${i}` });
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

  it("shows a message when there are no tasks", async () => {
    renderList();
    expect(await screen.findByText(/No tasks yet/)).toBeInTheDocument();
  });

  it("lists the newest tasks first", async () => {
    await caller.task.create({ title: "First", description: "With description" });
    await caller.task.create({ title: "Second" });
    renderList();

    await screen.findByText("Second");
    expect(titles()).toEqual(["Second", "First"]);
    expect(screen.getByText("With description")).toBeInTheDocument();
    expect(screen.getAllByText(/^Created on/)).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("loads the next page when scrolling to the end", async () => {
    await createMany(15);
    renderList();

    await screen.findByText("Task 15");
    expect(titles()).toHaveLength(10);

    act(() => observers.forEach((observer) => observer.intersect()));

    await waitFor(() => expect(titles()).toHaveLength(15));
    expect(titles().at(-1)).toBe("Task 1");
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("loads the next page with the button", async () => {
    const user = userEvent.setup();
    await createMany(12);
    renderList();

    await user.click(await screen.findByRole("button", { name: "Load more" }));

    await waitFor(() => expect(titles()).toHaveLength(12));
  });

  it("deletes the task after confirmation", async () => {
    const user = userEvent.setup();
    await caller.task.create({ title: "Keep" });
    await caller.task.create({ title: "Delete this one" });
    renderList();

    const item = (await screen.findByText("Delete this one")).closest("li")!;
    await user.click(within(item).getByRole("button", { name: "Delete" }));

    expect(window.confirm).toHaveBeenCalledWith('Delete task "Delete this one"?');
    expect(await screen.findByText("Task deleted successfully")).toBeInTheDocument();
    await waitFor(() => expect(titles()).toEqual(["Keep"]));
  });

  it("does not delete if the user cancels", async () => {
    const user = userEvent.setup();
    vi.mocked(window.confirm).mockReturnValue(false);
    const task = await caller.task.create({ title: "Stays" });
    renderList();

    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await expect(caller.task.byId({ id: task.id })).resolves.toBeDefined();
    expect(titles()).toEqual(["Stays"]);
  });

  it("shows an error and refreshes the list if the task was already deleted", async () => {
    const user = userEvent.setup();
    const task = await caller.task.create({ title: "Already deleted" });
    renderList();
    await screen.findByText("Already deleted");
    await caller.task.delete({ id: task.id });

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText(`Task ${task.id} not found`),
    ).toBeInTheDocument();
    expect(await screen.findByText(/No tasks yet/)).toBeInTheDocument();
  });
});
