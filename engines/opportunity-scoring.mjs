// Opportunity Intelligence Engine — Transparent, weighted 10-dimension scoring.
// A score is strictly a prioritization aid, NEVER proof of market success.

export const DEFAULT_WEIGHTS = {
  demandGrowth: 12,
  willingnessToPay: 14,
  customerPain: 11,
  competitionGap: 10,
  distributionReach: 13,
  retentionLtv: 10,
  implementationEase: 8,
  complianceRiskSafe: 7,
  portfolioSynergy: 7,
  fastPaidPilot: 8
};

export const DIMENSION_LABELS = {
  demandGrowth: 'Groei & marktvraag',
  willingnessToPay: 'Betaalbereidheid & koopintentie',
  customerPain: 'Klachten & onvervulde pijn',
  competitionGap: 'Concurrentiegat',
  distributionReach: 'Distributie & bereikbaarheid',
  retentionLtv: 'Retentie & LTV-potentieel',
  implementationEase: 'Bouw- & onderhoudsgemak',
  complianceRiskSafe: 'Compliance & platformveiligheid',
  portfolioSynergy: 'Vaardigheden & portfolio-synergie',
  fastPaidPilot: 'Snelle betaalde pilot mogelijk'
};

const UNCERTAINTY_PENALTY = {
  laag: 0,
  middel: 3,
  hoog: 7
};

export function normalizeWeights(weights = DEFAULT_WEIGHTS) {
  const keys = Object.keys(DEFAULT_WEIGHTS);
  const raw = {};
  let sum = 0;
  for (const key of keys) {
    const val = Number(weights[key] ?? DEFAULT_WEIGHTS[key]);
    if (!Number.isFinite(val) || val < 0) {
      throw new Error(`Ongeldig gewicht voor '${key}': ${weights[key]}`);
    }
    raw[key] = val;
    sum += val;
  }
  if (sum <= 0) {
    throw new Error('Som van wegingen moet groter zijn dan 0.');
  }
  const normalized = {};
  for (const key of keys) {
    normalized[key] = raw[key] / sum;
  }
  return normalized;
}

export function freshnessPenalty(observedAt, referenceDate = new Date()) {
  if (!observedAt) return 5;
  const obs = new Date(observedAt);
  if (Number.isNaN(obs.getTime())) return 5;
  const ageDays = Math.max(0, (referenceDate - obs) / (1000 * 60 * 60 * 24));
  if (ageDays <= 30) return 0;
  if (ageDays <= 90) return 2;
  if (ageDays <= 180) return 4;
  return 6;
}

export function scoreOpportunity(opportunity, weights = DEFAULT_WEIGHTS, referenceDate = new Date()) {
  if (!opportunity || typeof opportunity !== 'object' || !opportunity.scores) {
    throw new Error('Opportunity vereist een geldig scores-object.');
  }

  const norm = normalizeWeights(weights);
  let weightedSum = 0;
  const breakdown = {};

  for (const [key, w] of Object.entries(norm)) {
    const rawScore = Number(opportunity.scores[key]);
    if (!Number.isFinite(rawScore) || rawScore < 0 || rawScore > 100) {
      throw new Error(`Score voor '${key}' moet tussen 0 en 100 liggen (kreeg ${opportunity.scores[key]}).`);
    }
    const contribution = rawScore * w;
    weightedSum += contribution;
    breakdown[key] = {
      score: rawScore,
      weightPct: Math.round(w * 1000) / 10,
      contribution: Math.round(contribution * 10) / 10
    };
  }

  const uPenalty = UNCERTAINTY_PENALTY[opportunity.uncertainty] ?? 5;
  const fPenalty = freshnessPenalty(opportunity.observedAt, referenceDate);
  const rawScore = Math.round(weightedSum * 10) / 10;
  const adjustedScore = Math.max(0, Math.min(100, Math.round((weightedSum - uPenalty - fPenalty) * 10) / 10));

  return {
    id: opportunity.id,
    rawScore,
    uncertaintyPenalty: uPenalty,
    freshnessPenalty: fPenalty,
    adjustedScore,
    uncertainty: opportunity.uncertainty || 'hoog',
    observedAt: opportunity.observedAt || null,
    breakdown,
    disclaimer: 'Prioriteringsscore op basis van gewogen bewijs — geen bewezen kans op succes zonder klantvalidatie.'
  };
}

export function rankOpportunities(opportunities, weights = DEFAULT_WEIGHTS, referenceDate = new Date()) {
  return opportunities
    .map((opp) => ({
      ...opp,
      evaluation: scoreOpportunity(opp, weights, referenceDate)
    }))
    .sort((a, b) => b.evaluation.adjustedScore - a.evaluation.adjustedScore);
}
