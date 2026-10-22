import{available,campaignBalance,validateAmount}from'../src/domain.mjs';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function validateChange(old,next,role){
 const admin=role==='Administrator',finance=admin||role==='Finance officer',project=admin||role==='Project officer';
 const permissions={campaigns:admin,donations:finance,allocations:finance,expenses:finance,distributions:project,results:project};
 for(const key of Object.keys(permissions)){
  if(!Array.isArray(next[key])||next[key].length>10000)throw Error('Invalid collection');
  if(!permissions[key]&&!same(old[key],next[key]))throw Error('Permission denied');
  const ids=new Set();for(const row of next[key]){if(typeof row.id!=='string'||ids.has(row.id))throw Error('Duplicate or invalid ID');ids.add(row.id)}
  for(const row of old[key]){const updated=next[key].find(x=>x.id===row.id);if(!updated)throw Error('Posted records cannot be deleted');if(!same(row,updated)&&!(key==='campaigns'&&admin)&&!(key==='results'&&admin&&same({...row,published:updated.published},updated)))throw Error('Posted records cannot be changed');}
 }
 for(const c of next.campaigns){validateAmount(c.target);if(!c.name||!c.description||typeof c.published!=='boolean')throw Error('Invalid campaign');}
 const references=new Set();for(const d of next.donations){validateAmount(d.value);if(d.type!=='cash'&&d.type!=='goods')throw Error('Invalid donation type');if(d.type==='cash'&&!Number.isSafeInteger(d.value))throw Error('Cash must use integer kobo');if(!d.reference||references.has(d.reference))throw Error('Duplicate reference');references.add(d.reference);if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||d.date>new Date().toISOString().slice(0,10))throw Error('Invalid date');if(d.type==='goods'&&(!d.item||!d.unit))throw Error('Goods require item and unit');if(available(d,next.allocations)<0)throw Error('Donation over-allocated');}
 for(const a of next.allocations){validateAmount(a.value);if(next.donations.find(d=>d.id===a.donationId)?.type==='cash'&&!Number.isSafeInteger(a.value))throw Error('Cash allocation must use integer kobo');if(!next.donations.some(d=>d.id===a.donationId)||!next.campaigns.some(c=>c.id===a.campaignId))throw Error('Invalid allocation link');}
 for(const e of next.expenses){validateAmount(e.value);if(!Number.isSafeInteger(e.value)||!e.purpose||!next.campaigns.some(c=>c.id===e.campaignId))throw Error('Invalid expenditure');}
 for(const c of next.campaigns)if(campaignBalance(c.id,next.donations,next.allocations,next.expenses)<0)throw Error('Campaign overspent');
 for(const x of next.distributions){validateAmount(x.value);const a=next.allocations.find(a=>a.id===x.allocationId);if(!a||!next.donations.some(d=>d.id===a.donationId&&d.type==='goods')||!x.destination)throw Error('Invalid distribution');if(next.distributions.filter(x=>x.allocationId===a.id).reduce((s,x)=>s+x.value,0)>a.value)throw Error('Stock exceeded');}
 for(const r of next.results){validateAmount(r.target);validateAmount(r.actual);if(!r.name||!r.unit||!r.method||!r.evidence||!next.campaigns.some(c=>c.id===r.campaignId)||typeof r.published!=='boolean')throw Error('Invalid result');if(!admin&&r.published&&!old.results.some(x=>x.id===r.id&&x.published))throw Error('Only administrators can publish');}
}
