import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';

let genAI = null;
let runtimeKey = null;

const GEMINI_MODELS = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];

export function setApiKey(key) {
  if (key && typeof key === 'string' && key.trim()) {
    runtimeKey = key.trim();
    config.geminiApiKey = runtimeKey;
    genAI = new GoogleGenerativeAI(runtimeKey);
    return true;
  }
  return false;
}

function getClient() {
  const activeKey = runtimeKey || config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!activeKey) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(activeKey);
  }
  return genAI;
}

async function callGemini(prompt) {
  const client = getClient();
  if (!client) return null;

  for (const mName of GEMINI_MODELS) {
    try {
      const model = client.getGenerativeModel({ model: mName });
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini call timeout (12s)')), 12000))
      ]);
      const text = result?.response?.text();
      if (text && typeof text === 'string') return text;
    } catch (err) {
      console.warn(`Gemini candidate ${mName} skipped (${err.message.slice(0, 60)}), trying next candidate...`);
    }
  }
  return null;
}

/**
 * Generate AI explanation for a trip risk
 */
export async function explainTripRisk(tripData, riskAssessment) {
  const prompt = `You are MOVA, an AI mobility operations assistant. Analyze this trip and explain why it is at risk.

TRIP DATA:
- Trip: ${tripData.trip_id}
- Vehicle: ${tripData.vehicle_id}
- Route: ${tripData.origin_name} → ${tripData.destination_name}
- Distance: ${tripData.distance_km}km
- Progress: ${tripData.progress_percent}%
- Predicted Delay: ${tripData.predicted_delay_min} minutes
- Status: ${tripData.status}

RISK ASSESSMENT (Score: ${riskAssessment.overall}/100 - ${riskAssessment.level}):
${Object.entries(riskAssessment.breakdown).map(([k, v]) => `- ${k}: ${v} points`).join('\n')}

ACTIVE INCIDENTS: ${tripData.incidents?.map(i => i.title).join('; ') || 'None'}

Provide a concise 3-4 sentence explanation of why this trip is at risk and what factors are contributing most. Use precise language. Say "predicted" or "estimated" when referring to future outcomes. Do NOT claim certainty. Keep it under 150 words.`;

  try {
    const text = await callGemini(prompt);
    if (text) return text;
  } catch (err) {
    console.warn('Gemini trip risk error, falling back to MOVA engine:', err.message);
  }
  return getFallbackTripExplanation(tripData, riskAssessment);
}

/**
 * Generate AI recommendation explanation
 */
export async function generateRecommendation(context) {
  const prompt = `You are MOVA, an AI mobility operations assistant. Generate an operational recommendation.

CONTEXT:
- Scenario: ${context.scenario}
- Affected Vehicles: ${JSON.stringify(context.affectedVehicles)}
- Affected Deliveries: ${JSON.stringify(context.affectedDeliveries)}
- Current Risk Level: ${context.currentRisk}
- Available Alternatives: ${JSON.stringify(context.alternatives)}

DETERMINISTIC ANALYSIS RESULTS:
- Estimated time impact: ${context.timeImpact} minutes
- Estimated distance change: ${context.distanceImpact} km
- Estimated cost impact: ₹${context.costImpact}
- Risk reduction: ${context.riskReduction} points
- Confidence: ${context.confidence}%

Generate a JSON response with:
{
  "title": "Brief recommendation title",
  "description": "2-3 sentence description of the recommendation",
  "reasoning": "4-5 sentence explanation of WHY this recommendation is made, referencing specific data points",
  "steps": ["Step 1", "Step 2", ...]
}

Use "predicted", "estimated", "recommended" language. Do not claim certainty.`;

  try {
    const text = await callGemini(prompt);
    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return { title: context.scenario, description: text, reasoning: text, steps: [] };
    }
  } catch (err) {
    console.warn('Gemini recommendation error, falling back to MOVA engine:', err.message);
  }
  return getFallbackRecommendation(context);
}

/**
 * AI Assistant query
 */
