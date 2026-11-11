import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiError, apiSend } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type Room = {
  id: number;
  ownerUserId: number;
  name: string;
  description: string | null;
  locked: boolean;
  hidden: boolean;
};

type RoomPost = {
  id: number;
  userId: number;
  authorName: string;
  content: string;
  createdAt: string;
};

type Member = {
  userId: number;
  displayName: string;
  memberRole: string;
};

export function RoomsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [invite, setInvite] = useState<string | null>(null);

  const rooms = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const result = await apiSend("/api/rooms");
      if (!result.ok) throw new Error(apiError(result.json, "Could not load rooms"));
      return result.json as Room[];
    },
  });

  const detail = useQuery({
    queryKey: ["rooms", openId],
    enabled: openId !== null,
    queryFn: async () => {
      const [posts, members] = await Promise.all([
        apiSend(`/api/rooms/${openId}/posts`),
        apiSend(`/api/rooms/${openId}/members`),
      ]);
      if (!posts.ok || !members.ok) throw new Error("This room is not available");
      return { posts: posts.json as RoomPost[], members: members.json as Member[] };
    },
  });

  const createRoom = async (event: FormEvent) => {
    event.preventDefault();
    const result = await apiSend("/api/rooms", { method: "POST", body: { name, description } });
    if (!result.ok) {
      toast({ title: apiError(result.json, "Could not create the room") });
      return;
    }
    setName("");
    setDescription("");
    await queryClient.invalidateQueries({ queryKey: ["rooms"] });
  };

  const join = async (event: FormEvent) => {
    event.preventDefault();
    const result = await apiSend("/api/rooms/join", { method: "POST", body: { code: joinCode.trim() } });
    if (!result.ok) {
      toast({ title: apiError(result.json, "Could not join") });
      return;
    }
    setJoinCode("");
    setOpenId((result.json as Room).id);
    await queryClient.invalidateQueries({ queryKey: ["rooms"] });
  };

  const post = async () => {
    if (!openId || !draft.trim()) return;
    const result = await apiSend(`/api/rooms/${openId}/posts`, { method: "POST", body: { content: draft } });
    if (!result.ok) {
      toast({ title: apiError(result.json, "Could not post") });
      return;
    }
    setDraft("");
    await queryClient.invalidateQueries({ queryKey: ["rooms", openId] });
  };

  const createInvite = async () => {
    if (!openId) return;
    const result = await apiSend(`/api/rooms/${openId}/invites`, { method: "POST", body: {} });
    if (!result.ok) {
      toast({ title: apiError(result.json, "Could not create an invitation") });
      return;
    }
    setInvite((result.json as { code: string }).code);
  };

  const removeMember = async (userId: number) => {
    if (!openId) return;
    const result = await apiSend(`/api/rooms/${openId}/members/${userId}`, { method: "DELETE" });
    if (!result.ok) {
      toast({ title: apiError(result.json, "Could not remove that member") });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["rooms", openId] });
  };

  const openRoom = rooms.data?.find((room) => room.id === openId) ?? null;
  const isOwner = Boolean(user && openRoom && openRoom.ownerUserId === user.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif flex items-center gap-3"><Lock className="h-7 w-7 text-primary" /> Private rooms</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          A private room is invisible to anyone who has not been invited. The owner manages members. Invitations can be revoked.
          By default only paid or comp access can join. That members-only rule is an open question and can be relaxed with a server flag.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Open a room</CardTitle>
            <CardDescription>You become the owner.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createRoom}>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Room name" required />
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this room for?" rows={3} />
              <Button type="submit" disabled={!name.trim()}>Create room</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Join with an invitation</CardTitle>
            <CardDescription>Paste the code the owner sent you.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={join}>
              <Input value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="ROOM-…" required />
              <Button type="submit">Join room</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Your rooms</h2>
        {rooms.isLoading ? <p className="text-sm text-muted-foreground">Loading rooms…</p> : null}
        {rooms.data?.length === 0 ? <p className="text-sm text-muted-foreground">You are not in a private room yet.</p> : null}
        <div className="space-y-2">
          {rooms.data?.map((room) => (
            <button key={room.id} type="button" onClick={() => { setOpenId(room.id); setInvite(null); }} className="w-full text-left">
              <Card className={openId === room.id ? "border-primary" : ""}>
                <CardContent className="p-4">
                  <div className="font-medium">{room.name}</div>
                  {room.description ? <div className="text-sm text-muted-foreground mt-1">{room.description}</div> : null}
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </section>

      {openRoom ? (
        <section className="space-y-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">{openRoom.name}</h2>
            {isOwner ? <Button variant="outline" onClick={() => { void createInvite(); }}>Create invitation</Button> : null}
          </div>
          {invite ? (
            <p className="text-sm">Invitation code, shown once: <code className="font-mono">{invite}</code></p>
          ) : null}
          <div className="grid md:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-3">
              {detail.data?.posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs text-muted-foreground">{post.authorName} · {new Date(post.createdAt).toLocaleString()}</div>
                    <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                  </CardContent>
                </Card>
              ))}
              {openRoom.locked ? (
                <p className="text-sm text-muted-foreground">This room is locked.</p>
              ) : (
                <div className="space-y-2">
                  <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} placeholder="Write to the room" />
                  <Button onClick={() => { void post(); }} disabled={!draft.trim()}>Post</Button>
                </div>
              )}
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-serif">Members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detail.data?.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between gap-2 text-sm">
                    <span>{member.displayName} <span className="text-muted-foreground">({member.memberRole})</span></span>
                    {isOwner && member.userId !== user?.id ? (
                      <Button variant="outline" size="sm" onClick={() => { void removeMember(member.userId); }}>Remove</Button>
                    ) : null}
                  </div>
                ))}
                <Link href="/commons" className="text-xs text-muted-foreground underline">Public discussions stay in the Commons</Link>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}
    </div>
  );
}
