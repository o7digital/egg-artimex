"use client";

import { useMemo, useRef, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, LineChart, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  BarChart3, Bot, Boxes, CalendarRange, ChevronDown,
  CloudUpload, Database, Download, FileCheck2, Filter, Gauge, Menu, PackageSearch,
  RefreshCw, Search, Settings2, Sparkles, Users, X,
} from "lucide-react";
import { demoGlobalBakeAdapter } from "@/lib/globalbake/adapter";
import { groupLines, summarize } from "@/lib/globalbake/reporting";
import type { OrderLine, ReportingFilters, SeasonDefinition } from "@/lib/globalbake/types";
import "./reporting.css";

type Screen = "executive" | "sales" | "products" | "customers" | "seasonality" | "data" | "olivia" | "future";

const NAV: { id: Screen; label: string; icon: typeof Gauge; priority?: boolean }[] = [
  { id: "executive", label: "Executive Dashboard", icon: Gauge, priority: true },
  { id: "sales", label: "Sales Intelligence", icon: BarChart3, priority: true },
  { id: "products", label: "Product Profitability", icon: PackageSearch, priority: true },
  { id: "customers", label: "Customer Profitability", icon: Users, priority: true },
  { id: "seasonality", label: "Seasonality", icon: CalendarRange, priority: true },
  { id: "data", label: "GlobalBake Data", icon: Database, priority: true },
  { id: "olivia", label: "Olivia AI Insights", icon: Bot },
  { id: "future", label: "Future O7 Bakery OS Capabilities", icon: Boxes },
];

const EMPTY_FILTERS: ReportingFilters = {
  dateFrom: "", dateTo: "", year: "2026", month: "", quarter: "", season: "", product: "", productFamily: "", customer: "", customerGroup: "", location: "",
};

const DEFAULT_SEASONS: SeasonDefinition[] = [
  { name: "Season A", months: [1, 2, 3] }, { name: "Season B", months: [4, 5, 6] },
  { name: "Season C", months: [7, 8, 9] }, { name: "Season D", months: [10, 11, 12] },
];

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const money2 = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
const pct = (value: number) => `${value.toFixed(1)}%`;
const cost = (value: number | null, formatter: (n: number) => string = money) => value === null ? "Cost data unavailable" : formatter(value);

function DemoBadge() {
  return <span className="bi-demo"><i /> Demo Data — Pending GlobalBake Data Connection</span>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="bi-filter-field"><span>{label}</span><div><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">All</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown /></div></label>;
}

function GlobalFilters({ filters, setFilters, seasons }: { filters: ReportingFilters; setFilters: (filters: ReportingFilters) => void; seasons: SeasonDefinition[] }) {
  const [expanded, setExpanded] = useState(false);
  const dimensions = demoGlobalBakeAdapter.getDimensions();
  const update = (key: keyof ReportingFilters, value: string) => setFilters({ ...filters, [key]: value });
  const activeCount = Object.values(filters).filter(Boolean).length;
  return <section className="bi-filters">
    <div className="bi-filter-row">
      <div className="bi-filter-title"><Filter /><span>Global filters</span>{activeCount > 0 && <b>{activeCount}</b>}</div>
      <label className="bi-filter-field bi-date"><span>Date range</span><input type="date" value={filters.dateFrom} onChange={(event) => update("dateFrom", event.target.value)} aria-label="Date from" /><em>to</em><input type="date" value={filters.dateTo} onChange={(event) => update("dateTo", event.target.value)} aria-label="Date to" /></label>
      <FilterSelect label="Year" value={filters.year} onChange={(value) => update("year", value)} options={dimensions.years} />
      <FilterSelect label="Product" value={filters.product} onChange={(value) => update("product", value)} options={dimensions.products} />
      <FilterSelect label="Customer" value={filters.customer} onChange={(value) => update("customer", value)} options={dimensions.customers} />
      <button className="bi-more" onClick={() => setExpanded(!expanded)}><Settings2 /> {expanded ? "Fewer" : "More"} filters</button>
      <button className="bi-clear" onClick={() => setFilters(EMPTY_FILTERS)}><RefreshCw /> Reset</button>
    </div>
    {expanded && <div className="bi-filter-extra">
      <FilterSelect label="Month" value={filters.month} onChange={(value) => update("month", value)} options={Array.from({ length: 12 }, (_, i) => String(i + 1))} />
      <FilterSelect label="Quarter" value={filters.quarter} onChange={(value) => update("quarter", value)} options={["Q1", "Q2", "Q3", "Q4"]} />
      <FilterSelect label="Season" value={filters.season} onChange={(value) => update("season", value)} options={seasons.map((season) => season.name)} />
      <FilterSelect label="Product family" value={filters.productFamily} onChange={(value) => update("productFamily", value)} options={dimensions.productFamilies} />
      <FilterSelect label="Customer group" value={filters.customerGroup} onChange={(value) => update("customerGroup", value)} options={dimensions.customerGroups} />
      <FilterSelect label="Location / sales area" value={filters.location} onChange={(value) => update("location", value)} options={dimensions.locations} />
    </div>}
  </section>;
}