export async function assistantQuery(question, contextData) {
  const prompt = `You are MOVA, an enterprise AI mobility operations assistant for freight fleets and smart logistics. Answer the operator's query using the real-time operational state provided below.

CURRENT OPERATIONAL STATE:
- Active Fleet Units: ${contextData.activeVehicles}
- Total Deliveries: ${contextData.totalDeliveries}
- In-Transit Deliveries: ${contextData.inTransitDeliveries}
- High-Risk Trips (Risk ≥ 60): ${contextData.atRiskTrips}
- Network On-Time Rate: ${contextData.onTimeRate}%
- Fleet Utilization: ${contextData.fleetUtilization}%
- Active Road Incidents: ${contextData.activeIncidents}

HIGH-RISK TRIPS:
${contextData.highRiskTrips?.map(t => `- ${t.trip_id} (${t.origin_name}→${t.destination_name}): Risk ${t.risk_score}/100, Predicted Delay +${t.predicted_delay_min}min, Cargo: Vehicle ${t.vehicle_code || t.vehicle_id}`).join('\n') || 'None currently.'}

ACTIVE INCIDENTS:
${contextData.incidentList?.map(i => `- [${i.incident_id}] ${i.title} (${i.severity}) at ${i.location_name}, +${i.predicted_delay_min}m delay`).join('\n') || 'None'}

ACTIVE RECOMMENDATIONS:
${contextData.recommendations?.map(r => `- ${r.title} (${r.priority})`).join('\n') || 'None'}

OPERATOR QUERY: "${question}"

Provide a concise, highly actionable response (under 180 words). Reference specific trip codes, vehicle IDs, or locations when relevant. Maintain a professional, executive command-center tone.`;

  try {
    const text = await callGemini(prompt);
    if (text) return { response: text, source: 'gemini' };
  } catch (err) {
    console.warn('Gemini assistant error, falling back to MOVA engine:', err.message);
  }
  return getFallbackAssistantResponse(question, contextData);
}

/**
 * Generate simulation analysis
 */
export async function analyzeSimulation(scenario, beforeState, afterState, impact) {
  const prompt = `You are MOVA, an AI mobility operations assistant. Analyze the results of a what-if simulation.

SCENARIO: ${scenario.type} - ${scenario.description}

BEFORE STATE:
- Active Vehicles: ${beforeState.activeVehicles}
- At-Risk Deliveries: ${beforeState.atRiskDeliveries}
- Total Delay: ${beforeState.totalDelay} min
- Total Distance: ${beforeState.totalDistance} km

AFTER AI OPTIMIZATION:
- Active Vehicles: ${afterState.activeVehicles}
- At-Risk Deliveries: ${afterState.atRiskDeliveries}
- Total Delay: ${afterState.totalDelay} min
- Total Distance: ${afterState.totalDistance} km

ESTIMATED IMPACT:
- Delay avoided: ${impact.delaySaved} min
- Distance saved: ${impact.distanceSaved} km
- Late deliveries prevented: ${impact.lateDeliveriesPrevented}
- Cost saved: ₹${impact.costSaved}

Provide a 3-4 sentence analysis of the optimization results. Explain what MOVA did and why. Use "estimated" and "predicted" language. Keep it under 150 words.`;

  try {
    const text = await callGemini(prompt);
    if (text) return text;
  } catch (err) {
    console.warn('Gemini simulation error, falling back to MOVA engine:', err.message);
  }
  return getFallbackSimulationAnalysis(scenario, impact);
}

// =================== MOVA INTERNAL ENGINE (FALLBACK) ===================

