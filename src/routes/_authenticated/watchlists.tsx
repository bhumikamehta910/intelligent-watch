import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MoreHorizontal, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  addItem,
  allItemsQuery,
  createWatchlist,
  deleteWatchlist,
  knownTickersQuery,
  removeItem,
  renameWatchlist,
  watchlistsQuery,
} from "@/lib/api";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/watchlists")({
  head: () => ({
    meta: [
      { title: "Watchlists — PulseIQ" },
      { name: "description", content: "Create, rename and curate the companies PulseIQ watches for you." },
      { property: "og:title", content: "Watchlists — PulseIQ" },
      { property: "og:description", content: "Curate the companies PulseIQ watches for you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WatchlistsPage,
});

function WatchlistsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const lists = useQuery(watchlistsQuery());
  const items = useQuery(allItemsQuery());
  const known = useQuery(knownTickersQuery());

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [ticker, setTicker] = useState("");
  const [company, setCompany] = useState("");

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["watchlists"] });
    void qc.invalidateQueries({ queryKey: ["watchlist_items"] });
  };

  const create = useMutation({
    mutationFn: () => createWatchlist(user.id, newName.trim()),
    onSuccess: () => {
      setCreating(false);
      setNewName("");
      invalidate();
      toast.success("Watchlist created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rename = useMutation({
    mutationFn: () => renameWatchlist(renaming!.id, renaming!.name.trim()),
    onSuccess: () => {
      setRenaming(null);
      invalidate();
      toast.success("Watchlist renamed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteWatchlist(id),
    onSuccess: () => {
      invalidate();
      toast.success("Watchlist deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addStock = useMutation({
    mutationFn: () => addItem(adding!, ticker, company.trim() || null),
    onSuccess: () => {
      setAdding(null);
      setTicker("");
      setCompany("");
      invalidate();
      toast.success("Stock added");
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("duplicate") ? "Already on this watchlist" : e.message),
  });

  const removeStock = useMutation({
    mutationFn: (id: string) => removeItem(id),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Watchlists"
        subtitle="Group the companies you follow. Each list feeds your dashboard."
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New watchlist
          </Button>
        }
      />

      {lists.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : (lists.data ?? []).length === 0 ? (
        <div className="panel p-12 text-center">
          <h2 className="text-[15px] font-medium">No watchlists yet</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-muted-foreground">
            Start with one — "Core holdings" or "AI infrastructure" work well.
          </p>
          <Button className="mt-5" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Create watchlist
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {(lists.data ?? []).map((list) => {
            const listItems = (items.data ?? []).filter((i) => i.watchlist_id === list.id);
            return (
              <section key={list.id} className="panel p-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-[15px] font-medium">{list.name}</h2>
                  <span className="num rounded-full bg-accent px-1.5 text-[11px] text-muted-foreground">
                    {listItems.length}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAdding(list.id);
                        setTicker("");
                        setCompany("");
                      }}
                    >
                      <Plus className="size-3.5" /> Add stock
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label="Watchlist actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => setRenaming({ id: list.id, name: list.name })}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => remove.mutate(list.id)}
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {listItems.length === 0 ? (
                  <p className="mt-4 text-[13.5px] text-muted-foreground">
                    Empty list — add a company to start receiving its signals.
                  </p>
                ) : (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {listItems.map((item) => (
                      <li
                        key={item.id}
                        className="group flex items-center gap-2 rounded-md border border-border bg-surface-raised py-1.5 pl-2.5 pr-1.5"
                      >
                        <Link
                          to="/stock/$ticker"
                          params={{ ticker: item.ticker }}
                          className="flex items-baseline gap-2"
                        >
                          <span className="num text-[12.5px] font-medium">{item.ticker}</span>
                          <span className="text-[12.5px] text-muted-foreground">
                            {item.company_name}
                          </span>
                        </Link>
                        <button
                          type="button"
                          aria-label={`Remove ${item.ticker}`}
                          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-negative"
                          onClick={() => removeStock.mutate(item.id)}
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Create */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New watchlist</DialogTitle>
            <DialogDescription>Give it a name you'll recognise at a glance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="wl-name">Name</Label>
            <Input
              id="wl-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Core holdings"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => create.mutate()}
              disabled={!newName.trim() || create.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename */}
      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename watchlist</DialogTitle>
            <DialogDescription>This only changes the label, not its contents.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="wl-rename">Name</Label>
            <Input
              id="wl-rename"
              value={renaming?.name ?? ""}
              onChange={(e) => setRenaming((r) => (r ? { ...r, name: e.target.value } : r))}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => rename.mutate()}
              disabled={!renaming?.name.trim() || rename.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add stock */}
      <Dialog open={adding !== null} onOpenChange={(open) => !open && setAdding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a stock</DialogTitle>
            <DialogDescription>
              Enter a ticker, or pick one PulseIQ already tracks signals for.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ticker">Ticker</Label>
              <Input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="num"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company name</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Apple Inc."
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(known.data ?? []).map((k) => (
              <button
                key={k.ticker}
                type="button"
                className="num rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                onClick={() => {
                  setTicker(k.ticker);
                  setCompany(k.company_name);
                }}
              >
                {k.ticker}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => addStock.mutate()}
              disabled={!ticker.trim() || addStock.isPending}
            >
              Add stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
