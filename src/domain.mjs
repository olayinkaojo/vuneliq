export function available(donation, allocations) { return donation.value - allocations.filter(a=>a.donationId===donation.id).reduce((s,a)=>s+a.value,0); }
export function campaignBalance(id, donations, allocations, expenses) {return allocations.filter(a=>a.campaignId===id&&donations.some(d=>d.id===a.donationId&&d.type==='cash')).reduce((s,a)=>s+a.value,0)-expenses.filter(e=>e.campaignId===id).reduce((s,e)=>s+e.value,0);}
export function validateAmount(value, maximum=Infinity){if(!Number.isFinite(value)||value<=0)throw Error('Enter a positive amount or quantity.');if(value>maximum)throw Error('This exceeds the available balance.');}
export function csvCell(value){const s=String(value??'');return '"'+(/^[\s]*[=+@-]/.test(s)?"'"+s:s).replaceAll('"','""')+'"';}
