/* Phase 1 received supplier quotations. Browser demonstration, no real documents or approval. */
(()=>{
"use strict";
const W=window,M=W.CPQ_VENDOR_MODEL;
W.CPQ_VENDOR_OFFERS={version:1,offers:[]};
const copy=x=>JSON.parse(JSON.stringify(x)),str=x=>String(x??"").trim(),norm=x=>str(x).toLowerCase().replace(/\s+/g," "),round=x=>Math.round((Number(x)+Number.EPSILON)*100)/100;
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
const dateOK=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)===x;
const db=()=>W.CPQ_SHARED?.read()?.modules?.vendorOffers||W.CPQ_VENDOR_OFFERS;
const vendors=()=>W.CPQ_SHARED?.read()?.modules?.vendors?.vendors||M.data().vendors;
const vendor=id=>vendors().find(v=>v.id===id);
const company=id=>M.entities().find(c=>c.id===id);
const enquiries=()=>W.CPQ_SHARED?.read()?.modules?.opportunities?.opportunities||W.CPQ_MA005_DATA?.opportunities||[];
const nextId=rows=>"VQ-"+String(Math.max(0,...rows.map(x=>Number(String(x.id).replace(/^VQ-/,""))||0))+1).padStart(6,"0");
const items=()=>[...M.products().map(p=>({id:p.id,kind:"product",label:M.productName(p.id),sku:p.sku||"",manufacturerId:p.manufacturerId||"",unit:M.catalog().families.find(f=>f.id===p.familyId)?.unit||"Nos",status:p.status})),...M.services().map(s=>({id:s.id,kind:"service",label:s.name,sku:s.code||"",unit:s.unit||"Job",status:s.status}))];
function num(value,label,{optional=false,positive=false,max=1e12}={}){
 if(optional&&str(value)==="")return null;
 const n=Number(value);if(str(value)===""||!Number.isFinite(n)||n<0||(positive&&n<=0)||n>max)throw Error("Enter a valid "+label+".");return n;
}
function status(o,date=today()){return o.status==="Verified (demo)"&&(!o.validUntil||o.validUntil<date)?"Expired":o.status;}
function totals(o){
 const lines=o.lines||[],subtotal=round(lines.reduce((a,l)=>a+round((l.quantity||0)*(l.rate||0)),0)),tax=round(lines.reduce((a,l)=>a+round(round((l.quantity||0)*(l.rate||0))*(l.taxRate||0)/100),0));
 const charges=round((o.freight||0)+(o.otherCharges||0)),chargeTax=round(charges*(o.chargeTaxRate||0)/100);
 return {subtotal,tax,charges,chargeTax,total:round(subtotal+tax+charges+chargeTax),taxIncomplete:lines.some(l=>l.taxRate==null)||(charges>0&&o.chargeTaxRate==null)};
}
function build(input,old=null,records=db(),record=false,now=new Date().toISOString()){
 if(old&&!["Draft","Pending verification","Returned"].includes(old.status))throw Error("This supplier offer is locked. Copy it as a new offer instead.");
 const companyId=str(input.companyId),vendorId=str(input.vendorId),branchId=str(input.branchId),opportunityId=str(input.opportunityId),v=vendor(vendorId),c=company(companyId);
 if(!c||c.status==="Inactive")throw Error("Select an active company.");
 if(!v||v.status!=="Active"||!v.companyIds.includes(companyId))throw Error("Select an active vendor available to this company.");
 if(branchId&&!c.branches?.some(b=>b.id===branchId&&b.status!=="Inactive"))throw Error("Select a branch of this company.");
 if(opportunityId&&!enquiries().some(e=>e.id===opportunityId&&e.companyId===companyId&&(!branchId||e.branchId===branchId)))throw Error("Choose an enquiry within this company and branch.");
 const reference=str(input.reference),received=str(input.received),quoteDate=str(input.quoteDate),validUntil=str(input.validUntil);
 if(!dateOK(received)||received>today())throw Error("Enter a valid received date, not in the future.");
 if(quoteDate&&(!dateOK(quoteDate)||quoteDate>received))throw Error("Supplier quotation date cannot follow the received date.");
 if(validUntil&&(!dateOK(validUntil)||validUntil<(quoteDate||received)))throw Error("Validity must not precede the offer date.");
 if(record&&(!reference||!quoteDate||!validUntil))throw Error("Enter the supplier quotation reference, date and valid-until date before recording the offer.");
 if(reference&&records.offers.some(o=>o.id!==old?.id&&o.vendorId===vendorId&&o.companyId===companyId&&norm(o.reference)===norm(reference)))throw Error("This supplier quotation reference already exists for this vendor and company. Open it, or use its distinct revision reference.");
 const id=old?.id||nextId(records.offers),lines=[];let seq=Number(old?.lineSeq)||0;
 for(const row of input.lines||[]){
  const kind=str(row.kind),itemId=str(row.itemId),description=str(row.description);
  if(!itemId&&kind!=="custom"&&!description&&!str(row.rate))continue;
  if(!["product","service","custom"].includes(kind))throw Error("Choose a valid item type.");
  const item=items().find(x=>x.kind===kind&&x.id===itemId);
  const prior=old?.lines?.find(l=>l.id===row.id);
  if(kind!=="custom"&&(!item||item.status!=="Active")&&!(prior&&prior.itemId===itemId&&prior.kind===kind))throw Error("Choose an active product model or service.");
  if(kind==="custom"&&!description)throw Error("Describe the custom supplier item.");
  const unit=kind==="custom"?str(row.unit):(prior?.itemId===itemId&&prior.kind===kind?prior.unit:item?.unit);
  if(!unit)throw Error("Enter a unit for each item.");
  const quantity=num(row.quantity,"quantity",{positive:true,max:1e6}),rate=num(row.rate,"unit purchase rate",{optional:!record,positive:record}),taxRate=num(row.taxRate,"GST percentage",{optional:true,max:100});
  if(rate!=null&&rate<=0)throw Error("A recorded purchase rate must be positive; leave it blank in an incomplete draft.");
  const snapshot=prior?.itemId===itemId&&prior.kind===kind?copy(prior.itemSnapshot):item?copy(item):null;
  if(prior&&lines.some(l=>l.id===prior.id))throw Error("Duplicate supplier line identifier.");
  lines.push({id:prior?.id||id+"-L"+(++seq),kind,itemId:kind==="custom"?"":itemId,itemSnapshot:snapshot,description:description||snapshot?.label||"",unit,quantity,rate,taxRate,remarks:str(row.remarks)});
 }
 if(record&&!lines.length)throw Error("Add at least one priced product, service or custom item.");
 const evidence=copy(old?.evidence||[]);for(const f of input.files||[]){const name=str(f.name),size=Number(f.size);if(!name||name.length>255||!Number.isFinite(size)||size<0)throw Error("Invalid evidence metadata.");if(!evidence.some(x=>x.name===name&&x.size===size))evidence.push({name,size,type:str(f.type),metadataOnly:true,addedAt:now});}
 if(input.removeEvidence)evidence.splice(0,evidence.length);
 const result={id,companyId,companyName:c.name,branchId,opportunityId,vendorId,vendorName:v.name,reference,received,quoteDate,validUntil,currency:"INR",lines,lineSeq:seq,evidence,freight:num(input.freight,"freight",{optional:true})||0,otherCharges:num(input.otherCharges,"other charges",{optional:true})||0,chargeTaxRate:num(input.chargeTaxRate,"tax on additional charges",{optional:true,max:100}),payment:str(input.payment),delivery:str(input.delivery),remarks:str(input.remarks),status:record?"Pending verification":"Draft",verification:null,createdAt:old?.createdAt||now,updatedAt:now,history:[...(old?.history||[]),{at:now,actor:"Demo employee",action:old?"Updated offer":"Created offer",note:record?"Recorded for separate verification":"Saved draft"}]};
 return result;
}
function decide(o,decision,note,now=new Date().toISOString(),date=today()){
 if(o.status!=="Pending verification")throw Error("Only recorded offers pending verification can be reviewed.");
 note=str(note);if(!note)throw Error("Enter a verification remark.");
 if(!["verify","return"].includes(decision))throw Error("Unknown verification action.");
 if(decision==="verify"){
  if(!o.evidence?.length)throw Error("Add original quotation file metadata before simulating verification.");
  if(!dateOK(o.validUntil)||o.validUntil<date)throw Error("This supplier offer is expired; obtain a new offer.");
  if(!vendor(o.vendorId)||vendor(o.vendorId).status!=="Active"||!vendor(o.vendorId).companyIds.includes(o.companyId))throw Error("Supplier is not active for the selected company.");
  if(!o.lines.length||o.lines.some(l=>!Number.isFinite(l.rate)||l.rate<=0||l.quantity<=0))throw Error("Complete all quoted rates.");
 }
 return {...copy(o),status:decision==="verify"?"Verified (demo)":"Returned",verification:{decision,at:now,actor:"Simulated rate verifier",note,evidenceNames:o.evidence.map(x=>x.name)},updatedAt:now,history:[...o.history,{at:now,actor:"Simulated rate verifier",action:decision==="verify"?"Sample rate verification":"Returned for correction",note}]};
}
function archive(o,note,now=new Date().toISOString()){if(o.status==="Archived")throw Error("Already archived.");if(!str(note))throw Error("Enter an archive reason.");return {...copy(o),status:"Archived",updatedAt:now,history:[...o.history,{at:now,actor:"Demo employee",action:"Archived offer",note:str(note)}]};}
function quoteItem(l){return l.serviceId?{kind:"service",id:l.serviceId,sku:l.serviceSnapshot?.code||""}:{kind:"product",id:l.sourceVariantId||l.modelSnapshot?.variantId||"",sku:l.modelSnapshot?.sku||""};}
function contextMatch(o,q){const v=vendor(o.vendorId);return !!q.companyId&&o.companyId===q.companyId&&(!o.branchId||o.branchId===q.branchId)&&(!o.opportunityId||o.opportunityId===q.opportunityId)&&q.currency==="INR"&&!!v&&v.status==="Active"&&v.companyIds.includes(q.companyId);}
function lineMatch(l,s){const i=quoteItem(l);return !!i.id&&s.kind===i.kind&&s.itemId===i.id&&(!i.sku||!s.itemSnapshot?.sku||i.sku===s.itemSnapshot.sku)&&norm(l.unit)===norm(s.unit)&&Number(l.quantity)===Number(s.quantity)&&Number.isFinite(s.rate)&&s.rate>0;}
function choices(q,l,date=today()){if(l.includedInParent)return [];return db().offers.filter(o=>status(o,date)==="Verified (demo)"&&o.evidence?.length&&o.verification?.decision==="verify"&&contextMatch(o,q)).flatMap(o=>o.lines.filter(s=>lineMatch(l,s)).map(s=>({key:o.id+"|"+s.id,offer:o,line:s}))); }
function snapshot(q,l,key,date=today()){const match=choices(q,l,date).find(x=>x.key===key);if(!match)throw Error("Select a currently verified supplier rate matching the company, enquiry, quantity and unit.");const {offer:o,line:s}=match;return {offerId:o.id,lineId:s.id,vendorId:o.vendorId,vendorName:o.vendorName,reference:o.reference,companyId:o.companyId,branchId:o.branchId,opportunityId:o.opportunityId,kind:s.kind,itemId:s.itemId,itemSnapshot:copy(s.itemSnapshot),quantity:s.quantity,unit:s.unit,rate:s.rate,taxRate:s.taxRate,validUntil:o.validUntil,verification:copy(o.verification),capturedAt:new Date().toISOString(),freight:o.freight,otherCharges:o.otherCharges,currency:o.currency};}
function snapshotIssues(q,l,review=false,date=today()){
 const s=l.pricing?.vendorRate;if(!s)return "";
 if(!contextMatch(s,q)||!lineMatch(l,s)||l.includedInParent||Number(l.pricing.unitCost)!==round(s.rate))return "Supplier cost no longer matches scope, item, quantity or unit: "+l.description+". Clear or reselect the supplier rate.";
 if(review&&!choices(q,l,date).some(x=>x.offer.id===s.offerId&&x.line.id===s.lineId&&x.line.rate===s.rate))return "Supplier offer expired, archived or no longer eligible: "+l.description+". Review its cost source before submitting.";
 return "";
}
W.CPQ_VENDOR_QUOTE={db,vendors,vendor,company,enquiries,items,today,dateOK,nextId,status,totals,build,decide,archive,choices,snapshot,snapshotIssues,round};
})();