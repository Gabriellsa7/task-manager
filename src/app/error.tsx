"use client";

// Fallback para erros inesperados ao renderizar uma página.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card">
      <p>Algo deu errado ao carregar esta página.</p>
      <button className="btn" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
