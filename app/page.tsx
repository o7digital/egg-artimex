"use client";

import { useMemo, useState } from "react";
import DecisionStudio, { type ScenarioPlan } from "./decision-studio";
import { CostsStudio, WorkforceStudio, useOperationsDemo } from "./updates/operations";
import { LocaleProvider, useLocale } from "@/lib/i18n";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, Boxes,
  BrainCircuit, Check, ChevronDown, CircleAlert, ClipboardCheck,
  CloudCog, Factory, Gauge, Layers3, PackageCheck, RefreshCw, Search,
  ShieldCheck, Sparkles, ThermometerSnowflake, TimerReset, Truck, Wheat,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";

type Screen = "command" | "forecast" | "production" | "traceability" | "quality" | "sync" | "orders" | "recipes" | "costs" | "workforce";

const NAV: { id: Screen; label: string; icon: typeof Gauge }[] = [
  { id: "command", label: "Command center", icon: Gauge },
  { id: "forecast", label: "Demand & forecast", icon: Activity },
  { id: "production", label: "Production board", icon: Factory },
  { id: "costs", label: "Costs & revenue", icon: Activity },
  { id: "workforce", label: "Workforce & payroll", icon: TimerReset },
  { id: "traceability", label: "Batch traceability", icon: Layers3 },
  { id: "quality", label: "Quality control", icon: ClipboardCheck },
  { id: "sync", label: "R365 sync", icon: CloudCog },
  { id: "orders", label: "Orders & shipping", icon: Truck },
  { id: "recipes", label: "Recipes & items", icon: Boxes },
];

const demand = [
  { day: "Mon", actual: 82, forecast: 86 }, { day: "Tue", actual: 91, forecast: 94 },
  { day: "Wed", actual: 88, forecast: 101 }, { day: "Thu", actual: 107, forecast: 112 },
  { day: "Fri", actual: 122, forecast: 128 }, { day: "Sat", actual: 143, forecast: 151 },
  { day: "Sun", actual: 118, forecast: 124 },
];
const lines = [{ line: "L1", value: 86 }, { line: "L2", value: 94 }, { line: "L3", value: 72 }];
const products = [
  ["Concha vanilla", "Sweet bread", 48500, 12], ["Bolillo", "Rolls", 42200, 8],
  ["Concha chocolate", "Sweet bread", 31800, 17], ["Telera", "Rolls", 27600, -3],
  ["Empanada pineapple", "Pastry", 19400, 6],
] as const;
const batches = [
  { id: "BA-0905-114", product: "Concha Rosa", qty: "12,400", line: "Line 2", status: "Mixing", progress: 38, tone: "rose" },
  { id: "BA-0905-109", product: "Bolillo 6 oz", qty: "18,000", line: "Line 1", status: "Proofing", progress: 66, tone: "amber" },
  { id: "BA-0905-103", product: "Telera 8 oz", qty: "9,600", line: "Line 3", status: "Baking", progress: 82, tone: "green" },
] as const;

