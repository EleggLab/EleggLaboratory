import { NextResponse } from 'next/server';
import { compareCharts } from '@saju/core';
import { parseBirthInput } from '../../../lib/birthInputSchema';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { a?: unknown; b?: unknown };
    if (!body || body.a === undefined || body.b === undefined) {
      return NextResponse.json({ error: 'a and b inputs are required.' }, { status: 400 });
    }

    const a = parseBirthInput(body.a);
    const b = parseBirthInput(body.b);
    const result = compareCharts(a, b);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
