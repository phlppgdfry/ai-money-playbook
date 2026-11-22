// Capital Allocation & Founder Operating Constraints Engine (3.0)

export function checkWipLimits(experiments = [], constraints = { maxActiveValidations: 2 }) {
  const active = experiments.filter((e) =>
    ['READY_FOR_APPROVAL', 'RUNNING'].includes(e.status) && e.decision !== 'KILL'
  );
  const maxAllowed = Number(constraints.maxActiveValidations ?? 2);
  return {
    activeCount: active.length,
    maxAllowed,
    withinLimit: active.length <= maxAllowed,
    activeIds: active.map((e) => e.id),
    warning: active.length > maxAllowed
      ? `WIP-limiet overschreden: ${active.length} actieve validaties (maximaal ${maxAllowed} toegestaan). Pauzeer of kill eerst een project.`
      : null
  };
}

export function validateDistributionFirstGate(opportunities = [], plans = []) {
  const planIds = new Set(plans.filter((p) => p.first10 && p.first100).map((p) => p.opportunityId));
  const selected = opportunities.filter((o) => o.status === 'SELECTED_FOR_VALIDATION');
  const missing = selected.filter((o) => !planIds.has(o.id)).map((o) => o.id);
  return {
    passed: missing.length === 0,
    checkedCount: selected.length,
    missingOpportunityIds: missing
  };
}

export function rankCapitalAllocation(options = []) {
  return options
    .map((opt) => {
      const hours = Math.max(1, Number(opt.hoursNeeded || 1));
      const cash = Math.max(0, Number(opt.cashNeededEur || 0));
      const expectedNet = Math.max(0, Number(opt.expectedMonthlyNetAt90dEur || 0));
      const prob = Math.max(0, Math.min(100, Number(opt.probabilityPct || 0))) / 100;
      const mult = Math.max(0.5, Number(opt.unfairAdvantageMultiplier || 1));

      // Risk-adjusted 3-month expected net return minus direct cash spent, divided by founder hours.
      const riskAdjusted3mReturn = (expectedNet * 3 * prob * mult) - cash;
      const evPerHour = Math.round((riskAdjusted3mReturn / hours) * 10) / 10;

      return {
        ...opt,
        riskAdjusted3mReturnEur: Math.round(riskAdjusted3mReturn),
        evPerHourEur: evPerHour
      };
    })
    .sort((a, b) => b.evPerHourEur - a.evPerHourEur);
}
