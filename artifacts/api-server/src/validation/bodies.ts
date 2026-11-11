import { z } from "zod/v4";
import { PUBLIC_FORUM_CATEGORIES } from "@workspace/db";

export const reasonBody = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const compCodeCreateBody = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  singleUse: z.boolean().optional(),
});

export const redeemCodeBody = z.object({
  code: z.string().trim().min(8).max(120),
});

export const delegateBody = z.object({
  email: z.email().trim().max(200),
});

export const incidentResolveBody = z.object({
  status: z.enum(["reviewed", "dismissed"]),
});

export const prefillCheckBody = z.object({
  sourceId: z.number().int().positive(),
  originalText: z.string().max(20_000),
});

export const serviceAccountBody = z.object({
  email: z.email().trim().max(200),
  displayName: z.string().trim().min(1).max(80),
});

export const roomCreateBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
});

export const roomInviteBody = z.object({
  expiresAt: z.iso.datetime().nullable().optional(),
});

export const roomPostBody = z.object({
  content: z.string().trim().min(1).max(20_000),
});

export const forumThreadUpdateBody = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(20_000).optional(),
  })
  .refine((value) => value.title !== undefined || value.content !== undefined, {
    message: "Provide a title or the post body",
  });

export const forumReplyUpdateBody = z.object({
  content: z.string().trim().min(1).max(20_000),
});

export const recommendBody = z.object({
  researcherType: z.string().trim().min(1).max(40),
  interests: z.array(z.string().trim().max(80)).max(20).optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export function isPublicCategory(value: string): boolean {
  return (PUBLIC_FORUM_CATEGORIES as readonly string[]).includes(value);
}
