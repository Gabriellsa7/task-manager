"use client";

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