function Heading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <header className="bi-heading"><div><p>{eyebrow}</p><h1>{title}</h1><span>{copy}</span></div>{action}</header>;
}

function Empty() { return <div className="bi-empty"><Search /><strong>No matching data</strong><span>Adjust the global filters to widen this view.</span></div>; }

function Metric({ label, value, note, tone = "plain" }: { label: string; value: string; note?: string; tone?: string }) {
  return <article className={`bi-metric ${tone === "accent" ? "accent" : ""}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

function chartMonths(lines: OrderLine[]) {
  return groupLines(lines, (line) => line.date.slice(0, 7)).sort((a, b) => a.name.localeCompare(b.name)).map((row) => ({ month: row.name.slice(2), sales: Math.round(row.summary.netSales), contribution: row.summary.contribution === null ? null : Math.round(row.summary.contribution) }));
}

function Executive({ lines, setScreen }: { lines: OrderLine[]; setScreen: (screen: Screen) => void }) {
  const summary = summarize(lines);
  const products = groupLines(lines, (line) => line.product).sort((a, b) => b.summary.netSales - a.summary.netSales);
  const profitableProducts = products.filter((row) => row.summary.contribution !== null).sort((a, b) => (b.summary.contribution ?? 0) - (a.summary.contribution ?? 0));
  const customers = groupLines(lines, (line) => line.customer).filter((row) => row.summary.contribution !== null).sort((a, b) => (b.summary.contribution ?? 0) - (a.summary.contribution ?? 0));
  const months = chartMonths(lines);
  if (!lines.length) return <><Heading eyebrow="Management overview" title="Executive Dashboard" copy="One trusted view of sales, contribution and customer performance." /><Empty /></>;
  return <>
    <Heading eyebrow="Management overview" title="Executive Dashboard" copy="A read-only intelligence layer built around GlobalBake transactional data." />
    <section className="bi-metrics">
      <Metric label="Net Sales" value={money(summary.netSales)} note="Gross less discounts and credits" tone="accent" />
      <Metric label="Units Sold" value={number(summary.quantity)} /><Metric label="Total Orders" value={number(summary.orders)} />
      <Metric label="Average Order Value" value={money(summary.orders ? summary.netSales / summary.orders : 0)} />
      <Metric label="Estimated Contribution Margin" value={cost(summary.contribution)} /><Metric label="Contribution Margin Percentage" value={cost(summary.contributionPct, pct)} />
      <Metric label="Active Customers" value={String(new Set(lines.map((line) => line.customerId)).size)} />
      <Metric label="Best-Selling Product" value={products[0]?.name ?? "—"} note={products[0] ? `${money(products[0].summary.netSales)} net sales` : undefined} />
      <Metric label="Most Profitable Product" value={profitableProducts[0]?.name ?? "Cost data unavailable"} note={profitableProducts[0] ? money(profitableProducts[0].summary.contribution ?? 0) : undefined} />
      <Metric label="Most Profitable Customer" value={customers[0]?.name ?? "Cost data unavailable"} note={customers[0] ? money(customers[0].summary.contribution ?? 0) : undefined} />
    </section>
    <section className="bi-grid-main">
      <article className="bi-panel"><PanelTitle label="PERFORMANCE TREND" title="Sales and contribution over time" action="Sales report" onAction={() => setScreen("sales")} /><div className="bi-chart tall"><ResponsiveContainer><AreaChart data={months}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cf3d69" stopOpacity=".28"/><stop offset="1" stopColor="#cf3d69" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f4"/><XAxis dataKey="month" tickLine={false} axisLine={false}/><YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tickLine={false} axisLine={false}/><Tooltip formatter={(v) => money(Number(v))}/><Area dataKey="sales" stroke="#cf3d69" fill="url(#salesFill)" strokeWidth={2.5}/><Line dataKey="contribution" stroke="#273142" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></article>
      <article className="bi-panel bi-dark"><p className="bi-kicker">OLIVIA MANAGEMENT SIGNAL</p><Sparkles className="bi-spark"/><h2>{products[0]?.name} leads filtered net sales.</h2><p>{customers[0]?.name} currently generates the strongest estimated contribution among customers with complete cost data.</p><button onClick={() => setScreen("olivia")}>Open deterministic insights →</button></article>
    </section>
  </>;
}

function PanelTitle({ label, title, action, onAction }: { label: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="bi-panel-title"><div><p>{label}</p><h2>{title}</h2></div>{action && <button onClick={onAction}>{action} →</button>}</div>;
}

type ProductRow = ReturnType<typeof groupLines>[number];
function ProductTable({ rows, onSelect }: { rows: ProductRow[]; onSelect: (name: string) => void }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"sales" | "contribution" | "quantity">("sales");
  const visible = rows.filter((row) => row.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === "sales" ? b.summary.netSales - a.summary.netSales : sort === "quantity" ? b.summary.quantity - a.summary.quantity : (b.summary.contribution ?? -Infinity) - (a.summary.contribution ?? -Infinity));
  return <article className="bi-panel"><div className="bi-table-tools"><PanelTitle label="PRODUCT LEDGER" title="Product performance"/><div className="bi-search"><Search/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products"/></div><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="sales">Sort: Net sales</option><option value="contribution">Sort: Contribution</option><option value="quantity">Sort: Quantity</option></select></div><div className="bi-table-wrap"><table><thead><tr><th>Product</th><th>Family</th><th>Quantity</th><th>Gross sales</th><th>Discounts</th><th>Returns</th><th>Net sales</th><th>Net unit price</th><th>Std. unit cost</th><th>Total variable cost</th><th>Contribution</th><th>Margin</th></tr></thead><tbody>{visible.map((row) => <tr key={row.name} onClick={() => onSelect(row.name)}><td><button>{row.name}</button></td><td>{row.lines[0].productFamily}</td><td>{number(row.summary.quantity)}</td><td>{money(row.summary.grossSales)}</td><td>{money(row.summary.discounts)}</td><td>{money(row.summary.returns)}</td><td><b>{money(row.summary.netSales)}</b></td><td>{money2(row.summary.avgNetPrice)}</td><td>{cost(row.summary.unitVariableCost, money2)}</td><td>{cost(row.summary.variableCost)}</td><td>{cost(row.summary.contribution)}</td><td>{cost(row.summary.contributionPct, pct)}</td></tr>)}</tbody></table></div></article>;
}

function ProductDetail({ product, lines, onClose }: { product: string; lines: OrderLine[]; onClose: () => void }) {
  const selected = lines.filter((line) => line.product === product);
  const summary = summarize(selected);
  const byCustomer = groupLines(selected, (line) => line.customer).sort((a, b) => b.summary.netSales - a.summary.netSales);
  const months = chartMonths(selected);
  return <div className="bi-drawer-backdrop" onMouseDown={onClose}><aside className="bi-drawer" onMouseDown={(event) => event.stopPropagation()}><button className="bi-drawer-close" onClick={onClose}><X/></button><p className="bi-kicker">PRODUCT DRILL-DOWN</p><h2>{product}</h2><span>All values are calculated from the filtered demo order lines.</span><div className="bi-detail-metrics"><Metric label="Quantity sold" value={number(summary.quantity)}/><Metric label="Net revenue" value={money(summary.netSales)}/><Metric label="Net selling price / unit" value={money2(summary.avgNetPrice)}/><Metric label="Standard variable cost / unit" value={cost(summary.unitVariableCost, money2)}/><Metric label="Unit contribution" value={summary.unitVariableCost === null ? "Cost data unavailable" : money2(summary.avgNetPrice - summary.unitVariableCost)}/><Metric label="Total estimated contribution" value={cost(summary.contribution)}/><Metric label="Contribution margin" value={cost(summary.contributionPct, pct)}/></div><PanelTitle label="MONTHLY EVOLUTION" title="Sales and contribution"/><div className="bi-chart"><ResponsiveContainer><LineChart data={months}><CartesianGrid vertical={false}/><XAxis dataKey="month"/><YAxis hide/><Tooltip formatter={(v) => money(Number(v))}/><Line dataKey="sales" stroke="#cf3d69" strokeWidth={2}/><Line dataKey="contribution" stroke="#273142" strokeWidth={2}/></LineChart></ResponsiveContainer></div><PanelTitle label="CUSTOMERS" title="Sales and contribution by customer"/><div className="bi-mini-list">{byCustomer.map((row) => <div key={row.name}><span><b>{row.name}</b><small>{number(row.summary.quantity)} units</small></span><span>{money(row.summary.netSales)}<small>{cost(row.summary.contribution)} contribution</small></span></div>)}</div></aside></div>;
}

function Sales({ lines }: { lines: OrderLine[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const rows = groupLines(lines, (line) => line.product);
  const sales = [...rows].sort((a, b) => b.summary.netSales - a.summary.netSales).map((row) => ({ name: row.name, value: Math.round(row.summary.netSales) }));
  const contribution = [...rows].filter((row) => row.summary.contribution !== null).sort((a, b) => (b.summary.contribution ?? 0) - (a.summary.contribution ?? 0)).map((row) => ({ name: row.name, value: Math.round(row.summary.contribution ?? 0) }));
  return <><Heading eyebrow="Commercial reporting" title="Sales Intelligence" copy="Compare product demand, realized pricing and contribution without changing GlobalBake records."/>{!lines.length ? <Empty/> : <><section className="bi-grid-two"><ChartCard title="Net sales by product" data={sales} color="#cf3d69"/><ChartCard title="Contribution by product" data={contribution} color="#273142"/></section><article className="bi-panel"><PanelTitle label="TIME SERIES" title="Product sales over time"/><div className="bi-chart"><ResponsiveContainer><LineChart data={chartMonths(lines)}><CartesianGrid vertical={false}/><XAxis dataKey="month"/><YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`}/><Tooltip formatter={(v) => money(Number(v))}/><Line dataKey="sales" stroke="#cf3d69" strokeWidth={2.5}/></LineChart></ResponsiveContainer></div></article><ProductTable rows={rows} onSelect={setSelected}/>{selected && <ProductDetail product={selected} lines={lines} onClose={() => setSelected(null)}/>}</> }</>;
}

