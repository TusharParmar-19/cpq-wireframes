/* Phase 1 orders: fictional browser data, never real order registration. */
(()=>{
"use strict";
const W=window,copy=x=>JSON.parse(JSON.stringify(x)),text=(x,n=500)=>String(x??"").trim().slice(0,n);
const load=()=>{const d=W.CPQ_SHARED?.read()?.modules?.orders;return d?.version===1&&Array.isArray(d.orders)?copy(d):{version:1,orders:[]};};
const find=id=>load().orders.find(o=>o.id===id);
const linked=id=>id?load().orders.find(o=>o.source==="Accepted Quotation"&&o.quoteId===id):null;
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
const dateOK=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||"")&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const term=x=>!!text(x)&&!/^(to be agreed|to be confirmed|tbd)$/i.test(text(x));
const statuses=["Draft","Registered","In Progress","Completed","Cancelled"];
const transitionMap={Draft:["Registered","Cancelled"],Registered:["In Progress","Cancelled"],"In Progress":["Completed","Cancelled"],Completed:[],Cancelled:[]};
function commit(book){if(!W.CPQ_SHARED?.save("orders",book))throw Error("Order could not be saved in this browser.");}
function nextId(book){const year=today().slice(0,4),max=Math.max(22,...book.orders.filter(o=>o.id.startsWith("ORD-"+year+"-")).map(o=>Number(o.id.split("-").at(-1))||0));return "ORD-"+year+"-"+String(max+1).padStart(3,"0");}
function accepted(q){
 const d=q?.demoDispatch,r=d?.response;
 return !!q&&d?.state==="Sent in demo"&&d.revision===q.rev&&r?.decision==="Accepted"&&!!text(d.reference)&&!!text(r.reference)&&dateOK(d.date)&&dateOK(r.date)&&r.date>=d.date&&!!W.CPQ_POLICY?.phase1Reviewed(q);
}
const available=q=>accepted(q)&&!linked(q.id);
function record(q,t,labels,source,book,at){
 if(!q?.customerId||!q.buyerId||!q.companyId||!q.branchId||!q.ownerId||!text(q.title)||!q.lines?.length)throw Error("Complete customer, buyer, selling branch, owner and BOQ.");
 if(q.lines.some(l=>!Number.isInteger(Number(l.quantity))||Number(l.quantity)<=0||!Number.isFinite(Number(l.unitPrice))||Number(l.unitPrice)<0))throw Error("Check quantities and rates.");
 if(!term(q.payment)||!term(q.delivery))throw Error("Complete payment and delivery terms.");
 if(!t||![t.subtotal,t.discount,t.taxable,t.tax,t.total,t.totalCost].every(Number.isFinite)||t.total<0||t.missing||t.margin==null||t.gst&&!t.gst.ready||t.commercial&&!t.commercial.ready)throw Error("Complete reconciliation, GST and costs.");
 const label=Object.fromEntries(["customer","buyer","seller","branch","owner","contact","site","project"].map(k=>[k,text(q.revisionIdentity?.[k]||labels?.[k]||"",200)]));
 if(!label.customer||!label.buyer||!label.seller||!label.branch)throw Error("Capture customer and selling identities.");
 return {id:nextId(book),title:text(q.title,150),source,status:"Draft",customerId:q.customerId,buyerId:q.buyerId,companyId:q.companyId,branchId:q.branchId,ownerId:q.ownerId,opportunityId:q.opportunityId||"",configurationId:q.sourceConfigId||"",snapshot:{quote:copy(q),calculation:copy(t),labels:label},createdAt:at,updatedAt:at,orderDate:"",reference:"",notes:"",documents:[],events:[{action:"Order draft created",at,comment:source}]};
}
function createFromQuote(id,rev,calculate,labels,at){
 const q=W.CPQ_SHARED?.read()?.modules?.quotations?.quotations?.find(x=>x.id===id);
 if(!q||q.rev!==rev||!accepted(q))throw Error("Current saved revision must have demo review, dispatch and acceptance evidence.");
 const book=load(),existing=book.orders.find(o=>o.source==="Accepted Quotation"&&o.quoteId===id);
 if(existing)return existing;
 const o=record(q,calculate(q),labels,"Accepted Quotation",book,at);
 o.quoteId=q.id;o.quoteRev=q.rev;o.acceptance=copy(q.demoDispatch.response);
 o.events[0].comment=q.id+" / "+q.rev+" · "+o.acceptance.reference;book.orders.unshift(o);commit(book);return copy(o);
}
function saveDirect(q,t,labels,at,id=""){
 if(!q.directOrderDraft||q.id||q.demoApproval||q.demoDispatch)throw Error("Use direct order editor, not a quotation.");
 const book=load(),i=id?book.orders.findIndex(o=>o.id===id):-1;
 if(id&&(i<0||book.orders[i].source!=="Direct Order"||book.orders[i].status!=="Draft"))throw Error("Only editable direct order drafts may be saved.");
 const o=record(q,t,labels,"Direct Order",book,at);
 if(id){const old=book.orders[i];o.id=old.id;o.createdAt=old.createdAt;o.documents=copy(old.documents);o.events=[...old.events,{action:"Direct order draft updated",at,comment:"Commercial snapshot updated before registration."}];book.orders[i]=o;}else book.orders.unshift(o);
 commit(book);return copy(o);
}
function update(id,to,fields,at,now=today()){
 const book=load(),o=book.orders.find(x=>x.id===id);if(!o||!transitionMap[o.status]?.includes(to))throw Error("This status change is not available.");
 const note=text(fields?.note);
 if(to==="Registered"){
  const ref=text(fields?.reference,120),date=fields?.date;
  if(!ref||!dateOK(date)||date>now||(o.acceptance?.date&&date<o.acceptance.date))throw Error("Enter customer PO / confirmation reference and a valid registration date, not before acceptance or after today.");
  if(o.source==="Accepted Quotation"){const q=W.CPQ_SHARED?.read()?.modules?.quotations?.quotations?.find(x=>x.id===o.quoteId);if(!accepted(q)||q.rev!==o.quoteRev||JSON.stringify(q.demoDispatch.response)!==JSON.stringify(o.acceptance))throw Error("Accepted quotation evidence changed; review source before registration.");}
  o.reference=ref;o.orderDate=date;o.notes=note;
 }
 if(to==="Cancelled"&&!note)throw Error("Enter a cancellation reason.");
 const from=o.status;o.status=to;o.updatedAt=at;o.events.push({action:from+" → "+to,at,comment:note||(to==="Registered"?o.reference+" · "+o.orderDate:"")});commit(book);return copy(o);
}
function addDocument(id,fields,at){
 const book=load(),o=book.orders.find(x=>x.id===id);
 if(!o||o.status==="Cancelled")throw Error("Order unavailable for adding references.");
 const kind=text(fields.kind,80),reference=text(fields.reference,120),date=fields.date;
 if(!kind||!reference||!dateOK(date)||date>today())throw Error("Enter document type, reference and valid date.");
 if(o.documents.some(d=>d.kind===kind&&d.reference===reference))throw Error("Reference already recorded.");
 o.documents.push({kind,reference,date,note:text(fields.note),at});o.updatedAt=at;o.events.push({action:"Document reference added",at,comment:kind+" · "+reference});commit(book);return copy(o);
}
W.CPQ_ORDERS={load,find,linked,today,statuses,transitionMap,accepted,available,createFromQuote,saveDirect,update,addDocument};
})();
