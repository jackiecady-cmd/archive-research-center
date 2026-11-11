import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { submitAuth } from "@/lib/auth";

export function SignUpPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await submitAuth("/api/auth/register", { displayName, email, password });
    setPending(false);
    if (!result.ok) {
      const fieldMessage = result.fieldErrors
        ? Object.entries(result.fieldErrors).flatMap(([field, messages]) => (messages ?? []).map((message) => `${field}: ${message}`)).join(" ")
        : "";
      setError(fieldMessage || result.message);
      return;
    }
    queryClient.setQueryData(["auth", "me"], result.user);
    navigate("/account");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="displayName">Display name</label>
              <Input id="displayName" autoComplete="nickname" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <Input id="password" type="password" autoComplete="new-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required />
              <p className="text-xs text-muted-foreground">At least 10 characters.</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>{pending ? "Creating account…" : "Create account"}</Button>
            <p className="text-sm text-muted-foreground">
              Already registered? <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
