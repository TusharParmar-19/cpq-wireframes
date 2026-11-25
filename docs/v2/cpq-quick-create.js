/* CPQ V2 Quick Create. Reuse the original master forms in same-origin dialogs.
   Browser demo only. No real authorization, activation, file storage or messages. */
(()=>{
"use strict";
const W=window,D=document,addValue="__cpq_quick_create__",params=new URLSearchParams(W.location.search);
const page=W.location.pathname.split("/").pop();
const copy=x=>JSON.parse(JSON.stringify(x));
const str=x=>String(x??"");
const $=id=>D.getElementById(id);
const esc=x=>str(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sources={
 company:["Company","ma-002-organization.html","entities"],
 branch:["Branch","ma-002-organization.html","entities"],
 employee:["Employee","ma-003-users-roles.html","users"],
 role:["Role","ma-003-users-roles.html","roles"],
 customer:["Customer","ma-004-customers.html","customers","customers"],
 customerScope:["Selling Company / Branch","ma-004-customers.html","customers","customers"],
 buyer:["Buyer Company","ma-004-customers.html","customers","companies"],
 contact:["Contact","ma-004-customers.html","customers","contacts"],
 site:["Site","ma-004-customers.html","customers","sites"],
 project:["Project","ma-004-customers.html","customers","projects"],
 enquiry:["Enquiry","ma-005-opportunities.html","opportunities","opportunities"],
 manufacturer:["Manufacturer","ma-006a-configuration.html","catalog","manufacturers"],
 family:["Product Group","ma-006a-configuration.html","catalog","families"],
 template:["Specification Template","ma-006a-configuration.html","catalog","specTemplates"],
 product:["Product Model","ma-006a-configuration.html","catalog","variants"],
 part:["Part / Accessory","ma-006a-configuration.html","catalog","parts"],
 vendor:["Vendor","vendor-master.html","vendors","vendors"],
 service:["Service / Sub-service","service-master.html","services","services"]
};
const lists={
 category:["Product Category","catalog","categories",[]],
 domain:["Business Domain","services","domains",["Trading","Solar","Electrical","Substation","Other"]],
 workType:["Work Type","services","workTypes",["Installation","Other"]],
 unit:["Service Unit","services","units",["Job","Visit","Hour","Day","Month","Year","Contract","Project","Package","Set","Other"]],
 payment:["Payment Terms Template","quotations","paymentPresets",["50% advance; 50% before dispatch","30% advance; 70% after completion","Net 30 days from invoice"]],
 enquirySource:["Enquiry Source","opportunities","sources",["Existing Customer","Direct Enquiry","Website","Email","Phone","Referral","Tender / RFP","Other"]],
 enquiryKind:["Enquiry Type","opportunities","kinds",["Products / Equipment","Project / EPC","Service / Maintenance","Mixed Requirement"]],
 costType:["Cost Type","quotations","customCostTypes",[]]
};
const globals={entities:"CPQ_MA002_DATA",users:"CPQ_MA003_USERS",roles:"CPQ_MA003_ROLES",customers:"CPQ_MA004_DATA",opportunities:"CPQ_MA005_DATA",catalog:"CPQ_MA006A_CATALOG",services:"CPQ_SERVICE_MASTER",vendors:"CPQ_VENDOR_MASTER",quotations:"CPQ_MA006_DATA",configurations:"CPQ_MA006A_DATA"};
function store(){return W.CPQ_SHARED?.read()?.modules||{};}
function memoryTargets(key){
 const a=W.CPQ_MA003,c=W.CPQ_MA004,o=W.CPQ_MA005;
 const values=[W[globals[key]]];
 if(key==="entities")values.push(W.CPQ_MA002?.records,a?.entities,c?.own,o?.org,W.CPQ_MA006?.org);
 if(key==="roles")values.push(a?.roles);
 if(key==="users")values.push(a?.users,o?.staff,W.CPQ_MA006?.staff);
 if(key==="customers")values.push(c?.db,o?.master,W.CPQ_MA006?.master);
 if(key==="opportunities")values.push(o?.db);
 if(key==="catalog")values.push(W.CPQ_MA006A_CATALOG_UI?.db);
 if(key==="services")values.push(W.CPQ_SERVICE_UI?.db());
 if(key==="quotations")values.push(W.CPQ_MA006?.db);
 return [...new Set(values.filter(x=>x&&typeof x==="object"))];
}
// Preserve live references held by page scripts; never rebuild the parent form.
function merge(target,source){
 if(Array.isArray(target)&&Array.isArray(source)){
  const byId=new Map(target.filter(x=>x&&typeof x==="object"&&x.id).map(x=>[x.id,x]));
  const next=source.map(v=>{
   const old=v&&typeof v==="object"&&v.id?byId.get(v.id):null;
   if(old){merge(old,v);return old;}return copy(v);
  });
  target.splice(0,target.length,...next);return;
 }
 for(const [key,value] of Object.entries(source||{})){
  if(value&&typeof value==="object"&&target[key]&&typeof target[key]==="object"&&Array.isArray(value)===Array.isArray(target[key]))merge(target[key],value);
  else target[key]=copy(value);
 }
}
function sync(before){
 const now=store(),changed=[];
 for(const [key,value] of Object.entries(now)){
  if(JSON.stringify(before[key])===JSON.stringify(value))continue;
  for(const target of memoryTargets(key))merge(target,value);
  if(key==="catalog")W.CPQ_PRODUCT_TEMPLATES?.apply(W.CPQ_MA006A_CATALOG_UI?.db||W.CPQ_MA006A_CATALOG);
  changed.push(key);
 }
 return changed;
}
function getRecords(type,modules=store()){
 const entry=sources[type];if(!entry)return [];
 const value=modules[entry[2]]??W[globals[entry[2]]];
 if(type==="branch")return (value||[]).flatMap(e=>(e.branches||[]).map(b=>({...b,companyId:e.id})));
 return entry[3]?(value?.[entry[3]]||[]):(Array.isArray(value)?value:[]);
}
function row(type,id){return getRecords(type).find(r=>r.id===id);}
function label(type,r){
 return type==="manufacturer"?[r.name,r.brand].filter(Boolean).join(" · "):type==="enquiry"?[r.title,r.id].filter(Boolean).join(" · "):
 type==="product"?[r.model||r.variant||r.capacity,r.sku].filter(Boolean).join(" · "):r.name||r.title||r.id;
}
function eligible(type,r,ctx,activeOnly=false){
 if(!r)return "The new record could not be read from the shared master.";
 if(type==="vendor"&&(r.status!=="Active"||(ctx.companyId&&!r.companyIds?.includes(ctx.companyId))))return "Vendor saved, but not active for the selected company. Review the supplier master before selection.";
 if(type==="employee"&&r.status!=="Active")return "Employee saved as "+r.status+". Activate the account and assign the required branch before selecting it as owner.";
 if(type==="product"&&activeOnly&&r.status!=="Active")return "Product model saved as "+r.status+". Complete the existing catalog review before selecting it for a configuration, quotation or service link.";
 if(type==="service"&&activeOnly&&r.status!=="Active")return "Service saved as "+r.status+". Activate it in Service Management before selecting it for a new enquiry or quotation.";
 if(type==="buyer"&&r.customerId!==ctx.customerId)return "Buyer saved, but it belongs to a different customer account.";
 if(["contact","site","project","enquiry"].includes(type)){
  if(r.customerId!==ctx.customerId||(ctx.buyerId&&(r.buyerId||r.companyId)!==ctx.buyerId))return "Record saved, but it belongs to a different customer or buyer.";
  if(["contact","site"].includes(type)&&r.status==="Inactive")return "Record saved as Inactive. Activate it before selection.";
 }
 if(type==="branch"&&(r.companyId!==ctx.companyId||r.status==="Inactive"))return "Branch saved, but it is not active in the selected company.";
 if(type==="company"&&r.status==="Inactive")return "Company saved as Inactive.";
 if(ctx.restrictScope&&ctx.customerId&&["company","branch"].includes(type)){
  const c=row("customer",ctx.customerId);
  if(!(c?.links||[]).some(l=>type==="company"?l.companyId===r.id:l.companyId===r.companyId&&l.branchId===r.id))
   return "Saved to Organization. This customer must first be linked to the new company/branch using its existing Link Internal Company & Branch form.";
 }
 if(type==="family"&&ctx.solarKind&&(r.solarKind||"general")!==ctx.solarKind)return "Product group saved, but its equipment template differs from the one selected on your product.";
 if(type==="role"&&r.system)return "Existing system role is not a new custom role.";
 return "";
}
function context(el){
 const builder=W.CPQ_MA006?.state?.builder?.quote||W.CPQ_MA006A?.state?.builder?.value||{};
 const selected=W.CPQ_MA005?.db?.opportunities?.find(x=>x.id===W.CPQ_MA005?.state?.selected)||{};
 const form=el.closest("form"),read=(...ids)=>ids.map(id=>$(id)).find(x=>x&&x.tagName==="SELECT")?.value||"";
 const inCustomer=page==="ma-004-customers.html";
 const ctx={
  customerId:read("f-customerId","c-customerId","b-customerId")||builder.customerId||(inCustomer?W.CPQ_MA004?.state.selected:selected.customerId)||"",
  buyerId:read("f-buyerId","c-buyerId","b-buyerId","ma4-project-company")||builder.buyerId||selected.buyerId||"",
  companyId:read("ma4-own-company","f-companyId","c-companyId","b-companyId")||builder.companyId||selected.companyId||"",
  branchId:read("ma4-own-branch","f-branchId","c-branchId","b-branchId")||builder.branchId||selected.branchId||"",
  solarKind:form?.querySelector('[name="solarKind"]')?.value||"general",
  parentId:form?.querySelector('[name="parentId"]')?.value||"",
  restrictScope:!inCustomer&&["ma-005-opportunities.html","ma-006a-configuration.html","ma-006-quotations.html"].includes(page)
 };
 // Existing MA-004 contact/site editors use companyId for the BUYER.
 if(inCustomer){
  const buyer=form?.querySelector('[name="companyId"]')?.value;
  if(buyer)ctx.buyerId=buyer;
 }
 if(el.closest(".ma3-scope-card"))ctx.companyId=el.closest(".ma3-scope-card").dataset.companyId;
 // A blank visible parent selection must never inherit the selected register row.
 for(const [key,ids] of Object.entries({customerId:["f-customerId","c-customerId","b-customerId"],buyerId:["f-buyerId","c-buyerId","b-buyerId"],companyId:["ma4-own-company",...(!inCustomer?["f-companyId"]:[]),"c-companyId","b-companyId"],branchId:["ma4-own-branch","f-branchId","c-branchId","b-branchId"]})){
  const field=ids.map(id=>$(id)).find(x=>x&&x.tagName==="SELECT"&&x.closest(".overlay.open,#config-builder-body,#builder-body"));
  if(field)ctx[key]=field.value;
 }
 if(inCustomer&&el.closest("#ma4-form")?.querySelector('[name="type"]'))ctx.customerId="";
 return ctx;
}
function resolve(el){
 if(el.tagName!=="SELECT"||el.multiple||el.disabled)return "";
 const id=el.id,name=el.name;
 if(id==="ma4-own-company")return "company";
 if(id==="ma4-own-branch")return "branch";
 if(id==="f-owner"&&page==="ma-004-customers.html")return "employee";
 if(page==="ma-004-customers.html"&&["f-companyId","ma4-project-company"].includes(id))return "buyer";
 if(id==="ma4-project-site")return "site";
 if(id==="sm-parent")return "service";
 if(id==="sm-domain")return "domain";
 if(id==="sm-work")return "workType";
 if(id==="sm-unit")return "unit";
 if(id==="quote-payment-preset")return "payment";
 if(el.dataset.costField==="kind")return "costType";
 if(page==="ma-005-opportunities.html"&&el.closest("#op-form")){
  if(name==="source")return "enquirySource";
  if(name==="kind")return "enquiryKind";
 }
 if(el.closest("#catalog-editor-form")){
  if(name==="manufacturerId")return "manufacturer";
  if(name==="supplierId")return "vendor";
  if(name==="familyCategory")return "category";
  if(name==="tplCategory")return "category";
  if(name==="solarKind")return "template";
  if(name==="wizardFamilyId")return "family";
 }
 if(!el.closest("#op-form,#config-builder-body,#builder-body"))return "";
 const field=el.dataset.cField||el.dataset.field||name;
 return ({customerId:"customer",buyerId:"buyer",companyId:"company",branchId:"branch",ownerId:"employee",contactId:"contact",siteId:"site",projectId:"project",opportunityId:"enquiry"})[field]||"";
}
function allowed(type,ctx){
 if(type==="customerScope")return !!ctx.customerId&&row("customer",ctx.customerId)?.status!=="Archived"&&!!row("customer",ctx.customerId);
 if(type==="branch")return !!ctx.companyId;
 if(type==="buyer")return row("customer",ctx.customerId)?.type==="Group";
 if(["contact","site","project","enquiry"].includes(type))return !!ctx.customerId&&!!ctx.buyerId;
 if(type==="employee"&&ctx.restrictScope)return !!ctx.companyId&&!!ctx.branchId;
 return true;
}
function notice(message){
 let node=$("cpq-qc-notice");if(!node){node=D.createElement("div");node.id="cpq-qc-notice";node.setAttribute("role","status");D.body.appendChild(node);}
 node.textContent=message;node.hidden=false;
 clearTimeout(notice.timer);notice.timer=setTimeout(()=>node.hidden=true,7000);
}
let current=null;
function ensureHost(){
 if($("cpq-qc-dialog"))return $("cpq-qc-dialog");
 const host=D.createElement("dialog");host.id="cpq-qc-dialog";host.className="qc-host";
 host.innerHTML='<header class="qc-host-head"><div><strong id="cpq-qc-title">Quick Create</strong><small>Original master form · your current work stays open · fictional demo only</small></div><button type="button" class="btn" id="cpq-qc-close" aria-label="Cancel quick creation">×</button></header><div id="cpq-qc-content" class="qc-host-content"></div>';
 D.body.appendChild(host);
 $("cpq-qc-close").addEventListener("click",()=>close(true));
 host.addEventListener("cancel",e=>{e.preventDefault();close(true);});
 // Esc inside the frame is handled by that existing form.
 return host;
}
function close(cancel=false,result=null){
 if(!current)return;
 const task=current;current=null;
 const changed=sync(task.before);
 const staleNotice=$("cpq-demo-store-notice");if(staleNotice)staleNotice.remove();
 if($("cpq-qc-dialog")?.open)$("cpq-qc-dialog").close();
 if($("cpq-qc-content"))$("cpq-qc-content").replaceChildren();
 if(result?.id){
  const r=row(task.type,result.id);
  const scope=result.scope;
  const scopeIssue=task.type==="customerScope"&&(!scope||r?.id!==task.ctx.customerId||!r?.links?.some(l=>l.companyId===scope.companyId&&l.branchId===scope.branchId))?"Customer scope could not be verified. Check the customer master before selecting the company.":"";
  const issue=result.error||scopeIssue||eligible(task.type,r,task.ctx,task.activeOnly);
  if(issue){notice(issue);}
  else{try{
   // Refresh any already open compatible selectors, preserving their current values.
   for(const el of D.querySelectorAll("select")){
    if(resolve(el)!==task.type||!allowed(task.type,context(el))||eligible(task.type,r,context(el)))continue;
    insertOption(el,task.type==="employee"&&el.id==="f-owner"?r.name:r.id,label(task.type,r));
   }
   task.onSave?.(r,scope);notice(task.type==="customerScope"?"Selling company and branch linked and selected.":label(task.type,r)+" saved and selected.");}catch(e){notice("Saved to master. Please reopen the selector to select it. "+e.message);}}
 }else if(result?.value){
  try{task.onSave?.(result.value);notice(result.value+(task.onSave?" saved and selected.":" saved to master."));}catch(e){notice(result.value+" saved to master. "+e.message);}
 }else if(result?.error)notice(result.error);
 else if(changed.length&&cancel)notice("Returned to your form. Any separately saved master records remain available.");
 if(task.anchor?.isConnected)task.anchor.focus({preventScroll:true});
}
function open(type,ctx={},onSave=null,anchor=null,activeOnly=false){
 if(current)return;
 if(!allowed(type,ctx)){notice("Choose the required parent customer, buyer or company first.");return;}
 if(!sources[type]&&!lists[type])return;
 const host=ensureHost(),content=$("cpq-qc-content");
 current={type,ctx,onSave,anchor,activeOnly,before:copy(store()),token:W.crypto?.randomUUID?.()||"qc-"+Date.now()+"-"+Math.random()};
 $("cpq-qc-title").textContent=type==="customerScope"?"Link selling company / branch":"Add New "+(sources[type]?.[0]||lists[type][0]);
 host.classList.toggle("qc-compact",!!lists[type]);content.replaceChildren();
 host.showModal();
 if(lists[type]){openList(type);return;}
 const frame=D.createElement("iframe");
 frame.title=type==="customerScope"?"Link selling company / branch":"Add New "+sources[type][0];frame.className="qc-frame";
 const url=new URL(sources[type][1],W.location.href);
 url.searchParams.set("quickCreate",type);url.searchParams.set("qcToken",current.token);
 for(const key of ["customerId","buyerId","companyId","branchId","solarKind","parentId"])if(ctx[key])url.searchParams.set("qc_"+key,ctx[key]);
 current.frame=frame;frame.src=url.href;content.appendChild(frame);
}
function openList(type){
 const [title,module,key,defaults]=lists[type],content=$("cpq-qc-content");
 const form=D.createElement("form");form.className="qc-list-form";
 form.innerHTML='<label for="qc-option-name">'+esc(title)+' *</label><input id="qc-option-name" name="name" type="text" required maxlength="'+(type==="payment"?240:100)+'" placeholder="'+esc(title)+'"><p class="qc-help">Saves a shared editable master option. Workflow statuses and calculation rules are not changed.</p><p class="qc-error" id="qc-list-error" role="alert"></p><div class="qc-list-actions"><button type="button" class="btn" id="qc-list-cancel">Cancel</button><button class="btn primary" type="submit">Save &amp; Select</button></div>';
 content.appendChild(form);
 $("qc-list-cancel").addEventListener("click",()=>close(true));
 form.addEventListener("submit",e=>{
  e.preventDefault();
  const value=$("qc-option-name").value.trim();
  if(!value)return;
  if(["all","__new__",addValue].includes(value.toLowerCase())){$("qc-list-error").textContent="Choose a name other than a reserved system option.";return;}
  const existing=store()[module]||memoryTargets(module)[0];
  if(!existing){$("qc-list-error").textContent="Master data is unavailable.";return;}
  const next=copy(existing);const all=Array.isArray(next[key])?next[key]:[...defaults];
  const reserved=type==="costType"?["Labour","Installation","Transportation","Loading / unloading","Engineering & design","Site survey","Subcontractor","Commission","Administrative expenses","Overhead","Contingency","Other custom cost"]:[];
  if([...all,...reserved].some(x=>str(x).toLowerCase()===value.toLowerCase())){$("qc-list-error").textContent="This option already exists. Choose it from the list.";return;}
  next[key]=[...all,value];
  if(!W.CPQ_SHARED?.save(module,next)){$("qc-list-error").textContent="Could not save in this browser.";return;}
  close(false,{value});
 });
 $("qc-option-name").focus();
}
function insertOption(el,value,title){
 const v=str(value);let opt=Array.from(el.options).find(x=>x.value===v);
 if(!opt){opt=D.createElement("option");opt.value=v;opt.textContent=title;const add=Array.from(el.options).find(x=>x.value===addValue);el.insertBefore(opt,add||null);}
 return opt;
}
const previous=new WeakMap();
function choose(el,type,r){
 if(!el.isConnected)throw Error("The original field was closed.");
 const value=typeof r==="string"?(type==="costType"?"custom:"+r:r):type==="employee"&&el.id==="f-owner"?r.name:r.id;
 insertOption(el,value,typeof r==="string"?r:label(type,r));
 el.value=value;previous.set(el,value);
 el.dispatchEvent(new Event("change",{bubbles:true}));
}
function decorate(el){
 const type=resolve(el);if(!type)return;
 const ctx=context(el);
 if(type==="payment"){
  for(const v of store().quotations?.paymentPresets||[])insertOption(el,v,v);
 }
 if(lists[type]&&type!=="payment"){
  const [,module,key,defaults]=lists[type];for(const v of store()[module]?.[key]||defaults)insertOption(el,type==="costType"?"custom:"+v:v,v);
 }
 const has=Array.from(el.options).find(o=>o.value===addValue);
 if(!allowed(type,ctx)){if(has)has.remove();return;}
 if(!has){
  const opt=D.createElement("option");opt.value=addValue;opt.textContent="+ Add New "+(sources[type]?.[0]||lists[type][0]);opt.className="qc-add-option";
  el.appendChild(opt);
 }
 if(el.value!==addValue)previous.set(el,el.value);
}
function button(host,type,title,callback){
 if(!host||host.querySelector('[data-qc-button="'+type+'"]'))return;
 const b=D.createElement("button");b.type="button";b.className="btn qc-inline-button";b.dataset.qcButton=type;b.textContent=title;
 host.appendChild(b);b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();open(type,context(b),r=>callback(r,b),b,["service","product"].includes(type));});
}
function addServiceChoice(r,host){
 const name=host.querySelector('input[name="serviceIds"],input[name="configServiceIds"]')?.name||(page==="ma-006a-configuration.html"?"configServiceIds":"serviceIds");
 const grid=host.querySelector(".cpq-scope-grid");if(!grid)return;
 const wrap=D.createElement("label");wrap.className="cpq-scope-option";wrap.innerHTML='<input type="checkbox" name="'+esc(name)+'" value="'+esc(r.id)+'"><span><strong>'+esc(r.name)+'</strong><small>'+esc(r.code)+' · '+esc(r.workType)+'</small></span>';
 grid.appendChild(wrap);const input=wrap.querySelector("input");input.checked=true;input.dispatchEvent(new Event("change",{bubbles:true}));
}
function decoratePickers(){
 for(const host of D.querySelectorAll(".cpq-scope-picker"))button(host,"service","+ Add New Service / Sub-service",r=>addServiceChoice(r,host));
 for(const host of D.querySelectorAll(".sm-product-choices")){
  button(host,"product","+ Add New Product Model",r=>{
   const wrap=D.createElement("label");wrap.className="sm-product-choice";wrap.innerHTML='<input type="checkbox" name="productIds" checked value="'+esc(r.id)+'"><span><b>'+esc(label("product",r))+'</b></span>';host.insertBefore(wrap,host.lastElementChild);
  });
 }
 for(const host of D.querySelectorAll(".ma6a-product-picker-toolbar")){
  button(host,"product","+ Add New Product Model",r=>{
   const a=W.CPQ_MA006A?.state?.builder?W.CPQ_MA006A:W.CPQ_MA006;
   if(a?.quickSelectProduct)a.quickSelectProduct(r.id);
  });
  if(page==="ma-006-quotations.html")button(host,"service","+ Add New Service",r=>W.CPQ_MA006?.quickSelectProduct?.(r.id));
 }
 for(const host of D.querySelectorAll(".ma6a-parts-picker")){
  button(host,"part","+ Add New Part",r=>{
   const item=D.createElement("div");item.className="ma6a-part-choice";
   item.innerHTML='<label><input type="checkbox" name="linkedPart" checked value="'+esc(r.id)+'"> '+esc(r.name)+'</label><input type="number" name="qty_'+esc(r.id)+'" value="1" min="1" step="1" aria-label="Part quantity"><select name="role_'+esc(r.id)+'" aria-label="Part requirement"><option>Required</option><option>Optional</option></select><input name="group_'+esc(r.id)+'" placeholder="BOM group (optional)" maxlength="100">';
   host.insertBefore(item,host.lastElementChild);
  });
 }
 for(const card of D.querySelectorAll(".ma3-scope-card")){
  const groups=card.querySelectorAll(".ma3-checkbox-grid");
  for(const [i,type,title,name] of [[0,"role","+ Add New Role","scopeRole"],[1,"branch","+ Add New Branch","scopeBranch"]]){
   button(groups[i],type,title,r=>{
    const wrap=D.createElement("label");wrap.className="ma3-checklabel";wrap.innerHTML='<input type="checkbox" name="'+name+'" value="'+esc(card.dataset.companyId+":"+r.id)+'"><span>'+esc(r.name)+'</span>';
    groups[i].insertBefore(wrap,groups[i].lastElementChild);
    const input=wrap.querySelector("input");input.checked=true;input.dispatchEvent(new Event("change",{bubbles:true}));
   });
  }
 }
}
let scheduled=false;
function scan(){scheduled=false;for(const el of D.querySelectorAll("select"))decorate(el);decoratePickers();}
function schedule(){if(!scheduled){scheduled=true;queueMicrotask(scan);}}
D.addEventListener("focusin",e=>{if(e.target.tagName==="SELECT")decorate(e.target);});
D.addEventListener("pointerdown",e=>{if(e.target.tagName==="SELECT")decorate(e.target);},true);
D.addEventListener("change",e=>{
 const el=e.target;if(el.tagName!=="SELECT")return;
 if(el.value!==addValue){previous.set(el,el.value);schedule();return;}
 e.preventDefault();e.stopImmediatePropagation();
 const type=resolve(el),old=previous.get(el)||"";
 el.value=Array.from(el.options).some(x=>x.value===old)?old:"";
 if(!type)return;
 const ctx=context(el);
 open(type,ctx,r=>choose(el,type,r),el,false);
},true);
// Original master forms call saved only after their existing validation and save path.
let embeddedDone=false;
function send(result){
 if(embeddedDone)return;embeddedDone=true;
 W.parent.postMessage({type:"cpq-quick-create-result",token:params.get("qcToken"),...result},W.location.origin);
}
function saved(type,id,scope=null){
 if(W.parent===W||params.get("quickCreate")!==type)return;
 const entry=sources[type],persisted=store()[entry[2]];
 const record=persisted&&getRecords(type,{[entry[2]]:persisted}).find(x=>x.id===id);
 const scopeOK=type!=="customerScope"||!!(scope&&id===params.get("qc_customerId")&&record?.links?.some(l=>l.companyId===scope.companyId&&l.branchId===scope.branchId));
 if(record&&scopeOK)send(type==="customerScope"?{id,scope:{companyId:scope.companyId,branchId:scope.branchId}}:{id});
 else send({error:"The master form closed but the record could not be verified in browser storage. Please check storage and try again."});
}
W.addEventListener("message",e=>{
 if(!current?.frame||e.origin!==W.location.origin||e.source!==current.frame.contentWindow||
 e.data?.type!=="cpq-quick-create-result"||e.data.token!==current.token)return;
 close(false,{id:e.data.id,error:e.data.error,scope:e.data.scope});
});
function embedded(){
 const type=params.get("quickCreate");if(!sources[type]||W.parent===W)return;
 D.body.classList.add("qc-embedded");
 const ctx={};for(const key of ["customerId","buyerId","companyId","branchId","solarKind","parentId"])ctx[key]=params.get("qc_"+key)||"";
 const forms=W.CPQ_QC_FORMS;
 try{
  if(!forms?.[type])throw Error("The original creation form is not available on this page.");
  const overlay=forms[type](ctx);
  if(!overlay||!overlay.classList.contains("open"))throw Error("The selected master form could not be opened.");
  new MutationObserver(()=>{
   if(!overlay.classList.contains("open")&&!embeddedDone)send({});
  }).observe(overlay,{attributes:true,attributeFilter:["class"]});
 }catch(e){send({error:e.message});}
}
W.CPQ_QUICK_CREATE={open,saved,scan,eligible,merge,getRecords,list:type=>{const entry=lists[type];return entry?(store()[entry[1]]?.[entry[2]]||entry[3]):[];}};
new MutationObserver(schedule).observe(D.body,{childList:true,subtree:true});
scan();embedded();
})();
