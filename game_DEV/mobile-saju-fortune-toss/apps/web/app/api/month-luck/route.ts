import { NextResponse } from 'next/server';
import { computeFourPillars, computeMonthLuckForYearMonth } from '@saju/core';
import { z } from 'zod';
import { parseBirthInput } from '../../../lib/birthInputSchema';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  birthInput: z.unknown(),
  solarYear: z.number().int().min(1900).max(2100),
  solarMonth: z.number().int().min(1).max(12),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = bodySchema.parse(await request.json());
    const birthInput = parseBirthInput(body.birthInput);

    const natal = computeFourPillars(birthInput);
    const cycle = computeMonthLuckForYearMonth(natal, body.solarYear, body.solarMonth);

    return NextResponse.json({
      solarYear: body.solarYear,
      solarMonth: body.solarMonth,
      anchor: cycle.anchor,
      cycle: {
        pillar: cycle.pillar,
        tenGodToDayMaster: cycle.tenGodToDayMaster,
        element: cycle.element,
        tags: cycle.tags,
        notes: cycle.notes,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

