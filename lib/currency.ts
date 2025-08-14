export type RateMap = { base: string; rates: Record<string, number>; fetchedAt: string };

export function convert(amount: number, from: string, to: string, data: RateMap | null): number {
  if (!data) return amount; // fallback
  const base = data.base.toUpperCase();
  from = from.toUpperCase();
  to = to.toUpperCase();
  if (from === to) return amount;
  // Normalize: if from not base, convert to base
  let amountInBase = amount;
  if (from !== base) {
    const rateFrom = data.rates[from];
    if (!rateFrom) return amount; // unknown
    amountInBase = amount / rateFrom;
  }
  if (to === base) return amountInBase;
  const rateTo = data.rates[to];
  if (!rateTo) return amountInBase;
  return amountInBase * rateTo;
}

export function listSupportedCurrencies(data: RateMap | null): string[] {
  if (!data) return ['USD'];
  return [data.base, ...Object.keys(data.rates)].filter((v,i,a)=>a.indexOf(v)===i).sort();
}
