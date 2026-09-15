import type { OrderLine } from "./types";

export type Summary = {
  quantity: number;
  grossSales: number;
  discounts: number;
  returns: number;
  netSales: number;
  orders: number;
  variableCost: number | null;
  contribution: number | null;
  contributionPct: number | null;
  avgNetPrice: number;
  unitVariableCost: number | null;
  freight: number | null;
};

export function summarize(lines: OrderLine[]): Summary {
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const grossSales = lines.reduce((sum, line) => sum + line.grossSales, 0);
  const discounts = lines.reduce((sum, line) => sum + line.discounts, 0);
  const returns = lines.reduce((sum, line) => sum + line.returns, 0);
  const netSales = grossSales - discounts - returns;
  const costsAvailable = lines.every((line) => line.standardUnitVariableCost !== null && line.allocatedFreight !== null && line.otherVariableCosts !== null);
  const variableCost = costsAvailable
    ? lines.reduce((sum, line) => sum + line.quantity * (line.standardUnitVariableCost as number) + (line.allocatedFreight as number) + (line.otherVariableCosts as number), 0)
    : null;
  const contribution = variableCost === null ? null : netSales - variableCost;
  return {
    quantity,
    grossSales,
    discounts,
    returns,
    netSales,
    orders: new Set(lines.map((line) => line.orderId)).size,
    variableCost,
    contribution,
    contributionPct: contribution === null || netSales === 0 ? null : contribution / netSales * 100,
    avgNetPrice: quantity ? netSales / quantity : 0,
    unitVariableCost: costsAvailable && quantity ? lines.reduce((sum, line) => sum + line.quantity * (line.standardUnitVariableCost as number), 0) / quantity : null,
    freight: costsAvailable ? lines.reduce((sum, line) => sum + (line.allocatedFreight as number), 0) : null,
  };
}

export function groupLines(lines: OrderLine[], key: (line: OrderLine) => string) {
  const groups = new Map<string, OrderLine[]>();
  lines.forEach((line) => groups.set(key(line), [...(groups.get(key(line)) ?? []), line]));
  return [...groups].map(([name, group]) => ({ name, lines: group, summary: summarize(group) }));
}
