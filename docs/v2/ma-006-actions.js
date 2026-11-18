/* MA-006 · Browser-only demonstration events. No issue, customer send, approval or backend save. */
(()=>{
"use strict";
const a=window.CPQ_MA006;
const {$,esc,db,master,org,staff,enquiries,state,quote,customer,buyer,contact,site,project,employee,entity,branch,opportunity,product,configCheck,configUnit,numeric,render,renderBuilder,paper,note}=a;
let toastTimer=null,priorFocus=null;
const copy=x=>JSON.parse(JSON.stringify(x));
const demoDate=()=>new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const statusDraft="Draft";
const toISO=v=>{
 const raw=String(v||"").trim(),d=new Date(raw);
 if(!Number.isFinite(d.valueOf()))return "";
 const iso=d.toISOString().slice(0,10);
 return /^\d{4}-\d{2}-\d{2}$/.test(raw)&&iso!==raw?"":iso;
};
function toast(message){
 const node=$("toast");node.textContent=message;node.hidden=false;
 if(toastTimer)clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>{node.hidden=true},3900);
}
function modal(title,subtitle,html){
 priorFocus=document.activeElement;$("modal-title").textContent=title;$("modal-subtitle").textContent=subtitle;
 $("modal-body").innerHTML=html;$("modal-body").scrollTop=0;$("overlay").classList.add("open");
 $("overlay").setAttribute("aria-hidden","false");$("modal-close").focus();
}
function closeModal(){
 $("overlay").classList.remove("open");$("overlay").setAttribute("aria-hidden","true");
 $("modal-body").innerHTML="";
 if(priorFocus?.isConnected)priorFocus.focus();
}
function explain(title,body){modal(title,"MA-006 · Wireframe only",'<div class="ma6-note">'+body+'</div>');}
function makeBlank(){
 return {
  id:"",rev:"R0",status:statusDraft,title:"",customerId:"",buyerId:"",contactId:"",siteId:"",projectId:"",opportunityId:"",
  companyId:"",branchId:"",ownerId:"",date:demoDate(),validUntil:"",currency:"INR",
  discount:0,taxRate:18,payment:"To be agreed",delivery:"To be confirmed",warranty:"Subject to approved product terms",
  exclusions:"",notes:"",lines:[],review:"Not submitted",response:"Not issued",responseNote:"",lastUpdated:demoDate()+" (demo)",versionNotes:"New unissued draft"
 };
}
function setProduct(b,prodId){
 const p=product(prodId);if(!p)return;
 b.productId=prodId;b.quantity=1;b.options=p.type==="config"?{...p.defaults}:{};
}
function newBuilder(sourceId=""){
 const q=makeBlank();
 const src=opportunity(sourceId);
 if(src){
  q.customerId=src.customerId;q.buyerId=src.buyerId;q.contactId=src.contactId;q.siteId=src.siteId;
  q.projectId=src.projectId;q.companyId=src.companyId;q.branchId=src.branchId;q.ownerId=src.ownerId;
  q.opportunityId=src.id;q.title="Quotation — "+src.title;q.notes="Source enquiry: "+src.summary;
 }
 const b={quote:q,isNew:true,step:0,productId:"",options:{},quantity:1,addPickerOpen:true,catalogSearch:""};
 setProduct(b,"CFG-PNL-01");
 state.mode="builder";state.builder=b;renderBuilder();
 $("quote-builder").scrollIntoView({block:"start",behavior:"auto"});
}
function existingBuilder(mode="edit"){
 const original=quote(state.selected);if(!original)return;
 if(mode==="edit"&&original.status!==statusDraft){
  explain("Editing not available","Only permitted, unissued draft revisions may be edited. Sent, accepted and awaiting-approval quotations require a controlled new revision / duplication flow.");return;
 }
 const q=copy(original);q.validUntil=toISO(q.validUntil);if(mode==="duplicate"){
  q.id="";q.rev="R0";q.status=statusDraft;q.date=demoDate();q.review="Not submitted";q.response="Not issued";q.responseNote="";
  q.versionNotes="New draft based on an existing sample";q.lastUpdated=demoDate()+" (demo)";
 }
 const b={quote:q,isNew:mode==="duplicate",step:0,productId:"",options:{},quantity:1,addPickerOpen:!q.lines.length,catalogSearch:""};
 const existingConfig=q.lines.find(l=>l.type==="config"&&product(l.productId));
 setProduct(b,existingConfig?.productId||"CFG-PNL-01");
 if(existingConfig)b.options={...existingConfig.options};
 state.builder=b;state.mode="builder";renderBuilder();$("quote-builder").scrollIntoView({block:"start",behavior:"auto"});
}
function saveBuilder(){
 const b=state.builder;if(!b)return;
 const q=b.quote;
 const isGoodBuyer=master.companies.some(x=>x.customerId===q.customerId&&x.id===q.buyerId);
 const scope=customer(q.customerId)?.links||[];
 const validScope=scope.some(x=>x.companyId===q.companyId&&x.branchId===q.branchId);
 const validOwner=staff.some(u=>u.id===q.ownerId&&u.status==="Active"&&(u.assignments||[]).some(x=>x.companyId===q.companyId&&x.branches.includes(q.branchId)));
 const sameBuyer=(id,arr)=>!id||arr.some(x=>x.id===id&&x.customerId===q.customerId&&x.companyId===q.buyerId);
 const contactOK=sameBuyer(q.contactId,master.contacts),siteOK=sameBuyer(q.siteId,master.sites),projectOK=sameBuyer(q.projectId,master.projects);
 const sourceOK=!q.opportunityId||enquiries.some(x=>x.id===q.opportunityId&&x.customerId===q.customerId&&x.buyerId===q.buyerId);
 const linesOK=q.lines.length>0&&q.lines.every(l=>Number(l.quantity)>0&&Number.isFinite(+l.unitPrice)&&Number(l.unitPrice)>=0&&(l.type!=="config"||configCheck(product(l.productId),l.options).ok));
 const percentOK=Number.isFinite(+q.discount)&&Number.isFinite(+q.taxRate)&&+q.discount>=0&&+q.discount<=100&&+q.taxRate>=0&&+q.taxRate<=100;
 let error="";
 if(!customer(q.customerId))error="Select a customer in step 1.";
 else if(!isGoodBuyer)error="Select a buyer belonging to that customer.";
 else if(!validScope)error="Choose an internal company and branch already linked to this customer.";
 else if(!validOwner)error="Choose an active employee assigned to the selected internal branch.";
 else if(!contactOK||!siteOK||!projectOK)error="Contact, delivery site and project must belong to the selected buyer.";
 else if(!sourceOK)error="The selected opportunity must match the customer and buyer.";
 else if(!q.title.trim())error="Enter a quotation title in step 1.";
 else if(!linesOK)error="Add at least one valid item in Configuration; check quantities and sample rules.";
 else if(!percentOK)error="Enter discount and illustrative tax percentages between 0 and 100.";
 else if(!toISO(q.validUntil))error="Choose a valid quotation expiry date in Price & Terms.";
 if(error){explain("Draft needs more information",esc(error)+"<p>You can move between the four steps without losing your current draft fields.</p>");return;}
 if(b.isNew){
  const max=Math.max(20,...db.quotations.map(x=>Number(x.id.split("-").at(-1))||0));
  q.id="QT-2026-"+String(max+1).padStart(3,"0");q.rev="R0";db.quotations.unshift(copy(q));
 }else{
  const idx=db.quotations.findIndex(x=>x.id===q.id);
  if(idx<0||db.quotations[idx].status!=="Draft"){explain("Draft not available","This sample quotation is no longer an editable draft.");return;}
  db.quotations[idx]=copy(q);
 }
 state.selected=q.id;state.mode="register";state.builder=null;state.tab="summary";
 state.search="";state.status="all";state.company="all";state.branch="all";state.owner="all";
 render();toast("Draft quotation "+q.id+" saved in demo browser state");
 $("quote-register").scrollIntoView({block:"start",behavior:"auto"});
}
function addSelectedProduct(){
 const b=state.builder;if(!b)return;const q=b.quote,p=product(b.productId);
 if(!p)return;
 if(p.status&&p.status!=="Active"){explain("Model not active","Draft models cannot be selected until approved.");return;}
 const check=configCheck(p,b.options);
 if(!check.ok){explain("Resolve configuration selection",esc(check.message)+"<p>Option compatibility is illustrative. Production must use approved engineering rules.</p>");return;}
 const qty=Number(b.quantity);
 if(!Number.isInteger(qty)||qty<=0||qty>100000){explain("Quantity required","Enter a whole number between 1 and 100,000.");return;}
 const index=Math.max(0,...q.lines.map(x=>Number(x.id.replace(/[^0-9]/g,""))||0))+1;
 const line={id:"L"+String(index).padStart(2,"0"),productId:p.id,type:p.type,description:p.name,
  quantity:qty,unit:p.unit,unitPrice:configUnit(p,b.options),options:p.type==="config"?{...b.options}:{},
  catalogSpec:p.catalogSpec||"",sourceVariantId:p.sourceVariantId||"",pricingReview:!!p.sourceVariantId};
 q.lines.push(line);
 renderBuilder();toast("Sample product added to BOQ");
}
function updateBuilderField(field,value){
 const b=state.builder;if(!b)return;const q=b.quote;
 if(field.startsWith("config-")){
  b.options[field.slice(7)]=value;renderBuilder();return;
 }
 if(field==="customerId"){
  q.customerId=value;q.buyerId="";q.contactId="";q.siteId="";q.projectId="";q.opportunityId="";
  q.companyId="";q.branchId="";q.ownerId="";renderBuilder();return;
 }
 if(field==="buyerId"){
  q.buyerId=value;q.contactId="";q.siteId="";q.projectId="";q.opportunityId="";
  renderBuilder();return;
 }
 if(field==="companyId"){
  q.companyId=value;q.branchId="";q.ownerId="";renderBuilder();return;
 }
 if(field==="branchId"){
  q.branchId=value;q.ownerId="";renderBuilder();return;
 }
 if(field==="opportunityId"){
  q.opportunityId=value;const src=opportunity(value);
  if(src&&src.customerId===q.customerId&&src.buyerId===q.buyerId){
   q.contactId=src.contactId||"";q.siteId=src.siteId||"";q.projectId=src.projectId||"";
   if(!q.title)q.title="Quotation — "+src.title;
  }
  renderBuilder();return;
 }
 if(["discount","taxRate"].includes(field)){
  q[field]=Math.max(0,Math.min(100,Number(value)||0));renderBuilder();return;
 }
 q[field]=value;
}
function handleAction(action){
 if(action==="edit-builder"){existingBuilder("edit");return;}
 if(action==="duplicate"){existingBuilder("duplicate");return;}
 if(action==="add-config-item"){addSelectedProduct();return;}
 if(action==="toggle-add-product"){if(state.builder){state.builder.addPickerOpen=!state.builder.addPickerOpen;state.builder.catalogSearch="";renderBuilder();}return;}
 if(action==="preview-builder"){if(state.builder)modal("Quotation layout preview","Unissued draft · No PDF generated",paper(state.builder.quote));return;}
 if(action==="preview-pdf"){
  const q=quote(state.selected);if(q)modal("Customer-facing quotation preview",q.id+" / "+q.rev+" · Not an issued PDF",paper(q));return;
 }
 if(action==="preview-approval"){
  explain("Approval policy & review (planned)","In production, the quote must pass MA-003 page/action rights, legal-entity and branch scope, pricing rules, restricted-cost controls, technical review and the applicable approval policy.<p><b>This demo does not approve any revision or issue a quotation.</b></p>");return;
 }
 if(action==="preview-dispatch"){
  explain("Dispatch & customer response (planned)","A production issue workflow should generate and lock an approved revision, capture dispatch channel/time/recipient and evidence, record a customer response with source and audit trail, and keep order registration separate.<p>Nothing is sent by the wireframe.</p>");return;
 }
}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-quote],[data-tab],[data-step],[data-product],[data-remove-line],[data-action],[data-planned]");
 if(!t)return;const d=t.dataset;
 if(d.quote){state.selected=d.quote;state.tab="summary";render();return;}
 if(d.tab){state.tab=d.tab;render();return;}
 if(d.step!==undefined){const i=Number(d.step);if(state.builder&&Number.isInteger(i)&&i>=0&&i<4){state.builder.step=i;renderBuilder();}return;}
 if(d.product){if(state.builder){setProduct(state.builder,d.product);renderBuilder();}return;}
 if(d.removeLine){if(state.builder){state.builder.quote.lines=state.builder.quote.lines.filter(l=>l.id!==d.removeLine);renderBuilder();}return;}
 if(d.action){handleAction(d.action);return;}
 if(d.planned){explain(esc(d.planned)+" (planned)","This is a future administration or business workflow. MA-006 only represents where it connects to quotation configuration and issuance.");return;}
});
function changedInput(e,commit=true){
 if(state.mode!=="builder"||!state.builder)return;
 const t=e.target;
 const b=state.builder,q=b.quote;
 if(t.dataset.field){updateBuilderField(t.dataset.field,t.value);return;}
 if(t.dataset.configQty!==undefined){b.quantity=Math.max(1,Number(t.value)||1);return;}
  if(t.dataset.paymentPreset!==undefined){if(t.value){q.payment=t.value;renderBuilder();}return;}
 if(t.dataset.lineQty!==undefined){
  const l=q.lines.find(x=>x.id===t.dataset.lineQty);if(l){l.quantity=Math.max(1,Number(t.value)||1);if(commit)renderBuilder();}return;
 }
 if(t.dataset.catalogSearch!==undefined){b.catalogSearch=t.value;return;}
  if(t.dataset.lineRate!==undefined){
  const l=q.lines.find(x=>x.id===t.dataset.lineRate);if(l){l.unitPrice=Math.max(0,Number(t.value)||0);if(commit)renderBuilder();}return;
 }
}
$("builder-body").addEventListener("change",e=>changedInput(e,true));
$("builder-body").addEventListener("input",e=>{
 const t=e.target;
 if(t.dataset.catalogSearch!==undefined){
    const b=state.builder;if(b)b.catalogSearch=t.value;
    $("builder-body").querySelectorAll("[data-product]").forEach(el=>{el.hidden=!el.textContent.toLowerCase().includes(t.value.toLowerCase());});
    return;
  }
  if(t.dataset.field&&["title","validUntil","currency","payment","delivery","warranty","exclusions","notes"].includes(t.dataset.field))
  updateBuilderField(t.dataset.field,t.value);
});
$("new-quote").addEventListener("click",()=>newBuilder());
$("builder-close").addEventListener("click",()=>{state.mode="register";state.builder=null;render();$("quote-register").scrollIntoView({block:"start",behavior:"auto"});});
$("builder-prev").addEventListener("click",()=>{if(state.builder){state.builder.step=Math.max(0,state.builder.step-1);renderBuilder();}});
$("builder-next").addEventListener("click",()=>{if(state.builder){state.builder.step=Math.min(3,state.builder.step+1);renderBuilder();}});
$("builder-save").addEventListener("click",saveBuilder);
$("company-filter").addEventListener("change",e=>{state.company=e.target.value;state.branch="all";state.owner="all";render();});
$("branch-filter").addEventListener("change",e=>{state.branch=e.target.value;state.owner="all";render();});
$("quote-status-filter").addEventListener("change",e=>{state.status=e.target.value;render();});
$("quote-owner-filter").addEventListener("change",e=>{state.owner=e.target.value;render();});
$("quote-search").addEventListener("input",e=>{state.search=e.target.value;render();});
$("reset-filters").addEventListener("click",()=>{state.company="all";state.branch="all";state.owner="all";state.status="all";state.search="";render();});
$("modal-close").addEventListener("click",closeModal);
$("modal-ok").addEventListener("click",closeModal);
$("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("overlay").classList.contains("open"))closeModal();});
/* Import only sample configuration choices; never accept user-supplied rates or approval status. */
function openConfigurationHandoff(raw){
 if(!raw||raw.length>28000)return false;
 let c;try{c=JSON.parse(raw);}catch(_){return false;}
 if(c?.v!==1||typeof c.configId!=="string"||!/^CF-20\d{2}-\d{3,5}$/.test(c.configId)||
 typeof c.name!=="string"||!Array.isArray(c.items)||c.items.length<1||c.items.length>25)return false;
 const lines=[],catalog=window.CPQ_MA006A_CATALOG;
 for(let i=0;i<c.items.length;i++){
  const value=c.items[i],qty=Number(value?.quantity);
  if(!value||typeof value.productId!=="string"||!Number.isInteger(qty)||qty<1||qty>100000)return false;
  const variantId=typeof value.variantId==="string"?value.variantId:"";
  if(variantId&&/^VAR-\d{3,5}$/.test(variantId)){
   const v=catalog?.variants.find(x=>x.id===variantId);
   if(v){
    if(v.status!=="Active")return false;
    const fam=catalog.families.find(x=>x.id===v.familyId),m=catalog.manufacturers.find(x=>x.id===v.manufacturerId);
    if(!fam)return false;
    const dims=v.dimensions||{},spec=[v.sku,m?.brand||m?.name,v.capacity,
      dims.width&&dims.height&&dims.depth?dims.width+" × "+dims.height+" × "+dims.depth+" "+(dims.unit||"mm"):""].filter(Boolean).join(" · ");
    lines.push({id:"L"+String(i+1).padStart(2,"0"),productId:v.id,type:"standard",description:fam.name+" — "+v.model,
     quantity:qty,unit:fam.unit||"Nos",unitPrice:Math.max(0,Number(v.price?.sell)||0),options:{},catalogSpec:spec+(value.customSpec?" · Custom project specification requires review: "+String(value.customSpec).slice(0,250):""),
     sourceVariantId:v.id,pricingReview:true,technicalReview:!!value.customSpec});
    continue;
   }
   const snap=value.model;
   if(!snap||typeof snap!=="object"||typeof snap.sku!=="string"||typeof snap.model!=="string"||
      snap.sku.length>80||snap.model.length>120||String(snap.name||"").length>150)return false;
   const name=[String(snap.name||"Unverified catalog item"),snap.model].join(" — ");
   lines.push({id:"L"+String(i+1).padStart(2,"0"),productId:variantId,type:"standard",description:name,
    quantity:qty,unit:String(snap.unit||"Nos").slice(0,15),unitPrice:0,options:{},
    catalogSpec:"Unverified new model: "+snap.sku+" · Price and specification approval required",
    sourceVariantId:variantId,pricingReview:true,unverified:true,technicalReview:true});
   continue;
  }
  const p=product(value.productId);if(!p)return false;
  const options={};
  if(p.type==="config"){
   if(!value.options||typeof value.options!=="object")return false;
   for(const [key,spec] of Object.entries(p.options)){
    const choice=value.options[key];
    if(typeof choice!=="string"||!spec.choices.some(([v])=>v===choice))return false;
    options[key]=choice;
   }
   if(!configCheck(p,options).ok)return false;
  }
  lines.push({id:"L"+String(i+1).padStart(2,"0"),productId:p.id,type:p.type,
   description:p.name,quantity:qty,unit:p.unit,unitPrice:configUnit(p,options),options});
 }
 const validCust=master.customers.find(x=>x.id===c.customerId);
 const validBuyer=validCust?master.companies.find(x=>x.id===c.buyerId&&x.customerId===validCust.id):null;
 const src=validBuyer?opportunity(c.opportunityId):null;
 const sameSource=src&&src.customerId===validCust.id&&src.buyerId===validBuyer.id;
 newBuilder(sameSource?src.id:"");
 const q=state.builder.quote;
 if(validCust&&validBuyer){
  q.customerId=validCust.id;q.buyerId=validBuyer.id;
  for(const [key,collection] of [["contactId",master.contacts],["siteId",master.sites],["projectId",master.projects]]){
   const selected=collection.find(x=>x.id===c[key]&&x.customerId===validCust.id&&x.companyId===validBuyer.id);
   if(selected)q[key]=selected.id;
  }
  const scope=(validCust.links||[]).find(x=>x.companyId===c.companyId&&x.branchId===c.branchId);
  if(scope){
   q.companyId=c.companyId;q.branchId=c.branchId;
   const u=staff.find(x=>x.id===c.ownerId);
   if(u&&u.status==="Active"&&(u.assignments||[]).some(a=>a.companyId===scope.companyId&&a.branches.includes(scope.branchId)))q.ownerId=u.id;
  }
 }
 q.title="Quotation — "+c.name.slice(0,140);
  q.sourceConfigId=c.configId;q.sourceConfigName=c.name.slice(0,160);
  q.sourceConfigRevision=typeof c.revision==="string"?c.revision.slice(0,16):"C0";
 q.lines=lines;
  state.builder.addPickerOpen=false;
  setProduct(state.builder,"VAR-009");
 q.projectTechnical=c.solutionType==="solar"&&c.solar&&typeof c.solar==="object"?{
  systemType:String(c.solar.systemType||"").slice(0,100),
  targetDcKwp:Number(c.solar.targetDcKwp)||0,
  targetAcKw:Number(c.solar.targetAcKw)||0,
  roofType:String(c.solar.roofType||"").slice(0,100),
  usableArea:Number(c.solar.usableArea)||0,
  siteLocation:String(c.solar.siteLocation||"").slice(0,150)
 }:null;
 q.notes="Source "+c.configId+". Catalog prices are fictional and require approval. Solar electrical/structural checks and project-specific modifications remain unverified.";
 renderBuilder();
 toast("Technical configuration imported into an unissued quotation draft (demo)");
 return true;
}
const params=new URLSearchParams(window.location.search);
const quoteRef=params.get("quote"),opRef=params.get("opportunity"),configData=params.get("configData");
if(configData){
 if(!openConfigurationHandoff(configData)){
  newBuilder();
  explain("Configuration handoff unavailable","This demonstration cannot validate the supplied configuration data. Please use the Product Configuration page to select a sample solution, or start a new draft quotation.");
 }
}else if(quoteRef&&quote(quoteRef)){state.selected=quoteRef;state.tab="summary";render();}
else if(opRef&&opportunity(opRef)){newBuilder(opRef);}
else if(params.get("action")==="new")newBuilder();
})();