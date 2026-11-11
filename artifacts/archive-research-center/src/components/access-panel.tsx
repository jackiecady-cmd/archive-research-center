import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { apiError, apiSend } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type CompCodeRow = {
  id: number;
  hint: string;
  label: string | null;
  singleUse: boolean;
  revokedAt: string | null;
  redeemedCount: number;
};

type IncidentRow = {
  id: number;
  codeHint: string;
  attemptingName: string;
  attemptingEmail: string;
  ip: string;
  userAgent: string;
  status: string;
  createdAt: string;
};

type AuditRow = {
  id: number;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
};

export function AccessPanel() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [minted, setMinted] = useState<string | null>(null);
  const [delegateEmail, setDelegateEmail] = useState("");
  const [botEmail, setBotEmail] = useState("");
  const [botName, setBotName] = useState("");
  const [botToken, setBotToken] = useState<string | null>(null);

  const incidents = useQuery({
    queryKey: ["comp-incidents"],
    enabled: user?.compStaff === true,
    queryFn: async () => {
      const result = await apiSend("/api/comp-code-incidents");
      if (!result.ok) throw new Error(apiError(result.json, "Could not load comp alerts"));
      return result.json as IncidentRow[];
    },
  });

  const codes = useQuery({
    queryKey: ["comp-codes"],
    enabled: user?.role === "admin",
    queryFn: async () => {
      const result = await apiSend("/api/comp-codes");
      if (!result.ok) throw new Error(apiError(result.json, "Could not load codes"));
      return result.json as CompCodeRow[];
    },
  });

  const delegate = useQuery({
    queryKey: ["comp-delegate"],
    enabled: user?.role === "admin",
    queryFn: async () => {
      const result = await apiSend("/api/comp-delegates");
      if (!result.ok) throw new Error(apiError(result.json, "Could not load the delegate"));
      return result.json as { delegate: { email: string; displayName: string } | null };
    },
  });

  const audit = useQuery({
    queryKey: ["moderation-audit"],
    enabled: user?.role === "admin",
    queryFn: async () => {
      const result = await apiSend("/api/moderation/audit");
      if (!result.ok) throw new Error(apiError(result.json, "Could not load the audit log"));
      return result.json as AuditRow[];
    },
  });

  const resolveIncident = async (id: number, status: "reviewed" | "dismissed") => {
    const result = await apiSend(`/api/comp-code-incidents/${id}/resolve`, { method: "POST", body: { status } });
    if (!result.ok) {
      toast({ title: apiError(result.json, "Could not update that alert") });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["comp-incidents"] });
    await queryClient.invalidateQueries({ queryKey: ["comp-incidents-unread"] });
  };

  useEffect(() => {
    if (!incidents.data) return;
    void queryClient.invalidateQueries({ queryKey: ["comp-incidents-unread"] });
  }, [incidents.data, queryClient]);

  const redeem = async (event: FormEvent) => {
    event.preventDefault();
    const result = await apiSend("/api/comp-codes/redeem", { method: "POST", body: { code: code.trim() } });
    if (!result.ok) {
      toast({ title: apiError(result.json, "That code could not be redeemed") });
      return;
    }
    setCode("");
    toast({ title: "Comp access is on for this account" });
    await refresh();
  };

  const createCode = async (event: FormEvent) => {
    event.preventDefault();
    const result = await apiSend("/api/comp-codes", { method: "POST", body: { label: label.trim() || undefined } });
    if (!result.ok) {
      toast({ title: apiError(result.json, "Could not create a code") });
      return;
    }
    setMinted((result.json as { code: string }).code);
    setLabel("");
    await queryClient.invalidateQueries({ queryKey: ["comp-codes"] });
  };

  const revoke = async (id: number) => {
    const result = await apiSend(`/api/comp-codes/${id}/revoke`, { method: "POST", body: {} });
    if (!result.ok) {
      toast({ title: apiError(result.json, "Could not revoke that code") });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["comp-codes"] });
  };

  const designate = async (event: FormEvent) => {
    event.preventDefault();
    const result = await apiSend("/api/comp-delegates", { method: "POST", body: { email: delegateEmail.trim() } });
    if (!result.ok) {
      toast({ title: apiError(result.json, "Could not designate a delegate") });
      return;
    }
    setDelegateEmail("");
    await queryClient.invalidateQueries({ queryKey: ["comp-delegate"] });
  };

  const clearDelegate = async () => {
    const result = await apiSend("/api/comp-delegates", { method: "DELETE" });
    if (!result.ok) {
      toast({ title: apiError(result.json, "Could not revoke the delegate") });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["comp-delegate"] });
  };

  const createBot = async (event: FormEvent) => {
    event.preventDefault();
    const result = await apiSend("/api/moderation/service-accounts", {
      method: "POST",
      body: { email: botEmail.trim(), displayName: botName.trim() },
    });
    if (!result.ok) {
      toast({ title: apiError(result.json, "Could not create the moderator account") });
      return;
    }
    setBotToken((result.json as { token: string }).token);
    setBotEmail("");
    setBotName("");
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Comp code</CardTitle>
          <CardDescription>
            A comp lasts until an administrator revokes it and overrides every other access level. The code stays with the first account that redeems it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={redeem}>
            <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="ARC-…" className="font-mono" />
            <Button type="submit" disabled={code.trim().length < 8}>Redeem</Button>
          </form>
        </CardContent>
      </Card>

      {user.compStaff ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Comp code alerts</CardTitle>
            <CardDescription>
              Another account tried a code that is already bound. The holder keeps access. Only an administrator and the comp delegate can see this list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {incidents.data?.length === 0 ? <p className="text-muted-foreground">No alerts.</p> : null}
            {incidents.data?.map((row) => (
              <div key={row.id} className="border-b border-border pb-3 space-y-1">
                <div className="font-medium">
                  ····{row.codeHint} · {row.attemptingName} · {row.status}
                </div>
                <div className="text-muted-foreground">
                  {row.attemptingEmail} · {new Date(row.createdAt).toLocaleString()}
                </div>
                <div className="text-muted-foreground break-all">IP {row.ip} · {row.userAgent}</div>
                {row.status === "open" ? (
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => { void resolveIncident(row.id, "reviewed"); }}>Reviewed</Button>
                    <Button variant="outline" size="sm" onClick={() => { void resolveIncident(row.id, "dismissed"); }}>Dismiss</Button>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {user.role === "admin" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Issue a comp code</CardTitle>
              <CardDescription>Codes are single-use unless you later build a multi-use option. Only the hint is stored after you leave this page. At most one delegate may also issue codes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="flex flex-col sm:flex-row gap-3" onSubmit={createCode}>
                <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Label, optional" />
                <Button type="submit">Create code</Button>
              </form>
              {minted ? <p className="text-sm">Copy this code now: <code className="font-mono">{minted}</code></p> : null}
              <ul className="space-y-2 text-sm">
                {codes.data?.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                    <span>····{row.hint} {row.label ? `· ${row.label}` : ""} · {row.redeemedCount} redeemed {row.revokedAt ? "· revoked" : ""}</span>
                    {row.revokedAt ? null : <Button variant="outline" size="sm" onClick={() => { void revoke(row.id); }}>Revoke</Button>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Comp delegate</CardTitle>
              <CardDescription>
                {delegate.data?.delegate
                  ? `${delegate.data.delegate.displayName} (${delegate.data.delegate.email}) can create codes.`
                  : "No delegate is designated."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form className="flex flex-col sm:flex-row gap-3" onSubmit={designate}>
                <Input type="email" value={delegateEmail} onChange={(event) => setDelegateEmail(event.target.value)} placeholder="member@example.com" />
                <Button type="submit">Designate</Button>
              </form>
              {delegate.data?.delegate ? <Button variant="outline" onClick={() => { void clearDelegate(); }}>Revoke delegate</Button> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Moderator service account</CardTitle>
              <CardDescription>The token is for a server-side moderator. It is not a browser session, and it is shown only once.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form className="space-y-3" onSubmit={createBot}>
                <Input type="email" value={botEmail} onChange={(event) => setBotEmail(event.target.value)} placeholder="bot@archive.local" required />
                <Input value={botName} onChange={(event) => setBotName(event.target.value)} placeholder="Display name" required />
                <Button type="submit">Create moderator</Button>
              </form>
              {botToken ? <p className="text-sm break-all">Token: <code className="font-mono">{botToken}</code></p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Moderation audit</CardTitle>
              <CardDescription>Visible to administrators. Every hide, lock, suspension, and comp change is recorded.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {audit.data?.length === 0 ? <p className="text-muted-foreground">No moderation events yet.</p> : null}
              {audit.data?.slice(0, 30).map((row) => (
                <div key={row.id} className="border-b border-border pb-2">
                  <div className="font-medium">{row.action} on {row.targetType} {row.targetId}</div>
                  <div className="text-muted-foreground">{row.actorName} · {new Date(row.createdAt).toLocaleString()}{row.reason ? ` · ${row.reason}` : ""}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
