import { z } from "zod";

const base64ChunkSchema = z.string().min(4);

export const projectSchema = z.object({
  id: z.string().trim().min(3),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(80),
  active: z.boolean(),
  defaultPromptHint: z.string().trim().max(500).optional(),
});

export const projectUpsertBodySchema = projectSchema.extend({
  id: projectSchema.shape.id.optional(),
});

export const createEntryImageInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(3).max(120),
  dataBase64: base64ChunkSchema,
});

export const createEntryBodySchema = z.object({
  projectId: z.string().trim().min(3),
  text: z.string().max(10000).default(""),
  images: z.array(createEntryImageInputSchema).max(12).default([]),
  source: z.literal("manual").default("manual"),
});

export const listEntriesQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  projectId: z.string().trim().min(3).optional(),
});

export const generateDraftBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const projectDraftSchema = z.object({
  projectId: z.string().trim().min(3),
  projectName: z.string().trim().min(1).max(80),
  body: z.string().min(1),
  sourceEntryIds: z.array(z.string().trim().min(3)),
});

export const notionTargetsSchema = z.object({
  overallPageId: z.string().trim().min(3).optional(),
  overallPageUrl: z.string().trim().url().optional(),
  projectPageIds: z.record(z.string(), z.string()),
  projectPageUrls: z.record(z.string(), z.string()),
});

export const draftBundleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generatedAt: z.string().datetime(),
  sourceEntryIds: z.array(z.string().trim().min(3)),
  overallDraft: z.string().min(1),
  projectDrafts: z.array(projectDraftSchema),
  previewHtml: z.string().default(""),
  notionTargets: notionTargetsSchema,
  revisionCount: z.number().int().min(0),
});

export const refineDraftBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overallDraft: z.string().min(1),
  projectDrafts: z.array(projectDraftSchema),
});

export const notionBootstrapBodySchema = z.object({
  token: z.string().trim().min(10),
  parentPageIdOrUrl: z.string().trim().min(10),
  forceRecreate: z.boolean().default(false),
});

export const publishDraftBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateSettingsBodySchema = z.object({
  defaultProjectId: z.string().trim().min(3).optional(),
});
