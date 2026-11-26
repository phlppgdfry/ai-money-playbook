import { rankOpportunities, DEFAULT_WEIGHTS } from './opportunity-scoring.mjs';

export function generateWeeklyBrief({
  opportunities = [],
  evidence = [],
  experiments = [],
  changelogRuns = [],
  telemetry = null,
  referenceDate = new Date()
}) {
  const ranked = rankOpportunities(opportunities, DEFAULT_WEIGHTS, referenceDate);
  const top5 = ranked
    .filter((o) => o.decision !== 'KILL')
    .slice(0, 5)
    .map((o) => ({
      id: o.id,
      title: o.title,
      track: o.track,
      score: o.evaluation.adjustedScore,
      uncertainty: o.uncertainty,
      decision: o.decision
    }));

  const validatable = ranked
    .filter((o) => o.status === 'SELECTED_FOR_VALIDATION')
    .map((o) => ({ id: o.id, title: o.title, score: o.evaluation.adjustedScore, nextGate: o.nextGate }));

  const rejected = ranked
    .filter((o) => o.decision === 'KILL' || o.status === 'REJECTED')
    .map((o) => ({ id: o.id, title: o.title, reason: o.decisionReason }));

  const totalSpentEur = experiments.reduce((s, e) => s + (e.metrics?.spentEur || 0), 0);
  const totalRevenueEur = experiments.reduce((s, e) => s + (e.metrics?.revenueEur || 0), 0);
  const maxApprovedBudgetEur = experiments.reduce((s, e) => s + (e.maxBudgetEur || 0), 0);

  const recommendedFocus = validatable[0] || top5[0] || null;

  return {
    generatedAt: referenceDate.toISOString().slice(0, 10),
    top5Opportunities: top5,
    recentEvidence: evidence.slice(0, 5).map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      observedAt: e.observedAt
    })),
    validatableNow: validatable,
    rejectedOpportunities: rejected,
    top3ActionsNextWeek: [
      'Keur Experiment 1 (B2B Vlaamse/NL GDPR AI-Receptionist) goed en zet 1 live testnummer klaar binnen €50 budget.',
      'Voer 10 echte prospect-checks uit bij lokale praktijken/installateurs en log uitkomsten in je lokale CRM.',
      'Keur Experiment 2 (RingValue smoke-test kaart in RingSizer + landingspagina) goed om betaalintentie te meten vóór enige MVP-code.'
    ],
    experimentResults: experiments.map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      decision: e.decision,
      revenueEur: e.metrics?.revenueEur || 0,
      spentEur: e.metrics?.spentEur || 0,
      approvalPending: !e.approvalGate?.outreachApproved || !e.approvalGate?.spendApproved
    })),
    financialReality: {
      realizedRevenueEur: totalRevenueEur,
      actualSpentEur: totalSpentEur,
      allocatedMaxBudgetEur: maxApprovedBudgetEur,
      estimatedCloudAgentCostUsd: telemetry?.estimatedCostUsd ?? 0,
      note: totalRevenueEur === 0
        ? 'Nog €0 gerealiseerde omzet uit de 2 nieuwe validatie-experimenten (wachten op menselijke goedkeuring vóór outreach/uitgaven).'
        : `Gerealiseerde pilot-omzet: €${totalRevenueEur} tegen €${totalSpentEur} uitgaven.`
    },
    recommendedFocusProject: recommendedFocus
      ? {
          id: recommendedFocus.id,
          title: recommendedFocus.title,
          why: 'Snelste pad naar eerste echte betalende klant zonder advertentiebudget, met duidelijke BE/NL + GDPR-voorsprong.'
        }
      : null,
    latestChangelogRun: changelogRuns[0] || null
  };
}
