"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card">
      <p>Something went wrong while loading this page.</p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
