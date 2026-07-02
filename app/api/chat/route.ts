import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth';
import { getPlantsByCompany, getHourlyMetrics } from '@/lib/supabase';
import { canAccessField } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    const { message, userContext } = await request.json();

    if (!message || !userContext) {
      return NextResponse.json(
        { error: 'Missing message or userContext' },
        { status: 400 }
      );
    }

    // Verify user context
    const currentUser = await getUserContext();
    if (!currentUser || currentUser.userId !== userContext.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's plants and recent data for context
    const plants = await getPlantsByCompany(userContext.companyId);
    const plantSummaries = [];

    for (const plant of plants.slice(0, 3)) {
      const today = new Date();
      const startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      try {
        const metrics = await getHourlyMetrics(plant.id, startDate, endDate);
        const avgEnergy =
          metrics.reduce((sum, m) => sum + m.energy_produced_kwh, 0) /
          (metrics.length || 1);
        const avgPower =
          metrics.reduce((sum, m) => sum + m.power_output_kw, 0) /
          (metrics.length || 1);

        plantSummaries.push({
          name: plant.name,
          avgEnergy: avgEnergy.toFixed(2),
          avgPower: avgPower.toFixed(2),
          capacity: plant.capacity_kw,
        });
      } catch (error) {
        console.error(`[v0] Error fetching metrics for ${plant.id}:`, error);
      }
    }

    // Build context string based on user role
    let contextStr = `User Role: ${userContext.role}\n`;
    contextStr += `Plant Data Context:\n`;
    plantSummaries.forEach((summary) => {
      contextStr += `- ${summary.name}: ${summary.avgEnergy} kWh/day, ${summary.avgPower} kW avg\n`;
    });

    // If operator, note financial data restrictions
    if (userContext.role === 'operator') {
      contextStr += `\nNote: User is an operator and cannot see financial data (costs, prices).\n`;
    }

    // Call AI Gateway or local LLM
    const systemPrompt = `You are a helpful AI assistant for a solar energy company called SolarSolutions (InvertixAI). You help operators and admins monitor and analyze their solar plant performance.

${contextStr}

Guidelines:
- Provide insights about energy production, power output, temperature, irradiance, and insolation.
- If the user asks about financial data (costs, prices) and they are an operator, politely inform them that this data is restricted to admins.
- Keep responses concise and actionable.
- Always acknowledge the company's role as a renewable energy provider.
- Be helpful and professional.`;

    // For now, return a simulated response
    // In production, you would call an actual LLM API
    const response = generateResponse(message, userContext.role, plantSummaries);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('[v0] Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateResponse(
  message: string,
  role: string,
  plantSummaries: any[]
): string {
  const messageLower = message.toLowerCase();

  // Simple pattern matching for demo
  if (
    messageLower.includes('hello') ||
    messageLower.includes('hi') ||
    messageLower.includes('greetings')
  ) {
    return `Hello! I'm InvertixAI, your solar operations assistant. I can help you analyze your plant performance and answer questions about energy production, power output, and other metrics. ${role === 'admin' ? 'As an admin, you also have access to financial data.' : 'As an operator, you can view operational metrics like energy, power, temperature, and irradiance.'}`;
  }

  if (
    messageLower.includes('energy') ||
    messageLower.includes('production')
  ) {
    const totalEnergy = plantSummaries
      .reduce((sum: number, p: any) => sum + parseFloat(p.avgEnergy), 0)
      .toFixed(2);
    return `Based on the last 24 hours, your plants produced an average of ${totalEnergy} kWh total across all facilities. ${plantSummaries.map((p: any) => `${p.name}: ${p.avgEnergy} kWh`).join(', ')}.`;
  }

  if (messageLower.includes('power')) {
    const totalPower = plantSummaries
      .reduce((sum: number, p: any) => sum + parseFloat(p.avgPower), 0)
      .toFixed(2);
    return `Your plants are currently outputting an average of ${totalPower} kW. This represents good performance for your installed capacity of ${plantSummaries.reduce((sum: number, p: any) => sum + p.capacity, 0)} kW.`;
  }

  if (
    messageLower.includes('cost') ||
    messageLower.includes('price') ||
    messageLower.includes('financial')
  ) {
    if (role === 'operator') {
      return 'I apologize, but financial data including costs and energy prices are restricted to administrators. Please contact your admin if you need this information.';
    }
    return 'Financial data is available for your account. Please check the dedicated financial reports section for detailed cost and pricing information.';
  }

  if (messageLower.includes('help') || messageLower.includes('?')) {
    return `I can help you with:
- Energy production analysis
- Power output monitoring
- Plant performance comparison
${role === 'admin' ? '- Financial data and cost analysis' : ''}
- Temperature, irradiance, and insolation metrics

What would you like to know about your solar operations?`;
  }

  return `I'm analyzing your solar operations data. Based on your ${plantSummaries.length} plants, everything appears to be operating normally. Is there a specific metric or plant you'd like me to focus on?`;
}
