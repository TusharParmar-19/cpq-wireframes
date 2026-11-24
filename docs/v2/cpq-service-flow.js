/* CPQ V2 cross-page service + model handoff contract.
 * Browser-only wireframe, not authorization, document storage or pricing policy. */
(function(){
"use strict";
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const services=()=>window.CPQ_SERVICE_MASTER?.services||[];
const service=id=>services().find(s=>s.id===id);
function ancestry(id){
 const out=[],seen=new Set([id]);let s=service(id);
 while(s?.parentId&&!seen.has(s.parentId)){
  seen.add(s.parentId);s=service(s.parentId);if(s)out.unshift(s);
 }
 return out;
}
function normalized(ids,allowInactive=true){
 if(!Array.isArray(ids))return [];
 const seen=new Set();
 return ids.filter(id=>{
  const s=typeof id==="string"?service(id):null;
  if(!s||seen.has(id)||(!allowInactive&&s.status!=="Active"))return false;
  seen.add(id);return true;
 });
}
function ordered(){
 const rows=[],seen=new Set();
 function walk(s,depth){
  if(seen.has(s.id))return;
  seen.add(s.id);rows.push({service:s,depth});
  services().filter(x=>x.parentId===s.id).sort((a,b)=>a.name.localeCompare(b.name)).forEach(x=>walk(x,depth+1));
 }
 services().filter(s=>!s.parentId||!service(s.parentId)).sort((a,b)=>a.name.localeCompare(b.name)).forEach(s=>walk(s,0));
 services().forEach(s=>{if(!seen.has(s.id))walk(s,0);});
 return rows;
}
function selector(selected=[],name="serviceIds"){
 const picked=new Set(normalized(selected,true));
 const rows=ordered();
 return '<div class="cpq-scope-picker">'+
 '<p class="cpq-scope-help">Optional for product-only enquiries. Choose main services, sub-services or both. A service can exist without linked products.</p>'+
 '<div class="cpq-scope-grid">'+rows.map(({service:s,depth})=>{
  const isAvailable=s.status==="Active",preserve=picked.has(s.id);
  return '<label class="cpq-scope-option'+(depth?' is-child':'')+(isAvailable?'':' is-unavailable')+'" style="--depth:'+Math.min(depth,5)+'">'+
    '<input type="checkbox" name="'+esc(name)+'" value="'+esc(s.id)+'"'+(preserve?' checked':'')+(!isAvailable?' disabled':'')+'>'+
    (!isAvailable&&preserve?'<input type="hidden" name="'+esc(name)+'" value="'+esc(s.id)+'">':'')+
    '<span><strong>'+esc(s.name)+'</strong><small>'+esc(s.code)+' · '+esc(s.workType||"Other")+(isAvailable?"":" · "+esc(s.status))+'</small></span></label>';
 }).join("")+'</div>'+
 '<small class="cpq-scope-help">Selecting a parent and its child does not mean charging twice. In quotations, child services selected with their parent are included in the parent package by default.</small></div>';
}
function summary(ids=[],limit=0){
 const arr=normalized(ids,true).map(id=>service(id).name);
 if(!arr.length)return '<span class="cpq-scope-muted">No Service Master selection — product-only or not yet classified.</span>';
 const main=limit>0?arr.slice(0,limit):arr;
 return '<span class="cpq-scope-pills">'+main.map(n=>'<span class="cpq-scope-pill">'+esc(n)+'</span>').join("")+
  (limit>0&&arr.length>limit?'<span class="cpq-scope-pill">+'+(arr.length-limit)+' more</span>':'')+'</span>';
}
function snapshot(id){
 const s=service(id);if(!s)return null;
 return {id:s.id,code:s.code,name:s.name,parentId:s.parentId||"",parentName:service(s.parentId)?.name||"",
  domain:s.domain||"",workType:s.workType||"",unit:s.unit||"Job",description:s.description||"",
  scope:s.scope||"",deliverables:s.deliverables||"",status:s.status};
}
function hasSelectedAncestor(id,selected){
 const seen=new Set(selected);return ancestry(id).find(s=>seen.has(s.id))||null;
}
function lineFor(id,index=1,selected=[],fromEnquiry=""){
 const s=service(id);
 if(!s||s.status!=="Active")return null;
 const parent=hasSelectedAncestor(id,selected);
 return {id:"L"+String(index).padStart(2,"0"),productId:s.id,serviceId:s.id,type:"service",
  description:s.name,unit:s.unit||"Job",quantity:1,unitPrice:0,options:{},
  catalogSpec:[s.workType,s.scope].filter(Boolean).join(" · ").slice(0,300),
  serviceSnapshot:snapshot(id),includedInParent:!!parent,includedInServiceId:parent?.id||"",
  importedFromOpportunity:!!fromEnquiry,sourceServiceOpportunityId:fromEnquiry||"",
  pricingReview:true};
}
function serviceLines(ids=[],startingAt=1,fromEnquiry=""){
 const clean=normalized(ids,false);
 return clean.map((id,i)=>lineFor(id,startingAt+i,clean,fromEnquiry)).filter(Boolean);
}
function variantLabel(v={}){return String(v.model||v.variant||v.capacity||v.sku||"Product variant");}
function manufacturerLabel(v={},m){return m?.brand||m?.name||({generic:"Unbranded / Generic",inhouse:"In-house assembled",unknown:"Manufacturer not yet known",service:"Service"})[v.manufacturerSource]||"Manufacturer not supplied";}
function productName(f,v){return [f?.name||"Catalog item",variantLabel(v)].filter(Boolean).join(" — ");}
function modelSnapshot(id){
 const catalog=window.CPQ_MA006A_CATALOG,variant=catalog?.variants?.find(x=>x.id===id);
 if(!variant)return null;
 const family=catalog.families?.find(x=>x.id===variant.familyId);
 const m=catalog.manufacturers?.find(x=>x.id===variant.manufacturerId);
 const docs=(variant.documents||[]).filter(d=>d.status==="Current").slice(0,30).map(d=>({
  id:String(d.id||"").slice(0,70),name:String(d.name||"").slice(0,180),
  type:String(d.type||"").slice(0,60),version:String(d.version||"").slice(0,30),
  visibility:String(d.visibility||"Internal Only").slice(0,50),
  status:String(d.status||"Current")
 }));
 return {
  id:variant.id,sku:variant.sku||"",model:variant.model||"",family:family?.name||"",
  manufacturer:manufacturerLabel(variant,m),manufacturerId:variant.manufacturerId||"",manufacturerSource:variant.manufacturerSource||"",manufacturerPartNo:variant.manufacturerPartNo||"",variantLabel:variantLabel(variant),variant:variant.variant||"",capacity:variant.capacity||"",
  specTemplate:clone(variant.specTemplate||null),components:(variant.components||[]).map(c=>{const p=catalog.parts?.find(x=>x.id===c.partId);return {...clone(c),name:p?.name||c.partId,code:p?.code||"",unit:p?.unit||"Nos"};}),
  revisionCount:(variant.revisionHistory||[]).length,
  dimensions:clone(variant.dimensions||{}),solar:clone(variant.solar||{}),
  categorySpecs:clone(variant.categorySpecs||{}),technical:clone(variant.technical||[]),
  warranty:clone(variant.warranty||{}),documentRefs:docs,
  capturedAt:new Date().toISOString(),demoOnly:true
 };
}
function attachModel(line,id){
 const snap=modelSnapshot(id);
 if(snap){
  line.modelSnapshot=snap;line.sourceVariantId=id;
  line.documentRefCount=snap.documentRefs.length;
 }
 return line;
}
function quotedServiceIds(q){
 return normalized([...new Set([...(q.serviceIds||[]),...(q.lines||[]).map(l=>l.serviceId||"").filter(Boolean)])],true);
}
window.CPQ_FLOW={variantLabel,manufacturerLabel,productName,services,service,ancestry,normalized,ordered,selector,summary,snapshot,hasSelectedAncestor,lineFor,serviceLines,modelSnapshot,attachModel,quotedServiceIds};
})();
