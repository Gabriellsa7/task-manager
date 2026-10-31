import { TaskForm } from "../task-form";

export default function NewTaskPage() {
  return (
    <>
      <div className="header">
        <h1>Nova tarefa</h1>
      </div>
      <TaskForm />
    </>
  );
}