function ChartCard({ title, data, color }: { title: string; data: { name: string; value: number }[]; color: string }) {
  return <article className="bi-panel"><PanelTitle label="RANKING" title={title}/><div className="bi-chart"><ResponsiveContainer><BarChart data={data} layout="vertical" margin={{ left: 28 }}><CartesianGrid horizontal={false}/><XAxis type="number" hide/><YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false}/><Tooltip formatter={(v) => money(Number(v))}/><Bar dataKey="value" fill={color} radius={[0, 5, 5, 0]}/></BarChart></ResponsiveContainer></div></article>;
}

function downloadCsv(lines: OrderLine[]) {
  const rows = groupLines(lines, (line) => `${line.product}|||${line.customer}`);
  const csv = [["Product","Customer","Quantity Sold","Net Sales","Net Unit Price","Unit Variable Cost","Allocated Freight","Estimated Contribution","Contribution Percentage"], ...rows.map((row) => [row.lines[0].product,row.lines[0].customer,row.summary.quantity,row.summary.netSales.toFixed(2),row.summary.avgNetPrice.toFixed(2),row.summary.unitVariableCost?.toFixed(2) ?? "Cost data unavailable",row.summary.freight?.toFixed(2) ?? "Cost data unavailable",row.summary.contribution?.toFixed(2) ?? "Cost data unavailable",row.summary.contributionPct?.toFixed(2) ?? "Cost data unavailable"])].map((row) => row.map((cell) => `"${String(cell).replaceAll('"','""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "product-customer-analysis.csv"; anchor.click(); URL.revokeObjectURL(url);
}

function ProductProfitability({ lines }: { lines: OrderLine[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"sales"|"discount"|"margin">("sales");
  const rows = groupLines(lines, (line) => `${line.product}|||${line.customer}`).filter((row) => row.name.toLowerCase().includes(search.toLowerCase())).sort((a,b) => sort === "discount" ? b.summary.discounts-a.summary.discounts : sort === "margin" ? (b.summary.contributionPct ?? -Infinity)-(a.summary.contributionPct ?? -Infinity) : b.summary.netSales-a.summary.netSales);
  return <><Heading eyebrow="Unit economics" title="Product Profitability" copy="See the products and customer combinations that create—not just consume—revenue." action={<button className="bi-primary" onClick={() => downloadCsv(lines)}><Download/> Export CSV</button>}/>{!lines.length ? <Empty/> : <><section className="bi-grid-two"><ChartCard title="Sales by product" data={groupLines(lines,l=>l.product).map(r=>({name:r.name,value:Math.round(r.summary.netSales)}))} color="#cf3d69"/><ChartCard title="Contribution by product" data={groupLines(lines,l=>l.product).filter(r=>r.summary.contribution!==null).map(r=>({name:r.name,value:Math.round(r.summary.contribution ?? 0)}))} color="#273142"/></section><article className="bi-panel"><div className="bi-table-tools"><PanelTitle label="PRODUCT × CUSTOMER" title="Contribution matrix"/><div className="bi-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter product or customer"/></div><select value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="sales">Sort: Sales</option><option value="discount">Sort: Discounts</option><option value="margin">Sort: Margin</option></select></div><div className="bi-table-wrap"><table><thead><tr><th>Product</th><th>Customer</th><th>Quantity Sold</th><th>Net Sales</th><th>Net Unit Price</th><th>Unit Variable Cost</th><th>Allocated Freight</th><th>Estimated Contribution</th><th>Contribution %</th></tr></thead><tbody>{rows.map(row=><tr key={row.name}><td><b>{row.lines[0].product}</b></td><td>{row.lines[0].customer}</td><td>{number(row.summary.quantity)}</td><td>{money(row.summary.netSales)}</td><td>{money2(row.summary.avgNetPrice)}</td><td>{cost(row.summary.unitVariableCost,money2)}</td><td>{cost(row.summary.freight)}</td><td>{cost(row.summary.contribution)}</td><td>{cost(row.summary.contributionPct,pct)}</td></tr>)}</tbody></table></div></article></>}</>;
}

function CustomerProfitability({ lines }: { lines: OrderLine[] }) {
  const [selected, setSelected] = useState<string|null>(null);
  const rows = groupLines(lines, line=>line.customer).sort((a,b)=>b.summary.netSales-a.summary.netSales);
  const maxSales = Math.max(...rows.map(row=>row.summary.netSales),1);
  const monthlyByCustomer=(name:string)=>chartMonths(lines.filter(line=>line.customer===name));
  return <><Heading eyebrow="Account economics" title="Customer Profitability" copy="Rank customer value, margin quality and momentum from the same filtered order lines."/>{!lines.length?<Empty/>:<><section className="bi-grid-two"><ChartCard title="Sales by customer" data={rows.map(r=>({name:r.name,value:Math.round(r.summary.netSales)}))} color="#cf3d69"/><ChartCard title="Contribution by customer" data={rows.filter(r=>r.summary.contribution!==null).map(r=>({name:r.name,value:Math.round(r.summary.contribution ?? 0)}))} color="#273142"/></section><article className="bi-panel"><PanelTitle label="CUSTOMER RANKING" title="Revenue, contribution and trajectory"/><div className="bi-table-wrap"><table><thead><tr><th>Customer</th><th>Signal</th><th>Group</th><th>Orders</th><th>Quantity</th><th>Net sales</th><th>AOV</th><th>Discounts</th><th>Returns</th><th>Freight</th><th>Variable costs</th><th>Contribution</th><th>Margin</th><th>Last order</th></tr></thead><tbody>{rows.map((row,index)=>{const series=monthlyByCustomer(row.name);const first=series[0]?.sales??0,last=series.at(-1)?.sales??0;const signal=index===rows.length-1?"Inactive":last>first*1.2?"Growing":last<first*.95?"Declining":row.summary.netSales>maxSales*.7&&(row.summary.contributionPct??0)<35?"High revenue · Low margin":"High revenue · High margin";return <tr key={row.name} onClick={()=>setSelected(row.name)}><td><button>{row.name}</button></td><td><span className={`bi-signal ${signal.toLowerCase().replaceAll(" ","-")}`}>{signal}</span></td><td>{row.lines[0].customerGroup}</td><td>{row.summary.orders}</td><td>{number(row.summary.quantity)}</td><td><b>{money(row.summary.netSales)}</b></td><td>{money(row.summary.netSales/row.summary.orders)}</td><td>{money(row.summary.discounts)}</td><td>{money(row.summary.returns)}</td><td>{cost(row.summary.freight)}</td><td>{cost(row.summary.variableCost)}</td><td>{cost(row.summary.contribution)}</td><td>{cost(row.summary.contributionPct,pct)}</td><td>{row.lines.map(l=>l.date).sort().at(-1)}</td></tr>})}</tbody></table></div></article>{selected&&<CustomerDrawer customer={selected} lines={lines} onClose={()=>setSelected(null)}/>}</>}</>;
}

function CustomerDrawer({customer,lines,onClose}:{customer:string;lines:OrderLine[];onClose:()=>void}){const selected=lines.filter(l=>l.customer===customer);const s=summarize(selected);const products=groupLines(selected,l=>l.product);return <div className="bi-drawer-backdrop" onMouseDown={onClose}><aside className="bi-drawer" onMouseDown={e=>e.stopPropagation()}><button className="bi-drawer-close" onClick={onClose}><X/></button><p className="bi-kicker">CUSTOMER DRILL-DOWN</p><h2>{customer}</h2><div className="bi-detail-metrics"><Metric label="Net sales" value={money(s.netSales)}/><Metric label="Orders" value={number(s.orders)}/><Metric label="Estimated contribution" value={cost(s.contribution)}/><Metric label="Margin" value={cost(s.contributionPct,pct)}/></div><PanelTitle label="EVOLUTION" title="Sales and contribution"/><div className="bi-chart"><ResponsiveContainer><LineChart data={chartMonths(selected)}><CartesianGrid vertical={false}/><XAxis dataKey="month"/><YAxis hide/><Tooltip formatter={v=>money(Number(v))}/><Line dataKey="sales" stroke="#cf3d69" strokeWidth={2}/><Line dataKey="contribution" stroke="#273142" strokeWidth={2}/></LineChart></ResponsiveContainer></div><PanelTitle label="PRODUCT MIX" title="Products purchased"/><div className="bi-mini-list">{products.map(r=><div key={r.name}><span><b>{r.name}</b><small>{number(r.summary.quantity)} units</small></span><span>{money(r.summary.netSales)}<small>{cost(r.summary.contribution)} contribution</small></span></div>)}</div></aside></div>}

function Seasonality({ lines, seasons, setSeasons }: { lines: OrderLine[]; seasons: SeasonDefinition[]; setSeasons: (s: SeasonDefinition[])=>void }) {
  const [editing,setEditing]=useState(false);
  const byMonth=groupLines(lines,l=>String(Number(l.date.slice(5,7)))).sort((a,b)=>Number(a.name)-Number(b.name)).map(r=>({name:new Date(2026,Number(r.name)-1).toLocaleString("en",{month:"short"}),sales:Math.round(r.summary.netSales),contribution:r.summary.contribution}));
  const bySeason=seasons.map(season=>{const group=lines.filter(l=>season.months.includes(Number(l.date.slice(5,7))));return {name:season.name,...summarize(group)}});
  const productMonths=groupLines(lines,l=>l.product).map(row=>({name:row.name,months:Array.from({length:12},(_,i)=>summarize(row.lines.filter(l=>Number(l.date.slice(5,7))===i+1)).netSales)}));
  return <><Heading eyebrow="Time and demand" title="Seasonality" copy="Compare monthly, quarterly and configurable commercial-season performance." action={<button className="bi-secondary" onClick={()=>setEditing(!editing)}><Settings2/> Configure seasons</button>}/>{editing&&<article className="bi-panel bi-season-config"><strong>Commercial season definitions</strong><p>Neutral placeholder names are used until Charles approves Artimex-specific seasons.</p><div>{seasons.map((season,index)=><label key={index}><input value={season.name} onChange={e=>setSeasons(seasons.map((s,i)=>i===index?{...s,name:e.target.value}:s))}/><span>Months: {season.months.join(", ")}</span></label>)}</div></article>}{!lines.length?<Empty/>:<><section className="bi-grid-two"><article className="bi-panel"><PanelTitle label="MONTHLY TREND" title="Net sales by month"/><div className="bi-chart"><ResponsiveContainer><LineChart data={byMonth}><CartesianGrid vertical={false}/><XAxis dataKey="name"/><YAxis tickFormatter={v=>`$${Math.round(v/1000)}k`}/><Tooltip formatter={v=>money(Number(v))}/><Line dataKey="sales" stroke="#cf3d69" strokeWidth={2.5}/></LineChart></ResponsiveContainer></div></article><article className="bi-panel"><PanelTitle label="SEASON COMPARISON" title="Sales and contribution"/><div className="bi-chart"><ResponsiveContainer><BarChart data={bySeason}><CartesianGrid vertical={false}/><XAxis dataKey="name"/><YAxis tickFormatter={v=>`$${Math.round(v/1000)}k`}/><Tooltip formatter={v=>money(Number(v))}/><Bar dataKey="netSales" fill="#cf3d69"/><Bar dataKey="contribution" fill="#273142"/></BarChart></ResponsiveContainer></div></article></section><article className="bi-panel"><PanelTitle label="PRODUCT TREND HEATMAP" title="Monthly demand intensity"/><Heatmap rows={productMonths}/></article><article className="bi-panel"><PanelTitle label="CUSTOMER TREND HEATMAP" title="Customer monthly intensity"/><Heatmap rows={groupLines(lines,l=>l.customer).map(row=>({name:row.name,months:Array.from({length:12},(_,i)=>summarize(row.lines.filter(l=>Number(l.date.slice(5,7))===i+1)).netSales)}))}/></article></>}</>;
}

function Heatmap({rows}:{rows:{name:string;months:number[]}[]}){const max=Math.max(...rows.flatMap(r=>r.months),1);return <div className="bi-heatmap"><div/><>{Array.from({length:12},(_,i)=><b key={i}>{new Date(2026,i).toLocaleString("en",{month:"short"})}</b>)}</>{rows.map(row=><div className="bi-heat-row" key={row.name}><strong>{row.name}</strong>{row.months.map((value,i)=><span key={i} title={`${row.name}: ${money(value)}`} style={{background:`rgba(207,61,105,${.08+.82*value/max})`}}>{value?`${Math.round(value/1000)}k`:"—"}</span>)}</div>)}</div>}

function GlobalBakeData() {
  const input=useRef<HTMLInputElement>(null); const [file,setFile]=useState<File|null>(null); const [stage,setStage]=useState<"select"|"preview"|"confirm"|"done">("select"); const [error,setError]=useState(""); const [headers,setHeaders]=useState<string[]>([]);
  const choose=async(selected?:File)=>{if(!selected)return;setFile(selected);const text=await selected.text();const first=text.split(/\r?\n/)[0]?.split(",").map(v=>v.trim().replaceAll('"',""))??[];if(!selected.name.toLowerCase().endsWith(".csv")||first.length<3){setError("Validation failed: select a CSV with at least three mapped columns.");setStage("select");return;}setError("");setHeaders(first);setStage("preview")};
  return <><Heading eyebrow="Connection readiness" title="GlobalBake Data" copy="Validate and stage approved exports through the same adapter contract used by reporting."/><section className="bi-data-status">{[["Data source","GlobalBake structured export"],["Last import date","Not connected"],["Imported file",stage==="done"?file?.name??"—":"No production file"],["Imported orders",stage==="done"?"128 simulated":"0"],["Order lines",stage==="done"?"1,024 simulated":"0"],["Accepted rows",stage==="done"?"1,019 simulated":"0"],["Rejected rows",stage==="done"?"5 simulated":"0"],["Unmatched products","3 demo issues"],["Unmatched customers","2 demo issues"],["Missing cost data","1 product"],["Data coverage","92% demo coverage"]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section><article className="bi-panel bi-import"><div className="bi-import-steps">{["1 Select file","2 Validate","3 Map columns","4 Review","5 Confirm"].map((s,i)=><span className={i<=(stage==="select"?0:stage==="preview"?2:stage==="confirm"?3:4)?"active":""} key={s}>{s}</span>)}</div>{stage==="select"&&<div className="bi-drop" onClick={()=>input.current?.click()}><CloudUpload/><h2>Select a GlobalBake CSV export</h2><p>The file stays in this browser demo. No live import or GlobalBake write occurs.</p><button className="bi-primary">Choose CSV file</button><input ref={input} type="file" accept=".csv,text/csv" onChange={e=>choose(e.target.files?.[0])}/>{error&&<b>{error}</b>}</div>}{stage==="preview"&&<div><PanelTitle label="COLUMN MAPPING PREVIEW" title={file?.name??"Selected CSV"}/><div className="bi-mapping">{headers.map((header,i)=><div key={header}><span>{header}</span><b>→</b><select defaultValue={i===0?"Order ID":i===1?"Date":i===2?"Product":"Ignore"}><option>Order ID</option><option>Date</option><option>Product</option><option>Customer</option><option>Quantity</option><option>Gross Sales</option><option>Ignore</option></select><FileCheck2/></div>)}</div><div className="bi-import-actions"><button className="bi-secondary" onClick={()=>setStage("select")}>Cancel</button><button className="bi-primary" onClick={()=>setStage("confirm")}>Validate mapping</button></div></div>}{stage==="confirm"&&<div className="bi-confirm"><FileCheck2/><h2>Validation complete</h2><p>1,024 rows parsed · 1,019 accepted · 5 rejected · 3 unmatched products · 2 unmatched customers.</p><div className="bi-error-report"><strong>Error report</strong><span>Rows 84, 211: unmatched product IDs</span><span>Rows 403, 622: unmatched customer IDs</span><span>Row 780: invalid quantity</span></div><p><b>Confirmation required:</b> this demo will only simulate the import summary. It will not persist or overwrite records.</p><button className="bi-primary" onClick={()=>setStage("done")}>Confirm simulated import</button></div>}{stage==="done"&&<div className="bi-confirm"><FileCheck2/><h2>Simulation complete</h2><p>The import summary has been updated. Reporting remains on the unchanged structured demo adapter.</p><button className="bi-secondary" onClick={()=>{setStage("select");setFile(null)}}>Run another simulation</button></div>}</article></>;
}

function OliviaInsights({lines}:{lines:OrderLine[]}){const products=groupLines(lines,l=>l.product);const customers=groupLines(lines,l=>l.customer);const conchas=products.find(r=>r.name==="Conchas");const best=customers.sort((a,b)=>b.summary.netSales-a.summary.netSales)[0];const discounted=[...customers].sort((a,b)=>b.summary.discounts-a.summary.discounts)[0];const freight=[...customers].filter(r=>r.summary.freight!==null).sort((a,b)=>(b.summary.freight??0)-(a.summary.freight??0))[0];const insights=[conchas&&`Conchas generated ${money(conchas.summary.netSales)} in net sales and ${cost(conchas.summary.contribution)} in estimated contribution in the selected period.`,best&&`${best.name} generates the highest revenue; its estimated contribution margin is ${cost(best.summary.contributionPct,pct)}.`,discounted&&`${discounted.name} receives the highest aggregate discounts at ${money(discounted.summary.discounts)}.`,freight&&`Freight costs reduce the contribution generated by ${freight.name} by ${money(freight.summary.freight??0)}.`,`Seasonal product performance should be reviewed after commercial season names are approved.`].filter(Boolean) as string[];return <><Heading eyebrow="Deterministic management analysis" title="Olivia AI Insights" copy="Rule-based observations calculated from the selected demo data. No live AI or GlobalBake connection is active."/><section className="bi-olivia"><div className="bi-olivia-head"><Sparkles/><div><strong>Olivia management brief</strong><span>Generated from {number(lines.length)} filtered order lines</span></div></div>{insights.map((insight,i)=><article key={insight}><b>{String(i+1).padStart(2,"0")}</b><p>{insight}</p><span>{i<2?"Opportunity":"Monitor"}</span></article>)}</section></>}

function FutureCapabilities(){const items=[["Production planning","Demand-to-line scheduling and capacity scenarios"],["Recipes & formulas","Versioned recipes, yields and ingredient controls"],["Quality control","Hold, release and corrective-action workflows"],["Batch traceability","Ingredient genealogy and customer exposure"],["Workforce & payroll","Time, labor and payroll operations"],["Inventory & ERP replacement","Transactional workflows after explicit approval"]];return <><Heading eyebrow="Clearly separated roadmap" title="Future O7 Bakery OS Capabilities" copy="These concepts are not current BI functions and do not imply a live ERP replacement."/><div className="bi-future-note"><Boxes/><div><strong>GlobalBake remains the transactional backend.</strong><span>Any future write workflow requires separate approval, integration design and validation.</span></div></div><section className="bi-future-grid">{items.map(([title,copy],i)=><article key={title}><span>{String(i+1).padStart(2,"0")}</span><h2>{title}</h2><p>{copy}</p><b>Future capability</b></article>)}</section></>}

export default function ReportingDashboard(){const [screen,setScreen]=useState<Screen>("executive");const [filters,setFilters]=useState(EMPTY_FILTERS);const [seasons,setSeasons]=useState(DEFAULT_SEASONS);const [mobile,setMobile]=useState(false);const lines=useMemo(()=>demoGlobalBakeAdapter.getOrderLines(filters,seasons),[filters,seasons]);const content=screen==="executive"?<Executive lines={lines} setScreen={setScreen}/>:screen==="sales"?<Sales lines={lines}/>:screen==="products"?<ProductProfitability lines={lines}/>:screen==="customers"?<CustomerProfitability lines={lines}/>:screen==="seasonality"?<Seasonality lines={lines} seasons={seasons} setSeasons={setSeasons}/>:screen==="data"?<GlobalBakeData/>:screen==="olivia"?<OliviaInsights lines={lines}/>:<FutureCapabilities/>;return <div className="bi-shell"><aside className={`bi-sidebar ${mobile?"open":""}`}><button className="bi-brand" onClick={()=>{setScreen("executive");setMobile(false)}}><span>O7</span><div><strong>O7 Bakery Intelligence</strong><small>Artimex Command Center</small></div></button><div className="bi-side-label">CURRENT INTELLIGENCE</div><nav>{NAV.map(item=>{const Icon=item.icon;return <button key={item.id} className={screen===item.id?"active":""} onClick={()=>{setScreen(item.id);setMobile(false)}}><Icon/><span>{item.label}</span></button>})}</nav><footer><Database/><div><strong>GlobalBake</strong><span>Transactional backend</span></div><i/></footer></aside>{mobile&&<button className="bi-scrim" aria-label="Close menu" onClick={()=>setMobile(false)}/>}<main className="bi-main"><header className="bi-top"><button className="bi-menu" onClick={()=>setMobile(true)}><Menu/></button><div><strong>{NAV.find(item=>item.id===screen)?.label}</strong><span>Read-only reporting layer</span></div><DemoBadge/></header><div className="bi-workspace">{!(["data","future"].includes(screen))&&<GlobalFilters filters={filters} setFilters={setFilters} seasons={seasons}/>}<div className="bi-screen" key={screen}>{content}</div></div></main></div>}
