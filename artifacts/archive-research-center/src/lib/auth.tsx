import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export type AuthUser = {
  id: number;
  email: string;
  displayName: string;
  role: "user" | "editor" | "moderator" | "admin";
  entitlement: "free" | "paid" | "comp";
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text) as unknown;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.status === 401) return null;
      if (!response.ok) throw new Error("Could not load the current account");
      return (await response.json()) as AuthUser;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  }, [queryClient]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    queryClient.setQueryData(["auth", "me"], null);
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: query.data ?? null,
      loading: query.isLoading,
      refresh,
      logout,
    }),
    [query.data, query.isLoading, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

export function canEditCatalog(user: AuthUser | null): boolean {
  return user?.role === "editor" || user?.role === "admin";
}

export function RequireAuth({ children, message }: { children: ReactNode; message?: string }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-sm text-muted-foreground">Loading account…</div>;
  }
  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 space-y-4 text-center">
        <h1 className="font-serif text-3xl">Sign in to continue</h1>
        <p className="text-sm text-muted-foreground">
          {message ?? "Research projects, notes, claim cards, and translation workspaces belong to your account."}
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild><Link href="/sign-in">Sign in</Link></Button>
          <Button variant="outline" asChild><Link href="/sign-up">Create account</Link></Button>
        </div>
      </div>
    );
  }
  return children;
}

export async function submitAuth(
  path: "/api/auth/register" | "/api/auth/login",
  body: Record<string, string>,
): Promise<{ ok: true; user: AuthUser } | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> }> {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJson(response);
  if (!response.ok) {
    const record = data && typeof data === "object" ? data as { error?: string; fieldErrors?: Record<string, string[] | undefined> } : {};
    return {
      ok: false,
      message: record.error || "Request failed",
      fieldErrors: record.fieldErrors,
    };
  }
  return { ok: true, user: data as AuthUser };
}
