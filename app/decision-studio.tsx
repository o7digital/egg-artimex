"use client";
import {useState} from "react";
import {ArrowRight, Sparkles, Factory, CircleCheck, Clock3, Package, ArrowUpRight, TriangleAlert} from "lucide-react";
import {Slider} from "@/components/ui/slider";
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription} from "@/components/ui/sheet";

const money=(n:number)=>n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});
export type ScenarioPlan = {qty:number; option:number; delivery:string; hours:number; contribution:number};
export default function DecisionStudio({go,scenarioPlan,onApply,onCancel}:{go:(s:"production"|"quality"|"sync"|"traceability")=>void;scenarioPlan:ScenarioPlan|null;onApply:(plan:ScenarioPlan)=>void;onCancel:()=>void}){
 const [qty,setQty]=useState(scenarioPlan?.qty??20000),[option,setOption]=useState(scenarioPlan?.option??0),[detail,setDetail]=useState<string|null>(null);
 const overtime=Math.max(0,qty-12000)/2500;
 const cost=qty*.58+(option===0?overtime*180:option===1?240:0);
 const margin=qty*1.05-cost;
 const feasible=option!==1||qty<=30000;
 const times=option===0?["12:30","16:40"]:option===1?["14:00","18:10"]:["06:00","10:10"];
 function change(n:number){setQty(n);onCancel()}
 function applyScenario(){onApply({qty,option,delivery:option===2?"Saturday morning":"Friday delivery",hours:overtime,contribution:margin})}
 return <div className="studio">
  <div className="studio-heading"><div><p className="eyebrow">ARTIMEX / OPERATIONS INTELLIGENCE</p><h1>Ahead of the next batch.</h1><p>Your factory, your orders, your next decision.</p></div><span className="demo-chip">INTERACTIVE DEMO · SAMPLE DATA</span></div>
  <div className="pulse-strip">{[["Scheduled output","124,000","units today"],["On-time dispatch","98.6%","+2.1 pts this week"],["Yield","97.8%","target 97.0%"],["Capacity available","16%","before overtime"]].map((m,i)=><div key={m[0]}><span>{m[0]}</span><strong>{m[1]}<ArrowUpRight size={18}/></strong><small>{m[2]}</small><div className="micro-bars" aria-hidden="true">{[20,35,28,45,36,54,42,58,48,66,58,75].map((h,j)=><i key={j} style={{height:h/3,width:4,opacity:j>8?1:.25,background:i===2?"#367866":"#de3470"}}/>)}</div></div>)}</div>
  <section className="decision-grid">
   <article className="simulator">
    <div className="sim-head"><span className="sim-icon"><Sparkles size={19}/></span><span>DECISION STUDIO</span><span className="version-tag">WHAT IF / 01</span></div>
    <h2>One more order.<br/><em>A better-informed yes.</em></h2>
    <p>Can we deliver an extra order of vanilla conchas for Gallo Giro without disrupting the plan?</p>
    <div className="order-field"><div><span>Additional order</span><strong>{qty.toLocaleString()} <small>units</small></strong></div><Package size={24}/></div>
    <Slider aria-label="Additional conchas" min={5000} max={40000} step={1000} value={[qty]} onValueChange={v=>change(v[0])}/>
    <div className="range-labels"><span>5,000 units</span><span>40,000 units</span></div>
    <div className="sim-assumptions"><span>Vanilla concha</span><span>Friday delivery</span><span>$1.05 / unit</span></div>
    <div className="decision-result" aria-live="polite"><span>Estimated incremental contribution</span><strong>{money(margin)}<small>{(margin/(qty*1.05)*100).toFixed(1)}%</small></strong><p>Revenue {money(qty*1.05)} − modeled variable costs {money(cost)}</p></div>
    {!feasible&&<div className="constraint-warning"><TriangleAlert size={17}/><span><strong>Scenario not feasible</strong><small>Line 3 changeover supports up to 30,000 units in this demo model.</small></span></div>}
    <small className="model-note">Illustrative model, not live AI: $0.58/unit base cost; 12,000 units spare capacity; 2,500 units/hour; $180/hour overtime. Other options use the assumptions shown.</small>
   </article>
   <div className="decision-right">
    <div className="section-line"><div><p className="eyebrow">THREE WAYS FORWARD</p><h2>Choose the trade-off.</h2></div><span>Human approval required</span></div>
    <div className="option-list">{[
     ["Keep Friday delivery","Use Line 2 overtime",overtime.toFixed(1)+"h overtime","No existing orders moved"],
     ["Balance the floor","Transfer to Line 3","$240 changeover","Demo assumes compatible line"],
     ["Protect the shift","Deliver Saturday morning","No overtime","Customer agreement required"]
    ].map((o,i)=><button key={o[0]} aria-pressed={option===i} className={"plan-option "+(option===i?"chosen":"")} onClick={()=>{setOption(i);onCancel()}}><span className="option-number">0{i+1}</span><span><strong>{o[0]}</strong><small>{o[1]} · {o[2]}</small><em>{o[3]}</em></span><span className="option-radio">{option===i&&<CircleCheck size={20}/>}</span></button>)}</div>
    <div className="olivia-reason"><Sparkles size={20}/><div><strong>Olivia’s scenario brief</strong><p>{option===0?"Keep the promised delivery window. The model adds overtime only above the available 12,000-unit capacity.":option===1?"Move the order to Line 3 with a modeled $240 changeover. Confirm tooling, labor and freezer availability before approval.":"Protect today’s schedule and avoid modeled overtime. Confirm the later delivery with the customer before accepting."}</p><span>Scripted demo insight · no AI service connected</span></div></div>
    <button className="apply-plan" disabled={!feasible} onClick={scenarioPlan?onCancel:applyScenario}>{scenarioPlan?<><CircleCheck size={18}/> Added to demo schedule · Undo</>:<>Apply scenario to demo schedule <ArrowRight size={18}/></>}</button>
   </div>
  </section>
  <section className="floor-panel">
   <div className="section-line"><div><p className="eyebrow">FACTORY ORCHESTRATION</p><h2>The day, in motion.</h2></div><button onClick={()=>go("production")}>Open production board <ArrowRight size={16}/></button></div>
   <div className="schedule-scroll"><div className="schedule"><div className="time-axis"><span>PRODUCTION LINE</span>{["04:00","06:00","08:00","10:00","12:00","14:00","16:00","18:00"].map(t=><span key={t}>{t}</span>)}</div>
   {["01 / Bread & rolls","02 / Sweet bread","03 / Specialty"].map((line,i)=><div className="schedule-row" key={line}><div className="line-name"><Factory size={19}/><strong>{line}</strong><small>{i===1?"Changeover at 10:35":"Running to plan"}</small></div><div className="schedule-track">
    <button style={{left:"0%",width:i===0?"31%":"24%"}} className={"schedule-block block-"+i} onClick={()=>setDetail(i===0?"Bolillo · 18,000 units":i===1?"Concha Rosa · 12,400 units":"Telera · 9,600 units")}><strong>{i===0?"Bolillo":i===1?"Concha Rosa":"Telera"}</strong><span>{i===0?"18,000":i===1?"12,400":"9,600"} units · {i===0?"Baking":"In progress"}</span></button>
    <button style={{left:i===0?"35%":"28%",width:"23%"}} className="schedule-block block-neutral" onClick={()=>setDetail("Scheduled batch · ingredient check pending")}><strong>{i===0?"Telera":i===1?"Chocolate concha":"Empanada"}</strong><span>Next batch · ready</span></button>
    {scenarioPlan&&i===(scenarioPlan.option===1?2:1)&&<button className="schedule-block block-new" style={{left:"58%",width:"38%"}} onClick={()=>setDetail("Scenario order · "+scenarioPlan.qty.toLocaleString()+" conchas")}><strong>+ Gallo Giro · {scenarioPlan.qty.toLocaleString()}</strong><span>{scenarioPlan.option===2?"Saturday":times.join("–")} · demo plan</span></button>}
    <div className="now-line" style={{left:"31%"}}><span>{i===0?"NOW · 09:00":""}</span></div>
   </div></div>)}</div></div>
   <div className="schedule-footer"><span><i/>Current batches</span><span><i/>Upcoming batches</span><span>Schematic demo · timings are illustrative</span></div>
  </section>
  <section className="action-ribbon"><div><TriangleAlert size={22}/><span><strong>One quality hold needs review</strong><small>Flour FL-8831 · three queued batches affected</small></span><button onClick={()=>go("quality")}>Review hold <ArrowRight size={16}/></button></div><div><CircleCheck size={22}/><span><strong>R365 remains the system of record</strong><small>Accounting & inventory · simulated connection</small></span><button onClick={()=>go("sync")}>Data ownership <ArrowRight size={16}/></button></div></section>
  <Sheet open={!!detail} onOpenChange={v=>{if(!v)setDetail(null)}}><SheetContent><SheetHeader><SheetTitle>{detail}</SheetTitle><SheetDescription>Illustrative production batch. No operational records are changed.</SheetDescription></SheetHeader><div className="batch-detail"><p><Clock3/> Planned start 06:00 · finish 10:00</p><p><CircleCheck/> Recipe version 3.2 assigned</p><p><Package/> Ingredient allocation requires validation</p><button className="apply-plan" onClick={()=>{setDetail(null);go("traceability")}}>Inspect batch genealogy <ArrowRight size={18}/></button></div></SheetContent></Sheet>
 </div>
}
