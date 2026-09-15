"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Boxes, CircleDollarSign, Filter, PackageSearch, Users } from "lucide-react";
import "./globalbake-bi.css";

type LineItem = { season: string; product: string; family: string; customer: string; quantity: number; gross: number; discount: number; returns: number; unitCost: number; freight: number };
type Totals = { quantity: number; gross: number; discount: number; returns: number; net: number; cost: number; contribution: number; margin: number };

const products = [
  { name: "Conchas", family: "Sweet bread", price: 1.48, cost: .67 },
  { name: "Bolillo", family: "Rolls", price: .91, cost: .39 },
  { name: "Telera", family: "Rolls", price: 1.06, cost: .46 },
  { name: "Pineapple empanada", family: "Pastry", price: 1.84, cost: .86 },
  { name: "Marranito", family: "Sweet bread", price: 1.36, cost: .62 },
] as const;
const customers = ["Sunrise Food Market", "Valley Fresh Foods", "Camino Restaurant Group", "Pacific Foodservice", "Neighborhood Pantries"];
const seasons = ["Winter", "Spring", "Summer", "Fall"];

const demoLines: LineItem[] = seasons.flatMap((season, seasonIndex) => customers.flatMap((customer, customerIndex) => products.map((product, productIndex) => {
  const seasonFactor = [0.92, 1.04, .96, 1.22][seasonIndex] * (product.name === "Conchas" && season === "Fall" ? 1.18 : 1);
  const quantity = Math.round((2900 + customerIndex * 610 + productIndex * 430) * seasonFactor);
  const gross = quantity * product.price;
  const discount = gross * (.025 + customerIndex * .009);
  const returns = gross * ((customerIndex + productIndex + seasonIndex) % 5 === 0 ? .012 : .003);
  return { season, product: product.name, family: product.family, customer, quantity, gross, discount, returns, unitCost: product.cost, freight: quantity * (.026 + customerIndex * .007) };
})));

function summarize(lines: LineItem[]): Totals {
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const gross = lines.reduce((sum, line) => sum + line.gross, 0);
  const discount = lines.reduce((sum, line) => sum + line.discount, 0);
  const returns = lines.reduce((sum, line) => sum + line.returns, 0);
  const net = gross - discount - returns;
  const cost = lines.reduce((sum, line) => sum + line.quantity * line.unitCost + line.freight, 0);
  const contribution = net - cost;
  return { quantity, gross, discount, returns, net, cost, contribution, margin: net ? contribution / net * 100 : 0 };
}

function group(lines: LineItem[], key: (line: LineItem) => string) {
  const grouped = new Map<string, LineItem[]>();
  lines.forEach((line) => grouped.set(key(line), [...(grouped.get(key(line)) ?? []), line]));
  return [...grouped].map(([name, items]) => ({ name, items, ...summarize(items) }));
}

const usd = (value: number, decimals = 0) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value);
const num = (value: number) => new Intl.NumberFormat("en-US").format(Math.round(value));

