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

  it("prevents submitting an empty title", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskForm />);

    await user.type(screen.getByLabelText("Title *"), "   ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Title *")).toHaveAttribute("aria-invalid", "true");
    expect(push).not.toHaveBeenCalled();
    await expect(caller.task.list({})).resolves.toMatchObject({ items: [] });
  });

  it("creates the task and goes back to the list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskForm />);

    await user.type(screen.getByLabelText("Title *"), "Buy bread");
    await user.type(screen.getByLabelText("Description"), "At the bakery");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Task created successfully")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(push).toHaveBeenCalledWith("/");

    const { items } = await caller.task.list({});
    expect(items).toMatchObject([{ title: "Buy bread", description: "At the bakery" }]);
  });

  it("opens prefilled and saves the edit", async () => {
    const user = userEvent.setup();
    const task = await caller.task.create({ title: "Old", description: "Desc" });
    renderWithProviders(<TaskForm task={task} />);

    const title = screen.getByLabelText("Title *");
    expect(title).toHaveValue("Old");
    expect(screen.getByLabelText("Description")).toHaveValue("Desc");

    await user.clear(title);
    await user.type(title, "New");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Task updated successfully")).toBeInTheDocument();
    await expect(caller.task.byId({ id: task.id })).resolves.toMatchObject({
      title: "New",
    });
  });

  it("shows the server error when the task no longer exists", async () => {
    const user = userEvent.setup();
    const task = await caller.task.create({ title: "Removed" });
    renderWithProviders(<TaskForm task={task} />);
    await caller.task.delete({ id: task.id });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(`Task ${task.id} not found`),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    });
    expect(push).not.toHaveBeenCalled();
  });
});
