import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Activity, LogIn } from "lucide-react";

export const Route = createFileRoute("/demo")({
  component: DemoLayout,
});

function DemoLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Activity className="size-3.5" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">PulseIQ</span>
          </Link>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">
            Demo workspace
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] transition-colors hover:bg-accent"
            >
              <LogIn className="size-3.5" /> Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8">
        <Outlet />
      </main>
    </div>
  );
}
