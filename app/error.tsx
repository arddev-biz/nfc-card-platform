"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Basic error logging for V1 — replace with a real logging/monitoring
    // integration when that need arises.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center">
      <Container>
        <h1 className="text-xl font-semibold text-slate-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-slate-600">
          An unexpected error occurred while loading this page.
        </p>
        <Button className="mt-4" onClick={() => reset()}>
          Try again
        </Button>
      </Container>
    </main>
  );
}