function getFallbackTripExplanation(trip, risk) {
  const topFactors = Object.entries(risk.breakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const factorNames = {
    traffic: 'traffic congestion',
    historicalDelay: 'historical delay patterns',
    timePressure: 'delivery time pressure',
    priority: 'delivery priority level',
    disruption: 'active disruptions',
    vehicleStatus: 'vehicle mechanical condition',
    remainingDistance: 'remaining transit distance',
    capacityPressure: 'cargo capacity constraints'
  };

  return `Trip ${trip.trip_id} has a calculated risk score of ${risk.overall}/100 (${risk.level}). Primary contributing factors are ${topFactors.map(([k, v]) => `${factorNames[k] || k} (${v} pts)`).join(', ')}. With a predicted delay of ${trip.predicted_delay_min} minutes, proactive rerouting is recommended to protect downstream SLA deadlines.`;
}

function getFallbackRecommendation(ctx) {
  return {
    title: `Optimize Corridor Dispatch for ${ctx.scenario}`,
    description: `MOVA Telematics analysis recommends immediate adjustments to mitigate corridor bottlenecks. Estimated time improvement: ${Math.abs(ctx.timeImpact)} minutes.`,
    reasoning: `Based on multi-objective optimization: estimated time impact is ${ctx.timeImpact} minutes, route distance delta is ${ctx.distanceImpact} km, and net cost delta is ₹${ctx.costImpact}. Network risk is predicted to drop by ${ctx.riskReduction} points with ${ctx.confidence}% confidence.`,
    steps: ['Evaluate affected vehicles and shipments', 'Execute recommended route bypass', 'Stream real-time updates to vehicle telematics'],
    source: 'mova-engine',
  };
}

function getFallbackAssistantResponse(question, ctx) {
  const q = question.toLowerCase();
  let response = '';

  if (q.includes('risk') || q.includes('highest')) {
    if (ctx.highRiskTrips && ctx.highRiskTrips.length > 0) {
      const top = ctx.highRiskTrips[0];
      const others = ctx.highRiskTrips.slice(1, 3).map(t => `${t.trip_id} (${t.origin_name}→${t.destination_name}, Risk ${t.risk_score})`).join(', ');
      response = `Currently, ${ctx.atRiskTrips} trips are flagged at elevated risk (≥60/100). The most critical is ${top.trip_id} (${top.origin_name} → ${top.destination_name}) with a risk score of ${top.risk_score}/100 and a predicted delay of +${top.predicted_delay_min} min. Other notable high-risk routes include: ${others || 'none'}. Rerouting options are available in the AI Optimizer.`;
    } else {
      response = `Fleet risk is currently within nominal thresholds. All active trips are operating below high-risk limits with an average risk score of ${ctx.avgRisk || 28}/100.`;
    }
  } else if (q.includes('optimize') || q.includes('recommend') || q.includes('action')) {
    if (ctx.recommendations && ctx.recommendations.length > 0) {
      const rec = ctx.recommendations[0];
      response = `Top priority recommendation: "${rec.title}" (${rec.priority.toUpperCase()} priority). ${rec.description} This action is projected to save approximately ${Math.abs(rec.estimated_time_impact_min || 18)} minutes and reduce corridor risk by ${rec.risk_reduction || 35} points with ${rec.confidence || 88}% confidence. Open the AI Optimizer to dispatch this change.`;
    } else {
      response = `Network throughput is currently optimized. Routine corridor dispatch checks are ongoing across all 15 active vehicles.`;
    }
  } else if (q.includes('delay') || q.includes('late') || q.includes('on time') || q.includes('sla')) {
    response = `The network is currently operating at a ${ctx.onTimeRate}% on-time rate. There are ${ctx.activeIncidents} active road incidents contributing to corridor latency. Critical freight orders (such as D-101 temperature-sensitive pharma) are prioritized on clear corridors to guarantee delivery SLA compliance.`;
  } else if (q.includes('utilization') || q.includes('fleet') || q.includes('truck')) {
    response = `Active fleet utilization is currently at ${ctx.fleetUtilization}%. Out of 15 multi-modal assets, ${ctx.activeVehicles} are in transit, 1 is idle on standby, and 1 is undergoing scheduled maintenance. Total active cargo in transit stands at ${ctx.inTransitDeliveries} orders.`;
  } else if (q.includes('incident') || q.includes('traffic') || q.includes('road') || q.includes('weather')) {
    if (ctx.incidentList && ctx.incidentList.length > 0) {
      const topInc = ctx.incidentList[0];
      response = `There are ${ctx.activeIncidents} active incidents monitored across corridors. Most severe: "${topInc.title}" at ${topInc.location_name} (+${topInc.predicted_delay_min}m predicted delay). Alternative routes via NH48 and bypass highways have been computed in the Live Operations view.`;
    } else {
      response = `No critical roadblocks or incidents detected on primary freight corridors at this moment.`;
    }
  } else {
    response = `MOVA Command Summary: ${ctx.activeVehicles} vehicles active across corridors, ${ctx.inTransitDeliveries} shipments in transit, ${ctx.atRiskTrips} trips under close risk monitoring, and ${ctx.activeIncidents} detected disruptions. Network on-time rate is at ${ctx.onTimeRate}%. You can ask me to analyze specific trip risks, evaluate what-if disruptions, or review route optimizations.`;
  }

  return { response, source: 'mova-engine' };
}

function getFallbackSimulationAnalysis(scenario, impact) {
  return `The ${scenario.type.replace('_', ' ')} simulation demonstrates that MOVA's dynamic rerouting and cargo offload protocols can prevent approximately ${impact.delaySaved} minutes of cumulative delay, save ~${impact.distanceSaved} km of redundant transit, and prevent ${impact.lateDeliveriesPrevented} SLA breaches, realizing estimated net operational savings of ₹${impact.costSaved}.`;
}

export function isGeminiAvailable() {
  return !!(runtimeKey || config.geminiApiKey || process.env.GEMINI_API_KEY);
}
