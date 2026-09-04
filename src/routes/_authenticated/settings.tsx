import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { allItemsQuery, profileQuery, updateProfile, watchlistsQuery } from "@/lib/api";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PulseIQ" },
      { name: "description", content: "Manage your PulseIQ profile, password and session." },
      { property: "og:title", content: "Settings — PulseIQ" },
      { property: "og:description", content: "Manage your PulseIQ account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const profile = useQuery(profileQuery(user.id));
  const lists = useQuery(watchlistsQuery());
  const items = useQuery(allItemsQuery());

  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profile.data?.full_name) setFullName(profile.data.full_name);
  }, [profile.data?.full_name]);

  const saveProfile = useMutation({
    mutationFn: () => updateProfile(user.id, { full_name: fullName.trim() }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      } as Parameters<typeof supabase.auth.updateUser>[0]);
      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account and how PulseIQ knows you." />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <section className="panel p-5">
            <h2 className="text-[15px] font-medium">Profile</h2>
            <div className="mt-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.data?.email ?? user.email ?? ""} disabled />
              </div>
              <Button
                onClick={() => saveProfile.mutate()}
                disabled={saveProfile.isPending || !fullName.trim()}
              >
                Save changes
              </Button>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="text-[15px] font-medium">Password</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Only applies to email and password sign-in.
            </p>
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="next">New password</Label>
                <Input
                  id="next"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => changePassword.mutate()}
              disabled={newPassword.length < 6 || changePassword.isPending}
            >
              Update password
            </Button>
          </section>

          <section className="panel p-5">
            <h2 className="text-[15px] font-medium">Session</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Sign out of PulseIQ on this device.
            </p>
            <Button className="mt-4" variant="outline" onClick={signOut}>
              Sign out
            </Button>
          </section>
        </div>

        <aside className="panel h-fit p-5">
          <div className="flex items-center gap-3">
            <span className="num flex size-10 items-center justify-center rounded-full bg-primary/15 text-[13px] font-medium text-primary">
              {initials(profile.data?.full_name ?? null, profile.data?.email ?? user.email ?? null)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">
                {profile.data?.full_name || "Unnamed investor"}
              </p>
              <p className="truncate text-[12.5px] text-muted-foreground">
                {profile.data?.email ?? user.email}
              </p>
            </div>
          </div>
          <dl className="mt-5 space-y-2 text-[13px]">
            <Row label="Watchlists" value={String(lists.data?.length ?? 0)} />
            <Row label="Companies tracked" value={String(items.data?.length ?? 0)} />
            <Row
              label="Member since"
              value={
                profile.data
                  ? new Date(profile.data.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"
              }
            />
          </dl>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}
