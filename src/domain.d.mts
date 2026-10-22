export function available(donation: {id:string,value:number}, allocations: {donationId:string,value:number}[]):number;
export function campaignBalance(id:string, donations: {id:string,type:string}[], allocations:{donationId:string,campaignId:string,value:number}[],expenses:{campaignId:string,value:number}[]):number;
export function validateAmount(value:number,maximum?:number):void;
export function csvCell(value:unknown):string;
