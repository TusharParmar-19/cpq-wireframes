/* Phase 1 read-only reporting. All values and activity are fictional browser data. */
(function(){
"use strict";
const W=window, arr=x=>Array.isArray(x)?x:[], str=x=>String(x??""), round=x=>Math.round((x+Number.EPSILON)*100)/100;
const sum=(rows,fn)=>round(rows.reduce((a,r)=>a+(Number.isFinite(fn(r))?fn(r):0),0));
const route={customers:["ma-004-customers.html","customer"],enquiries:["ma-005-opportunities.html","opportunity"],quotations:["ma-006-quotations.html","quote"],orders:["ma-007-orders.html","order"]};
function link(type,id,tab=""){const r=route[type];return r?r[0]+"?"+r[1]+"="+encodeURIComponent(id)+(tab?"&tab="+encodeURIComponent(tab):""):"commercial-settings.html";}
function source(){
 const m=W.CPQ_SHARED.read().modules;
 return {entities:m.entities||W.CPQ_MA002_DATA||[],users:m.users||W.CPQ_MA003_USERS||[],
 customers:m.customers||W.CPQ_MA004_DATA||{},opportunities:m.opportunities||W.CPQ_MA005_DATA||{},
 quotations:m.quotations||W.CPQ_MA006_DATA||{},orders:arr(m.orders?.orders),settings:m.commercialSettings||{},vendorOffers:arr(m.vendorOffers?.offers)};
}
function scopeMatch(row,f={}){return (!f.company||row.companyId===f.company)&&(!f.branch||row.branchId===f.branch);}
function dateKey(v){
 const s=str(v).replace(/\s*·\s*(Demo|Sample)$/i,"").replace(/\s*\(demo\)$/i,"");
 if(/^\d{4}-\d{2}-\d{2}/.test(s)){const t=Date.parse(s);return Number.isFinite(t)?t:0;}
 const n=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:,\s*|\s+)?(.*)$/);
 if(n){let t=Date.parse(n[3]+"-"+n[2].padStart(2,"0")+"-"+n[1].padStart(2,"0")+(n[4]?" "+n[4]:""));return Number.isFinite(t)?t:0;}
 const t=Date.parse(s);return Number.isFinite(t)?t:0;
}
function build(s,f={}){
 const entities=arr(s.entities), customers=arr(s.customers?.customers), qs=arr(s.quotations?.quotations), opps=arr(s.opportunities?.opportunities), os=arr(s.orders);
 const co=id=>entities.find(x=>x.id===id), names=r=>({company:co(r.companyId)?.name||r.companyId||"Unassigned",branch:co(r.companyId)?.branches?.find(b=>b.id===r.branchId)?.name||r.branchId||"Unassigned"});
 const cn=id=>customers.find(c=>c.id===id)?.name||id||"Unknown customer";
 const owner=id=>arr(s.users).find(u=>u.id===id)?.name||id||"Not recorded";
 const links=c=>arr(c.links);
 const crows=customers.filter(c=>!f.company&&!f.branch||links(c).some(l=>scopeMatch(l,f))).map(c=>{
  const scopes=links(c).filter(l=>scopeMatch(l,f)).map(l=>names(l));
  return {id:c.id,title:c.name,status:c.status||"Unknown",type:c.type||"",owner:c.owner||"Not recorded",company:scopes.map(l=>l.company).filter((v,i,a)=>a.indexOf(v)===i).join(" · ")||"Unassigned",branch:scopes.map(l=>l.branch).join(" · ")||"Unassigned",url:link("customers",c.id)};
 });
 const erows=opps.filter(o=>scopeMatch(o,f)).map(o=>({id:o.id,title:o.title,customer:cn(o.customerId),status:o.stage||"Unknown",owner:owner(o.ownerId),date:o.received||"",source:o.source||"",...names(o),url:link("enquiries",o.id)}));
 const qrows=qs.filter(q=>scopeMatch(q,f)).map(q=>{
  let t=null;try{t=W.CPQ_PRICING.calculate(q);}catch(_){}
  const outcome=q.demoDispatch?.response?.decision;
  return {id:q.id,title:q.title,revision:q.rev,customer:q.revisionIdentity?.customer||cn(q.customerId),status:outcome?outcome+" (demo)":q.demoDispatch?.state==="Sent in demo"?"Sent (demo)":q.status||"Unknown",recordStatus:q.status,date:q.date||"",owner:owner(q.ownerId),...names(q),total:Number.isFinite(t?.total)?t.total:null,provisional:!t||!!(t.gst&&!t.gst.ready||t.commercial&&!t.commercial.ready),url:link("quotations",q.id,"commercial")};
 });
 const orows=os.filter(o=>scopeMatch(o,f)).map(o=>{
  const t=o.snapshot?.calculation, l=o.snapshot?.labels||{};
  const complete=!!t&&Number.isFinite(t.profit)&&Number.isFinite(t.totalCost)&&Number.isFinite(t.taxable)&&!t.missing;
  return {id:o.id,title:o.title,customer:l.customer||cn(o.customerId),status:o.status||"Unknown",source:o.source,quote:o.quoteId||"",revision:o.quoteRev||"",date:o.orderDate||"",owner:l.owner||owner(o.ownerId),...names(o),total:Number.isFinite(t?.total)?t.total:null,net:Number.isFinite(t?.taxable)?t.taxable:null,cost:complete?t.totalCost:null,profit:complete?t.profit:null,margin:complete&&Number.isFinite(t.margin)?t.margin:null,url:link("orders",o.id)};
 });
 const registered=orows.filter(o=>["Registered","In Progress","Completed"].includes(o.status));
 const priced=registered.filter(o=>o.total!==null), known=registered.filter(o=>o.profit!==null);
 const net=sum(known,x=>x.net),profit=sum(known,x=>x.profit),cost=sum(known,x=>x.cost);
 const metrics={customers:crows.length,enquiries:erows.length,quotations:qrows.length,orders:orows.length,registered:registered.length,completed:registered.filter(o=>o.status==="Completed").length,orderValue:sum(priced,x=>x.total),pricedCount:priced.length,knownCount:known.length,net,cost,profit,margin:net>0?profit/net*100:null};
 const activity=[],seen=new Set();
 function add(module,r,e,url,unscoped=false){
  if(!unscoped&&!scopeMatch(r,f))return;
  if(unscoped&&(f.company||f.branch))return;
  const v={module,id:r.id,action:str(e.action||e.title||e.text||"Recorded activity"),actor:str(e.actor||"Not recorded"),date:str(e.at||e.when||""),detail:str(e.comment||e.detail||e.note||""),revision:str(e.revision||""),...(unscoped?{company:"All companies / not attributed",branch:"Not attributed"}:names(r)),url};
  const key=JSON.stringify([v.module,v.id,v.action,v.actor,v.date,v.detail,v.revision]);if(seen.has(key))return;seen.add(key);activity.push(v);
 }
 for(const h of arr(s.customers?.history)){
  const c=customers.find(x=>x.id===h.customerId);
  if(!c||((f.company||f.branch)&&!links(c).some(l=>scopeMatch(l,f))))continue;
  // Customer actions have no historical branch attribution. Show them only unfiltered.
  add("Customers",{id:h.customerId},h,link("customers",h.customerId),true);
 }
 for(const h of arr(s.opportunities?.history)){const o=opps.find(x=>x.id===h.opportunityId);if(o)add("Enquiries",o,h,link("enquiries",o.id));}
 function qevents(q){for(const e of [...arr(q.demoApproval?.events),...arr(q.demoDispatch?.events)])add("Quotations",q,e,link("quotations",q.id,"revisions"));for(const e of arr(q.pricing?.history))add("Quotations",q,{action:"Offered rate changed",actor:e.actor,at:e.at,comment:str(e.item)+" · "+str(e.before)+" → "+str(e.after)+" · "+str(e.reason)},link("quotations",q.id,"commercial"));}
 for(const q of qs)qevents(q);
 for(const h of arr(s.quotations?.revisionSnapshots)){if(!h.quote)continue;qevents(h.quote);add("Quotations",h.quote,{action:"Revision archived",at:h.archivedAt,actor:h.archivedBy,revision:h.rev,comment:h.reason},link("quotations",h.quoteId,"revisions"));}
 for(const o of os)for(const e of arr(o.events))add("Orders",o,e,link("orders",o.id));
 for(const o of arr(s.vendorOffers))for(const e of arr(o.history))add("Supplier quotations",o,e,"vendor-quotations.html");
 for(const v of [...arr(s.settings?.history),s.settings?.current].filter(v=>v?.version>0))add("Commercial settings",{id:"Version "+v.version},{action:"Commercial settings saved",at:v.savedAt,comment:"Saved defaults and payment templates."},"commercial-settings.html",true);
 activity.sort((a,b)=>dateKey(b.date)-dateKey(a.date));
 return {customers:crows,enquiries:erows,quotations:qrows,orders:orows,activity,metrics};
}
W.CPQ_REPORTS={source,build,dateKey,scopeMatch};
})();