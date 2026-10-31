import { PageHeader } from "@/components/page-header";
import { TaskForm } from "../task-form";

export default function NewTaskPage() {
  return (
    <>
      <PageHeader title="New task" />
      <TaskForm />
    </>
  );
}
