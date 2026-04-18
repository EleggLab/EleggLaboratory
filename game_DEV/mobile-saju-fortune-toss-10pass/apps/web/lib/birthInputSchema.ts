import type { BirthInput } from '@saju/core';
import { z } from 'zod';

export const birthInputSchema = z.object({
  calendar: z.enum(['solar', 'lunar']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  isLeapMonth: z.boolean().optional(),
  timezone: z.string().default('Asia/Seoul'),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  location: z
    .object({
      name: z.string().optional(),
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
  options: z
    .object({
      yearPillarRule: z.enum(['ipchun', 'lunarNewYear', 'custom']).optional(),
      monthPillarRule: z.enum(['solarTerms', 'lunarMonth']).optional(),
      jaSiBoundaryRule: z.enum(['23-01_sameDay', '23-01_nextDay', 'configurable']).optional(),
      jaSiBoundaryHour: z.union([z.literal(0), z.literal(23)]).optional(),
      customYearBoundary: z
        .object({
          month: z.number().int().min(1).max(12),
          day: z.number().int().min(1).max(31),
        })
        .optional(),
      includeHiddenStems: z.boolean().optional(),
      hiddenStemWeights: z.enum(['dominant_only', 'all_weighted']).optional(),
      elementDistributionModel: z
        .enum(['stems_only', 'stems_branches', 'stems_branches_hidden'])
        .optional(),
      strengthModel: z.enum(['simple', 'advanced_v1']).optional(),
      luckComputationModel: z.enum(['simple', 'advanced_v1']).optional(),
      luckStartAge: z.number().int().optional(),
      applyLocalSolarTimeCorrection: z.boolean().optional(),
    })
    .optional(),
});

export function parseBirthInput(input: unknown): BirthInput {
  return birthInputSchema.parse(input) as BirthInput;
}
