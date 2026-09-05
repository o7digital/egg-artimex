"use client";
import {useState} from "react";
import {ArrowRight, Sparkles, Factory, CircleCheck, Clock3, Package, ArrowUpRight, TriangleAlert} from "lucide-react";
import {Slider} from "@/components/ui/slider";
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription} from "@/components/ui/sheet";
import {useLocale} from "@/lib/i18n";

const money=(n:number,locale:"en"|"es")=>n.toLocaleString(locale === "es" ? "es-US" : "en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});
export type ScenarioPlan = {qty:number; option:number; delivery:string; hours:number; contribution:number};
export default function DecisionStudio({go,scenarioPlan,onApply,onCancel}:{go:(s:"production"|"quality"|"sync"|"traceability")=>void;scenarioPlan:ScenarioPlan|null;onApply:(plan:ScenarioPlan)=>void;onCancel:()=>void}){
 const {locale,t}=useLocale();
 const [qty,setQty]=useState(scenarioPlan?.qty??20000),[option,setOption]=useState(scenarioPlan?.option??0),[detail,setDetail]=useState<string|null>(null);
 const overtime=Math.max(0,qty-12000)/2500;
 const cost=qty*.58+(option===0?overtime*180:option===1?240:0);
 const margin=qty*1.05-cost;
 const feasible=option!==1||qty<=30000;
 const times=option===0?["12:30","16:40"]:option===1?["14:00","18:10"]:["06:00","10:10"];
 const optionLabels=locale === "es" ? [
  ["Mantener entrega el viernes","Usar horas extra de la línea 2","horas extra","No se mueven pedidos existentes"],
  ["Equilibrar la planta","Transferir a la línea 3","cambio de $240","La demo asume una línea compatible"],
  ["Proteger el turno","Entregar el sábado por la mañana","Sin horas extra","Requiere acuerdo del cliente"],
 ] : [
  ["Keep Friday delivery","Use Line 2 overtime",overtime.toFixed(1)+"h overtime","No existing orders moved"],
  ["Balance the floor","Transfer to Line 3","$240 changeover","Demo assumes compatible line"],
  ["Protect the shift","Deliver Saturday morning","No overtime","Customer agreement required"],
 ];
 function change(n:number){setQty(n);onCancel()}
 function applyScenario(){onApply({qty,option,delivery:option===2?"Saturday morning":"Friday delivery",hours:overtime,contribution:margin})}
 return <div className="studio">
    <div className="studio-heading"><div><p className="eyebrow">ARTIMEX / {locale === "es" ? "INTELIGENCIA OPERATIVA" : "OPERATIONS INTELLIGENCE"}</p><h1>{t("Ahead of the next batch.")}</h1><p>{t("Your factory, your orders, your next decision.")}</p></div><span className="demo-chip">{t("INTERACTIVE DEMO · SAMPLE DATA")}</span></div>
    <div className="pulse-strip">{[["Scheduled output","124,000","units today"],["On-time dispatch","98.6%","+2.1 pts this week"],["Yield","97.8%","target 97.0%"],["Capacity available","16%","before overtime"]].map((m,i)=><div key={m[0]}><span>{t(m[0])}</span><strong>{m[1]}<ArrowUpRight size={18}/></strong><small>{t(m[2])}</small><div className="micro-bars" aria-hidden="true">{[20,35,28,45,36,54,42,58,48,66,58,75].map((h,j)=><i key={j} style={{height:h/3,width:4,opacity:j>8?1:.25,background:i===2?"#367866":"#de3470"}}/>)}</div></div>)}</div>
  <section className="decision-grid">
   <article className="simulator">
    <div className="sim-head"><span className="sim-icon"><Sparkles size={19}/></span><span>{t("DECISION STUDIO")}</span><span className="version-tag">WHAT IF / 01</span></div>
    <h2>{t("One more order.")}<br/><em>{t("A better-informed yes.")}</em></h2>
    <p>{locale === "es" ? "¿Podemos entregar un pedido adicional de conchas de vainilla para Gallo Giro sin alterar el plan?" : "Can we deliver an extra order of vanilla conchas for Gallo Giro without disrupting the plan?"}</p>
    <div className="order-field"><div><span>{t("Additional order")}</span><strong>{qty.toLocaleString(locale === "es" ? "es-US" : "en-US")} <small>{t("units")}</small></strong></div><Package size={24}/></div>
    <Slider aria-label="Additional conchas" min={5000} max={40000} step={1000} value={[qty]} onValueChange={v=>change(v[0])}/>
    <div className="range-labels"><span>{locale === "es" ? "5.000 unidades" : "5,000 units"}</span><span>{locale === "es" ? "40.000 unidades" : "40,000 units"}</span></div>
    <div className="sim-assumptions"><span>{t("Vanilla concha")}</span><span>{t("Friday delivery")}</span><span>$1.05 / {t("unit")}</span></div>
    <div className="decision-result" aria-live="polite"><span>{t("Estimated incremental contribution")}</span><strong>{money(margin,locale)}<small>{(margin/(qty*1.05)*100).toFixed(1)}%</small></strong><p>{t("Revenue")} {money(qty*1.05,locale)} − {t("modeled variable costs")} {money(cost,locale)}</p></div>
    {!feasible&&<div className="constraint-warning"><TriangleAlert size={17}/><span><strong>{t("Scenario not feasible")}</strong><small>{locale === "es" ? "El cambio de línea 3 admite hasta 30.000 unidades en este modelo demo." : "Line 3 changeover supports up to 30,000 units in this demo model."}</small></span></div>}
    <small className="model-note">{locale === "es" ? "Modelo ilustrativo, no IA activa: costo base de $0.58/unidad; 12.000 unidades de capacidad disponible; 2.500 unidades/hora; $180/hora extra. Las demás opciones usan los supuestos mostrados." : "Illustrative model, not live AI: $0.58/unit base cost; 12,000 units spare capacity; 2,500 units/hour; $180/hour overtime. Other options use the assumptions shown."}</small>
   </article>
   <div className="decision-right">
    <div className="section-line"><div><p className="eyebrow">{t("THREE WAYS FORWARD")}</p><h2>{t("Choose the trade-off.")}</h2></div><span>{t("Human approval required")}</span></div>
    <div className="option-list">{optionLabels.map((o,i)=><button key={o[0]} aria-pressed={option===i} className={"plan-option "+(option===i?"chosen":"")} onClick={()=>{setOption(i);onCancel()}}><span className="option-number">0{i+1}</span><span><strong>{o[0]}</strong><small>{o[1]} · {o[2]}</small><em>{o[3]}</em></span><span className="option-radio">{option===i&&<CircleCheck size={20}/>}</span></button>)}</div>
    <div className="olivia-reason"><Sparkles size={20}/><div><strong>{t("Olivia’s scenario brief")}</strong><p>{option===0?(locale === "es" ? "Mantén la ventana de entrega prometida. El modelo añade horas extra solo por encima de las 12.000 unidades disponibles." : "Keep the promised delivery window. The model adds overtime only above the available 12,000-unit capacity."):option===1?(locale === "es" ? "Mueve el pedido a la línea 3 con un cambio de $240 modelado. Confirma herramientas, personal y espacio de congelación antes de aprobar." : "Move the order to Line 3 with a modeled $240 changeover. Confirm tooling, labor and freezer availability before approval."):(locale === "es" ? "Protege el programa de hoy y evita horas extra modeladas. Confirma la entrega posterior con el cliente antes de aceptar." : "Protect today’s schedule and avoid modeled overtime. Confirm the later delivery with the customer before accepting.")}</p><span>{locale === "es" ? "Información de demo programada · sin servicio de IA conectado" : "Scripted demo insight · no AI service connected"}</span></div></div>
    <button className="apply-plan" disabled={!feasible} onClick={scenarioPlan?onCancel:applyScenario}>{scenarioPlan?<><CircleCheck size={18}/> {t("Added to demo schedule · Undo")}</>:<>{t("Apply scenario to demo schedule")} <ArrowRight size={18}/></>}</button>
   </div>
  </section>
  <section className="floor-panel">
   <div className="section-line"><div><p className="eyebrow">{t("FACTORY ORCHESTRATION")}</p><h2>{t("The day, in motion.")}</h2></div><button onClick={()=>go("production")}>{t("Open production board")} <ArrowRight size={16}/></button></div>
   <div className="schedule-scroll"><div className="schedule"><div className="time-axis"><span>PRODUCTION LINE</span>{["04:00","06:00","08:00","10:00","12:00","14:00","16:00","18:00"].map(t=><span key={t}>{t}</span>)}</div>
   {["01 / Bread & rolls","02 / Sweet bread","03 / Specialty"].map((line,i)=><div className="schedule-row" key={line}><div className="line-name"><Factory size={19}/><strong>{line}</strong><small>{i===1?"Changeover at 10:35":"Running to plan"}</small></div><div className="schedule-track">
    <button style={{left:"0%",width:i===0?"31%":"24%"}} className={"schedule-block block-"+i} onClick={()=>setDetail(i===0?"Bolillo · 18,000 units":i===1?"Concha Rosa · 12,400 units":"Telera · 9,600 units")}><strong>{i===0?"Bolillo":i===1?"Concha Rosa":"Telera"}</strong><span>{i===0?"18,000":i===1?"12,400":"9,600"} units · {i===0?"Baking":"In progress"}</span></button>
    <button style={{left:i===0?"35%":"28%",width:"23%"}} className="schedule-block block-neutral" onClick={()=>setDetail("Scheduled batch · ingredient check pending")}><strong>{i===0?"Telera":i===1?"Chocolate concha":"Empanada"}</strong><span>Next batch · ready</span></button>
    {scenarioPlan&&i===(scenarioPlan.option===1?2:1)&&<button className="schedule-block block-new" style={{left:"58%",width:"38%"}} onClick={()=>setDetail("Scenario order · "+scenarioPlan.qty.toLocaleString()+" conchas")}><strong>+ Gallo Giro · {scenarioPlan.qty.toLocaleString()}</strong><span>{scenarioPlan.option===2?"Saturday":times.join("–")} · demo plan</span></button>}
    <div className="now-line" style={{left:"31%"}}><span>{i===0?"NOW · 09:00":""}</span></div>
   </div></div>)}</div></div>
  <div className="schedule-footer"><span><i/>{t("Current batches")}</span><span><i/>{t("Upcoming batches")}</span><span>{t("Schematic demo · timings are illustrative")}</span></div>
  </section>
  <section className="action-ribbon"><div><TriangleAlert size={22}/><span><strong>{t("One quality hold needs review")}</strong><small>{t("Flour FL-8831 · three queued batches affected")}</small></span><button onClick={()=>go("quality")}>{t("Review hold")} <ArrowRight size={16}/></button></div><div><CircleCheck size={22}/><span><strong>{t("R365 remains the system of record")}</strong><small>{t("Accounting & inventory · simulated connection")}</small></span><button onClick={()=>go("sync")}>{t("Data ownership")} <ArrowRight size={16}/></button></div></section>
  <Sheet open={!!detail} onOpenChange={v=>{if(!v)setDetail(null)}}><SheetContent><SheetHeader><SheetTitle>{detail}</SheetTitle><SheetDescription>{t("Illustrative production batch. No operational records are changed.")}</SheetDescription></SheetHeader><div className="batch-detail"><p><Clock3/> {t("Planned start 06:00 · finish 10:00")}</p><p><CircleCheck/> {t("Recipe version 3.2 assigned")}</p><p><Package/> {t("Ingredient allocation requires validation")}</p><button className="apply-plan" onClick={()=>{setDetail(null);go("traceability")}}>{t("Inspect batch genealogy")} <ArrowRight size={18}/></button></div></SheetContent></Sheet>
 </div>
}
