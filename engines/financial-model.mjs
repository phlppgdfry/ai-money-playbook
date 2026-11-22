// Financial Intelligence Engine — Realistic SaaS, iOS Consumer App & B2B Agency unit economics.
// Separates Cash Collected from MRR, includes churn, CAC, LTV, payback, BE/NL tax,
// Best/Base/Worst scenarios, sensitivity analysis, and evidence-based valuation multiple ranges.

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function computeValuationRange({ mode, monthlyChurnPct, contributionMarginPct, recurringSharePct }) {
  // Evidence-based Acquire.com / micro-PE multiple ranges on annual SDE/net operating profit.
  let minMult = 1.8;
  let maxMult = 2.8;
  let rationale = '';

  if (mode === 'agency') {
    minMult = 1.5;
    maxMult = 2.6;
    rationale = 'Dienstverlening/agency verkoopt lager (1.5×–2.6× jaarwinst) door eigenaar-afhankelijkheid; stijgt richting 3.5×+ zodra geproductiseerd naar SaaS.';
  } else if (mode === 'ios') {
    if (monthlyChurnPct <= 6 && contributionMarginPct >= 55) {
      minMult = 2.8;
      maxMult = 4.0;
    } else {
      minMult = 1.8;
      maxMult = 3.0;
    }
    rationale = 'Consumenten-apps dragen platform- en churnrisico (RevenueCat: AI-apps churnen ~30% sneller); waardering hangt sterk af van retentie en organisch verkeer.';
  } else {
    // Vertical B2B Micro-SaaS
    if (monthlyChurnPct <= 3 && contributionMarginPct >= 70) {
      minMult = 3.8;
      maxMult = 5.5;
    } else if (monthlyChurnPct <= 6) {
      minMult = 3.0;
      maxMult = 4.2;
    } else {
      minMult = 2.2;
      maxMult = 3.2;
    }
    rationale = 'Verticale B2B Micro-SaaS met lage churn (<3%/mnd) en EU-compliance gracht haalt de hoogste multiples (3.8×–5.5× jaarwinst).';
  }

  if (recurringSharePct < 60) {
    minMult = Math.max(1.2, +(minMult - 0.4).toFixed(1));
    maxMult = Math.max(1.8, +(maxMult - 0.5).toFixed(1));
  }

  return { minMult, maxMult, rationale };
}

