"use client";

import { useEffect } from "react";

/**
 * Catches errors thrown in the root layout, where the regular error.tsx
 * boundary cannot apply since it renders inside the layout it's meant
 * to protect. Must render its own <html>/<body> since the root layout
 * is what failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
          <h1>Something went wrong</h1>
          <p>A critical error occurred while loading the application.</p>
          <button onClick={() => reset()}>Try again</button>
        </main>
      </body>
    </html>
  );
}
