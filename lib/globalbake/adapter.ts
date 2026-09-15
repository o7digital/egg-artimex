import { demoOrderLines } from "./demo-data";
import type { GlobalBakeAdapter, OrderLine, ReportingFilters, SeasonDefinition } from "./types";

const unique = (values: string[]) => [...new Set(values)].sort();

export const demoGlobalBakeAdapter: GlobalBakeAdapter = {
  sourceName: "GlobalBake structured export",
  mode: "demo",
  getDimensions() {
    return {
      years: unique(demoOrderLines.map((line) => line.date.slice(0, 4))),
      products: unique(demoOrderLines.map((line) => line.product)),
      productFamilies: unique(demoOrderLines.map((line) => line.productFamily)),
      customers: unique(demoOrderLines.map((line) => line.customer)),
      customerGroups: unique(demoOrderLines.map((line) => line.customerGroup)),
      locations: unique(demoOrderLines.map((line) => line.location)),
    };
  },
  getOrderLines(filters: ReportingFilters, seasons: SeasonDefinition[]): OrderLine[] {
    return demoOrderLines.filter((line) => {
      const date = new Date(`${line.date}T00:00:00`);
      const month = date.getMonth() + 1;
      const quarter = `Q${Math.ceil(month / 3)}`;
      const season = seasons.find((item) => item.months.includes(month))?.name ?? "Unassigned";
      return (!filters.dateFrom || line.date >= filters.dateFrom)
        && (!filters.dateTo || line.date <= filters.dateTo)
        && (!filters.year || line.date.startsWith(filters.year))
        && (!filters.month || String(month) === filters.month)
        && (!filters.quarter || quarter === filters.quarter)
        && (!filters.season || season === filters.season)
        && (!filters.product || line.product === filters.product)
        && (!filters.productFamily || line.productFamily === filters.productFamily)
        && (!filters.customer || line.customer === filters.customer)
        && (!filters.customerGroup || line.customerGroup === filters.customerGroup)
        && (!filters.location || line.location === filters.location);
    });
  },
};