export function calculateUnitEconomics(mode, input) {
  const taxRatePct = clamp(Number(input.taxRatePct ?? 20), 0, 50); // BE/NL kmo-tarief ~20%
  const supportInfraFixed = Math.max(0, Number(input.fixedMonthlyCosts ?? 150));

  let mrr = 0;
  let oneTimeMonthly = 0;
  let platformFees = 0;
  let variableApiSupport = 0;
  let marketingCost = 0;
  let arpu = 0;
  let cac = 0;
  let monthlyChurnPct = clamp(Number(input.monthlyChurnPct ?? 5), 0.5, 50);
  let activeCustomers = 0;

  if (mode === 'ios') {
    const downloads = Math.max(0, Number(input.downloads ?? 12000));
    const convPct = clamp(Number(input.convPct ?? 8), 0.1, 40);
    const annualPrice = Math.max(1, Number(input.annualPrice ?? 40));
    const appleFeePct = clamp(Number(input.appleFeePct ?? 15), 0, 35);
    const ugcMarketing = Math.max(0, Number(input.marketingMonthly ?? 1800));
    const apiPerUser = Math.max(0, Number(input.apiPerUser ?? 0.35));

    const newPaidPerMonth = downloads * (convPct / 100);
    // Steady-state active subscriber base ≈ newPaid / monthlyChurn
    activeCustomers = newPaidPerMonth / (monthlyChurnPct / 100);
    arpu = annualPrice / 12;
    // Economic MRR vs upfront annual cash collected
    mrr = activeCustomers * arpu;
    oneTimeMonthly = Math.max(0, (newPaidPerMonth * annualPrice) - mrr); // cashflow timing delta
    const grossCashCollected = newPaidPerMonth * annualPrice;

    platformFees = grossCashCollected * (appleFeePct / 100);
    variableApiSupport = activeCustomers * apiPerUser;
    marketingCost = ugcMarketing;
    cac = newPaidPerMonth > 0 ? ugcMarketing / newPaidPerMonth : 0;
  } else if (mode === 'agency') {
    const clients = Math.max(0, Number(input.clients ?? 8));
    const monthlyFee = Math.max(0, Number(input.monthlyFee ?? 750));
    const newClientsPerMonth = Math.max(0, Number(input.newClientsPerMonth ?? 1));
    const setupFee = Math.max(0, Number(input.setupFee ?? 2000));
    const apiPerClient = Math.max(0, Number(input.apiPerClient ?? 85));
    const salesMarketing = Math.max(0, Number(input.marketingMonthly ?? 400));

    activeCustomers = clients;
    arpu = monthlyFee;
    mrr = clients * monthlyFee;
    oneTimeMonthly = newClientsPerMonth * setupFee;
    platformFees = (mrr + oneTimeMonthly) * 0.015; // SEPA/Stripe B2B
    variableApiSupport = clients * apiPerClient;
    marketingCost = salesMarketing;
    cac = newClientsPerMonth > 0 ? salesMarketing / newClientsPerMonth : 0;
  } else {
    // Vertical B2B Micro-SaaS
    const customers = Math.max(0, Number(input.customers ?? 60));
    const monthlyPrice = Math.max(1, Number(input.monthlyPrice ?? 79));
    const morPct = clamp(Number(input.morPct ?? 5), 0, 15);
    const apiPerCustomer = Math.max(0, Number(input.apiPerCustomer ?? 6));
    const marketingMonthly = Math.max(0, Number(input.marketingMonthly ?? 800));
    const newCustomersPerMonth = Math.max(0.5, Number(input.newCustomersPerMonth ?? 8));

    activeCustomers = customers;
    arpu = monthlyPrice;
    mrr = customers * monthlyPrice;
    oneTimeMonthly = 0;
    platformFees = mrr * (morPct / 100);
    variableApiSupport = customers * apiPerCustomer;
    marketingCost = marketingMonthly;
    cac = marketingMonthly / newCustomersPerMonth;
  }

  const totalMonthlyRevenue = mrr + oneTimeMonthly;
  const directCogs = platformFees + variableApiSupport;
  const grossProfit = totalMonthlyRevenue - directCogs;
  const grossMarginPct = totalMonthlyRevenue > 0 ? (grossProfit / totalMonthlyRevenue) * 100 : 0;

  const contributionProfit = grossProfit - marketingCost;
  const contributionMarginPct = totalMonthlyRevenue > 0 ? (contributionProfit / totalMonthlyRevenue) * 100 : 0;

  const ebitdaMonthly = contributionProfit - supportInfraFixed;
  const taxMonthly = ebitdaMonthly > 0 ? ebitdaMonthly * (taxRatePct / 100) : 0;
  const netProfitMonthly = ebitdaMonthly - taxMonthly;
  const netProfitAnnual = netProfitMonthly * 12;

  const grossMarginRatio = clamp(grossMarginPct / 100, 0, 1);
  const ltv = (arpu * grossMarginRatio) / (monthlyChurnPct / 100);
  const ltvCacRatio = cac > 0 ? ltv / cac : null;
  const paybackMonths = arpu * grossMarginRatio > 0 && cac > 0
    ? cac / (arpu * grossMarginRatio)
    : 0;

  const recurringSharePct = totalMonthlyRevenue > 0 ? (mrr / totalMonthlyRevenue) * 100 : 0;
  const multiple = computeValuationRange({
    mode,
    monthlyChurnPct,
    contributionMarginPct,
    recurringSharePct
  });

  const annualSde = Math.max(0, ebitdaMonthly * 12);

  return {
    mode,
    activeCustomers: Math.round(activeCustomers),
    mrr: Math.round(mrr),
    arr: Math.round(mrr * 12),
    oneTimeMonthly: Math.round(oneTimeMonthly),
    totalMonthlyRevenue: Math.round(totalMonthlyRevenue),
    directCogs: Math.round(directCogs),
    marketingCost: Math.round(marketingCost),
    fixedMonthlyCosts: Math.round(supportInfraFixed),
    grossProfit: Math.round(grossProfit),
    grossMarginPct: Math.round(grossMarginPct * 10) / 10,
    contributionMarginPct: Math.round(contributionMarginPct * 10) / 10,
    ebitdaMonthly: Math.round(ebitdaMonthly),
    taxMonthly: Math.round(taxMonthly),
    netProfitMonthly: Math.round(netProfitMonthly),
    netProfitAnnual: Math.round(netProfitAnnual),
    arpu: Math.round(arpu * 100) / 100,
    cac: Math.round(cac * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
    ltvCacRatio: ltvCacRatio !== null ? Math.round(ltvCacRatio * 10) / 10 : null,
    paybackMonths: Math.round(paybackMonths * 10) / 10,
    monthlyChurnPct,
    valuation: {
      minEur: Math.round(annualSde * multiple.minMult),
      maxEur: Math.round(annualSde * multiple.maxMult),
      minMult: multiple.minMult,
      maxMult: multiple.maxMult,
      rationale: multiple.rationale
    }
  };
}

export function runScenarios(mode, baseInput) {
  const worstInput = { ...baseInput };
  const bestInput = { ...baseInput };

  if (mode === 'ios') {
    worstInput.downloads = Math.round((baseInput.downloads ?? 12000) * 0.55);
    worstInput.convPct = Math.max(1.5, (baseInput.convPct ?? 8) * 0.65);
    worstInput.monthlyChurnPct = Math.min(30, (baseInput.monthlyChurnPct ?? 12) * 1.35);

    bestInput.downloads = Math.round((baseInput.downloads ?? 12000) * 1.6);
    bestInput.convPct = Math.min(25, (baseInput.convPct ?? 8) * 1.25);
    bestInput.monthlyChurnPct = Math.max(3, (baseInput.monthlyChurnPct ?? 12) * 0.8);
  } else if (mode === 'agency') {
    worstInput.clients = Math.max(1, Math.round((baseInput.clients ?? 8) * 0.5));
    worstInput.monthlyFee = Math.round((baseInput.monthlyFee ?? 750) * 0.8);
    worstInput.monthlyChurnPct = Math.min(20, (baseInput.monthlyChurnPct ?? 4) * 1.5);

    bestInput.clients = Math.round((baseInput.clients ?? 8) * 1.6);
    bestInput.monthlyFee = Math.round((baseInput.monthlyFee ?? 750) * 1.2);
    bestInput.monthlyChurnPct = Math.max(1.5, (baseInput.monthlyChurnPct ?? 4) * 0.7);
  } else {
    worstInput.customers = Math.max(5, Math.round((baseInput.customers ?? 60) * 0.55));
    worstInput.monthlyChurnPct = Math.min(20, (baseInput.monthlyChurnPct ?? 3.5) * 1.5);

    bestInput.customers = Math.round((baseInput.customers ?? 60) * 1.6);
    bestInput.monthlyChurnPct = Math.max(1, (baseInput.monthlyChurnPct ?? 3.5) * 0.75);
  }

  return {
    worst: calculateUnitEconomics(mode, worstInput),
    base: calculateUnitEconomics(mode, baseInput),
    best: calculateUnitEconomics(mode, bestInput)
  };
}
