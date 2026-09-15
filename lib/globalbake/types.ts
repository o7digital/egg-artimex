export type OrderLine = {
  orderId: string;
  date: string;
  productId: string;
  product: string;
  productFamily: string;
  customerId: string;
  customer: string;
  customerGroup: string;
  location: string;
  quantity: number;
  grossSales: number;
  discounts: number;
  returns: number;
  standardUnitVariableCost: number | null;
  allocatedFreight: number | null;
  otherVariableCosts: number | null;
};

export type ReportingFilters = {
  dateFrom: string;
  dateTo: string;
  year: string;
  month: string;
  quarter: string;
  season: string;
  product: string;
  productFamily: string;
  customer: string;
  customerGroup: string;
  location: string;
};

export type SeasonDefinition = { name: string; months: number[] };

export type ReportingDimensions = {
  years: string[];
  products: string[];
  productFamilies: string[];
  customers: string[];
  customerGroups: string[];
  locations: string[];
};

export interface GlobalBakeAdapter {
  readonly sourceName: string;
  readonly mode: "demo" | "live";
  getDimensions(): ReportingDimensions;
  getOrderLines(filters: ReportingFilters, seasons: SeasonDefinition[]): OrderLine[];
}