function Metric({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof BarChart3 }) {
  return <article className="gb-metric"><div><Icon /></div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function ReportChart({ title, data, dataKey = "net", color = "#dc356f" }: { title: string; data: ReturnType<typeof group>; dataKey?: "net" | "contribution"; color?: string }) {
  return <article className="gb-panel"><header><div><span>GLOBALBAKE REPORT</span><h2>{title}</h2></div><i style={{ background: color }} /></header><div className="gb-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ left: 18, right: 12 }}><CartesianGrid horizontal={false} stroke="#edf0f3" /><XAxis type="number" tickFormatter={(value) => `$${Math.round(value / 1000)}k`} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={112} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => usd(Number(value))} /><Bar dataKey={dataKey} fill={color} radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div></article>;
}

export default function GlobalBakeBI() {
  const [product, setProduct] = useState("");
  const [customer, setCustomer] = useState("");
  const [season, setSeason] = useState("");
  const lines = useMemo(() => demoLines.filter((line) => (!product || line.product === product) && (!customer || line.customer === customer) && (!season || line.season === season)), [product, customer, season]);
  const totals = summarize(lines);
  const byProduct = group(lines, (line) => line.product).sort((a, b) => b.net - a.net);
  const byCustomer = group(lines, (line) => line.customer).sort((a, b) => b.net - a.net);
  const bySeason = group(lines, (line) => line.season).sort((a, b) => seasons.indexOf(a.name) - seasons.indexOf(b.name));
  const matrix = group(lines, (line) => `${line.product}|||${line.customer}`).sort((a, b) => b.contribution - a.contribution);
  const conchas = summarize(lines.filter((line) => line.product === "Conchas"));
  return <div className="gb-screen">
    <section className="gb-heading"><div><p>GLOBALBAKE · BUSINESS INTELLIGENCE</p><h1>Sales & contribution reports</h1><span>Product, customer and seasonal performance from a read-only reporting model.</span></div><b><i /> Demo data — pending GlobalBake connection</b></section>
    <section className="gb-filters"><div><Filter /><strong>Filters</strong></div><label>Product<select value={product} onChange={(event) => setProduct(event.target.value)}><option value="">All products</option>{products.map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label>Customer<select value={customer} onChange={(event) => setCustomer(event.target.value)}><option value="">All customers</option>{customers.map((item) => <option key={item}>{item}</option>)}</select></label><label>Season<select value={season} onChange={(event) => setSeason(event.target.value)}><option value="">All seasons</option>{seasons.map((item) => <option key={item}>{item}</option>)}</select></label><button onClick={() => { setProduct(""); setCustomer(""); setSeason(""); }}>Reset filters</button></section>
    <section className="gb-metrics"><Metric icon={CircleDollarSign} label="Net sales" value={usd(totals.net)} note="Gross sales − discounts − returns" /><Metric icon={Boxes} label="Units sold" value={num(totals.quantity)} note="Filtered order-line quantity" /><Metric icon={BarChart3} label="Estimated contribution" value={usd(totals.contribution)} note="Net sales − variable costs − freight" /><Metric icon={PackageSearch} label="Contribution margin" value={`${totals.margin.toFixed(1)}%`} note="Estimated contribution ÷ net sales" /></section>
    <section className="gb-conchas"><div><span>CONCHAS EXAMPLE · CALCULATED, NOT HARDCODED</span><h2>Contribution generated by Conchas</h2><p>Each customer result multiplies the standard unit variable cost by the quantity sold, adds allocated freight, then subtracts total variable cost from net revenue.</p></div><div><span>Quantity sold<strong>{num(conchas.quantity)}</strong></span><span>Net revenue<strong>{usd(conchas.net)}</strong></span><span>Unit variable cost<strong>{usd(products[0].cost, 2)}</strong></span><span>Estimated contribution<strong>{usd(conchas.contribution)}</strong></span><span>Margin<strong>{conchas.margin.toFixed(1)}%</strong></span></div></section>
    <section className="gb-grid"><ReportChart title="Net sales by product" data={byProduct} /><ReportChart title="Contribution by product" data={byProduct} dataKey="contribution" color="#273142" /><ReportChart title="Net sales by customer" data={byCustomer} /><ReportChart title="Contribution by customer" data={byCustomer} dataKey="contribution" color="#273142" /></section>
    <article className="gb-panel gb-season"><header><div><span>SEASONALITY</span><h2>Sales and contribution by season</h2></div></header><div className="gb-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={bySeason}><CartesianGrid vertical={false} stroke="#edf0f3" /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => usd(Number(value))} /><Line dataKey="net" name="Net sales" stroke="#dc356f" strokeWidth={3} /><Line dataKey="contribution" name="Contribution" stroke="#273142" strokeWidth={3} /></LineChart></ResponsiveContainer></div></article>
    <article className="gb-panel"><header><div><span>PRODUCT × CUSTOMER</span><h2>Quantity, sales and margin contribution</h2></div><Users /></header><div className="gb-table-wrap"><table><thead><tr><th>Product</th><th>Customer</th><th>Season coverage</th><th>Quantity sold</th><th>Net sales</th><th>Net price / unit</th><th>Variable cost / unit</th><th>Freight</th><th>Estimated contribution</th><th>Margin</th></tr></thead><tbody>{matrix.map((row) => <tr className={row.items[0].product === "Conchas" ? "highlight" : ""} key={row.name}><td><strong>{row.items[0].product}</strong><small>{row.items[0].family}</small></td><td>{row.items[0].customer}</td><td>{new Set(row.items.map((item) => item.season)).size}</td><td>{num(row.quantity)}</td><td>{usd(row.net)}</td><td>{usd(row.net / row.quantity, 2)}</td><td>{usd(row.items[0].unitCost, 2)}</td><td>{usd(row.items.reduce((sum, item) => sum + item.freight, 0))}</td><td><b>{usd(row.contribution)}</b></td><td>{row.margin.toFixed(1)}%</td></tr>)}</tbody></table></div><p className="gb-formula">Net revenue = gross sales − discounts − returns. Total variable cost = quantity sold × standard unit variable cost + allocated freight. Estimated contribution = net revenue − total variable cost.</p></article>
  </div>;
}