function Kicker({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return <p className="section-kicker">{typeof children === "string" ? t(children) : children}</p>;
}

function Status({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  const { t } = useLocale();
  return <span className={`status status--${tone}`}><i />{typeof children === "string" ? t(children) : children}</span>;
}

function Metric({ label, value, note, direction, icon: Icon }: {
  label: string; value: string; note: string; direction?: "up" | "down"; icon: typeof Gauge;
}) {
  const { t } = useLocale();
  return <article className="metric">
    <div className="metric__head"><span><Icon /></span>{direction && <em className={direction === "down" ? "good" : ""}>{direction === "up" ? <ArrowUpRight /> : <ArrowDownRight />}{note}</em>}</div>
    <p>{t(label)}</p><strong>{value}</strong>{!direction && <small>{t(note)}</small>}
  </article>;
}

function PageLead({ kicker, title, copy, action }: { kicker: string; title: string; copy: string; action?: React.ReactNode }) {
  const { t } = useLocale();
  return <section className="page-lead"><div><Kicker>{kicker}</Kicker><h1>{t(title)}</h1><p>{t(copy)}</p></div>{action}</section>;
}

function DemandChart({ dark = false, multiplier = 1 }: { dark?: boolean; multiplier?: number }) {
  return <ChartContainer
    config={{ actual: { label: "Actual orders", color: dark ? "#fff" : "#211b1b" }, forecast: { label: "Olivia forecast", color: dark ? "#ef8aac" : "#dc356f" } }}
    className="h-[260px] w-full"
  >
    <AreaChart data={demand.map(d => ({ ...d, forecast: Math.round(d.forecast * multiplier) }))} margin={{ left: -18, right: 8, top: 18 }}>
      <defs><linearGradient id={dark ? "pinkDark" : "pink"} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#dc356f" stopOpacity=".28" /><stop offset="100%" stopColor="#dc356f" stopOpacity="0" /></linearGradient></defs>
      <CartesianGrid vertical={false} stroke={dark ? "#ffffff18" : "#eee9e5"} />
      <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={12} tick={dark ? { fill: "#a99f9d" } : undefined} />
      <YAxis axisLine={false} tickLine={false} tick={dark ? { fill: "#a99f9d" } : undefined} />
      <ChartTooltip content={<ChartTooltipContent className={dark ? "bg-[#211b1b] text-white" : ""} />} />
      <Area type="monotone" dataKey="forecast" stroke="var(--color-forecast)" fill={`url(#${dark ? "pinkDark" : "pink"})`} strokeWidth={2.5} strokeDasharray="5 5" />
      <Area type="monotone" dataKey="actual" stroke="var(--color-actual)" fill="transparent" strokeWidth={3} />
    </AreaChart>
  </ChartContainer>;
}

function Command({ go }: { go: (screen: Screen) => void }) {
  const { t } = useLocale();
  const [shift, setShift] = useState("All shifts");
  return <div className="screen">
    <PageLead kicker="Friday, September 5 · Santa Fe Springs" title="Good morning, Charles." copy="Production is on plan. One ingredient risk needs attention before the evening shift."
      action={<div className="segments">{["All shifts", "Shift A", "Shift B"].map(x => <button key={x} className={shift === x ? "active" : ""} onClick={() => setShift(x)}>{t(x)}</button>)}</div>} />
    <section className="metrics">
      <Metric label="Today’s production" value="102,840" note="8.4% vs plan" direction="up" icon={Factory} />
      <Metric label="Line utilization" value="84%" note="Healthy capacity" icon={Gauge} />
      <Metric label="Waste rate" value="1.7%" note="0.4% vs last week" direction="down" icon={TimerReset} />
      <Metric label="Open batches" value="14" note="3 completing this hour" icon={Boxes} />
    </section>
    <section className="grid-main">
      <article className="panel">
        <div className="panel-head"><div><Kicker>Demand intelligence</Kicker><h2>{t("Seven-day output")}</h2></div><button onClick={() => go("forecast")}>{t("Open forecast")} <ArrowRight /></button></div>
        <DemandChart />
      </article>
      <article className="panel insight">
        <div className="insight__icon"><BrainCircuit /></div><Kicker>Olivia insight · 08:42</Kicker>
        <h2>Secure shortening inventory today.</h2>
        <p>{t("Chocolate concha demand is tracking 17% above baseline. Current stock covers 2.4 production days.")}</p>
        <div className="insight__stat"><span>{t("Suggested order")}</span><strong>4,800 lb</strong></div>
        <button className="primary" onClick={() => go("forecast")}>{t("Review recommendation")} <ArrowRight /></button>
      </article>
    </section>
    <section className="grid-half">
      <article className="panel">
        <div className="panel-head"><div><Kicker>Production floor</Kicker><h2>{t("Line capacity")}</h2></div><Status tone="green">{t("Live")}</Status></div>
        <div className="line-list">{lines.map(x => <div className="line-row" key={x.line}><span><b>{x.line}</b><small>{x.value}% {t("scheduled")}</small></span><Progress value={x.value} /><strong>{x.value}%</strong></div>)}</div>
        <button className="text-link" onClick={() => go("production")}>{t("View production board")} <ArrowRight /></button>
      </article>
      <article className="panel">
        <div className="panel-head"><div><Kicker>Attention queue</Kicker><h2>What needs you</h2></div><b className="count">3</b></div>
        <div className="attention">
          {[
            ["quality", "Lot quality hold", "Flour lot FL-8831 · moisture variance"],
            ["sync", "R365 mapping review", "2 new vendor items unmatched"],
            ["production", "Line 2 changeover", "12 minutes above target"],
          ].map(x => <button key={x[1]} onClick={() => go(x[0] as Screen)}><CircleAlert /><span><strong>{t(x[1])}</strong><small>{t(x[2])}</small></span><ArrowRight /></button>)}
        </div>
      </article>
    </section>
  </div>;
}

function Forecast() {
  const { t, locale } = useLocale();
  const [scenario, setScenario] = useState<"base" | "warm" | "promo">("base");
  const [customer, setCustomer] = useState("All customers");
  const [family, setFamily] = useState("All products");
  const factor = scenario === "warm" ? .91 : scenario === "promo" ? 1.18 : 1;
  const visibleProducts = products.filter(product => family === "All products" || product[1] === family);
  return <div className="screen">
    <PageLead kicker="Demand planning" title="Forecast studio" copy="Turn restaurant demand, direct orders and weather into a production-ready plan." action={<Button className="dark-btn"><Check /> {t("Approve weekly plan")}</Button>} />
    <div className="scenario"><span>{t("Scenario")}</span>{[["base", "Baseline"], ["warm", "Warm weather"], ["promo", "Gallo Giro promo"]].map(x => <button key={x[0]} className={scenario === x[0] ? "active" : ""} onClick={() => setScenario(x[0] as typeof scenario)}>{t(x[1])}</button>)}<small>{t("Updated 4 min ago")}</small></div>
    <section className="forecast-hero">
      <div><Kicker>{locale === "es" ? "Producción recomendada · 8–14 sep." : "Recommended output · Sep 8–14"}</Kicker><strong>{Math.round(827400 * factor).toLocaleString(locale === "es" ? "es-US" : "en-US")}</strong><span> {locale === "es" ? "unidades" : "units"}</span><p>{scenario === "warm" ? (locale === "es" ? "Menor demanda de pan dulce durante la ventana de calor." : "Lower sweet bread demand during the heat window.") : scenario === "promo" ? (locale === "es" ? "La promoción añade 18% de volumen, concentrado en las líneas 1 y 2." : "Promotion adds 18% volume, concentrated on Lines 1 and 2.") : (locale === "es" ? "6,2% por encima de la semana pasada, con crecimiento el fin de semana." : "6.2% above last week, with weekend demand leading growth.")}</p></div>
      <DemandChart dark multiplier={factor} />
    </section>
    <article className="panel">
      <div className="panel-head"><div><Kicker>Product mix</Kicker><h2>{t("Highest demand")}</h2></div><div className="filter-controls"><label>{t("Customer")}<select value={customer} onChange={event => setCustomer(event.target.value)}><option value="All customers">{t("All customers")}</option><option value="Gallo Giro">Gallo Giro</option><option value="Mixed accounts">{t("Mixed accounts")}</option></select></label><label>{t("Product")}<select value={family} onChange={event => setFamily(event.target.value)}><option value="All products">{t("All products")}</option><option value="Sweet bread">{t("Sweet bread")}</option><option value="Rolls">{t("Rolls")}</option><option value="Pastry">{t("Pastry")}</option></select></label></div></div>
      <div className="data-table"><div className="data-row data-head"><span>{t("Product")}</span><span>{t("Family")}</span><span>{t("Recommended")}</span><span>{t("vs baseline")}</span><span /></div>
        {visibleProducts.map((x, i) => <div className="data-row" key={x[0]}><span><b>{String(i + 1).padStart(2, "0")}</b><strong>{x[0]}</strong></span><span>{t(x[1])}</span><span>{Math.round(x[2] * factor).toLocaleString(locale === "es" ? "es-US" : "en-US")} {t("units")}</span><span className={x[3] >= 0 ? "positive" : "negative"}>{x[3] >= 0 ? "+" : ""}{x[3]}%</span><ArrowRight /></div>)}
      </div>
      <p className="model-note">{t(customer)} · Sep 8–14 · {locale === "es" ? "los pedidos confirmados y el pronóstico se muestran por separado; no se declara una tasa de precisión sin historial de validación." : "confirmed orders and forecast are shown separately; no accuracy rate is claimed without validation history."}</p>
    </article>
  </div>;
}

function Production({ scenarioPlan }: { scenarioPlan: ScenarioPlan | null }) {
  const { t } = useLocale();
  const [selected, setSelected] = useState("BA-0905-114-1");
  const columns = ["Queued", "In progress", "Finishing"];
  return <div className="screen">
    <PageLead kicker="Live production · Shift A" title="Production board" copy="See every batch, line constraint and handoff from mixing to cold storage." action={<Button className="dark-btn"><Factory /> {t("Create batch")}</Button>} />
    <section className="production-stats">
        {[['Shift target', '124,000', 'units'], ['Completed', '71%', '88,040 units'], ['Downtime', '18 min', '-9 min vs target'], ['Next changeover', '10:35', 'Line 2 · 24 min']].map(x => <div key={x[0]}><span>{t(x[0])}</span><strong>{x[1]}</strong><small>{t(x[2])}</small></div>)}
    </section>
    <section className="board">{columns.map((col, ci) => <div className="board-col" key={col}>
      <header><span>{t(col)}</span><b>{ci === 0 ? 3 : ci === 1 ? 4 : 2}</b></header>
      {batches.map((batch, i) => {
        const id = batch.id + "-" + ci; const progress = ci === 0 ? 8 + i * 5 : ci === 2 ? 90 + i * 3 : batch.progress;
        return <button className={`batch ${selected === id ? "selected" : ""}`} key={id} onClick={() => setSelected(id)}>
          <div><Status tone={batch.tone}>{ci === 0 ? "Ready" : ci === 2 ? "QC next" : batch.status}</Status><span>{batch.id}</span></div>
          <h3>{batch.product}</h3><p>{batch.qty} units · {batch.line}</p><Progress value={progress} /><footer><span>Due {9 + i + ci}:40</span><strong>{progress}%</strong></footer>
        </button>;
      })}
      {scenarioPlan && ci === (scenarioPlan.option === 1 ? 2 : 1) && <button className="batch selected" onClick={() => setSelected("scenario-order")}>
        <div><Status tone="rose">Demo scenario</Status><span>GG-{scenarioPlan.qty}</span></div>
        <h3>Gallo Giro · Vanilla concha</h3><p>{scenarioPlan.qty.toLocaleString()} units · {scenarioPlan.delivery}</p>
        <Progress value={0} /><footer><span>Applied to demo schedule</span><strong>0%</strong></footer>
      </button>}
    </div>)}</section>
  </div>;
}

function Traceability() {
  const { t } = useLocale();
  const [query, setQuery] = useState("BA-0905-103");
  const found = ["BA-0905-103", "BA-0905-109", "BA-0905-114"].includes(query.trim().toUpperCase());
  return <div className="screen">
    <PageLead kicker="One lot. Full history." title="Batch traceability" copy="Trace ingredients forward to customers or finished goods back to source in seconds." />
    <div className="trace-search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} aria-label={t("Search lot")} placeholder={t("Search batch, ingredient lot, PO or customer")} /><button>{t("Trace")}</button></div>
    <section className="trace-layout">
      <article className="panel">
        {!found ? <div className="empty-state"><CircleAlert /><h2>{t("No matching batch")}</h2><p>{t("Try BA-0905-103, BA-0905-109 or BA-0905-114 from this demo dataset.")}</p></div> : <>
        <div className="panel-head"><div><Kicker>Finished goods batch</Kicker><h2>{query || "BA-0905-103"}</h2></div><Status tone="green">Released</Status></div>
        <div className="trace-meta">{[["Product", "Telera 8 oz"], ["Produced", "Sep 5 · 06:14"], ["Quantity", "9,600 units"], ["Line", "Line 3"]].map(x => <span key={x[0]}><small>{t(x[0])}</small><strong>{x[1]}</strong></span>)}</div>
        <div className="trace-flow">
          <TraceStage icon={Wheat} top={t("Ingredients")} title={t("6 source lots")} note={t("Flour · Yeast · Oil +3")} />
          <ArrowRight /><TraceStage active icon={Factory} top={t("Production")} title={query || "BA-0905-103"} note={t("Mix 04:28 · Bake 05:52")} />
          <ArrowRight /><TraceStage icon={PackageCheck} top={t("Distribution")} title={t("4 shipments")} note={t("3 customers · 2 routes")} />
        </div>
        <Kicker>Ingredient genealogy</Kicker>
        <div className="ingredient-list">{[["High-gluten flour", "FL-8824", "2,140 lb"], ["Instant dry yeast", "YE-2291", "31.5 lb"], ["Vegetable shortening", "SH-4420", "188 lb"], ["Sea salt", "SA-1092", "42 lb"]].map(x => <div key={x[1]}><span><strong>{x[0]}</strong><small>{x[1]}</small></span><span>{x[2]}</span><BadgeCheck /></div>)}</div>
        </>}
      </article>
      <aside className="panel trace-side"><Kicker>Customer exposure</Kicker><h2>{found ? t("4 shipments") : t("No shipments")}</h2><p>{found ? t("All receiving locations for this batch.") : t("A valid batch is required to show downstream exposure.")}</p>
        {[["Gallo Giro · Canoga Park", "2,400", "RT-14"], ["Gallo Giro · Van Nuys", "1,800", "RT-08"], ["Mercado Central", "3,600", "RT-11"], ["Artimex Direct", "1,800", "B2C"]].map(x => <div className="shipment" key={x[0]}><span><strong>{x[0]}</strong><small>{x[2]}</small></span><b>{x[1]}</b></div>)}
        <button className="outline">{t("Export trace report")}</button>
      </aside>
    </section>
  </div>;
}

function TraceStage({ icon: Icon, top, title, note, active }: { icon: typeof Wheat; top: string; title: string; note: string; active?: boolean }) {
  return <div className={`trace-stage ${active ? "active" : ""}`}><i><Icon /></i><span><small>{top}</small><strong>{title}</strong><em>{note}</em></span></div>;
}

function Quality() {
  const { t } = useLocale();
  const [released, setReleased] = useState(false);
  const [reason, setReason] = useState("");
  return <div className="screen">
    <PageLead kicker="Quality assurance" title="Release with confidence" copy="Specifications, checks and deviations tied directly to every production batch." action={<Button className="dark-btn"><ClipboardCheck /> {t("New inspection")}</Button>} />
    <section className="metrics metrics--three"><Metric label="First-pass quality" value="98.4%" note="0.7% this month" direction="up" icon={ShieldCheck} /><Metric label="Open deviations" value="3" note="1 needs approval" icon={CircleAlert} /><Metric label="Checks completed" value="42 / 47" note="89% of shift plan" icon={ClipboardCheck} /></section>
    <section className="grid-half quality-grid">
      <article className="panel hold">
        <div className="hold__icon"><ThermometerSnowflake /></div><Kicker>Priority review</Kicker><h2>Flour moisture outside target</h2>
        <p>{t("Lot FL-8831 measured 14.8% against a 12.0–14.0% specification. Three queued batches are affected.")}</p>
        <div className="hold-stats">{[["Supplier", "Golden State Milling"], ["Received", "Sep 4 · 16:22"], ["On hold", "6,200 lb"]].map(x => <span key={x[0]}><small>{t(x[0])}</small><strong>{x[1]}</strong></span>)}</div>
        <label className="field-label" htmlFor="release-reason">{t("Release reason")}</label><textarea id="release-reason" value={reason} onChange={event => setReason(event.target.value)} placeholder={t("Required for this demo release")} />
        <div className="decision"><button className={!released ? "primary" : "outline"} onClick={() => setReleased(false)}>{t("Keep on hold")}</button><button className={released ? "primary" : "outline"} disabled={!reason.trim()} onClick={() => setReleased(true)}>{released ? <><Check /> {t("Released")}</> : t("Confirm release with reason")}</button></div>
        {released&&<p className="audit-note"><Check size={16}/> {t("Local demo audit: released by Artimex Operations with reason")} “{reason}”.</p>}
      </article>
      <article className="panel"><div className="panel-head"><div><Kicker>Today’s checks</Kicker><h2>Inspection queue</h2></div><b className="count">5</b></div>
        <div className="check-list">{[["BA-0905-109", "Proof height", "Due now", "rose"], ["BA-0905-103", "Bake color", "Passed", "green"], ["BA-0905-114", "Dough temperature", "Passed", "green"], ["BA-0905-118", "Piece weight", "In 18 min", "amber"]].map(x => <div key={x[0]}><span><b>{x[0]}</b><strong>{x[1]}</strong></span><Status tone={x[3]}>{x[2]}</Status></div>)}</div>
      </article>
    </section>
  </div>;
}

function Sync() {
  const { t } = useLocale();
  const [sync, setSync] = useState<"idle" | "loading" | "done">("idle");
  const [retried, setRetried] = useState(false);
  function runSync() { setSync("loading"); window.setTimeout(() => setSync("done"), 1200); }
  return <div className="screen">
    <PageLead kicker="Restaurant365 integration" title="R365 connection" copy="R365 remains the financial and inventory system of record. Bakery OS sends approved operational movements." action={<Button className="dark-btn" onClick={runSync} disabled={sync === "loading"}><RefreshCw className={sync === "loading" ? "spin" : ""} />{sync === "loading" ? t("Syncing…") : sync === "done" ? t("Synced") : t("Sync now")}</Button>} />
    <section className="sync-hero"><div className="sync-logos"><span>BAKERY<br />OS</span><RefreshCw /><span>R365</span></div><div><Status tone="green">{t("Simulated adapter")}</Status><h2>{t("Systems are aligned.")}</h2><p>{t("Last simulated sync today at 08:56:14 · no R365 endpoint is connected")}</p></div></section>
    <p className="system-record">{t("R365 remains the accounting and inventory system of record.")}</p>
    <section className="metrics"><Metric label="Records synchronized" value="18,442" note="Last 24 hours" icon={RefreshCw} /><Metric label="Success rate" value="99.98%" note="Within SLA" icon={BadgeCheck} /><Metric label="Pending mappings" value="2" note="Review required" icon={CircleAlert} /><Metric label="Sync latency" value="1m 42s" note="12s faster" direction="down" icon={Activity} /></section>
    <section className="grid-half">
      <article className="panel"><div className="panel-head"><div><Kicker>Data ownership</Kicker><h2>{t("Single source of truth")}</h2></div></div>
        {[["Item & vendor master", "R365", "Read"], ["Financial inventory", "R365", "Read"], ["Recipes & formulas", "Bakery OS", "Write"], ["Production batches", "Bakery OS", "Write"], ["Approved consumption", "Bakery OS → R365", "Sync"], ["Inventory valuation", "R365", "Read"]].map(x => <div className="owner-row" key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><em>{x[2]}</em></div>)}
      </article>
      <article className="panel"><div className="panel-head"><div><Kicker>Recent activity</Kicker><h2>{t("Sync log")}</h2></div><span className="status status--amber">{t("Demo adapter")}</span></div>
        {[["Production consumption", "1,284 records", "08:56", "green"], ["Finished goods receipts", "42 records", "08:54", "green"], ["Vendor item master", "2 need mapping", "08:42", "amber"], ["Inventory snapshot", "4,306 records", "08:30", "green"]].map(x => <div className="sync-row" key={x[0]}><i className={`dot dot--${x[3]}`} /><span><strong>{x[0]}</strong><small>{x[1]}</small></span><time>{x[2]}</time></div>)}
        <div className="sync-row"><i className={`dot dot--${retried ? "green" : "rose"}`} /><span><strong>Approved consumption · EV-0905-014</strong><small>Idempotency key: BA-0905-103-consumption-v1</small></span><button className="text-link" onClick={() => setRetried(true)}>{retried ? t("Replayed once") : t("Retry safely")}</button></div>
      </article>
    </section>
  </div>;
}

function Orders() {
  const { t } = useLocale();
  const [filter, setFilter] = useState("All statuses");
  const orders = [["GG-240905-01", "Gallo Giro · 3 locations", "Concha vanilla", "24,000", "Planned", "Fresh · Fri Sep 5"], ["GG-240905-02", "Gallo Giro · Commissary", "Bolillo 6 oz", "18,000", "In production", "Fresh · Fri Sep 5"], ["MC-240904-11", "Mercado Central", "Empanada pineapple", "8,400", "Ready", "Frozen · Sep 8"]];
  return <div className="screen"><PageLead kicker="B2B fulfillment" title="Orders & shipping" copy="Track confirmed customer demand from order confirmation to lot-linked shipment." action={<Button className="dark-btn"><Truck /> {t("New B2B order")}</Button>} /><div className="scenario"><span>{t("View")}</span>{["All statuses", "Confirmed", "In production", "Ready"].map(value => <button key={value} className={filter===value?"active":""} onClick={() => setFilter(value)}>{t(value)}</button>)}</div><article className="panel"><div className="panel-head"><div><Kicker>Customer orders</Kicker><h2>{t("Confirmed demand")}</h2></div><Status tone="green">{t("Demo data")}</Status></div><div className="data-table"><div className="data-row data-head"><span>{t("Order")}</span><span>{t("Customer")}</span><span>{t("Product")}</span><span>{t("Qty")}</span><span>{t("Status")}</span><span>{t("Delivery")}</span></div>{orders.filter(order => filter === "All statuses" || order[4] === filter).map(order => <div className="data-row" key={order[0]}><span><strong>{order[0]}</strong></span><span>{order[1]}</span><span>{order[2]}</span><span>{order[3]} {t("units")}</span><Status tone={order[4] === "Ready" ? "green" : "amber"}>{order[4]}</Status><span>{order[5]}</span></div>)}</div><p className="model-note">{t("Produced and remaining quantities are simulated; each shipment is linked to a finished-goods batch before dispatch.")}</p></article></div>;
}

function Recipes() {
  const { t } = useLocale();
  const [selected, setSelected] = useState("Concha vanilla · v3.2");
  const recipe = selected.startsWith("Frozen") ? { yield: "420 trays", size: "1 batch · 210 lb dough", loss: "2.5% expected", allergens: "Wheat, egg, milk" } : { yield: "12,000 units", size: "1 batch · 480 lb dough", loss: "1.8% expected", allergens: "Wheat, egg, milk, soy" };
  return <div className="screen"><PageLead kicker="Formula control" title="Recipes & batches" copy="Versioned formulas keep ingredients, yields, losses and allergen controls explicit." action={<Button className="dark-btn"><Boxes /> {t("Create recipe version")}</Button>} /><section className="grid-half"><article className="panel"><div className="panel-head"><div><Kicker>Versioned catalog</Kicker><h2>{t("Products")}</h2></div><Status tone="green">{t("3 active")}</Status></div>{["Concha vanilla · v3.2", "Bolillo 6 oz · v2.4", "Frozen empanada · v1.8"].map(value => <button key={value} className={`attention-row ${selected===value?"selected":""}`} onClick={() => setSelected(value)}><span><strong>{value}</strong><small>{t(value.startsWith("Frozen") ? "Frozen · active" : "Fresh · active")}</small></span><ArrowRight /></button>)}</article><article className="panel"><Kicker>Selected formula</Kicker><h2>{selected}</h2><div className="trace-meta"><span><small>{t("Theoretical yield")}</small><strong>{recipe.yield}</strong></span><span><small>{t("Batch size")}</small><strong>{recipe.size}</strong></span><span><small>{t("Expected loss")}</small><strong>{recipe.loss}</strong></span><span><small>{t("Allergens")}</small><strong>{recipe.allergens}</strong></span></div><Kicker>Ingredients · explicit units</Kicker><div className="ingredient-list">{[["High-gluten flour", "lb", "320"], ["Sugar", "lb", "68"], ["Vegetable shortening", "lb", "42"], ["Water", "gal", "18"]].map(item => <div key={item[0]}><span><strong>{item[0]}</strong><small>{item[1]}</small></span><span>{item[2]} {item[1]}</span><BadgeCheck /></div>)}</div><p className="model-note">{t("Units and packaging are displayed separately. No conversion is applied without an explicit factor.")}</p></article></section></div>;
}

function Olivia({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) {
  const { locale, t } = useLocale();
  const [prompt, setPrompt] = useState("");
  const [sent, setSent] = useState(false);
  return <Sheet open={open} onOpenChange={setOpen}><SheetContent className="olivia-sheet sm:max-w-[470px]">
    <SheetHeader><div className="olivia-mark"><Sparkles /></div><SheetTitle>{t("Olivia · Production intelligence")}</SheetTitle><SheetDescription>{t("Demo conversation only. No AI service or R365 connection is active.")}</SheetDescription></SheetHeader>
    <div className="thread"><div className="message"><span>O</span><p>{locale === "es" ? "Buenos días. Encontré un riesgo accionable: la cobertura de manteca está por debajo del objetivo de tres días mientras aumenta la demanda de conchas de chocolate." : "Good morning. I found one actionable risk: shortening coverage is below the three-day target while chocolate concha demand is rising."}</p></div>
       {[["Objectif de production", "124,000", "unités"], ["Complété", "71%", "88,040 unités"], ["Temps d'arrêt", "18 min", "-9 min par rapport à l'objectif"], ["Prochain changement", "10:35", "Ligne 2 · 24 min"]].map(x => <div key={x[0]}><span>{t(x[0])}</span><strong>{x[1]}</strong><small>{t(x[2])}</small></div>)}
      <div className="suggestions">{(locale === "es" ? ["Crear el plan de producción óptimo de mañana", "Explicar el retraso de la línea 2", "¿Qué lotes requieren atención?"] : ["Build tomorrow’s optimal production plan", "Explain the Line 2 delay", "Which lots need attention?"]).map(x => <button key={x} onClick={() => { setPrompt(x); setSent(false); }}>{x}<ArrowRight /></button>)}</div>
    </div>
    <div className="composer"><textarea value={prompt} onChange={e => { setPrompt(e.target.value); setSent(false); }} placeholder={locale === "es" ? "Pregunta a Olivia sobre demanda, producción o calidad…" : "Ask Olivia about demand, production or quality…"} /><button aria-label={t("Send")} onClick={() => prompt.trim() && setSent(true)}><ArrowUpRight /></button></div>
  </SheetContent></Sheet>;
}

function HomeContent() {
  const { locale, setLocale, t } = useLocale();
  const [active, setActive] = useState<Screen>("command");
  const [olivia, setOlivia] = useState(false);
  const [scenarioPlan, setScenarioPlan] = useState<ScenarioPlan | null>(null);
  const operations = useOperationsDemo();
  const resetDemo = () => { setScenarioPlan(null); operations.reset(); };
  const title = useMemo(() => t(NAV.find(x => x.id === active)?.label ?? ""), [active, t]);
  const content = active === "costs" ? <CostsStudio key={operations.resetVersion} demo={operations} /> : active === "workforce" ? <WorkforceStudio key={operations.resetVersion} demo={operations} /> : active === "command" ? <DecisionStudio go={setActive} scenarioPlan={scenarioPlan} onApply={setScenarioPlan} onCancel={() => setScenarioPlan(null)} /> : active === "forecast" ? <Forecast /> : active === "production" ? <Production scenarioPlan={scenarioPlan} /> : active === "traceability" ? <Traceability /> : active === "quality" ? <Quality /> : active === "sync" ? <Sync /> : active === "orders" ? <Orders /> : <Recipes />;
  return <SidebarProvider defaultOpen>
    <Sidebar collapsible="icon" className="app-sidebar">
      <SidebarHeader className="brand-block"><button className="brand" onClick={() => setActive("command")}><span>O7</span><div><strong>O7</strong><small>BAKERY OS</small></div></button></SidebarHeader>
      <SidebarContent>
        <SidebarGroup><SidebarGroupLabel>{t("Operations")}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{NAV.map(x => { const Icon = x.icon; return <SidebarMenuItem key={x.id}><SidebarMenuButton tooltip={t(x.label)} isActive={active === x.id} onClick={() => setActive(x.id)}><Icon /><span>{t(x.label)}</span>{x.id === "quality" && <i className="nav-alert" />}</SidebarMenuButton></SidebarMenuItem>; })}</SidebarMenu></SidebarGroupContent></SidebarGroup>
        <SidebarGroup><SidebarGroupLabel>{t("Workspace")}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton isActive={active === "orders"} onClick={() => setActive("orders")}><Truck /><span>{t("Orders & shipping")}</span></SidebarMenuButton></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton isActive={active === "recipes"} onClick={() => setActive("recipes")}><Boxes /><span>{t("Recipes & items")}</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>
      </SidebarContent>
      <SidebarFooter><button className="r365-mini" onClick={() => setActive("sync")}><CloudCog /><span><strong>{t("R365 · demo adapter")}</strong><small>{t("Accounting & inventory retained")}</small></span><i /></button><button className="text-link demo-reset" onClick={resetDemo}><RefreshCw size={15} /> {t("Reset demo")}</button><div className="user-mini"><span>AO</span><div><strong>Artimex Operations</strong><small>{t("Demo workspace")}</small></div><ChevronDown /></div></SidebarFooter>
    </Sidebar>
    <SidebarInset className="app-inset"><header className="topbar"><div><SidebarTrigger /><span className="mobile-title">{title}</span></div><div className="top-actions"><div className="locale-toggle" aria-label="Language"><button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button><button className={locale === "es" ? "active" : ""} onClick={() => setLocale("es")}>ES</button></div><span className="date">{t("Sample workspace · no live integrations")}</span><button className="ask" onClick={() => setOlivia(true)}><Sparkles /><span>{t("Ask Olivia")}</span></button></div></header><main className="workspace">{content}</main></SidebarInset>
    <Olivia open={olivia} setOpen={setOlivia} />
  </SidebarProvider>;
}

export default function Home() {
  return <LocaleProvider><HomeContent /></LocaleProvider>;
}
