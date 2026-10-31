import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card">
      <p>Tarefa ou página não encontrada.</p>
      <Link href="/" className="btn">
        Voltar para a lista
      </Link>
    </div>
  );
}
