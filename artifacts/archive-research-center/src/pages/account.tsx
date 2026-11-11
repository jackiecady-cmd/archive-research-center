import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, Mail, CreditCard, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";

const ROLE_LABEL = {
  user: "Researcher",
  editor: "Editor",
  admin: "Administrator",
} as const;

export function AccountPage() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-sm text-muted-foreground">Loading account…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 space-y-4 text-center">
        <h1 className="font-serif text-3xl">Account</h1>
        <p className="text-sm text-muted-foreground">Sign in to see your account and role.</p>
        <div className="flex justify-center gap-3">
          <Button asChild><Link href="/sign-in">Sign in</Link></Button>
          <Button variant="outline" asChild><Link href="/sign-up">Create account</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Account</h1>
          <p className="text-muted-foreground mt-2">Signed in as {user.displayName}.</p>
        </div>
        <Button variant="outline" onClick={() => { void logout(); }}>Sign out</Button>
      </header>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><UserCircle className="h-5 w-5" /> Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Display name</div>
                <div className="font-medium">{user.displayName}</div>
              </div>
              <div>
                <div className="text-muted-foreground flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</div>
                <div className="font-medium">{user.email}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Role</CardTitle>
              <CardDescription>{ROLE_LABEL[user.role]}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {user.role === "user"
                ? "Catalog edits are limited to editor and administrator accounts."
                : "You can edit catalog records, including original-language text, provenance, and rights."}
            </CardContent>
          </Card>
          <Card className="bg-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Membership</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/membership">View plans</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
