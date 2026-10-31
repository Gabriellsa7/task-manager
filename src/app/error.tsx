"use client";

import { button, card } from "@/components/styles";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className={`${card} space-y-3`}>
      <p>Something went wrong while loading this page.</p>
      <button className={button.default} onClick={reset}>
        Try again
      </button>
    </div>
  );
}
