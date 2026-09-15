import type { OrderLine } from "./types";

const products = [
  { id: "P-101", name: "Conchas", family: "Sweet Bread", price: 1.46, cost: 0.68 },
  { id: "P-102", name: "Bolillo 6 oz", family: "Rolls", price: 0.94, cost: 0.42 },
  { id: "P-103", name: "Telera 8 oz", family: "Rolls", price: 1.12, cost: 0.53 },
  { id: "P-104", name: "Empanada Pineapple", family: "Pastry", price: 1.88, cost: 0.91 },
  { id: "P-105", name: "Pan de Muerto", family: "Seasonal", price: 2.18, cost: 1.04 },
  { id: "P-106", name: "Tres Leches Slice", family: "Cakes", price: 3.25, cost: null },
] as const;

const customers = [
  { id: "C-01", name: "Gallo Giro", group: "Restaurant Group", location: "Los Angeles" },
  { id: "C-02", name: "Mercado Central", group: "Independent Retail", location: "Central LA" },
  { id: "C-03", name: "La Familia Markets", group: "Grocery", location: "San Fernando Valley" },
  { id: "C-04", name: "Pacific Foodservice", group: "Distributor", location: "Orange County" },
  { id: "C-05", name: "Artimex Direct", group: "Direct", location: "Santa Fe Springs" },
] as const;

const monthWeights = [0.83, 0.87, 0.92, 0.96, 1.02, 1.06, 1.01, 1.08, 1.12, 1.2, 1.29, 1.38];

export const demoOrderLines: OrderLine[] = [2025, 2026].flatMap((year, yearIndex) =>
  monthWeights.flatMap((weight, monthIndex) =>
    customers.flatMap((customer, customerIndex) =>
      products.map((product, productIndex) => {
        const seasonal = product.id === "P-105" ? (monthIndex >= 8 && monthIndex <= 10 ? 3.8 : 0.12) : 1;
        const growth = yearIndex ? 1.12 + productIndex * 0.012 - customerIndex * 0.008 : 1;
        const quantity = Math.round((720 + productIndex * 135 + customerIndex * 190) * weight * seasonal * growth);
        const discountRate = 0.025 + customerIndex * 0.009 + (customer.id === "C-04" ? 0.035 : 0);
        const grossSales = quantity * product.price;
        const discounts = grossSales * discountRate;
        const returns = monthIndex % 4 === customerIndex % 4 ? grossSales * 0.012 : 0;
        const allocatedFreight = product.cost === null ? null : quantity * (0.035 + customerIndex * 0.012);
        const otherVariableCosts = product.cost === null ? null : quantity * (0.012 + productIndex * 0.003);
        return {
          orderId: `GB-${year}-${String(monthIndex + 1).padStart(2, "0")}-${customerIndex + 1}-${productIndex + 1}`,
          date: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(5 + ((customerIndex * 4 + productIndex * 2) % 22)).padStart(2, "0")}`,
          productId: product.id,
          product: product.name,
          productFamily: product.family,
          customerId: customer.id,
          customer: customer.name,
          customerGroup: customer.group,
          location: customer.location,
          quantity,
          grossSales,
          discounts,
          returns,
          standardUnitVariableCost: product.cost,
          allocatedFreight,
          otherVariableCosts,
        };
      }),
    ),
  ),
);
