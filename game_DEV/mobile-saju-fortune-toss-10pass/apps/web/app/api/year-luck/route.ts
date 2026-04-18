import { NextResponse } from 'next/server';
import { computeFourPillars, computeSaeunForYear } from '@saju/core';
import { z } from 'zod';
import { parseBirthInput } from '../../../lib/birthInputSchema';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  birthInput: z.unknown(),
  solarYear: z.number().int().min(1900).max(2100),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = bodySchema.parse(await request.json());
    const birthInput = parseBirthInput(body.birthInput);
    const fourPillars = computeFourPillars(birthInput);
    const cycle = computeSaeunForYear(fourPillars, body.solarYear);

    return NextResponse.json({
      solarYear: body.solarYear,
      cycle,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
