// Financial Intelligence Engine — Realistic SaaS, iOS Consumer App & B2B Agency unit economics.
// Includes Belgian fiscal regimes (BV kmo 20%/25% vs Eenmanszaak sociale bijdragen + personenbelasting),
// steady-state MRR vs Month-1 Cash Collected, churn, CAC, LTV, payback, Best/Base/Worst & dynamic valuation multiples.

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function calculateBelgianAnnualTax(annualPreTaxProfit, regime = 'be-bv-kmo', customTaxRatePct = 20) {
  const profit = Math.max(0, Number(annualPreTaxProfit || 0));
  if (profit === 0) {
    return { annualTax: 0, effectiveRatePct: 0, note: 'Geen belastbare winst.' };
  }

  if (regime === 'be-bv-kmo') {
    // Belgische vennootschapsbelasting: 20% op eerste €100.000 (kmo-voorwaarden), 25% daarboven.
    const lowBracket = Math.min(profit, 100000);
    const highBracket = Math.max(0, profit - 100000);
    const annualTax = (lowBracket * 0.20) + (highBracket * 0.25);
    const effectiveRatePct = Math.round((annualTax / profit) * 1000) / 10;
    return {
      annualTax,
      effectiveRatePct,
      note: 'BE BV (kmo-tarief): 20% op eerste €100k jaarwinst, 25% daarboven (vereist kmo-voorwaarden & min. bedrijfsleidersbezoldiging; exclusief dividend/VVPRbis-belasting bij privé-uitkering).'
    };
  }

  if (regime === 'be-eenmanszaak') {
    // Belgische eenmanszaak / bijberoep: ~20.5% sociale bijdragen (begrensd op ~€19.200/jr plafond),
    // daarna marginale personenbelasting + gemeentebelasting (~42% effectief bij bijberoep/hogere schijf).
    const socialContrib = Math.min(profit * 0.205, 19200);
    const taxableAfterSocial = Math.max(0, profit - socialContrib);
    const incomeTax = taxableAfterSocial * 0.42;
    const annualTax = socialContrib + incomeTax;
    const effectiveRatePct = Math.round((annualTax / profit) * 1000) / 10;
    return {
      annualTax,
      effectiveRatePct,
      note: 'BE Eenmanszaak / bijberoep (indicatief): ~20,5% sociale bijdragen (met plafond) + ~42% marginale personen- & gemeentebelasting op het saldo.'
    };
  }

  const rate = clamp(Number(customTaxRatePct ?? 20), 0, 60);
  return {
    annualTax: profit * (rate / 100),
    effectiveRatePct: rate,
    note: `Aangepast belastingtarief (${rate}%).`
  };
}

export function computeValuationRange({ mode, monthlyChurnPct, contributionMarginPct, recurringSharePct }) {
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
  const fiscalRegime = input.fiscalRegime || 'be-bv-kmo';
  const customTaxRatePct = clamp(Number(input.taxRatePct ?? 20), 0, 60);
  const supportInfraFixed = Math.max(0, Number(input.fixedMonthlyCosts ?? 150));

  let mrr = 0;
  let oneTimeMonthly = 0;
  let month1CashCollected = 0;
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
    // Steady-state active subscriber base = newPaid / monthlyChurn
    activeCustomers = newPaidPerMonth / (monthlyChurnPct / 100);
    arpu = annualPrice / 12;
    // Economic steady-state MRR (includes renewals); Month-1 upfront cash shown separately without double counting.
    mrr = activeCustomers * arpu;
    month1CashCollected = newPaidPerMonth * annualPrice;
    oneTimeMonthly = 0;

    // Apple charges 15% (Small Business Program) on ALL subscription revenue (new + renewals)
    platformFees = mrr * (appleFeePct / 100);
    variableApiSupport = activeCustomers * apiPerUser;
    marketingCost = ugcMarketing;
    cac = newPaidPerMonth > 0 ? ugcMarketing / newPaidPerMonth : 0;
  } else if (mode === 'agency') {
    const clients = Math.max(0, Number(input.clients ?? 8));
    const monthlyFee = Math.max(0, Number(input.monthlyFee ?? 690));
    const newClientsPerMonth = Math.max(0, Number(input.newClientsPerMonth ?? 1));
    const setupFee = Math.max(0, Number(input.setupFee ?? 1250));
    const apiPerClient = Math.max(0, Number(input.apiPerClient ?? 85));
    const salesMarketing = Math.max(0, Number(input.marketingMonthly ?? 300));

    activeCustomers = clients;
    arpu = monthlyFee;
    mrr = clients * monthlyFee;
    oneTimeMonthly = newClientsPerMonth * setupFee;
    month1CashCollected = mrr + oneTimeMonthly;
    platformFees = (mrr + oneTimeMonthly) * 0.015;
    variableApiSupport = clients * apiPerClient;
    marketingCost = salesMarketing;
    cac = newClientsPerMonth > 0 ? salesMarketing / newClientsPerMonth : 0;
  } else {
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
    month1CashCollected = mrr;
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
  const annualPreTax = ebitdaMonthly * 12;
  const fiscal = calculateBelgianAnnualTax(annualPreTax, fiscalRegime, customTaxRatePct);
  const taxMonthly = fiscal.annualTax / 12;
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
    fiscalRegime,
    fiscalEffectiveRatePct: fiscal.effectiveRatePct,
    fiscalNote: fiscal.note,
    activeCustomers: Math.round(activeCustomers),
    mrr: Math.round(mrr),
    arr: Math.round(mrr * 12),
    oneTimeMonthly: Math.round(oneTimeMonthly),
    month1CashCollected: Math.round(month1CashCollected),
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
    worstInput.monthlyFee = Math.round((baseInput.monthlyFee ?? 690) * 0.8);
    worstInput.monthlyChurnPct = Math.min(20, (baseInput.monthlyChurnPct ?? 4) * 1.5);

    bestInput.clients = Math.round((baseInput.clients ?? 8) * 1.6);
    bestInput.monthlyFee = Math.round((baseInput.monthlyFee ?? 690) * 1.2);
    bestInput.monthlyChurnPct = Math.max(1.5, (baseInput.monthlyChurnPct ?? 4) * 0.7);
  } else {
    worstInput.customers = Math.max(5, Math.round((baseInput.customers ?? 60) * 0.55));
    worstInput.monthlyChurnPct = Math.min(20, (baseInput.monthlyChurnPct ?? 3) * 1.5);

    bestInput.customers = Math.round((baseInput.customers ?? 60) * 1.6);
    bestInput.monthlyChurnPct = Math.max(1, (baseInput.monthlyChurnPct ?? 3) * 0.75);
  }

  return {
    worst: calculateUnitEconomics(mode, worstInput),
    base: calculateUnitEconomics(mode, baseInput),
    best: calculateUnitEconomics(mode, bestInput)
  };
}
