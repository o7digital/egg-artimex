export type ProductionRow = {
  id: string; sourceRow: number; date: string; lot: string; sku: string; product: string;
  plannedCases: number | null; producedCases: number | null; unitsPerCase: number | null;
  looseUnits: number | null; pricePerCase: number | null; material: number | null;
  standardMaterial: number | null; regularHours: number | null; overtimeHours: number | null;
  doubleHours: number | null; hourlyRate: number | null; standardLaborRate: number | null;
  comment?: string | null; source?: Record<string, number | null>; rawIssues?: string[];
};
const nonnegative = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export function costRow(row: ProductionRow, overhead = 1.35) {
  const issues: string[] = [];
  for (const k of ['producedCases','pricePerCase','material','regularHours','hourlyRate'] as const)
    if (!nonnegative(row[k])) issues.push(`Missing or invalid ${k}`);
  if (!nonnegative(row.unitsPerCase) || row.unitsPerCase === 0) issues.push('Invalid case conversion');
  for (const k of ['looseUnits','overtimeHours','doubleHours'] as const)
    if (row[k] != null && !nonnegative(row[k])) issues.push(`Invalid ${k}`);
  if (!nonnegative(overhead)) issues.push('Invalid overhead');
  if (issues.length) return { row, issues, value: null };
  const units = row.producedCases! * row.unitsPerCase! + (row.looseUnits ?? 0);
  const labor = (row.regularHours! + (row.overtimeHours ?? 0) * 1.5 + (row.doubleHours ?? 0) * 2) * row.hourlyRate!;
  const appliedOverhead = labor * overhead;
  const cost = row.material! + labor + appliedOverhead;
  const productionValue = units * row.pricePerCase! / row.unitsPerCase!;
  return { row, issues, value: { units, labor, appliedOverhead, cost, productionValue,
    result: productionValue - cost, margin: productionValue > 0 ? (productionValue-cost)/productionValue : null,
    materialVariance: row.standardMaterial == null ? null : row.standardMaterial-row.material!,
    laborVariance: row.standardLaborRate == null ? null : row.standardLaborRate*row.producedCases!-labor,
    unitCost: units > 0 ? cost/units : null } };
}
export function summarize(rows: ProductionRow[]) {
  const checked = rows.map(r => costRow(r));
  return checked.reduce((a,r) => {
    if (!r.value) { a.excluded++; return a; }
    a.included++; a.units+=r.value.units; a.material+=r.row.material!; a.labor+=r.value.labor;
    a.overhead+=r.value.appliedOverhead; a.cost+=r.value.cost; a.value+=r.value.productionValue;
    return a;
  }, {included:0,excluded:0,units:0,material:0,labor:0,overhead:0,cost:0,value:0});
}
export type Scenario = { volume: number; price: number; sellThrough: number; materials: number; labor: number };
export const defaultScenario: Scenario = {volume:100,price:0,sellThrough:90,materials:0,labor:0};
export function projectRevenue(base: ReturnType<typeof summarize>, s: Scenario) {
  if (Object.values(s).some(x => !Number.isFinite(x)) || s.volume<0 || s.price < -100 || s.materials < -100 || s.labor < -100 || s.sellThrough<0 || s.sellThrough>100) throw new Error('Invalid scenario');
  const volume=s.volume/100, sold=s.sellThrough/100;
  const revenue=base.value*volume*(1+s.price/100)*sold;
  const material=base.material*volume*(1+s.materials/100);
  const labor=base.labor*volume*(1+s.labor/100);
  const overhead=labor*1.35;
  return {revenue,material,labor,overhead,spend:material+labor+overhead,
    balance:revenue-material-labor-overhead,producedUnits:base.units*volume,
    soldUnits:base.units*volume*sold,remainingUnits:base.units*volume*(1-sold)};
}
export function parseProduction(text: string): ProductionRow[] {
  const data=JSON.parse(text);
  if (!data || !Array.isArray(data.records) || data.records.length===0 || data.records.length>10000) throw new Error('Expected 1–10,000 normalized records. Use the supplied converter.');
  const ids=new Set<string>();
  for (const r of data.records) {
    if (!r || typeof r.id!=='string' || ids.has(r.id) || typeof r.product!=='string' || typeof r.date!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) throw new Error('Invalid or duplicate record identity / date.');
    for (const k of ['lot','sku','comment']) {
      if (r[k] != null && typeof r[k] !== 'string') throw new Error(`Invalid text field: ${k}`);
    }
    if (r.rawIssues != null && (!Array.isArray(r.rawIssues) || r.rawIssues.some((issue: unknown) => typeof issue !== 'string'))) throw new Error('Invalid source issues.');
    if (r.source != null && (typeof r.source !== 'object' || Array.isArray(r.source) || Object.values(r.source).some(v => v != null && (typeof v !== 'string' && (typeof v !== 'number' || !Number.isFinite(v)))))) throw new Error('Invalid source totals.');
    ids.add(r.id);
    for (const k of ['plannedCases','producedCases','unitsPerCase','looseUnits','pricePerCase','material','standardMaterial','regularHours','overtimeHours','doubleHours','hourlyRate','standardLaborRate']) {
      if (r[k] != null && !nonnegative(r[k])) throw new Error(`Invalid numeric field: ${k}`);
    }
  }
  return data.records;
}
export type Employee = {id:string;name:string;line:string;rate:number;regular:number;ot:number;double:number;status:'working'|'paid-rest'|'unpaid-meal'|'off';breakStart:number|null;paidBreak:number;unpaidBreak:number;approved:boolean};
export type Workforce = {minute:number;people:Employee[];audit:string[]};
export function initialWorkforce():Workforce {
  return {minute:10*60,people:['Alex Martin','Jamie Rivera','Sam Lee','Taylor Cruz'].map((name,i)=>({id:`DEMO-${i+1}`,name,line:`Line ${i%2+1}`,rate:22+i,regular:4,ot:0,double:0,status:'working',breakStart:null,paidBreak:0,unpaidBreak:0,approved:false})),audit:[]};
}
export function gross(e:Employee) { return (e.regular+e.ot*1.5+e.double*2)*e.rate; }
export function workforceAction(state:Workforce,id:string,action:'paid-rest'|'unpaid-meal'|'resume'|'finish'|'approve'|'reopen'|'advance'):Workforce {
  if (action==='advance') return {...state,minute:state.minute+15,people:state.people.map(e=>e.status==='off'?e:{...e,regular:e.regular+(e.status==='unpaid-meal'?0:.25)})};
  const target=state.people.find(e=>e.id===id);
  if (!target) return state;
  const e={...target};
  if (action==='reopen' && e.approved) e.approved=false;
  else if (e.approved) return state;
  else if ((action==='paid-rest'||action==='unpaid-meal') && e.status==='working') {e.status=action;e.breakStart=state.minute;}
  else if (action==='resume' && (e.status==='paid-rest'||e.status==='unpaid-meal')) {const duration=state.minute-e.breakStart!; if(duration<=0)return state; if(e.status==='paid-rest')e.paidBreak+=duration;else e.unpaidBreak+=duration;e.status='working';e.breakStart=null;}
  else if (action==='finish' && e.status==='working') e.status='off';
  else if (action==='approve' && e.status==='off') e.approved=true;
  else return state;
  return {...state,people:state.people.map(p=>p.id===id?e:p),audit:[`${state.minute} · ${id} · ${action}`, ...state.audit]};
}
export function payrollCSV(people:Employee[]) {
  const approved=people.filter(e=>e.approved&&e.status==='off');
  const cell=(v:string|number)=>`"${String(v).replace(/^[=+@\-]/,"'$&").replaceAll('"','""')}"`;
  return [['DEMO ONLY — gross pay preparation','ID','Regular hours','OT hours','Double hours','Rate USD','Gross USD','Paid rest min','Unpaid meal min'],...approved.map(e=>[e.name,e.id,e.regular.toFixed(2),e.ot.toFixed(2),e.double.toFixed(2),e.rate.toFixed(2),gross(e).toFixed(2),e.paidBreak,e.unpaidBreak])].map(r=>r.map(cell).join(',')).join('\r\n');
}
