/* Shared state for CPQ public wireframes. Fictional DEMO ONLY, never an authorization or production data layer. */
(function () {
 "use strict";
 const KEY="cpq-wireframes-v2-shared-demo-v1";
 const SCHEMA=1;
 const modules={
  entities:"CPQ_MA002_DATA",
  users:"CPQ_MA003_USERS",
  roles:"CPQ_MA003_ROLES",
  customers:"CPQ_MA004_DATA",
  opportunities:"CPQ_MA005_DATA",
  configurations:"CPQ_MA006A_DATA",
  catalog:"CPQ_MA006A_CATALOG",
  services:"CPQ_SERVICE_MASTER",
   vendors:"CPQ_VENDOR_MASTER",
   vendorOffers:"CPQ_VENDOR_OFFERS",
  quotations:"CPQ_MA006_DATA",
  approvalPolicies:"CPQ_APPROVAL_POLICY_DATA",
  orders:"CPQ_ORDER_DATA",
  productRules:"CPQ_PRODUCT_RULE_DATA",
  commercialSettings:"CPQ_COMMERCIAL_SETTINGS_DATA"
 };
 const copy=x=>JSON.parse(JSON.stringify(x));
 function read(){
  try {
   const raw=window.localStorage.getItem(KEY);
   if(!raw)return {schema:SCHEMA,modules:{}};
   const data=JSON.parse(raw);
   return data&&data.schema===SCHEMA&&data.modules&&typeof data.modules==="object"?data:{schema:SCHEMA,modules:{}};
  }catch(_){return {schema:SCHEMA,modules:{}};}
 }
 function usable(key,value){
  return key==="entities"||key==="users"||key==="roles"?Array.isArray(value):!!value&&typeof value==="object"&&!Array.isArray(value);
 }
 let storageOK=true;
 function saveMany(changes){
  if(window.CPQ_DEMO_ACCESS&&Object.keys(changes||{}).some(k=>!window.CPQ_DEMO_ACCESS.canWriteModule(k)))return false;
  const doc=read(),access=window.CPQ_DEMO_ACCESS;
  if(access&&!access.isMaster()){
   const adjusted={...changes};
   for(const [name,file,key] of [["configurations","ma-006a-configuration.html","configurations"],["quotations","ma-006-quotations.html","quotations"]]){
    if(!adjusted[name]||!Array.isArray(adjusted[name][key]))continue;
    const incoming=adjusted[name],latest=doc.modules[name];
    if(!latest||!Array.isArray(latest[key]))continue;
    const permitted=r=>access.canRecord(file,r),others=latest[key].filter(r=>!permitted(r)),own=incoming[key].filter(permitted);
    if(own.some(r=>others.some(o=>o.id===r.id)))return false;
    const next={...incoming,[key]:own.concat(others)};
    if(name==="quotations"){
     const inScope=s=>permitted(s.quote);
     next.revisionSnapshots=(incoming.revisionSnapshots||[]).filter(inScope).concat((latest.revisionSnapshots||[]).filter(s=>!inScope(s)));
    }
    adjusted[name]=next;
   }
   changes=adjusted;
  }
  for(const [name,value] of Object.entries(changes||{})){
   if(!(name in modules)||!usable(name,value))continue;
   doc.modules[name]=copy(value);
  }
  doc.updatedAt=new Date().toISOString();
  try{
   const payload=JSON.stringify(doc);
   if(payload.length>3800000)throw new Error("Demo storage size limit");
   window.localStorage.setItem(KEY,payload);
   storageOK=true;
   return true;
  }catch(err){
   storageOK=false;
   if(window.console)console.warn("CPQ demo data could not be saved in this browser.",err);
   return false;
  }
 }
 function save(name,value){return saveMany({[name]:value});}
 function hydrate(){
  const doc=read();
  for(const [key,globalName] of Object.entries(modules)){
   if(Object.prototype.hasOwnProperty.call(window,globalName)&&usable(key,doc.modules[key])){
    window[globalName]=copy(doc.modules[key]);
    if(key==="users"&&window.CPQ_DEMO_ACCESS)window[globalName]=window[globalName].map(window.CPQ_DEMO_ACCESS.normalizeUser);
   }
  }
 }
 function rebuildLinks(){
  const customers=window.CPQ_MA004_DATA;
  const opps=window.CPQ_MA005_DATA;
  const quotes=window.CPQ_MA006_DATA;
  const configs=window.CPQ_MA006A_DATA;
  const orderRecords=read().modules.orders?.orders||[];
  if(opps?.opportunities)for(const op of opps.opportunities)op.demoOrders=orderRecords.filter(o=>o.opportunityId===op.id).map(o=>({id:o.id,status:o.status,source:o.source}));
  if(opps&&quotes&&Array.isArray(opps.opportunities)&&Array.isArray(quotes.quotations)){
   const linked=new Map();
   for(const q of quotes.quotations){
    if(!q.opportunityId)continue;
    if(!linked.has(q.opportunityId))linked.set(q.opportunityId,[]);
    linked.get(q.opportunityId).push(q.id);
   }
   for(const op of opps.opportunities){
    op.linkedQuotes=linked.get(op.id)||[];
    const answers=quotes.quotations.filter(q=>q.opportunityId===op.id&&q.demoDispatch?.response?.decision);
    answers.sort((a,b)=>(b.lastUpdated||"").localeCompare(a.lastUpdated||""));
    if(answers.length){
     const latest=answers[0];
     op.demoQuoteOutcome={quoteId:latest.id,decision:latest.demoDispatch.response.decision,
      date:latest.demoDispatch.response.date||"",reference:latest.demoDispatch.response.reference||"",
      note:"Recorded in the quotation simulation only; not verified customer acceptance."};
    }else delete op.demoQuoteOutcome;
   }
  }
  if(customers&&opps&&quotes&&Array.isArray(customers.related)){
   const others=customers.related.filter(r=>!["Opportunity","Quotation"].includes(r.type)&&!r.demoOrder);
   const serviceCatalog=window.CPQ_SERVICE_MASTER?.services||[];
   const describeService=ids=>Array.isArray(ids)?ids.map(id=>serviceCatalog.find(x=>x.id===id)?.name).filter(Boolean).join(" · "):"";
   const rel=[];
   for(const o of opps.opportunities||[]){
    if(!customers.customers.some(c=>c.id===o.customerId))continue;
    rel.push({id:o.id,customerId:o.customerId,type:"Opportunity",status:o.stage,
     companyId:o.companyId,branchId:o.branchId,customerCompanyId:o.buyerId,
     serviceIds:o.serviceIds||[],serviceNames:describeService(o.serviceIds)});
   }
   for(const q of quotes.quotations||[]){
    if(!customers.customers.some(c=>c.id===q.customerId))continue;
    const outcome=q.demoDispatch?.response?.decision;
    const ids=q.serviceIds||q.lines?.map(l=>l.serviceId).filter(Boolean)||[];
    rel.push({id:q.id,customerId:q.customerId,type:"Quotation",
     status:q.status+(outcome?" · "+outcome+" (demo)":""),companyId:q.companyId,
     branchId:q.branchId,customerCompanyId:q.buyerId,serviceIds:ids,serviceNames:describeService(ids)});
   }
   for(const o of orderRecords){if(!customers.customers.some(c=>c.id===o.customerId))continue;rel.push({id:o.id,customerId:o.customerId,type:"Order",status:o.status+" (demo)",companyId:o.companyId,branchId:o.branchId,customerCompanyId:o.buyerId,demoOrder:true});}
   customers.related=others.concat(rel);
  }
  if(configs&&quotes&&Array.isArray(configs.configurations)){
   for(const c of configs.configurations){
    const linkedQuote=quotes.quotations.find(q=>q.sourceConfigId===c.id);
    if(linkedQuote)c.quoteId=linkedQuote.id;
   }
  }
 }
 function syncDashboard(){
  const data=window.CPQ_MA001_DEMO;
  if(!data)return;
  const own=window.CPQ_MA002_DATA;
  const users=window.CPQ_MA003_USERS;
  const customers=window.CPQ_MA004_DATA;
  const opportunities=window.CPQ_MA005_DATA;
  const quotations=window.CPQ_MA006_DATA;
  const orderRecords=read().modules.orders?.orders||[];
  data.orders=orderRecords.filter(o=>!["Draft","Cancelled"].includes(o.status)).map(o=>[o.id,o.snapshot.labels.customer,o.companyId,o.branchId,o.status,o.source]);
  if(Array.isArray(own)){
   data.entities=own.map(e=>({id:e.id,name:e.name,branches:(e.branches||[]).map(b=>[b.id,b.name])}));
  }
  if(Array.isArray(users)){
   data.employees=users.map(u=>{
    const assignment=(u.assignments||[])[0];
    return [u.id,u.name,assignment?.companyId||"",assignment?.branches?.[0]||"",u.status||"Active"];
   });
  }
  if(customers?.customers){
   data.customers=customers.customers.flatMap(c=>
    (c.links||[]).map(l=>[c.id,c.name,l.companyId,l.branchId]));
  }
  if(opportunities?.opportunities){
   data.opportunities=opportunities.opportunities.map(o=>[o.id,
    customers?.customers?.find(c=>c.id===o.customerId)?.name||o.customerId,
    o.companyId,o.branchId,o.stage]);
  }
  if(quotations?.quotations){
   data.quotations=quotations.quotations.map(q=>[q.id,
    customers?.customers?.find(c=>c.id===q.customerId)?.name||q.customerId,
    q.companyId,q.branchId,q.status,q.rev]);
  }
 }
 function diagnostics(){
  const own=window.CPQ_MA002_DATA||[];
  const users=window.CPQ_MA003_USERS||[];
  const cust=window.CPQ_MA004_DATA||{};
  const opps=window.CPQ_MA005_DATA?.opportunities||[];
  const quotes=window.CPQ_MA006_DATA?.quotations||[];
  const cfg=window.CPQ_MA006A_DATA?.configurations||[];
  const missing=[];
  const has=(arr,id)=>arr.some(x=>x.id===id);
  for(const o of opps){
   if(!has(cust.customers||[],o.customerId))missing.push(o.id+": customer "+o.customerId);
   if(!has(cust.companies||[],o.buyerId))missing.push(o.id+": buyer "+o.buyerId);
   if(!has(users,o.ownerId))missing.push(o.id+": owner "+o.ownerId);
  }
  for(const q of quotes){
   if(!has(cust.customers||[],q.customerId))missing.push(q.id+": customer "+q.customerId);
   if(!has(cust.companies||[],q.buyerId))missing.push(q.id+": buyer "+q.buyerId);
   if(q.opportunityId&&!has(opps,q.opportunityId))missing.push(q.id+": enquiry "+q.opportunityId);
  }
  return {demo:true,storageAvailable:storageOK,entities:own.length,customers:cust.customers?.length||0,
   opportunities:opps.length,configurations:cfg.length,quotations:quotes.length,
   missingReferences:missing};
 }
 function reset(){
  if(window.CPQ_DEMO_ACCESS&&!window.CPQ_DEMO_ACCESS.isMaster())return;
  if(!window.confirm("Reset CPQ DEMO data in this browser? All saved sample edits, quotes and simulated responses will be discarded."))return;
  try{window.localStorage.removeItem(KEY);}catch(_){}
  window.location.href=window.location.pathname;
 }
 function mountReset(){
  if(window.CPQ_DEMO_ACCESS&&!window.CPQ_DEMO_ACCESS.isMaster())return;
  if(document.getElementById("cpq-demo-reset"))return;
  const main=document.querySelector(".content,main,.main-content")||document.body;
  const button=document.createElement("button");
  button.type="button";button.id="cpq-demo-reset";
  button.textContent="Reset demo data";
  button.title="Clears only this browser's CPQ fictional sample records";
  button.style.cssText="display:inline-block;margin:12px 0 0 auto;padding:7px 11px;border:1px solid #cbdcea;border-radius:7px;background:#fff;color:#325a79;font:600 11px system-ui,sans-serif;cursor:pointer;";
  button.addEventListener("click",reset);
  const label=document.createElement("div");
  label.style.cssText="display:flex;justify-content:flex-end;";
  label.appendChild(button);
  const warning=main.querySelector(".ma6-warning,.ma6-disclaimer,.info")||null;
  if(warning&&warning.parentNode)warning.insertAdjacentElement("afterend",label);
  else main.appendChild(label);
 }
 hydrate();
 rebuildLinks();
 syncDashboard();
 window.CPQ_SHARED={save,saveMany,read,reset,diagnostics,get storageAvailable(){return storageOK;}};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountReset,{once:true});
 else mountReset();
 window.addEventListener("storage",event=>{
  if(event.key!==KEY)return;
  const node=document.getElementById("cpq-demo-store-notice");
  if(node)return;
  const notice=document.createElement("div");
  notice.id="cpq-demo-store-notice";
  notice.textContent="CPQ demo data changed in another tab. Refresh this page to see the latest records.";
  notice.style.cssText="position:fixed;bottom:14px;right:14px;z-index:9999;max-width:320px;background:#173d5d;color:#fff;padding:12px 16px;border-radius:8px;font:12px system-ui,sans-serif;box-shadow:0 3px 15px #1234;";
  document.body.appendChild(notice);
 });
})();
