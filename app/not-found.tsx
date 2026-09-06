import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center">
      <Container>
        <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </Container>
    </main>
  );
}
