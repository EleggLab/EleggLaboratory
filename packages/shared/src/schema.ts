import { z } from "zod";
import { AD_TAGS, PRICE_OPTIONS, STOCK_DEFINITIONS } from "./config";

const priceOptionSchema = z.union(
  PRICE_OPTIONS.map((value) => z.literal(value)) as [
    z.ZodLiteral<1>,
    z.ZodLiteral<2>,
    z.ZodLiteral<3>,
    z.ZodLiteral<4>,
    z.ZodLiteral<5>,
  ],
);

const adTagSchema = z.enum(AD_TAGS);
const stockIdSchema = z.enum(STOCK_DEFINITIONS.map((stock) => stock.id) as ["A", "B", "C", "D", "E"]);
const phaseTypeSchema = z.enum(["overall", "round"]);
const targetTypeSchema = z.enum(["single", "tag", "market"]);
const infoTypeSchema = z.enum(["up", "down", "compare", "exact"]);

export const createRoomBodySchema = z.object({
  nickname: z.string().trim().min(1).max(12),
});

export const joinRoomBodySchema = createRoomBodySchema.extend({
  playerToken: z.string().trim().min(8).optional(),
});

export const startGameBodySchema = z.object({
  playerToken: z.string().trim().min(8),
});

export const clientActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hello"), playerToken: z.string().min(8) }),
  z.object({ type: z.literal("startGame"), playerToken: z.string().min(8) }),
  z.object({
    type: z.literal("placeSellOrder"),
    playerToken: z.string().min(8),
    hintId: z.string().min(4),
    price: priceOptionSchema,
    adTag: adTagSchema,
  }),
  z.object({
    type: z.literal("cancelSellOrder"),
    playerToken: z.string().min(8),
    orderId: z.string().min(4),
  }),
  z.object({
    type: z.literal("placeBuyRequest"),
    playerToken: z.string().min(8),
    phaseType: phaseTypeSchema,
    targetType: targetTypeSchema,
    infoType: infoTypeSchema,
    price: priceOptionSchema,
  }),
  z.object({
    type: z.literal("cancelBuyRequest"),
    playerToken: z.string().min(8),
    requestId: z.string().min(4),
  }),
  z.object({
    type: z.literal("fulfillBuyRequest"),
    playerToken: z.string().min(8),
    requestId: z.string().min(4),
    hintId: z.string().min(4),
  }),
  z.object({
    type: z.literal("buySellOrder"),
    playerToken: z.string().min(8),
    orderId: z.string().min(4),
  }),
  z.object({
    type: z.literal("buyStock"),
    playerToken: z.string().min(8),
    stockId: stockIdSchema,
  }),
  z.object({
    type: z.literal("sellStock"),
    playerToken: z.string().min(8),
    stockId: stockIdSchema,
  }),
  z.object({
    type: z.literal("endTurn"),
    playerToken: z.string().min(8),
  }),
  z.object({
    type: z.literal("leaveRoom"),
    playerToken: z.string().min(8),
  }),
  z.object({
    type: z.literal("ping"),
    playerToken: z.string().min(8),
    now: z.number(),
  }),
]);
