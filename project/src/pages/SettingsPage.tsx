import { useState, type FormEvent } from "react";
import { User as UserIcon, Target, LogOut, Save } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Input, Button, Label } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { getInitials } from "@/lib/utils";

export function SettingsPage() {
  const { appUser, user, signOut, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(appUser?.display_name || "");
  const [focusTarget, setFocusTarget] = useState(appUser?.focus_target_minutes || 120);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      if (!supabase || !user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          focus_target_minutes: focusTarget,
        })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold text-text-primary">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader title="Profile" icon={<UserIcon size={14} />} />
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent-green/15 border border-accent-green/30 flex items-center justify-center text-lg font-semibold text-accent-green">
              {getInitials(displayName || appUser?.email || "U")}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{displayName || "Your name"}</p>
              <p className="text-xs text-text-muted">{appUser?.email || user?.email}</p>
            </div>
          </div>

          <div>
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>

          <div>
            <Label>Daily focus target (minutes)</Label>
            <Input
              type="number"
              value={focusTarget}
              onChange={(e) => setFocusTarget(Number(e.target.value) || 120)}
              min={15}
              max={600}
            />
            <p className="text-[11px] text-text-muted mt-1">
              This target appears on your dashboard and focus timer.
            </p>
          </div>

          {error && (
            <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {saved && (
            <div className="text-xs text-accent-green bg-accent-green/10 border border-accent-green/20 rounded-lg px-3 py-2">
              Settings saved successfully.
            </div>
          )}

          <Button type="submit" disabled={saving}>
            <Save size={14} /> {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader title="Account" icon={<Target size={14} />} />
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-text-primary">Email</p>
              <p className="text-xs text-text-muted">{appUser?.email || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border-primary">
            <div>
              <p className="text-sm text-text-primary">Account ID</p>
              <p className="text-xs text-text-muted font-mono">{user?.id?.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="pt-3 border-t border-border-primary">
            <Button
              variant="danger"
              onClick={() => signOut()}
            >
              <LogOut size={14} /> Sign out
            </Button>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="p-4">
        <p className="text-xs text-text-muted leading-relaxed">
          NOIRFLOW · Your life, in focus. A premium life management dashboard for tasks, habits, focus, and analytics.
        </p>
      </Card>
    </div>
  );
}
