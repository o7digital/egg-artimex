import test from 'node:test';
import assert from 'node:assert/strict';
import {costRow,summarize,projectRevenue,parseProduction,initialWorkforce,workforceAction,gross,payrollCSV} from '../app/updates/engine.ts';
const row={id:'sample',sourceRow:2,date:'2026-09-01',product:'Fictional roll',producedCases:10,unitsPerCase:20,looseUnits:5,pricePerCase:30,material:100,regularHours:2,overtimeHours:1,doubleHours:1,hourlyRate:20,standardMaterial:120,standardLaborRate:12};
test('case conversion, loose pieces, wage multipliers and overhead reconcile',()=>{
  const v=costRow(row).value;
  assert.equal(v.units,205);assert.equal(v.labor,110);assert.equal(v.appliedOverhead,148.5);
  assert.equal(v.cost,358.5);assert.equal(v.productionValue,307.5);assert.equal(v.result,-51);
  assert.equal(v.materialVariance,20);assert.equal(v.laborVariance,10);
});
test('missing costs excluded; explicit zero preserved and zero volume safe',()=>{
  assert.equal(costRow({...row,material:null}).value,null);
  assert.equal(costRow({...row,material:0}).value.cost,258.5);
  assert.equal(costRow({...row,unitsPerCase:0}).value,null);
  assert.equal(costRow({...row,producedCases:0,looseUnits:0}).value.unitCost,null);
  assert.equal(summarize([row,{...row,material:null}]).excluded,1);
});
test('unsold output is not revenue and production spend is retained',()=>{
  const base=summarize([row]);const s=projectRevenue(base,{volume:100,price:0,sellThrough:50,materials:0,labor:0});
  assert.equal(s.revenue,153.75);assert.equal(s.spend,358.5);assert.equal(s.remainingUnits,102.5);
  assert.throws(()=>projectRevenue(base,{volume:100,price:0,sellThrough:101,materials:0,labor:0}));
});
test('paid rest accrues pay, meal does not; invalid transitions ignored',()=>{
  let w=initialWorkforce();const id=w.people[0].id;
  w=workforceAction(w,id,'paid-rest');assert.equal(workforceAction(w,id,'unpaid-meal'),w);
  assert.equal(workforceAction(w,id,'resume'),w);
  w=workforceAction(w,'','advance');w=workforceAction(w,id,'resume');
  assert.equal(w.people[0].regular,4.25);assert.equal(w.people[0].paidBreak,15);
  w=workforceAction(w,id,'unpaid-meal');w=workforceAction(w,'','advance');w=workforceAction(w,id,'resume');
  assert.equal(w.people[0].regular,4.25);assert.equal(w.people[0].unpaidBreak,15);assert.equal(gross(w.people[0]),93.5);
});
test('only closed approved cards exported; approved card stays frozen',()=>{
  let w=initialWorkforce(),id=w.people[0].id;
  assert.equal(workforceAction(w,id,'approve'),w);
  assert.equal(payrollCSV(w.people).split('\r\n').length,1);
  w=workforceAction(w,id,'finish');w=workforceAction(w,id,'approve');
  assert.equal(workforceAction(w,id,'paid-rest'),w);
  assert.equal(payrollCSV(w.people).split('\r\n').length,2);
  const hours=w.people[0].regular;w=workforceAction(w,'','advance');assert.equal(w.people[0].regular,hours);
  w=workforceAction(w,id,'reopen');assert.equal(payrollCSV(w.people).split('\r\n').length,1);
});
test('normalized import validates numeric inputs and duplicate identities',()=>{
  assert.equal(parseProduction(JSON.stringify({records:[row]})).length,1);
  assert.throws(()=>parseProduction(JSON.stringify({records:[row,row]})));
  assert.throws(()=>parseProduction(JSON.stringify({records:[{...row,material:'100'}]})));
  assert.throws(()=>parseProduction(JSON.stringify({records:[]})));
});

test('malformed optional import fields cannot reach React rendering',()=>{
  assert.throws(()=>parseProduction('null'));
  for (const invalid of [{comment:{}},{lot:{}},{rawIssues:'WIP'},{rawIssues:[{}]},{source:[]}]) {
    assert.throws(()=>parseProduction(JSON.stringify({records:[{...row,...invalid}]})));
  }
});
