/* Service Master browser wireframe. No real authorization, rates, uploads or quotation changes. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const copy=v=>JSON.parse(JSON.stringify(v));
let db=copy(window.CPQ_SERVICE_MASTER||{services:[]});
if(!Array.isArray(db.services))db.services=[];
const catalog=window.CPQ_MA006A_CATALOG||{variants:[],manufacturers:[],families:[]};
const state={selected:db.services[0]?.id||"",search:"",status:"all",type:"all",view:"list",expanded:new Set(),collapsedInFilter:new Set(),editing:null,focus:null};
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
/* Main services start collapsed. Expanding rows reveals nested sub-services.
 * Filtered matches also reveal ancestor context; all IDs remain unchanged. */
function orderedServices(){
 const rows=[],seen=new Set();
 function walk(s,depth){
  if(seen.has(s.id))return;
  seen.add(s.id);rows.push({s,depth});
  db.services.filter(x=>x.parentId===s.id).sort((a,b)=>a.name.localeCompare(b.name)).forEach(x=>walk(x,depth+1));
 }
 db.services.filter(s=>!s.parentId||!item(s.parentId)).sort((a,b)=>a.name.localeCompare(b.name)).forEach(s=>walk(s,0));
 db.services.forEach(s=>{if(!seen.has(s.id))walk(s,0);});
 return rows;
}
function parentIds(id){
 const out=[],seen=new Set([id]);
 let s=item(id);
 while(s?.parentId&&!seen.has(s.parentId)){
  seen.add(s.parentId);out.unshift(s.parentId);s=item(s.parentId);
 }
 return out;
}
function revealParents(id){parentIds(id).forEach(parentId=>{state.expanded.add(parentId);state.collapsedInFilter.delete(parentId);});}
function matchingResults(){
 const needle=state.search.toLowerCase().trim();
 const type=state.type,status=state.status;
 const all=orderedServices();
 const isFiltered=!!needle||status!=="all";
 const matches=all.filter(({s,depth})=>{
  if(type==="main"&&depth!==0)return false;
  if(type==="sub"&&depth===0)return false;
  if(status!=="all"&&s.status!==status)return false;
  if(!needle)return true;
  return [s.name,s.code,s.domain,s.workType,s.description,item(s.parentId)?.name||"",lineage(s).join(" / ")].join(" ").toLowerCase().includes(needle);
 });
 if(type!=="all")return {rows:matches,autoExpanded:new Set(),isFiltered};
 if(!isFiltered)return {rows:all,autoExpanded:new Set(),isFiltered:false};
 const relevant=new Set(),autoExpanded=new Set();
 for(const {s} of matches){
  relevant.add(s.id);
  for(const ancestor of parentIds(s.id)){relevant.add(ancestor);autoExpanded.add(ancestor);}
 }
 return {rows:all.filter(({s})=>relevant.has(s.id)),autoExpanded,isFiltered:true};
}
function isOpen(id,autoExpanded){
 return !state.collapsedInFilter.has(id)&&(state.expanded.has(id)||autoExpanded.has(id));
}
function visibleRows(){
 const {rows,autoExpanded,isFiltered}=matchingResults();
 if(state.type!=="all")return {rows,autoExpanded,isFiltered};
 const show=rows.filter(({s})=>parentIds(s.id).every(id=>isOpen(id,autoExpanded)));
 return {rows:show,autoExpanded,isFiltered};
}
function allParentIds(){
 return db.services.filter(s=>subs(s.id).length).map(s=>s.id);
}
function updateExpandAll(){
 const {rows,autoExpanded}=matchingResults();
 const candidateIds=new Set(rows.map(({s})=>s.id));
 const toggles=allParentIds().filter(id=>candidateIds.has(id));
 const allOpen=toggles.length>0&&toggles.every(id=>isOpen(id,autoExpanded));
 $("sm-expand-all").textContent=allOpen?"Collapse all":"Expand all";
 $("sm-expand-all").hidden=state.type!=="all"||toggles.length===0;
}
function toggleChildren(id){
 if(!subs(id).length||state.type!=="all")return;
 const {autoExpanded}=matchingResults();
 if(isOpen(id,autoExpanded)){
  state.expanded.delete(id);
  state.collapsedInFilter.add(id);
 }else{
  state.expanded.add(id);
  state.collapsedInFilter.delete(id);
 }
 renderTable();
}
function renderTable(){
 const {rows,autoExpanded,isFiltered}=visibleRows();
 const eligible=state.type==="all"?matchingResults().rows:rows;
 const eligibleIds=new Set(eligible.map(({s})=>s.id));
 $("sm-count").textContent=rows.length+" shown";
 $("sm-result-summary").textContent="Showing "+rows.length+" of "+db.services.length+" services"+(state.type==="all"&&!isFiltered?" · Expand a row to view sub-services":"");
 updateExpandAll();
 $("sm-table-body").innerHTML=rows.length?rows.map(({s,depth})=>{
  const parent=item(s.parentId),children=subs(s.id).length;
  const availableChildren=subs(s.id).some(child=>eligibleIds.has(child.id));
  const canExpand=state.type==="all"&&children>0&&availableChildren;
  const opened=canExpand&&isOpen(s.id,autoExpanded);
  const pad=8+Math.min(depth,6)*12;
  const toggle=canExpand?
   '<button type="button" class="sm-row-toggle'+(opened?' is-open':'')+'" data-toggle-children="'+esc(s.id)+'" aria-expanded="'+String(opened)+'" aria-label="'+(opened?'Collapse':'Expand')+' sub-services for '+esc(s.name)+'"><span aria-hidden="true">▸</span></button>':
   '<span class="sm-row-spacer" aria-hidden="true"></span>';
  return '<tr data-service-row="'+esc(s.id)+'" class="'+(state.view==="detail"&&state.selected===s.id?'sm-selected-row':'')+'">'+
   '<td><div class="sm-table-name" style="padding-left:'+pad+'px">'+toggle+
   '<span class="sm-table-name-cell"><button type="button" class="sm-open-link" data-view-service="'+esc(s.id)+'">'+esc(s.name)+'</button>'+
   '<small class="sm-row-kind">'+esc(s.parentId?"Sub-service":"Main service")+'</small></span></div></td>'+
   '<td><span class="sm-table-code">'+esc(s.code)+'</span></td>'+
   '<td>'+esc(parent?.name||"—")+'</td>'+
   '<td><strong>'+esc(s.domain||"—")+'</strong><span class="sm-table-secondary">'+esc(s.workType||"Not set")+'</span></td>'+
   '<td><span class="sm-table-number">'+children+'</span></td>'+
   '<td><span class="sm-table-number">'+(s.productIds||[]).length+'</span></td>'+
   '<td><span class="'+safeStatus(s.status)+'">'+esc(s.status)+'</span></td>'+
   '<td><div class="sm-row-actions"><button type="button" class="sm-row-view" data-view-service="'+esc(s.id)+'" aria-label="View details of '+esc(s.name)+'">View Details</button>'+
   '<button type="button" class="sm-row-edit" data-edit-service="'+esc(s.id)+'" aria-label="Edit '+esc(s.name)+'">Edit</button></div></td></tr>';
 }).join(""):'<tr><td colspan="8" class="sm-table-empty">No services match your filters. Try a different search or change the status/type.</td></tr>';
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
function syncView(){
 const split=state.view==="detail";
 $("sm-register-view").hidden=false;
 $("sm-detail-view").hidden=!split;
 $("sm-workspace").classList.toggle("is-split",split);
}
function render(){stats();renderTable();renderDetail();syncView();}
function keepSelectedRowVisible(){
 const table=$("sm-table-body");
 const rows=table.querySelectorAll?.("tr[data-service-row]")||[];
 const selected=Array.from(rows).find(row=>row.dataset?.serviceRow===state.selected);
 if(selected&&typeof selected.scrollIntoView==="function"){
  selected.scrollIntoView({block:"nearest",inline:"nearest"});
 }
}
function choose(id){
 if(!item(id))return;
 state.selected=id;
 revealParents(id);
 if(!visibleRows().rows.some(({s})=>s.id===id)){
  state.type="all";state.status="all";state.search="";
  $("sm-type").value="all";$("sm-status").value="all";$("sm-search").value="";
  state.collapsedInFilter.clear();revealParents(id);
 }
 state.view="detail";
 syncView();renderTable();renderDetail();
 $("sm-workspace").scrollIntoView({block:"start"});
 keepSelectedRowVisible();
}
function backToList(){
 state.view="list";
 syncView();renderTable();
 $("sm-register-view").scrollIntoView({block:"start"});
}
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
 revealParents(record.id);state.collapsedInFilter.clear();
 closeEditor();render();
 if(state.view==="detail")keepSelectedRowVisible();
 toast(existing?"Service updated (demo).":"Service created (demo).");
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
$("sm-search").addEventListener("input",event=>{state.search=event.target.value;state.collapsedInFilter.clear();renderTable();});
$("sm-status").addEventListener("change",event=>{state.status=event.target.value;state.collapsedInFilter.clear();renderTable();});
$("sm-type").addEventListener("change",event=>{state.type=event.target.value;state.collapsedInFilter.clear();renderTable();});
$("sm-back").addEventListener("click",backToList);
$("sm-expand-all").addEventListener("click",()=>{
 const {rows,autoExpanded}=matchingResults(),eligibleIds=new Set(rows.map(({s})=>s.id));
 const parents=allParentIds().filter(id=>eligibleIds.has(id));
 if(parents.length&&parents.every(id=>isOpen(id,autoExpanded))){
  for(const id of parents){state.expanded.delete(id);state.collapsedInFilter.add(id);}
 }else{
  for(const id of parents){state.expanded.add(id);state.collapsedInFilter.delete(id);}
 }
 renderTable();
});
$("sm-table-body").addEventListener("click",event=>{
 const toggle=event.target.closest("[data-toggle-children]");
 if(toggle){toggleChildren(toggle.dataset.toggleChildren);return;}
 const edit=event.target.closest("[data-edit-service]");
 if(edit){
  state.selected=edit.dataset.editService;
  openEditor("edit","");
  return;
 }
 const view=event.target.closest("[data-view-service]");
 if(view)choose(view.dataset.viewService);
});
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
