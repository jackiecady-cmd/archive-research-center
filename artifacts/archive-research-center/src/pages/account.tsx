import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCircle, Mail, Key, CreditCard, Pencil } from "lucide-react";
import { Link } from "wouter";

const EDITOR_KEY = "arc_editor_mode";

function dispatchEditorChange() {
  window.dispatchEvent(new Event("arc_editor_mode_change"));
}

export function AccountPage() {
  const [editorMode, setEditorMode] = useState(() => {
    try { return localStorage.getItem(EDITOR_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    const handler = () => setEditorMode(localStorage.getItem(EDITOR_KEY) === "1");
    window.addEventListener("arc_editor_mode_change", handler);
    return () => window.removeEventListener("arc_editor_mode_change", handler);
  }, []);

  const toggleEditorMode = () => {
    const next = !editorMode;
    try { localStorage.setItem(EDITOR_KEY, next ? "1" : "0"); } catch {}
    setEditorMode(next);
    dispatchEditorChange();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-serif text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile, credentials, and preferences.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><UserCircle className="h-5 w-5" /> Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input defaultValue="Scholar" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input defaultValue="User" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Institutional Affiliation (Optional)</label>
                <Input placeholder="e.g. University of Oxford or Independent" />
              </div>
              <Button>Save Profile</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Mail className="h-5 w-5" /> Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input defaultValue="scholar@example.com" type="email" />
              </div>
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">Password</div>
                  <div className="text-xs text-muted-foreground">Last changed 3 months ago</div>
                </div>
                <Button variant="outline" size="sm" className="self-start sm:self-auto"><Key className="h-4 w-4 mr-2" /> Update</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="bg-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Membership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage your billing, view past invoices, or upgrade your access tier.
              </p>
              <Button asChild className="w-full">
                <Link href="/membership">Manage Subscription</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Editor Mode — mock role toggle for demonstration */}
          <Card className={editorMode ? "border-amber-400/60 bg-amber-50/30 dark:bg-amber-950/20" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pencil className={`h-4 w-4 ${editorMode ? "text-amber-600" : "text-muted-foreground"}`} />
                Editor Mode
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Enables the original-language text edit panel on source records. Demo feature — no real authentication required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`text-xs px-3 py-2 rounded border font-medium ${
                editorMode
                  ? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300"
                  : "bg-secondary border-border text-muted-foreground"
              }`}>
                {editorMode ? "✓ Editor mode active" : "Editor mode off"}
              </div>
              <Button
                variant={editorMode ? "destructive" : "outline"}
                size="sm"
                className="w-full"
                onClick={toggleEditorMode}
              >
                {editorMode ? "Disable Editor Mode" : "Enable Editor Mode"}
              </Button>
              {editorMode && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Open any source record to add or update its original-language text. Changes are saved immediately to the database.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
