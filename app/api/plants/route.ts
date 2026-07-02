import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth';
import { getPlantsByCompany } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext();

    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plants = await getPlantsByCompany(userContext.companyId);

    return NextResponse.json({
      plants,
      count: plants.length,
    });
  } catch (error) {
    console.error('[v0] Error fetching plants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
