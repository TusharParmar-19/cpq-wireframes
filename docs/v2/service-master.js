/* Service Master browser wireframe. No real authorization, rates, uploads or quotation changes. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const copy=v=>JSON.parse(JSON.stringify(v));
let db=copy(window.CPQ_SERVICE_MASTER||{services:[]});
if(!Array.isArray(db.services))db.services=[];
const catalog=window.CPQ_MA006A_CATALOG||{variants:[],manufacturers:[],families:[]};
const state={selected:db.services[0]?.id||"",search:"",status:"all",editing:null,focus:null};
const item=id=>db.services.find(s=>s.id===id);
const family=id=>(catalog.families||[]).find(f=>f.id===id);
const manufacturer=id=>(catalog.manufacturers||[]).find(m=>m.id===id);
const variant=id=>(catalog.variants||[]).find(v=>v.id===id);
const subs=id=>db.services.filter(s=>s.parentId===id);
const knownStatus=["Active","Draft","Inactive"];
const statuses=db.services.map(s=>s.status);
const safeStatus=s=>knownStatus.includes(s)?"sm-tag "+s.toLowerCase():"sm-tag";
const code=id=>item(id)?.code||"";
const at=()=>new Date().toISOString();
function lineage(s){
 const path=[],seen=new Set();
 let current=s;
 while(current&&!seen.has(current.id)&&path.length<30){
  path.unshift(current.name);seen.add(current.id);current=item(current.parentId);
 }
 return path;
}
function descendantIds(id){
 const found=new Set([id]),queue=[id];
 for(let p=0;p<queue.length;p++){
  for(const child of subs(queue[p])){
   if(found.has(child.id))continue;
   found.add(child.id);queue.push(child.id);
  }
 }
 return found;
}
function stats(){
 const all=db.services,parents=all.filter(s=>!s.parentId).length;
 const active=all.filter(s=>s.status==="Active").length;
 const links=all.reduce((n,s)=>n+(s.productIds||[]).length,0);
 $("sm-summary").innerHTML=[
  ["Main services",parents],["Sub-services",all.length-parents],["Active services",active],["Optional product links",links]
 ].map(v=>'<div class="card sm-stat"><span>'+esc(v[0])+'</span><strong>'+v[1]+'</strong></div>').join("");
}
function visibleSet(){
 const set=new Set(),needle=state.search.toLowerCase().trim();
 for(const s of db.services){
  const hay=[s.name,s.code,s.domain,s.workType,s.description].join(" ").toLowerCase();
  const matches=(!needle||hay.includes(needle))&&(state.status==="all"||s.status===state.status);
  if(!matches)continue;
  let current=s;
  const visited=new Set();
  while(current&&!visited.has(current.id)){
   set.add(current.id);visited.add(current.id);current=item(current.parentId);
  }
 }
 return set;
}
function renderTree(){
 const visible=visibleSet(),nodes=db.services,visited=new Set();
 $("sm-count").textContent=visible.size+" shown";
 function draw(s,depth){
  if(!visible.has(s.id)||visited.has(s.id))return "";
  visited.add(s.id);
  const n=subs(s.id).length,indent=Math.min(depth,8)*15+12;
  const row='<button type="button" class="sm-tree-row'+(state.selected===s.id?' active':'')+'" data-select="'+esc(s.id)+'" style="padding-left:'+indent+'px" aria-current="'+(state.selected===s.id?'true':'false')+'"><strong>'+
   (depth?'<span class="sm-indent" aria-hidden="true">↳</span>':"")+esc(s.name)+'</strong><span>'+esc(s.code)+' · '+esc(s.status)+(n?" · "+n+" sub-service(s)":"")+'</span></button>';
  return row+nodes.filter(x=>x.parentId===s.id).sort((a,b)=>a.name.localeCompare(b.name)).map(x=>draw(x,depth+1)).join("");
 }
 const roots=nodes.filter(s=>!s.parentId||!item(s.parentId)).sort((a,b)=>a.name.localeCompare(b.name));
 let html=roots.map(s=>draw(s,0)).join("");
 for(const s of nodes)if(visible.has(s.id)&&!visited.has(s.id))html+=draw(s,0);
 $("sm-tree").innerHTML=html||'<div class="sm-empty">No services match these filters. Clear the filters or add a service.</div>';
}
function productText(id){
 const v=variant(id),f=family(v?.familyId),m=manufacturer(v?.manufacturerId);
 return v?{name:(f?.name||"Product")+" — "+v.model,meta:v.sku+" · "+(m?.brand||m?.name||"Manufacturer not specified")+" · "+v.status}:{name:"Unlisted product",meta:id+" · Link requires review"};
}
function renderDetail(){
 const s=item(state.selected),el=$("sm-detail");
 if(!s){
  el.innerHTML='<div class="sm-empty">Choose a service to review it, or add a new main service.</div>';
  return;
 }
 const path=lineage(s),children=subs(s.id),products=s.productIds||[];
 const history=(s.history||[]).slice(-5).reverse();
 el.innerHTML='<div class="sm-breadcrumb">'+esc(path.join(" / "))+'</div>'+
  '<div class="sm-detail-head"><div><h2>'+esc(s.name)+'</h2><div class="sm-tags"><span class="'+safeStatus(s.status)+'">'+esc(s.status)+'</span><span class="sm-tag">'+esc(s.parentId?"Sub-service":"Main service")+'</span><span class="sm-tag">'+esc(s.code)+'</span></div></div>'+
  '<div class="sm-detail-actions"><button type="button" class="btn" data-action="edit">Edit</button><button type="button" class="btn primary" data-action="child">+ Add Sub-service</button></div></div>'+
  '<p class="muted">'+esc(s.description||"No description yet. You can add one when editing.")+'</p>'+
  '<div class="sm-kv">'+[
   ["Business domain",s.domain||"Not set"],["Work type",s.workType||"Not set"],
   ["Commercial unit",s.unit||"Not set"],["Parent service",s.parentId?(item(s.parentId)?.name||"Missing parent"):"None (main service)"]
  ].map(x=>'<div><small>'+esc(x[0])+'</small><strong>'+esc(x[1])+'</strong></div>').join("")+'</div>'+
  '<div class="sm-box"><b>Scope of work</b>'+esc(s.scope||"Not defined yet.")+'</div>'+
  '<div class="sm-box"><b>Expected deliverables</b>'+esc(s.deliverables||"Not defined yet.")+'</div>'+
  '<div class="sm-children"><div class="sm-head"><h3>Direct sub-services ('+children.length+')</h3></div>'+
  (children.length?children.map(child=>'<div class="sm-child"><button type="button" data-select="'+esc(child.id)+'">'+esc(child.name)+'</button><span class="'+safeStatus(child.status)+'">'+esc(child.status)+'</span></div>').join(""):'<div class="sm-empty">No sub-services. This service can still be used by itself.</div>')+'</div>'+
  '<div class="sm-box"><b>Suggested products ('+products.length+')</b>'+
  '<span class="muted">Optional exact manufacturer/model/SKU links. Nothing is automatically added to or priced in a quotation.</span>'+
  (products.length?'<div class="sm-product-list">'+products.map(id=>{const p=productText(id);return '<span class="sm-product"><b>'+esc(p.name)+'</b><small>'+esc(p.meta)+'</small></span>';}).join("")+'</div>':
  '<p class="muted">No products linked — perfectly valid for survey, maintenance or other service-only work.</p>')+'</div>'+
  (s.notes?'<div class="sm-box"><b>Internal notes (demo)</b>'+esc(s.notes)+'</div>':"")+
  (history.length?'<details class="sm-box"><summary><b>Demo change history ('+(s.history||[]).length+')</b></summary><ul>'+history.map(h=>'<li>'+esc(h.at+" — "+h.action)+'</li>').join("")+'</ul></details>':"")+
  '<p class="sm-status-note">Changes are recorded in this browser only. Production will enforce MA-003 permissions and immutable quotation snapshots.</p>';
}
function render(){stats();renderTree();renderDetail();}
function choose(id){if(!item(id))return;state.selected=id;renderTree();renderDetail();}
function parentOptions(editId,current){
 const blocked=editId?descendantIds(editId):new Set();
 const candidates=db.services.filter(s=>!blocked.has(s.id)).sort((a,b)=>lineage(a).join("/").localeCompare(lineage(b).join("/")));
 return '<option value="">None — Main service</option>'+candidates.map(s=>'<option value="'+esc(s.id)+'"'+(s.id===current?' selected':'')+'>'+esc(lineage(s).join(" / "))+'</option>').join("");
}
function options(list,current){
 return list.map(s=>'<option value="'+esc(s)+'"'+(s===current?' selected':'')+'>'+esc(s)+'</option>').join("");
}
function productChoices(current){
 const checked=new Set(current||[]);
 const vs=[...(catalog.variants||[])].sort((a,b)=>(family(a.familyId)?.name||"").localeCompare(family(b.familyId)?.name||"")||(a.model||"").localeCompare(b.model||""));
 return vs.length?vs.map(v=>{
  const p=productText(v.id);
  const unavailable=v.status!=="Active"&&!checked.has(v.id);
  return '<label class="sm-product-choice"><input type="checkbox" name="productIds" value="'+esc(v.id)+'"'+(checked.has(v.id)?' checked':'')+(unavailable?' disabled':'')+'><span><b>'+esc(p.name)+'</b><br>'+esc(p.meta)+(unavailable?' · Not eligible to add':'')+'</span></label>';
 }).join(""):'<p class="muted">No product models available. Add them in the independent Product Catalog first.</p>';
}
function openEditor(mode,parentId){
 const source=mode==="edit"?item(state.selected):null;
 if(mode==="edit"&&!source)return;
 state.editing=source?.id||"";
 state.focus=document.activeElement;
 const rec=source||{code:"",name:"",parentId:parentId||"",status:"Draft",domain:"Solar",workType:"Installation",unit:"Job",description:"",scope:"",deliverables:"",notes:"",productIds:[]};
 $("sm-dialog-title").textContent=source?"Edit Service":"Add "+(rec.parentId?"Sub-service":"Service");
 const units=["Job","Visit","Hour","Day","Month","Year","Contract","Project","Package","Set","Other"];
 $("sm-fields").innerHTML=
  '<details open><summary>1. Service basics</summary><div>'+
  '<div class="sm-form-grid">'+
  '<div class="sm-field"><label for="sm-name">Service name *</label><input id="sm-name" name="name" maxlength="150" required value="'+esc(rec.name)+'" placeholder="Example: Installation"></div>'+
  '<div class="sm-field"><label for="sm-code">Unique service code *</label><input id="sm-code" name="code" maxlength="40" required value="'+esc(rec.code)+'" placeholder="Example: SOL-INSTALL"></div>'+
  '<div class="sm-field"><label for="sm-parent">Parent service</label><select id="sm-parent" name="parentId">'+parentOptions(source?.id||"",rec.parentId)+'</select></div>'+
  '<div class="sm-field"><label for="sm-state">Status</label><select id="sm-state" name="status">'+options(["Draft","Active","Inactive"],rec.status)+'</select></div>'+
  '<div class="sm-field"><label for="sm-domain">Business domain</label><select id="sm-domain" name="domain">'+options(db.domains||["Trading","Solar","Electrical","Substation","Other"],rec.domain)+'</select></div>'+
  '<div class="sm-field"><label for="sm-work">Work type</label><select id="sm-work" name="workType">'+options(db.workTypes||["Installation","Other"],rec.workType)+'</select></div>'+
  '<div class="sm-field"><label for="sm-unit">Commercial unit</label><select id="sm-unit" name="unit">'+options(units,rec.unit)+'</select></div>'+
  '</div>'+
  '<div class="sm-field"><label for="sm-description">Short description</label><textarea id="sm-description" name="description" maxlength="600" placeholder="What does this service provide?">'+esc(rec.description)+'</textarea></div>'+
  '</div></details>'+
  '<details><summary>2. Scope &amp; deliverables (optional)</summary><div>'+
  '<div class="sm-field"><label for="sm-scope">Scope of work</label><textarea id="sm-scope" name="scope" maxlength="3000" placeholder="Scope, limits and assumptions">'+esc(rec.scope)+'</textarea></div>'+
  '<div class="sm-field"><label for="sm-deliverables">Expected deliverables</label><textarea id="sm-deliverables" name="deliverables" maxlength="2000" placeholder="Report, installation, inspection etc.">'+esc(rec.deliverables)+'</textarea></div>'+
  '<div class="sm-field"><label for="sm-notes">Internal notes (demo)</label><textarea id="sm-notes" name="notes" maxlength="1500">'+esc(rec.notes)+'</textarea></div>'+
  '</div></details>'+
  '<details><summary>3. Related products — optional ('+(rec.productIds||[]).length+' selected)</summary><div>'+
  '<p class="muted">Link exact active manufacturer/model/SKU variants. A service can have zero linked products; links are recommendations only and never auto-charge the BOQ.</p>'+
  '<div class="sm-product-choices">'+productChoices(rec.productIds)+'</div>'+
  '<p class="muted"><a href="ma-006a-configuration.html">Manage products and manufacturers →</a></p>'+
  '</div></details>';
 $("sm-error").hidden=true;
 $("sm-overlay").classList.add("open");
 $("sm-overlay").setAttribute("aria-hidden","false");
 $("sm-name").focus();
}
function closeEditor(){
 $("sm-overlay").classList.remove("open");
 $("sm-overlay").setAttribute("aria-hidden","true");
 state.editing=null;
 if(state.focus&&typeof state.focus.focus==="function")state.focus.focus();
}
function showError(message){
 $("sm-error").textContent=message;$("sm-error").hidden=false;$("sm-error").scrollIntoView({block:"nearest"});
}
function nextId(items){
 const number=Math.max(0,...items.map(s=>Number(String(s.id).replace(/[^0-9]/g,""))||0))+1;
 return "SVC-"+String(number).padStart(3,"0");
}
function saveEditor(event){
 event.preventDefault();
 const f=new FormData($("sm-form"));
 const name=String(f.get("name")||"").trim(),serviceCode=String(f.get("code")||"").trim().toUpperCase();
 const parentId=String(f.get("parentId")||"");
 const existing=state.editing?item(state.editing):null;
 if(!name||!serviceCode)return showError("Service name and unique service code are required.");
 if(!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(serviceCode))return showError("Use 2–40 letters, numbers, hyphens or underscores for the service code.");
 if(db.services.some(s=>s.code.toUpperCase()===serviceCode&&s.id!==existing?.id))return showError("This service code already exists. Enter a unique code.");
 if(parentId&&!item(parentId))return showError("The selected parent service no longer exists.");
 if(existing&&parentId&&descendantIds(existing.id).has(parentId))return showError("A service cannot be its own parent or be placed below its sub-service.");
 const allowed=new Set((catalog.variants||[]).filter(v=>v.status==="Active").map(v=>v.id));
 const prev=new Set(existing?.productIds||[]);
 const ids=Array.from($("sm-form").querySelectorAll('input[name="productIds"]:checked')).map(x=>x.value);
 if(ids.some(id=>!allowed.has(id)&&!prev.has(id)))return showError("Only Active product models can be newly linked.");
 const record={
  ...(existing||{}),id:existing?.id||nextId(db.services),code:serviceCode,name,parentId,
  domain:String(f.get("domain")||"Other"),workType:String(f.get("workType")||"Other"),
  unit:String(f.get("unit")||"Job"),status:String(f.get("status")||"Draft"),
  description:String(f.get("description")||"").trim(),scope:String(f.get("scope")||"").trim(),
  deliverables:String(f.get("deliverables")||"").trim(),notes:String(f.get("notes")||"").trim(),
  productIds:ids,updatedAt:at(),
  history:[...(existing?.history||[]),{at:at(),actor:"Demo operator",action:existing?"Service edited":"Service created"}]
 };
 const next=copy(db);
 if(existing)next.services=next.services.map(s=>s.id===record.id?record:s);
 else next.services.push(record);
 if(!window.CPQ_SHARED||!window.CPQ_SHARED.save("services",next))return showError("Could not save demo changes in this browser. Check available local storage.");
 db=next;window.CPQ_SERVICE_MASTER=copy(next);state.selected=record.id;
 closeEditor();render();toast(existing?"Service updated (demo).":"Service created (demo).");
}
let toastId=null;
function toast(msg){
 const el=$("sm-toast");el.textContent=msg;el.hidden=false;
 if(toastId)clearTimeout(toastId);
 toastId=setTimeout(()=>{el.hidden=true;},3200);
}
$("sm-add").addEventListener("click",()=>openEditor("add",""));
$("sm-close").addEventListener("click",closeEditor);
$("sm-cancel").addEventListener("click",closeEditor);
$("sm-overlay").addEventListener("click",event=>{if(event.target===$("sm-overlay"))closeEditor();});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&$("sm-overlay").classList.contains("open"))closeEditor();});
$("sm-form").addEventListener("submit",saveEditor);
$("sm-search").addEventListener("input",event=>{state.search=event.target.value;renderTree();});
$("sm-status").addEventListener("change",event=>{state.status=event.target.value;renderTree();});
$("sm-tree").addEventListener("click",event=>{const b=event.target.closest("[data-select]");if(b)choose(b.dataset.select);});
$("sm-detail").addEventListener("click",event=>{
 const select=event.target.closest("[data-select]");
 if(select){choose(select.dataset.select);return;}
 const action=event.target.closest("[data-action]")?.dataset.action;
 if(action==="edit")openEditor("edit","");
 if(action==="child")openEditor("add",state.selected);
});
document.querySelectorAll("[data-planned]").forEach(b=>b.addEventListener("click",()=>window.alert(b.dataset.planned+" is a planned wireframe module.")));
render();
})();
