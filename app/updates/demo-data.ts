import type { ProductionRow } from './engine';
// Entirely fictional public fixture. Private workbook is never imported into the bundle.
export const demoRows: ProductionRow[] = Array.from({length:12},(_,i)=>({
  id:`demo-${i}`,sourceRow:i+2,date:`2026-09-0${Math.floor(i/4)+1}`,lot:`DEMO-${100+i}`,
  sku:`SKU-${i%4}`,product:['Sweet rolls','Sandwich rolls','Frozen dough','Butter cookies'][i%4],
  plannedCases:100+i*4,producedCases:96+i*4,unitsPerCase:48,looseUnits:i%3*6,
  pricePerCase:24+i%4*3,material:700+i*31,standardMaterial:800+i*30,
  regularHours:24+i*2,overtimeHours:i%3,doubleHours:0,hourlyRate:22,
  standardLaborRate:6,comment:i===1?'Fictional delay: changeover exceeded plan.':null,
}));
