/* MA-006 · Browser-only demonstration events. No issue, customer send, approval or backend save. */
(()=>{
"use strict";
const a=window.CPQ_MA006;
const {$,esc,db,master,org,staff,enquiries,state,quote,customer,buyer,contact,site,project,employee,entity,branch,opportunity,product,configCheck,configUnit,numeric,render,renderBuilder,paper,note}=a;
let toastTimer=null,priorFocus=null;
const copy=x=>JSON.parse(JSON.stringify(x));
const flow=window.CPQ_FLOW,custom=window.CPQ_CUSTOM_BOQ,req=window.CPQ_REQUIREMENTS;
const pricing=window.CPQ_PRICING;
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
  id:"",rev:"R0",status:statusDraft,title:"",customerId:"",buyerId:"",contactId:"",siteId:"",projectId:"",opportunityId:"",serviceIds:[],enquiryServiceIds:[],
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
  req.transfer(q,req.opportunity(src),src.id);
   q.enquiryServiceIds=flow.normalized(src.serviceIds||[],true);
   q.lines=flow.serviceLines(q.enquiryServiceIds,1,src.id);
   q.serviceIds=q.lines.map(l=>l.serviceId);
 }
 pricing.prepare(q,true);
 const b={quote:q,isNew:true,step:0,productId:"",options:{},quantity:1,addPickerOpen:true,catalogSearch:""};
 state.mode="builder";state.builder=b;renderBuilder();
 $("quote-builder").scrollIntoView({block:"start",behavior:"auto"});
}
function existingBuilder(mode="edit",step=0){
 const original=quote(state.selected);if(!original)return;
 if(mode==="edit"&&original.demoDispatch?.state==="Sent in demo"){explain("Demo snapshot locked","This quote has a simulated dispatch record. A sent revision must not be silently edited. In production, create a controlled new revision; Duplicate as Draft creates a separate quote, not a revision.");return;}
 if(mode==="edit"&&original.status!==statusDraft){
  explain("Editing not available","Only permitted, unissued draft revisions may be edited. Sent, accepted and awaiting-approval quotations require a controlled new revision / duplication flow.");return;
 }
 const q=copy(original);q.validUntil=toISO(q.validUntil);if(mode==="duplicate"){
  q.id="";q.rev="R0";q.status=statusDraft;q.date=demoDate();q.review="Not submitted";q.response="Not issued";q.responseNote="";
  q.versionNotes="New draft based on an existing sample";q.lastUpdated=demoDate()+" (demo)";delete q.demoApproval;delete q.demoDispatch;
 }
 const b={quote:q,isNew:mode==="duplicate",step,productId:"",options:{},quantity:1,addPickerOpen:!q.lines.length,catalogSearch:""};
 const existingConfig=q.lines.find(l=>l.type==="config"&&product(l.productId));
 if(existingConfig)setProduct(b,existingConfig.productId);
 if(existingConfig)b.options={...existingConfig.options};
 state.builder=b;state.mode="builder";renderBuilder();$("quote-builder").scrollIntoView({block:"start",behavior:"auto"});
}
function saveBuilder(){
 const b=state.builder;if(!b)return;
 const q=b.quote;
 const validCust=customer(q.customerId);
 const isGoodBuyer=!!master.companies.find(x=>x.customerId===q.customerId&&x.id===q.buyerId);
 const scope=validCust?.links||[];
 const validScope=scope.some(x=>x.companyId===q.companyId&&x.branchId===q.branchId);
 const validOwner=staff.some(u=>u.id===q.ownerId&&u.status==="Active"&&(u.assignments||[]).some(x=>x.companyId===q.companyId&&x.branches.includes(q.branchId)));
 const sameBuyer=(id,arr)=>!id||arr.some(x=>x.id===id&&x.customerId===q.customerId&&x.companyId===q.buyerId);
 const contactOK=sameBuyer(q.contactId,master.contacts),siteOK=sameBuyer(q.siteId,master.sites),projectOK=sameBuyer(q.projectId,master.projects);
 const sourceOK=!q.opportunityId||enquiries.some(x=>x.id===q.opportunityId&&x.customerId===q.customerId&&x.buyerId===q.buyerId);
 const linesOK=q.lines.every(l=>Number.isInteger(Number(l.quantity))&&Number(l.quantity)>0&&Number(l.quantity)<=100000&&
  Number.isFinite(Number(l.unitPrice))&&Number(l.unitPrice)>=0&&
  (l.type!=="config"||configCheck(product(l.productId),l.options).ok)&&!custom.errors(l).length);
 const percentOK=Number.isFinite(+q.discount)&&Number.isFinite(+q.taxRate)&&+q.discount>=0&&+q.discount<=100&&+q.taxRate>=0&&+q.taxRate<=100;
 // Saving is not submitting for approval. Drafts may be missing buyer, BOQ or terms;
 // supplied links, quantities and numeric fields must remain internally consistent.
 let error="";
 if(!String(q.title||"").trim())error="Give this quotation draft a title in step 1.";
 else if(q.customerId&&!validCust)error="This customer is no longer available.";
 else if(q.buyerId&&!isGoodBuyer)error="The buyer must belong to the selected customer.";
 else if(q.companyId&&!entity(q.companyId))error="The selling legal entity is not available.";
 else if(q.branchId&&(!q.companyId||branch(q.branchId)?.companyId!==q.companyId))error="The branch must belong to the selected selling entity.";
 else if(q.customerId&&q.companyId&&q.branchId&&!validScope)error="The selected selling company and branch must be linked to this customer.";
 else if(q.ownerId&&!validOwner)error="The responsible employee must be active and assigned to this company and branch.";
 else if(!contactOK||!siteOK||!projectOK)error="Contact, delivery site and project must belong to the selected buyer.";
 else if(!sourceOK)error="The selected enquiry must belong to the customer and buyer.";
 else if(req.errors(q).length)error=req.errors(q)[0];
 else if(!linesOK)error="Check BOQ item quantities, rates and configured options; quantities must be whole numbers from 1 to 100,000.";
 else if(!percentOK)error="Sample discount and tax percentages must be between 0 and 100.";
 else if(pricing.errors(q).length)error=pricing.errors(q)[0];
 else if(q.validUntil&&!toISO(q.validUntil))error="Choose a valid calendar date or leave validity blank until review.";
 if(error){explain("Please correct the saved data",esc(error)+"<p>Incomplete quotation details and unconfirmed terms are allowed in Draft. Invalid relationships or numbers are not.</p>");return;}
 syncPackageBilling(q);
 if(b.isNew){
  const max=Math.max(20,...db.quotations.map(x=>Number(x.id.split("-").at(-1))||0));
  q.id="QT-2026-"+String(max+1).padStart(3,"0");q.rev="R0";db.quotations.unshift(copy(q));
 }else{
  const idx=db.quotations.findIndex(x=>x.id===q.id);
  if(idx<0||db.quotations[idx].status!=="Draft"){explain("Draft not available","This sample quotation is no longer an editable draft.");return;}
  const before=db.quotations[idx];
   const material=["title","customerId","buyerId","contactId","siteId","projectId","opportunityId","companyId","branchId","ownerId","validUntil","discount","taxRate","payment","delivery","warranty","exclusions","notes","requirementPack","lines","pricing"];
   if(before.demoApproval&&material.some(k=>JSON.stringify(before[k])!==JSON.stringify(q[k]))){
    const previous=before.demoApproval;
    q.demoApproval={state:"Needs resubmission",technical:"Not requested",commercial:"Not requested",
     events:[...(previous.events||[]),{action:"Draft changed; demo review reset",actor:"Draft editor (demo)",at:demoStamp(),revision:q.rev,comment:"Updated draft must be reviewed again."}]};
    q.review="Demo review reset after edits · not authorized";
   }
   db.quotations[idx]=copy(q);
 }
 state.selected=q.id;state.mode="register";state.builder=null;state.tab="summary";
 state.search="";state.status="all";state.company="all";state.branch="all";state.owner="all";
 render();toast("Draft quotation "+q.id+" saved in demo browser state");
 $("quote-register").scrollIntoView({block:"start",behavior:"auto"});
}
function syncPackageBilling(q){
 const selections=(q.lines||[]).filter(l=>l.serviceId).map(l=>l.serviceId);
 for(const line of q.lines||[]){
  if(!line.serviceId)continue;
  const ancestor=flow.hasSelectedAncestor(line.serviceId,selections);
  line.includedInParent=!!ancestor;
  line.includedInServiceId=ancestor?.id||"";
  if(ancestor){line.unitPrice=0;if(line.pricing)line.pricing.overrideReason="";}
 }
 q.serviceIds=flow.normalized(selections,true);
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
 if(p.serviceId&&q.lines.some(l=>l.serviceId===p.id)){
  explain("Service already selected","This service is already in the BOQ. Edit its existing line rather than adding a duplicate.");return;
 }
 const line={id:"L"+String(index).padStart(2,"0"),productId:p.id,type:p.type,description:p.name,
  quantity:qty,unit:p.unit,unitPrice:configUnit(p,b.options),options:p.type==="config"?{...b.options}:{},
  catalogSpec:p.catalogSpec||"",sourceVariantId:p.sourceVariantId||"",pricingReview:!!p.sourceVariantId,technicalReview:!!p.demoOnly,unverified:!!p.demoOnly||(!!p.sourceVariantId&&!(Number(p.basePrice)>0))};
 if(p.serviceId){
  const selected=[...q.lines.filter(l=>l.serviceId).map(l=>l.serviceId),p.id];
  Object.assign(line,flow.lineFor(p.id,index,selected,""));
 }
 if(p.sourceVariantId)flow.attachModel(line,p.sourceVariantId);
 pricing.captureLine(line,true);
 q.lines.push(line);syncPackageBilling(q);
 renderBuilder();toast(p.serviceId?"Service added as an unpriced BOQ line":"Sample product added to BOQ");
}
function handleCustom(action,target){
 const b=state.builder;if(!b)return;const q=b.quote;
 if(action==="cancel-custom-boq"){custom.clear(b);renderBuilder();return;}
 if(action==="edit-custom-boq"){const l=q.lines.find(x=>x.id===target.dataset.customId);if(custom.is(l)){custom.start(b,l);b.step=1;renderBuilder();custom.focusEditor();}return;}
 if(action==="save-custom-boq"){
  try{
   const index=q.lines.findIndex(x=>x.id===b.customEdit&&custom.is(x)),old=index>=0?q.lines[index]:null;
   if(b.customEdit&&!old)throw Error("Item is no longer available.");
   const next=custom.make(b.customDraft||custom.blank(),old?.id||custom.nextId(q.lines,"L"),true);
   const changed=old&&["kind","name","unit","specification"].some(k=>old.customItem[k]!==next.customItem[k]);
   if(old&&!changed){
    next.unitPrice=old.unitPrice;next.pricing=old.pricing;next.sourceCustomConfigLine=old.sourceCustomConfigLine;
   }else if(old){
    if((Number(old.unitPrice)>0||old.pricing?.unitCost!=null)&&!window.confirm("The item description, type, unit or specification changed. Clear the previous item cost and selling rate so they can be reviewed again?"))return;
    next.sourceCustomConfigLine=old.sourceCustomConfigLine;
    if(q.pricing?.history)q.pricing.history.push({at:new Date().toISOString(),actor:"Demo employee",lineId:next.id,item:next.description,before:Number(old.unitPrice)||0,after:0,reason:"Custom scope changed; manual rates reset"});
   }
   pricing.captureLine(next,true);
   if(index>=0)q.lines[index]=next;else q.lines.push(next);
   custom.clear(b);syncPackageBilling(q);renderBuilder();toast("Custom item saved. Review its cost and selling rate in Pricing & Costing.");
  }catch(e){explain("Check custom item",esc(e.message));}
 }
}
function updateBuilderField(field,value){
 const b=state.builder;if(!b)return;const q=b.quote;
 if(field.startsWith("config-")){
  b.options[field.slice(7)]=value;renderBuilder();return;
 }
 if(field==="customerId"){
  if(q.customerId&&q.customerId!==value){if(!req.confirmReplace(q)){renderBuilder();return;}req.clear(q);}
  q.customerId=value;q.buyerId="";q.contactId="";q.siteId="";q.projectId="";q.opportunityId="";
  q.lines=q.lines.filter(l=>!l.importedFromOpportunity);q.enquiryServiceIds=[];syncPackageBilling(q);
  Object.assign(q,window.CPQ_SCOPE_DEFAULTS.choose(org,customer(value)?.links||[]));q.ownerId="";renderBuilder();return;
 }
 if(field==="buyerId"){
  if(q.buyerId&&q.buyerId!==value){if(!req.confirmReplace(q)){renderBuilder();return;}req.clear(q);}
  q.buyerId=value;q.contactId="";q.siteId="";q.projectId="";q.opportunityId="";
  q.lines=q.lines.filter(l=>!l.importedFromOpportunity);q.enquiryServiceIds=[];syncPackageBilling(q);
  renderBuilder();return;
 }
 if(field==="companyId"){
  q.companyId=value;q.branchId=window.CPQ_SCOPE_DEFAULTS.sole(window.CPQ_SCOPE_DEFAULTS.branches(org,value,customer(q.customerId)?.links||[]));q.ownerId="";renderBuilder();return;
 }
 if(field==="branchId"){
  q.branchId=value;q.ownerId="";renderBuilder();return;
 }
 if(field==="opportunityId"){
  if(q.opportunityId===value)return;
  if(!req.confirmReplace(q)){renderBuilder();return;}
  q.opportunityId=value;const src=opportunity(value);
  req.transfer(q,src&&src.customerId===q.customerId&&src.buyerId===q.buyerId?req.opportunity(src):null,src?.id||"");
  q.lines=q.lines.filter(l=>!l.importedFromOpportunity);
  q.enquiryServiceIds=[];
  if(src&&src.customerId===q.customerId&&src.buyerId===q.buyerId){
   q.contactId=src.contactId||"";q.siteId=src.siteId||"";q.projectId=src.projectId||"";
   if(!q.title)q.title="Quotation — "+src.title;
   q.enquiryServiceIds=flow.normalized(src.serviceIds||[],true);
   const next=Math.max(0,...q.lines.map(l=>Number(String(l.id).replace(/\D/g,""))||0))+1;
   const imported=flow.serviceLines(q.enquiryServiceIds,next,src.id);
   imported.forEach(l=>pricing.captureLine(l,true));q.lines.push(...imported);
  }
  syncPackageBilling(q);
  renderBuilder();return;
 }
 if(["discount","taxRate"].includes(field)){
  q[field]=Math.max(0,Math.min(100,Number(value)||0));if(b.step===2)pricing.refresh(q,$("builder-body"),a.financialRows);else renderBuilder();return;
 }
 q[field]=value;
 if(b.step===3&&["validUntil","payment","delivery","warranty","exclusions"].includes(field)){
  const preview=$("cpq-final-customer-paper");
  if(preview)preview.innerHTML=paper(q);
 }
}
function demoStamp(){return new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function submitDemoReview(){
 const q=quote(state.selected);if(!q||q.status!=="Draft")return;
 const missing=a.demoReadiness(q);
 if(missing.length){
  explain("Complete the draft first","The sample approval request needs:<ul>"+missing.map(x=>"<li>"+esc(x)+"</li>").join("")+"</ul><p>Use Continue Editing to complete the missing fields. Real technical and pricing policies are not executed in this demo.</p>");return;
 }
 if(q.demoApproval?.state==="In review"||q.demoApproval?.state==="Demo reviewed"){toast("The current sample review is already active or completed.");return;}
 const events=[...(q.demoApproval?.events||[])];
 events.push({action:"Submitted for demo review",actor:"Quote owner (sample)",at:demoStamp(),revision:q.rev,comment:"Technical and commercial review requested. No real reviewer was contacted."});
 q.demoApproval={state:"In review",technical:"Pending",commercial:"Pending",events};
 q.review="Sample review submitted · not authorized";q.lastUpdated=demoDate()+" (demo)";
 state.tab="approvals";render();toast("Demo review requested. No real approver was notified.");
}
function openDemoDecision(role){
 const q=quote(state.selected);
 if(!["technical","commercial"].includes(role)||!q?.demoApproval||q.demoApproval.state!=="In review"||q.demoApproval[role]!=="Pending")return;
 const title=role==="technical"?"Technical review":"Commercial review";
 modal(title+" · Demo decision","Browser simulation · No authenticated approver",
  '<div class="ma6-note"><b>Demo only.</b> Choose a simulated decision to test the workflow. It will not validate engineering, pricing or permissions, and cannot authorize issuing a quote.</div>'+
  '<div class="ma6-field ma6a-review-comment"><label for="demo-review-comment">Reviewer comments (required for changes / rejection)</label>'+
  '<textarea id="demo-review-comment" maxlength="400" rows="3" placeholder="What should be corrected or checked?"></textarea></div>'+
  '<div class="ma6a-demo-decision-buttons">'+
  '<button type="button" class="btn" data-action="record-demo-review" data-role="'+role+'" data-decision="changes">Request changes</button>'+
  '<button type="button" class="btn" data-action="record-demo-review" data-role="'+role+'" data-decision="rejected">Reject (demo)</button>'+
  '<button type="button" class="btn primary" data-action="record-demo-review" data-role="'+role+'" data-decision="approved">Mark demo approved</button></div>');
}
function recordDemoDecision(role,decision){
 const q=quote(state.selected),d=q?.demoApproval;
 if(!d||q.status!=="Draft"||d.state!=="In review"||d[role]!=="Pending"||!["approved","changes","rejected"].includes(decision))return;
 const comments=$("demo-review-comment"),comment=comments?.value.trim()||"";
 if(decision!=="approved"&&!comment){toast("Enter a reason for requesting changes or rejecting.");comments?.focus();return;}
 const label=decision==="approved"?"Demo approved":decision==="changes"?"Changes requested":"Rejected";
 d[role]=label;
 d.events.push({action:(role==="technical"?"Technical":"Commercial")+" · "+label,actor:"Simulated "+role+" reviewer",at:demoStamp(),revision:q.rev,comment});
 if(decision==="changes")d.state="Changes requested";
 else if(decision==="rejected")d.state="Rejected";
 else if(d.technical==="Demo approved"&&d.commercial==="Demo approved")d.state="Demo reviewed";
 q.review=d.state+" · sample only, not authorized";q.lastUpdated=demoDate()+" (demo)";
 closeModal();state.tab="approvals";render();toast(label+" recorded for demonstration only.");
}
/* Everything below is a simulated employee workflow. No email, PDF issue or role authorization occurs. */
function localISO(){
 const d=new Date();
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}
function openDemoDispatch(){
 const q=quote(state.selected);
 if(!q||q.status!=="Draft"||q.demoDispatch?.state==="Sent in demo")return;
 if(q.demoApproval?.state!=="Demo reviewed"||a.demoReadiness(q).length){
  explain("Review required before dispatch","First complete the quote and record both sample review decisions under Review & Approvals. The demo still cannot authorize or issue an actual quotation.");return;
 }
 modal("Simulate quotation dispatch","Browser-only · No PDF issued or message sent",
  '<div class="ma6-note"><b>Demonstration only.</b> This records a pretend dispatch against '+esc(q.id)+' / '+esc(q.rev)+'. Do not enter actual recipient email addresses or confidential evidence.</div>'+
  '<div class="ma6-field-grid ma6a-dispatch-form">'+
  '<div class="ma6-field"><label for="demo-send-recipient">Recipient name *</label><input id="demo-send-recipient" maxlength="120" value="'+esc(contact(q.contactId)?.name||"Customer contact (sample)")+'" placeholder="Contact name"></div>'+
  '<div class="ma6-field"><label for="demo-send-channel">Delivery method *</label><select id="demo-send-channel"><option value="">Choose method</option><option>Email</option><option>WhatsApp</option><option>Customer portal</option><option>In person / courier</option></select></div>'+
  '<div class="ma6-field"><label for="demo-send-date">Dispatch date *</label><input id="demo-send-date" type="date" value="'+localISO()+'" max="'+localISO()+'"></div>'+
  '<div class="ma6-field"><label for="demo-send-ref">Demo reference *</label><input id="demo-send-ref" maxlength="100" placeholder="e.g. TEST-DISPATCH-001"></div>'+
  '<div class="ma6-field full"><label for="demo-send-note">Internal dispatch note (optional)</label><textarea id="demo-send-note" rows="2" maxlength="400" placeholder="Describe the simulated communication"></textarea></div></div>'+
  '<div class="ma6a-demo-decision-buttons"><button class="btn primary" type="button" data-action="record-demo-dispatch">Save simulated dispatch</button></div>');
}
function recordDemoDispatch(){
 const q=quote(state.selected);
 if(!q||q.status!=="Draft"||q.demoDispatch?.state==="Sent in demo"||
    q.demoApproval?.state!=="Demo reviewed"||a.demoReadiness(q).length)return;
 const recipient=$("demo-send-recipient")?.value.trim()||"";
 const channel=$("demo-send-channel")?.value||"";
 const date=$("demo-send-date")?.value||"";
 const reference=$("demo-send-ref")?.value.trim()||"";
 const noteText=$("demo-send-note")?.value.trim()||"";
 if(!recipient||!channel||!reference||!toISO(date)||date>localISO()){
  toast("Enter recipient, method, valid past/today date and a demo reference.");return;
 }
 q.demoDispatch={state:"Sent in demo",recipient,channel,date,reference,note:noteText,revision:q.rev,
  events:[{action:"Simulated dispatch recorded",actor:"Demo quotation user",at:demoStamp(),revision:q.rev,
   comment:"To "+recipient+" · "+channel+" · "+date+" · "+reference+(noteText?" · "+noteText:"")}]};
 q.lastUpdated=demoDate()+" (demo)";
 closeModal();state.tab="documents";render();toast("Simulated dispatch saved. Nothing was actually sent.");
}
function openDemoResponse(){
 const q=quote(state.selected);
 if(!q||(q.demoDispatch?.state!=="Sent in demo"&&q.status!=="Sent"))return;
 const response=q.demoDispatch?.response||{};
 const selectOption=(value,label,selected)=>'<option value="'+esc(value)+'"'+(value===selected?' selected':'')+'>'+esc(label)+'</option>';
 modal("Record customer response (demo)","Browser-only · Does not change official quotation or create an order",
  '<div class="ma6-note"><b>Demo response log.</b> This is not verified acceptance. Attach actual customer evidence and confirm authorized issue status in the production system.</div>'+
  '<div class="ma6-field-grid ma6a-dispatch-form">'+
  '<div class="ma6-field"><label for="demo-response-decision">Customer decision *</label><select id="demo-response-decision">'+
  selectOption("","Choose response",response.decision||"")+["Accepted","Rejected","Changes Requested"].map(x=>selectOption(x,x,response.decision||"")).join("")+'</select></div>'+
  '<div class="ma6-field"><label for="demo-response-source">Response received through *</label><select id="demo-response-source">'+
  selectOption("","Choose source",response.source||"")+["Email","Phone call","WhatsApp","Customer portal","In person"].map(x=>selectOption(x,x,response.source||"")).join("")+'</select></div>'+
  '<div class="ma6-field"><label for="demo-response-date">Response date *</label><input id="demo-response-date" type="date" value="'+esc(response.date||localISO())+'" max="'+localISO()+'"></div>'+
  '<div class="ma6-field"><label for="demo-response-ref">Evidence / message reference *</label><input id="demo-response-ref" maxlength="100" placeholder="e.g. TEST-REPLY-001" value="'+esc(response.reference||"")+'"></div>'+
  '<div class="ma6-field full"><label for="demo-response-notes">Customer response details (required for rejection or changes)</label><textarea id="demo-response-notes" rows="3" maxlength="500" placeholder="Summarize the customer reply and next action">'+esc(response.notes||"")+'</textarea></div></div>'+
  '<div class="ma6a-demo-decision-buttons"><button class="btn primary" type="button" data-action="save-demo-response">Save demo response</button></div>');
}
function saveDemoResponse(){
 const q=quote(state.selected);
 if(!q||(q.demoDispatch?.state!=="Sent in demo"&&q.status!=="Sent"))return;
 const decision=$("demo-response-decision")?.value||"";
 const source=$("demo-response-source")?.value||"";
 const date=$("demo-response-date")?.value||"";
 const reference=$("demo-response-ref")?.value.trim()||"";
 const notes=$("demo-response-notes")?.value.trim()||"";
 if(!["Accepted","Rejected","Changes Requested"].includes(decision)||!source||!reference||!toISO(date)||date>localISO()){
  toast("Choose a decision, reply source, valid date and demo evidence reference.");return;
 }
 if(decision!=="Accepted"&&!notes){toast("Enter the customer's reason or requested changes.");return;}
 if(!q.demoDispatch)q.demoDispatch={state:"Historical sample",events:[]};
 const wasUpdate=!!q.demoDispatch.response;
 q.demoDispatch.response={decision,source,date,reference,notes};
 q.demoDispatch.events.push({action:(wasUpdate?"Updated":"Recorded")+" demo customer response · "+decision,
  actor:"Demo quotation user",at:demoStamp(),revision:q.rev,comment:source+" · "+date+" · "+reference+(notes?" · "+notes:"")});
 q.response=decision+" (demo)";
 q.responseNote=notes||"Sample reply recorded without actual customer verification.";
 q.lastUpdated=demoDate()+" (demo)";
 closeModal();state.tab="documents";render();toast("Demo response recorded. No order was created.");
}
// Refresh shared organization/customer master data without replacing the current quotation draft.
function refreshCustomerScope(q){
 const shared=window.CPQ_SHARED?.read()?.modules||{},merge=window.CPQ_QUICK_CREATE?.merge;
 if(!merge)throw Error("Shared master refresh is unavailable. Save the draft before reloading the page.");
 for(const [key,target] of [["entities",org],["customers",master],["users",staff]]){
  const latest=shared[key];
  if(latest&&typeof latest==="object"&&Array.isArray(latest)===Array.isArray(target))merge(target,latest);
 }
 const c=customer(q.customerId),links=c?.links||[];
 const validCompanies=window.CPQ_SCOPE_DEFAULTS.companies(org,links);
 if(q.companyId&&!validCompanies.some(e=>e.id===q.companyId)){q.companyId="";q.branchId="";q.ownerId="";}
 if(q.branchId&&!window.CPQ_SCOPE_DEFAULTS.branches(org,q.companyId,links).some(b=>b.id===q.branchId)){q.branchId="";q.ownerId="";}
 if(q.ownerId&&!staff.some(u=>u.id===q.ownerId&&u.status==="Active"&&(u.assignments||[]).some(x=>x.companyId===q.companyId&&x.branches.includes(q.branchId))))q.ownerId="";
 renderBuilder();toast("Customer company links refreshed. Your quotation items, rates and other draft details remain open.");
}
function selectLinkedSellingScope(q,scope){
 const c=customer(q.customerId),company=entity(scope?.companyId),site=company?.branches?.find(x=>x.id===scope?.branchId);
 if(!c||c.status==="Archived"||!company||!site||["Inactive","Archived"].includes(company.status)||["Inactive","Archived"].includes(site.status)||!c.links?.some(x=>x.companyId===company.id&&x.branchId===site.id))throw Error("This company/branch is not an available customer link.");
 const changed=q.companyId!==company.id||q.branchId!==site.id;
 q.companyId=company.id;q.branchId=site.id;
 if(changed)q.ownerId="";
 renderBuilder();
 if(changed)toast("Selling company and branch selected. Choose the responsible employee and review any supplier rates for this company.");
}
function handleAction(action,target){
 if(["save-custom-boq","cancel-custom-boq","edit-custom-boq"].includes(action)){handleCustom(action,target);return;}
 if(action==="link-selling-scope"&&state.builder){
  const q=state.builder.quote;
  if(!q.customerId||!window.CPQ_QUICK_CREATE?.open){explain("Choose a customer","Select an available customer before linking another selling company.");return;}
  window.CPQ_QUICK_CREATE.open("customerScope",{customerId:q.customerId},(record,scope)=>{
   if(state.builder?.quote!==q||record.id!==q.customerId)throw Error("Return to the original customer quotation.");
   selectLinkedSellingScope(q,scope);
  },target);return;
 }
 if(action==="refresh-customer-scope"&&state.builder){
  try{refreshCustomerScope(state.builder.quote);}catch(error){explain("Cannot refresh links",esc(error.message));}
  return;
 }
 if(action==="go-demo-approvals"){state.tab="approvals";render();return;}
 if(action==="open-demo-dispatch"){openDemoDispatch();return;}
 if(action==="record-demo-dispatch"){recordDemoDispatch();return;}
 if(action==="open-demo-response"){openDemoResponse();return;}
 if(action==="save-demo-response"){saveDemoResponse();return;}
 if(action==="submit-demo-review"){submitDemoReview();return;}
  if(action==="simulate-review"){openDemoDecision(target?.dataset.role);return;}
  if(action==="record-demo-review"){recordDemoDecision(target?.dataset.role,target?.dataset.decision);return;}
  if(action==="edit-builder"){existingBuilder("edit");return;}
 if(action==="edit-pricing"){existingBuilder("edit",2);return;}
 if(action.startsWith("price-")&&state.builder){
  const q=state.builder.quote;
  try{
   if(action==="price-refresh-vendor"){toast("Supplier rate options refreshed; unsaved quotation remains open.");}
   else if(action==="price-apply-vendor"){
    const l=q.lines.find(x=>x.id===target.dataset.priceLine),key=target.closest("td")?.querySelector("[data-vendor-rate-select]")?.value;
    if(!l||!key)throw Error("Select an eligible verified supplier rate first.");
    pricing.applyVendorRate(q,l,key);toast("Supplier cost captured in this draft only. Review separate freight and tax.");
   }else if(action==="price-clear-vendor"){
    const l=q.lines.find(x=>x.id===target.dataset.priceLine);if(l)pricing.clearVendorRate(q,l);
   }else if(action==="price-add-cost")pricing.addCost(q);
   else if(action==="price-remove-cost"){
    if(!window.confirm("Remove this additional expense from this draft quotation?"))return;
    pricing.removeCost(q,target.dataset.costId);
   }else if(action==="price-reset"){
    const l=q.lines.find(x=>x.id===target.dataset.priceLine);
    if(l&&l.pricing?.defaultRate!=null)pricing.setRate(q,l,l.pricing.defaultRate);
   }else if(action==="price-apply-target"){
    if(!window.confirm("Apply the cost-plus target to all billable offered rates? Existing quote-specific rates will be replaced; the master catalog stays unchanged."))return;
    pricing.applyTarget(q);toast("Cost-plus target applied to this draft only.");
   }
   renderBuilder();
  }catch(error){explain("Check pricing data",esc(error.message));}
  return;
 }
 if(action==="duplicate"){existingBuilder("duplicate");return;}
 if(action==="add-config-item"){addSelectedProduct();return;}
 if(action==="toggle-add-product"){if(state.builder){state.builder.addPickerOpen=!state.builder.addPickerOpen;state.builder.catalogSearch="";renderBuilder();}return;}
 if(action==="preview-builder"){if(state.builder)modal("Quotation layout preview","Unissued draft · No PDF generated",paper(state.builder.quote));return;}
 if(action==="preview-pdf"){
  const q=quote(state.selected);if(q)modal("Customer-facing quotation preview",q.id+" / "+q.rev+" · Not an issued PDF",paper(q));return;
 }
 if(action==="preview-approval"){
  explain("How real approvals work","The intended production sequence is:<ol><li>Complete customer, BOQ and commercial terms.</li><li>Submit an immutable revision for technical and commercial review.</li><li>Route each review through MA-003 permissions, company/branch scope and approval thresholds. Approvers may approve, request changes or reject with comments.</li><li>Only after every required authorized decision and audit record is complete may an approved revision be locked and issued.</li></ol><p><b>Here you can simulate those two decisions for UI review only.</b> No reviewer is authenticated, no real approval is recorded and issuing stays disabled.</p>");return;
 }
 if(action==="preview-dispatch"){
  explain("Dispatch & customer response","Production flow: <ol><li>Complete technical and commercial approvals with verified MA-003 rights.</li><li>Lock the approved revision and issue its numbered PDF.</li><li>Dispatch to the authorized recipient; record channel, time and message/document proof.</li><li>Record Accepted, Rejected or Changes Requested with customer evidence and action owner.</li><li>Create an order separately after validating acceptance and terms.</li></ol><p><b>Try the two demo cards on this tab.</b> Neither card sends a message or authorizes a quotation.</p>");return;
 }
}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-quote],[data-tab],[data-step],[data-product],[data-remove-line],[data-action],[data-planned]");
 if(!t)return;const d=t.dataset;
 if(d.quote){
  const wasExpanded=state.listExpanded;
  state.selected=d.quote;state.tab="summary";state.listExpanded=false;
  render();
  if(wasExpanded)$("quote-register").scrollIntoView({block:"start",behavior:"auto"});
  return;
 }
 if(d.tab){state.tab=d.tab;render();return;}
 if(d.step!==undefined){const i=Number(d.step);if(state.builder&&Number.isInteger(i)&&i>=0&&i<a.steps.length){state.builder.step=i;renderBuilder();}return;}
 if(d.product){if(state.builder){setProduct(state.builder,d.product);renderBuilder();}return;}
 if(d.removeLine){if(state.builder){const q=state.builder.quote;if(state.builder.customEdit===d.removeLine)custom.clear(state.builder);q.lines=q.lines.filter(l=>l.id!==d.removeLine);syncPackageBilling(q);renderBuilder();}return;}
 if(d.action){handleAction(d.action,t);return;}
 if(d.planned){explain(esc(d.planned)+" (planned)","This is a future administration or business workflow. MA-006 only represents where it connects to quotation configuration and issuance.");return;}
});
function changedInput(e,commit=true){
 if(state.mode!=="builder"||!state.builder)return;
 const t=e.target;
 const b=state.builder,q=b.quote;
 if(custom.update(b,t))return;
 if(t.dataset.priceField||t.dataset.costField||t.dataset.pricingField){
  try{
   if(t.dataset.priceField){
    const l=q.lines.find(x=>x.id===t.dataset.priceLine);if(!l)return;
    if(t.dataset.priceField==="rate"){pricing.setRate(q,l,t.value);t.value=l.unitPrice;}
    else if(t.dataset.priceField==="reason")pricing.setReason(q,l,t.value);
    else if(t.dataset.priceField==="cost"){
     const value=String(t.value).trim()===""?null:pricing.validNumber(t.value)?Math.round(Number(t.value)*100)/100:NaN;
     if(Number.isNaN(value))throw Error("Enter a valid estimated unit cost, or leave it blank if unknown.");
     if(l.pricing.vendorRate&&value!==l.pricing.unitCost){pricing.clearVendorRate(q,l,value);renderBuilder();return;}
     l.pricing.unitCost=value;t.value=value??"";
    }
   }else if(t.dataset.costField){
    pricing.updateCost(q,t.dataset.costId,t.dataset.costField,t.value);
    if(["kind","method","separate"].includes(t.dataset.costField)){renderBuilder();return;}
   }else if(t.dataset.pricingField==="method"){
    q.pricing.method=t.value==="cost-plus"?"cost-plus":"standard";renderBuilder();return;
   }else if(t.dataset.pricingField==="markup"){
    if(!pricing.validNumber(t.value)||Number(t.value)>500)throw Error("Markup must be between 0 and 500%.");
    q.pricing.markup=Math.round(Number(t.value)*100)/100;
   }
   pricing.refresh(q,$("builder-body"),a.financialRows);
  }catch(error){renderBuilder();explain("Check pricing data",esc(error.message));}
  return;
 }
 if(t.dataset.field){updateBuilderField(t.dataset.field,t.value);return;}
 if(t.dataset.configQty!==undefined){b.quantity=Math.max(1,Number(t.value)||1);return;}
  if(t.dataset.paymentPreset!==undefined){if(t.value){q.payment=t.value;renderBuilder();}return;}
 if(t.dataset.lineQty!==undefined){
  const l=q.lines.find(x=>x.id===t.dataset.lineQty);if(l){l.quantity=Math.max(1,Number(t.value)||1);if(commit)renderBuilder();}return;
 }
 if(t.dataset.catalogSearch!==undefined){b.catalogSearch=t.value;return;}
  if(t.dataset.lineRate!==undefined){
  const l=q.lines.find(x=>x.id===t.dataset.lineRate);if(l&&!l.includedInParent){pricing.setRate(q,l,Math.max(0,Number(t.value)||0));if(commit)renderBuilder();}return;
 }
}
req.bind($("builder-body"),()=>state.builder?.quote);
$("builder-body").addEventListener("change",e=>changedInput(e,true));
$("builder-body").addEventListener("input",e=>{
 const t=e.target;
 if(state.builder&&custom.update(state.builder,t))return;
 if(t.dataset.catalogSearch!==undefined){
    const b=state.builder;
    if(!b)return;
    b.catalogSearch=t.value;
    const needle=t.value.trim().toLowerCase(),selected=product(b.productId);
    if(selected&&needle&&![selected.name,selected.id,selected.sku,selected.model,selected.manufacturer,selected.rating,selected.catalogSpec]
      .filter(Boolean).join(" ").toLowerCase().includes(needle)){
      b.productId="";b.options={};b.quantity=1;
    }
    // Recalculate matches against the full active catalog on every search,
    // not just buttons left visible after the previous search. Preserve typing focus.
    const caret=typeof t.selectionStart==="number"?t.selectionStart:t.value.length;
    renderBuilder();
    const input=$("quote-add-search");
    if(input){
      input.focus({preventScroll:true});
      if(input.setSelectionRange)input.setSelectionRange(caret,caret);
    }
    return;
  }
  if(t.dataset.field&&["title","validUntil","currency","payment","delivery","warranty","exclusions","notes"].includes(t.dataset.field))
  updateBuilderField(t.dataset.field,t.value);
});
function openQuotationTable(){
 if(state.mode==="builder"){
  const b=state.builder;
  const dirty=!!b&&(JSON.stringify(b.quote)!==b.initialQuoteSnapshot||
   (b.isNew&&(String(b.quote.title||"").trim()||b.quote.lines.length)));
  if(dirty&&!window.confirm("Open the full quotation table?\n\nUnsaved changes in this quotation editor will be discarded. Select Cancel to stay here and save your draft first."))return;
  state.builder=null;state.mode="register";
 }
 state.listExpanded=true;
 render();
 $("quote-register").scrollIntoView({block:"start",behavior:"auto"});
}
function toggleQuotationList(){
 if(state.mode==="builder"||!state.listExpanded){openQuotationTable();return;}
 state.listExpanded=false;render();
 $("quote-register").scrollIntoView({block:"start",behavior:"auto"});
}
$("quote-view-toggle").addEventListener("click",toggleQuotationList);
$("quote-expand-toggle").addEventListener("click",toggleQuotationList);
$("new-quote").addEventListener("click",()=>newBuilder());
$("builder-close").addEventListener("click",openQuotationTable);
$("builder-prev").addEventListener("click",()=>{if(state.builder){state.builder.step=Math.max(0,state.builder.step-1);renderBuilder();}});
$("builder-next").addEventListener("click",()=>{if(state.builder){state.builder.step=Math.min(a.steps.length-1,state.builder.step+1);renderBuilder();}});
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
function openConfigurationHandoff(raw,fromSaved=false){
 if(!raw||raw.length>(fromSaved?200000:28000))return false;
 let c;try{c=JSON.parse(raw);}catch(_){return false;}
 if(c?.v!==1||typeof c.configId!=="string"||!/^CF-20\d{2}-\d{3,5}$/.test(c.configId)||
 typeof c.name!=="string"||!Array.isArray(c.items)||c.items.length<1||c.items.length>25)return false;
 const lines=[],catalog=window.CPQ_MA006A_CATALOG;
 const storedConfig=window.CPQ_MA006A_DATA?.configurations?.find(x=>x.id===c.configId&&x.revision===c.revision);
 if(fromSaved&&storedConfig&&req.errors(storedConfig).length)return false;
 const quotedServices=flow.normalized(storedConfig?.serviceIds||c.serviceIds||[],false);
 if(c.serviceIds&&(!Array.isArray(c.serviceIds)||quotedServices.length!==c.serviceIds.length))return false;
 for(let i=0;i<c.items.length;i++){
  const value=c.items[i],qty=Number(value?.quantity);
  if(!value||typeof value.productId!=="string"||!Number.isInteger(qty)||qty<1||qty>100000)return false;
  if(custom.is(value)){
   const old=storedConfig?.items?.[i];
   if(!fromSaved||!custom.is(old)||custom.errors(old).length||custom.errors(value).length||value.id!==old.id||JSON.stringify(value.customItem)!==JSON.stringify(old.customItem)||qty!==Number(old.quantity))return false;
   const line=custom.make(custom.read(old),"L"+String(i+1).padStart(2,"0"),true);
   line.sourceCustomConfigLine=old.id;lines.push(line);continue;
  }
  const variantId=typeof value.variantId==="string"?value.variantId:"";
  if(variantId&&/^VAR-\d{3,5}$/.test(variantId)){
   const v=catalog?.variants.find(x=>x.id===variantId);
   if(v){
    if(v.status!=="Active")return false;
    const fam=catalog.families.find(x=>x.id===v.familyId),m=catalog.manufacturers.find(x=>x.id===v.manufacturerId);
    if(!fam)return false;
    const dims=v.dimensions||{},spec=[v.sku,m?.brand||m?.name,v.capacity,
      dims.width&&dims.height&&dims.depth?dims.width+" × "+dims.height+" × "+dims.depth+" "+(dims.unit||"mm"):""].filter(Boolean).join(" · ");
    const demoModel=v.demoReview?.state==="Enabled for demo";
    lines.push({id:"L"+String(i+1).padStart(2,"0"),productId:v.id,type:"standard",description:flow.productName(fam,v),
     quantity:qty,unit:fam.unit||"Nos",unitPrice:Math.max(0,Number(v.price?.sell)||0),options:{},catalogSpec:spec+(demoModel?" · DEMO-ENABLED ONLY: technical and selling-price verification pending":"")+(value.customSpec?" · Custom project specification requires review: "+String(value.customSpec).slice(0,250):""),
     sourceVariantId:v.id,pricingReview:true,technicalReview:demoModel||!!value.customSpec,unverified:demoModel||!(Number(v.price?.sell)>0)});
    const line=lines[lines.length-1],old=storedConfig?.items?.[i];
    if(old?.productId===v.id&&old.modelSnapshot?.id===v.id){
     line.modelSnapshot=copy(old.modelSnapshot);
     line.documentRefCount=line.modelSnapshot.documentRefs?.length||0;
     const snap=line.modelSnapshot,d=snap.dimensions||{};
     line.description=[snap.family||fam.name,snap.model||snap.variantLabel||snap.variant||snap.capacity||snap.sku].filter(Boolean).join(" — ");
     line.catalogSpec=[snap.sku,snap.manufacturer,snap.capacity,
      d.width&&d.height&&d.depth?[d.width,d.height,d.depth].join(" × ")+" "+(d.unit||"mm"):""].filter(Boolean).join(" · ");
     const now=flow.modelSnapshot(v.id);
     if(now&&JSON.stringify([now.sku,now.model,now.capacity,now.dimensions,now.solar,now.categorySpecs,now.documentRefs,now.specTemplate,now.components,now.manufacturerPartNo])!==
      JSON.stringify([snap.sku,snap.model,snap.capacity,snap.dimensions,snap.solar,snap.categorySpecs,snap.documentRefs,snap.specTemplate,snap.components,snap.manufacturerPartNo])){
      line.technicalReview=true;
      line.catalogSpec+=" · Catalog model changed after saved configuration: technical re-review required";
     }
    }else flow.attachModel(line,v.id);
    continue;
   }
   const snap=value.model;
   if(!snap||typeof snap!=="object"||typeof snap.sku!=="string"||typeof snap.model!=="string"||
      snap.sku.length>80||snap.model.length>120||String(snap.name||"").length>150)return false;
   const name=[String(snap.name||"Unverified catalog item"),snap.model||snap.sku].filter(Boolean).join(" — ");
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
 // Customer requirements are taken only from the saved configuration snapshot, never URL payload text.
 if(fromSaved&&storedConfig&&String(storedConfig.customerId||"")===String(q.customerId||"")&&String(storedConfig.buyerId||"")===String(q.buyerId||""))req.transfer(q,storedConfig,c.configId+" / "+c.revision);
 else req.clear(q);
 q.title="Quotation — "+c.name.slice(0,140);
  q.sourceConfigId=c.configId;q.sourceConfigName=c.name.slice(0,160);
  q.sourceConfigRevision=typeof c.revision==="string"?c.revision.slice(0,16):"C0";
 q.lines=[...lines,...flow.serviceLines(quotedServices,lines.length+1,c.opportunityId||"")];
 q.enquiryServiceIds=flow.normalized(src?.serviceIds||[],true);
 pricing.prepare(q,true);
 syncPackageBilling(q);
 state.builder.addPickerOpen=false;
  state.builder.productId="";
 q.projectTechnical=c.solutionType==="solar"&&c.solar&&typeof c.solar==="object"?{
  systemType:String(c.solar.systemType||"").slice(0,100),
  targetDcKwp:Number(c.solar.targetDcKwp)||0,
  targetAcKw:Number(c.solar.targetAcKw)||0,
  roofType:String(c.solar.roofType||"").slice(0,100),
  usableArea:Number(c.solar.usableArea)||0,
  siteLocation:String(c.solar.siteLocation||"").slice(0,150)
 }:null;
 q.notes="Source "+c.configId+". Catalog prices are fictional and require approval. Solar electrical/structural checks and project-specific modifications remain unverified.";
 state.builder.step=2;
 state.builder.initialQuoteSnapshot=JSON.stringify(q);
 renderBuilder();
 toast("Configuration imported. Review automatic rates and additional costs in Pricing & Costing.");
 return true;
}
function payloadFromStored(ref){
 const c=window.CPQ_MA006A_DATA?.configurations?.find(x=>x.id===ref);
 if(!c)return "";
 return JSON.stringify({
  v:1,configId:c.id,name:c.name,revision:c.revision||"C0",customerId:c.customerId||"",
  buyerId:c.buyerId||"",contactId:c.contactId||"",siteId:c.siteId||"",projectId:c.projectId||"",
  companyId:c.companyId||"",branchId:c.branchId||"",ownerId:c.ownerId||"",opportunityId:c.opportunityId||"",
  solutionType:c.solutionType||"general",solar:c.solutionType==="solar"?c.solar||{}:{},
  serviceIds:flow.normalized(c.serviceIds||[],true),
  items:(c.items||[]).map(l=>custom.is(l)?({id:l.id,type:"custom",productId:"",quantity:l.quantity,customItem:copy(l.customItem)}):({
   productId:l.productId,variantId:l.variantId||"",quantity:l.quantity,options:l.options||{},
   note:l.note||"",customSpec:l.customSpec||"",model:l.modelSnapshot?{
    sku:l.modelSnapshot.sku,model:l.modelSnapshot.model,name:l.modelSnapshot.family,
    manufacturer:l.modelSnapshot.manufacturer,unit:"Nos"}:null
  }))
 });
}
const params=new URLSearchParams(window.location.search);
const quoteRef=params.get("quote"),opRef=params.get("opportunity"),configData=params.get("configData"),configRef=params.get("configuration");
if(configRef){
 const data=payloadFromStored(configRef);
 if(!openConfigurationHandoff(data,true)){
  newBuilder();
  explain("Configuration handoff unavailable","This configuration was not found or its product/service references could not be validated. Return to MA-006A and review the saved configuration.");
 }
}else if(configData){
 if(!openConfigurationHandoff(configData)){
  newBuilder();
  explain("Configuration handoff unavailable","This demonstration cannot validate the supplied configuration data. Please use the Product Configuration page to select a sample solution, or start a new draft quotation.");
 }
}else if(quoteRef&&quote(quoteRef)){state.selected=quoteRef;state.tab="summary";render();}
else if(opRef&&opportunity(opRef)){newBuilder(opRef);}
else if(params.get("action")==="new")newBuilder();
a.quickSelectProduct=id=>{if(!state.builder)return;state.builder.addPickerOpen=true;state.builder.catalogSearch="";setProduct(state.builder,id);renderBuilder();};
})();