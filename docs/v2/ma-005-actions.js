/* MA-005 · Demonstration interaction only, no persistence or production rights. */
(()=>{
"use strict";
const a=window.CPQ_MA005;
const {$,esc,db,master,org,staff,state,customer,buyer,person,site,project,employee,entity,branch,opp,render,audit}=a;
const options=(items,selected)=>items.map(([v,t])=>'<option value="'+esc(v)+'"'+(String(v)===String(selected)?' selected':'')+'>'+esc(t)+'</option>').join("");
const field=(id,label,value="",required=false,type="text",full=false)=>'<div class="ma5-field'+(full?' full':'')+'"><label for="f-'+esc(id)+'">'+esc(label)+(required?' *':'')+'</label><input name="'+esc(id)+'" id="f-'+esc(id)+'" type="'+esc(type)+'" value="'+esc(value)+'"'+(required?' required':'')+'></div>';
const select=(id,label,items,value="",full=false,placeholder="Select...",required=false)=>'<div class="ma5-field'+(full?' full':'')+'"><label for="f-'+esc(id)+'">'+esc(label)+(required?' *':'')+'</label><select name="'+esc(id)+'" id="f-'+esc(id)+'"'+(required?' required':'')+'><option value="">'+esc(placeholder)+'</option>'+options(items,value)+'</select></div>';
const area=(id,label,value="",full=true,required=false)=>'<div class="ma5-field'+(full?' full':'')+'"><label for="f-'+esc(id)+'">'+esc(label)+(required?' *':'')+'</label><textarea name="'+esc(id)+'" id="f-'+esc(id)+'" rows="3"'+(required?' required':'')+'>'+esc(value)+'</textarea></div>';
const section=title=>'<div class="ma5-form-section">'+esc(title)+'</div>';
const wrap=(content,help="")=> (help?'<div class="ma5-dialog-message">'+help+'</div>':"")+'<form class="ma5-form" id="op-form">'+content+'<div class="ma5-form-error" role="alert" id="form-error"></div></form>';
const v=(fd,key)=>String(fd.get(key)||"").trim();
const today=()=>new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const todayInput=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
const dateText=s=>{if(!s)return"";const d=new Date(s+"T12:00:00");return Number.isNaN(+d)?s:d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});};
const dateValue=s=>{if(!s)return"";const m=s.match(/^(\d{1,2})\s([A-Za-z]{3})\s(\d{4})/);if(!m)return"";const mon=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m[2]);return mon<0?"":m[3]+"-"+String(mon+1).padStart(2,"0")+"-"+m[1].padStart(2,"0")};
const activeOwners=(comp,br)=>staff.filter(u=>u.status==="Active"&&(u.assignments||[]).some(x=>x.companyId===comp&&x.branches.includes(br)));
const ownersFor=o=>activeOwners(o.companyId,o.branchId).map(u=>[u.id,u.name]);
const contactFor=(id,bid)=>master.contacts.filter(x=>x.customerId===id&&x.companyId===bid&&x.status==="Active");
const siteFor=(id,bid)=>master.sites.filter(x=>x.customerId===id&&x.companyId===bid&&x.status==="Active");
const projectFor=(id,bid)=>master.projects.filter(x=>x.customerId===id&&x.companyId===bid);
const linkedScopes=id=>customer(id)?.links||[];
let submit=null,focusBefore=null,toastHandle=null;
function open(title,description,content,callback=null,label="Save demo"){
 focusBefore=document.activeElement;submit=callback;
 $("modal-title").textContent=title;$("modal-subtitle").textContent=description;
 $("modal-body").innerHTML=content;$("modal-body").scrollTop=0;
 $("modal-save").hidden=!callback;$("modal-save").disabled=false;$("modal-save").textContent=label;
 $("modal-cancel").textContent=callback?"Cancel":"Close";
 $("overlay").classList.add("open");$("overlay").setAttribute("aria-hidden","false");
 $("modal-close").focus();
}
function close(){submit=null;$("overlay").classList.remove("open");$("overlay").setAttribute("aria-hidden","true");$("modal-body").innerHTML="";if(focusBefore?.isConnected)focusBefore.focus();}
function help(title,description){open(title,"Wireframe preview",'<div class="ma5-dialog-message">'+description+'</div>');}
function error(msg){const node=$("form-error");if(node){node.textContent=msg;node.scrollIntoView({block:"nearest"});}}
function notify(msg){const n=$("toast");n.textContent=msg;n.hidden=false;if(toastHandle)clearTimeout(toastHandle);toastHandle=setTimeout(()=>n.hidden=true,3900);}
function done(o,title,detail,tab=""){audit(o,title,detail);if(tab)state.tab=tab;close();render();notify(title+" · demo only");}
function refList(){
 return '<span class="ma5-form-help">Select an existing customer from MA-004. <a href="ma-004-customers.html" target="_blank" rel="noopener" style="color:#1c729b;text-decoration:underline">Open Customer Master</a> to review the directory. New records in one wireframe do not synchronize to other wireframe pages; production should allow quick prospect creation.</span>';
}
function createForm(){
 const f=wrap(
 section("1 · Customer and ownership")+
 select("customerId","Customer account",master.customers.filter(c=>c.status!=="Archived").map(c=>[c.id,c.name+" ("+c.type+")"]),"",true,"Choose customer account",true)+
 '<div class="ma5-field full">'+refList()+'</div>'+
 select("buyerId","Buyer / bill-to identity",[],"",true,"Choose buyer",true)+
 select("companyId","Our legal entity",[],"",false,"Choose internal company",true)+
 select("branchId","Our internal branch",[],"",false,"Choose internal branch",true)+
 select("ownerId","Responsible employee",[],"",true,"Choose owner",true)+
 '<details class="ma5-optional"><summary><b>Additional customer links</b><small>Optional contact, site and project</small></summary><div class="ma5-optional-grid">'+
 select("contactId","Contact person (optional)",[],"",false,"Select contact")+
 select("siteId","Customer site / delivery location (optional)",[],"",false,"Select site")+
 select("projectId","Customer project (optional)",[],"",false,"Select project")+
 '</div></details>'+
 section("2 · Enquiry information")+
 field("title","Opportunity / enquiry title","",true,"text",true)+
 select("kind","Enquiry type",db.kinds.map(x=>[x,x]),"Products / Equipment")+
 select("source","Enquiry source",db.sources.map(x=>[x,x]),"Direct Enquiry")+
 select("priority","Priority",db.priorities.map(x=>[x,x]),"Medium")+
 field("received","Enquiry received on",todayInput(),true,"date")+
 field("needBy","Customer required-by date (optional)","",false,"date")+
 area("summary","Customer requirement summary","",true,true)+
 section("3 · Next action")+
 field("nextFollowUp","Next follow-up date (optional)","",false,"date")+
 field("nextAction","Next action / owner task (optional)","",false,"text",true)+
 '<details class="ma5-optional"><summary><b>More enquiry details</b><small>Optional requirement lines and internal notes</small></summary><div class="ma5-optional-grid">'+
 area("requirements","Initial requirements — one per line","")+
 area("remarks","Internal qualification notes (optional)","")+
 '</div></details>',
 "Fields marked * are required. The opportunity ID and New stage are automatic. Received date defaults to today but can be adjusted for an earlier enquiry. BOQ and pricing belong in the quotation module.");
 open("New Enquiry","Create a sample opportunity from an existing customer",f,fd=>{
  const customerId=v(fd,"customerId"),buyerId=v(fd,"buyerId"),companyId=v(fd,"companyId"),branchId=v(fd,"branchId"),ownerId=v(fd,"ownerId");
  const title=v(fd,"title"),summary=v(fd,"summary");
  if(!customer(customerId)){error("Select a customer from MA-004.");return;}
  if(!master.companies.some(x=>x.id===buyerId&&x.customerId===customerId)){error("Select a buyer that belongs to the chosen customer.");return;}
  if(!linkedScopes(customerId).some(x=>x.companyId===companyId&&x.branchId===branchId)){error("Our company/branch must be linked to that customer.");return;}
  if(!activeOwners(companyId,branchId).some(x=>x.id===ownerId)){error("Choose an active employee assigned to that internal branch.");return;}
  if(!title||!summary){error("Enter a title and a short customer requirement summary.");return;}
  const contactId=v(fd,"contactId"),siteId=v(fd,"siteId"),projectId=v(fd,"projectId");
  if(contactId&&!contactFor(customerId,buyerId).some(x=>x.id===contactId)){error("Contact must belong to the selected buyer company.");return;}
  if(siteId&&!siteFor(customerId,buyerId).some(x=>x.id===siteId)){error("Customer site must belong to the selected buyer company.");return;}
  if(projectId&&!projectFor(customerId,buyerId).some(x=>x.id===projectId)){error("Project must belong to the selected buyer company.");return;}
  const nextIndex=Math.max(17,...db.opportunities.map(x=>Number(x.id.split("-").at(-1))||0))+1;
  const id="OP-2026-"+String(nextIndex).padStart(3,"0");
  const record={id,title,customerId,buyerId,contactId,siteId,projectId,companyId,branchId,ownerId,stage:"New",priority:v(fd,"priority")||"Medium",source:v(fd,"source")||"Direct Enquiry",kind:v(fd,"kind")||"Mixed Requirement",summary,requirements:v(fd,"requirements").split(/\n/).map(x=>x.trim()).filter(Boolean),received:dateText(v(fd,"received"))||today(),needBy:dateText(v(fd,"needBy")),expectedClose:"",nextFollowUp:dateText(v(fd,"nextFollowUp")),nextAction:v(fd,"nextAction"),remarks:v(fd,"remarks"),lostReason:"",linkedQuotes:[],lastUpdated:"07 Nov 2026 (demo)"};
  db.opportunities.unshift(record);
  state.company="all";state.branch="all";state.stage="all";state.owner="all";state.priority="all";state.query="";state.selected=id;
  done(record,"Enquiry created: "+id,title,"overview");
 },"Create enquiry (demo)");
}
function updateCustomerBuyers(){
 const customerId=$("f-customerId")?.value||"",rows=master.companies.filter(x=>x.customerId===customerId);
 const b=$("f-buyerId");if(!b)return;
 b.innerHTML='<option value="">Choose buyer identity</option>'+options(rows.map(x=>[x.id,x.name]),"");b.value="";
 updateBuyerLinks();updateCustomerCompanies();
}
function updateCustomerCompanies(){
 const id=$("f-customerId")?.value||"",co=$("f-companyId");if(!co)return;
 const ids=[...new Set(linkedScopes(id).map(l=>l.companyId))];
 co.innerHTML='<option value="">Choose internal company</option>'+options(org.filter(e=>ids.includes(e.id)).map(e=>[e.id,e.name]),"");co.value="";
 updateInternalBranches();
}
function updateBuyerLinks(){
 const cid=$("f-customerId")?.value||"",bid=$("f-buyerId")?.value||"";
 for(const [formId,placeholder,rows] of [["contactId","Select contact",contactFor(cid,bid).map(x=>[x.id,x.name+" · "+x.role])],
 ["siteId","Select customer site",siteFor(cid,bid).map(x=>[x.id,x.name])],
 ["projectId","Select customer project",projectFor(cid,bid).map(x=>[x.id,x.name])]]){
  const el=$("f-"+formId);if(!el)continue;
  el.innerHTML='<option value="">'+esc(placeholder)+'</option>'+options(rows,"");el.value="";
 }
}
function updateInternalBranches(){
 const cid=$("f-customerId")?.value||"",companyId=$("f-companyId")?.value||"",sel=$("f-branchId");
 if(!sel)return;
 const ids=linkedScopes(cid).filter(x=>x.companyId===companyId).map(x=>x.branchId);
 const branches=(entity(companyId)?.branches||[]).filter(b=>ids.includes(b.id));
 sel.innerHTML='<option value="">Choose internal branch</option>'+options(branches.map(b=>[b.id,b.name+" · "+b.city]),"");
 sel.value="";updateOwners();
}
function updateOwners(){
 const comp=$("f-companyId")?.value,br=$("f-branchId")?.value,sel=$("f-ownerId");if(!sel)return;
 sel.innerHTML='<option value="">Choose responsible employee</option>'+options(activeOwners(comp,br).map(u=>[u.id,u.name+" · "+u.department]),"");sel.value="";
}
function editEnquiry(){
 const o=opp(state.selected);if(!o)return;
 const f=wrap(
 section("Customer & ownership")+
 '<div class="ma5-field full"><div class="ma5-dialog-message"><b>'+esc(o.id)+'</b> · '+esc(customer(o.customerId)?.name||"Customer")+' → '+esc(buyer(o.buyerId)?.name||"Buyer")+'<br>Buyer and internal company/branch stay fixed in this demo; reassignment needs a controlled workflow.</div></div>'+
 select("contactId","Contact person",contactFor(o.customerId,o.buyerId).map(x=>[x.id,x.name]),o.contactId)+
 select("siteId","Customer site",siteFor(o.customerId,o.buyerId).map(x=>[x.id,x.name]),o.siteId)+
 select("projectId","Customer project",projectFor(o.customerId,o.buyerId).map(x=>[x.id,x.name]),o.projectId)+
 select("ownerId","Responsible employee",ownersFor(o),o.ownerId)+
 section("Enquiry details")+
 field("title","Enquiry title",o.title,true,"text",true)+
 select("kind","Enquiry type",db.kinds.map(x=>[x,x]),o.kind)+
 select("source","Source",db.sources.map(x=>[x,x]),o.source)+
 select("priority","Priority",db.priorities.map(x=>[x,x]),o.priority)+
 field("needBy","Customer required-by date",dateValue(o.needBy),false,"date")+
 area("summary","Customer requirement summary",o.summary)+
 area("requirements","Requirement lines (one per line)",o.requirements.join("\n"))+
 field("nextFollowUp","Next follow-up date",dateValue(o.nextFollowUp),false,"date")+
 field("nextAction","Next action",o.nextAction,false,"text",true)+area("remarks","Internal notes",o.remarks),
 "Edit scope is limited to this selected opportunity. The linked quotation, if any, will not be rewritten.");
 open("Edit Enquiry",o.id+" · Update sample enquiry notes",f,fd=>{
  const title=v(fd,"title"),summary=v(fd,"summary"),contactId=v(fd,"contactId"),siteId=v(fd,"siteId"),projectId=v(fd,"projectId"),ownerId=v(fd,"ownerId");
  if(!title||!summary){error("Title and customer requirement summary are required.");return;}
  if(!activeOwners(o.companyId,o.branchId).some(u=>u.id===ownerId)){error("Choose an active employee assigned to the enquiry branch.");return;}
  if(contactId&&!contactFor(o.customerId,o.buyerId).some(x=>x.id===contactId)){error("Contact must belong to the selected buyer.");return;}
  if(siteId&&!siteFor(o.customerId,o.buyerId).some(x=>x.id===siteId)){error("Site must belong to the selected buyer.");return;}
  if(projectId&&!projectFor(o.customerId,o.buyerId).some(x=>x.id===projectId)){error("Project must belong to the selected buyer.");return;}
  Object.assign(o,{title,summary,contactId,siteId,projectId,ownerId,kind:v(fd,"kind")||o.kind,source:v(fd,"source")||o.source,priority:v(fd,"priority")||o.priority,needBy:dateText(v(fd,"needBy")),requirements:v(fd,"requirements").split(/\n/).map(x=>x.trim()).filter(Boolean),nextFollowUp:dateText(v(fd,"nextFollowUp")),nextAction:v(fd,"nextAction"),remarks:v(fd,"remarks")});
  done(o,"Enquiry updated",title);
 },"Save enquiry (demo)");
}
function stageForm(){
 const o=opp(state.selected);if(!o)return;
 const stageItems=db.stages.map(x=>[x.id,x.label]);
 const body=wrap(
 select("stage","New pipeline stage",stageItems,o.stage,true)+
 area("reason","Reason / outcome note (required for Won and Lost)","")+
 '<div class="ma5-field full"><div class="ma5-dialog-message">Changing an opportunity stage does not approve a quotation, send it to the customer, create an order, or unlock restricted commercial information.</div></div>',
 "Proposed stage workflow only. A production workflow must validate transitions, roles, attachments and closure outcomes.");
 open("Update Opportunity Stage",o.id+" · current: "+o.stage,body,fd=>{
  const stage=v(fd,"stage"),reason=v(fd,"reason");
  if(!db.stages.some(x=>x.id===stage)){error("Choose a valid stage.");return;}
  if(["Won","Lost"].includes(stage)&&!reason){error("Record an outcome note for Won or Lost.");return;}
  if(stage===o.stage){close();return;}
  const prior=o.stage;o.stage=stage;
  if(stage==="Lost")o.lostReason=reason;
  if(stage==="Won")o.remarks=(o.remarks?o.remarks+"\n":"")+"Outcome note (demo): "+reason;
  if(["Lost","Won"].includes(stage)){o.nextFollowUp="";o.nextAction="Outcome recorded — separate order workflow required";}
  done(o,"Stage changed: "+prior+" → "+stage,reason||"Pipeline stage updated","overview");
 },"Save stage (demo)");
}
function addFollowup(){
 const o=opp(state.selected);if(!o)return;
 const form=wrap(
 select("kind","Interaction type",[["Call","Call"],["Email note","Email note (not sent)"],["Meeting","Meeting"],["Discussion","Discussion"],["Action planned","Action planned"],["Quotation follow-up","Quotation follow-up"]],"Discussion")+
 field("actionDate","Contact / action date",new Date().toISOString().slice(0,10),false,"date")+
 area("summary","Discussion or next-action summary","")+
 field("nextDate","Next follow-up date","",false,"date")+
 field("nextAction","What should happen next?","",false,"text",true),
 "Records an activity note within this page only; this does not contact a customer or create a notification.");
 open("Add Follow-up",o.id+" · customer discussion record",form,fd=>{
  const summary=v(fd,"summary");if(!summary){error("Enter a brief follow-up summary.");return;}
  const id="FU-"+String(Math.max(0,...db.followups.map(x=>Number(x.id.slice(3))||0))+1).padStart(3,"0");
  db.followups.push({id,opportunityId:o.id,date:dateText(v(fd,"actionDate"))||today(),type:v(fd,"kind")||"Discussion",summary,owner:employee(o.ownerId)?.name||"Unassigned",nextDate:dateText(v(fd,"nextDate"))});
  o.nextFollowUp=dateText(v(fd,"nextDate"));o.nextAction=v(fd,"nextAction")||o.nextAction;
  done(o,"Follow-up recorded",summary,"followups");
 },"Add follow-up (demo)");
}
function handoff(){
 const o=opp(state.selected);if(!o)return;
 const title="Quotation hand-off preview";
 const description='<b>'+esc(o.id)+'</b> · '+esc(o.title)+
 '<p><b>Our company:</b> '+esc(entity(o.companyId)?.name||"Not found")+' / '+esc(branch(o.branchId)?.name||"Not found")+'</p>'+
 '<p><b>Customer:</b> '+esc(customer(o.customerId)?.name||"Not found")+'</p>'+
 '<p><b>Buyer:</b> '+esc(buyer(o.buyerId)?.name||"Not found")+'</p>'+
 '<p><b>Site:</b> '+esc(site(o.siteId)?.name||"Not selected")+'</p>'+
 '<p><b>Requirement:</b> '+esc(o.summary)+'</p>'+
 '<p><b>Next module:</b> Create a quotation draft, add technical BOQ lines, price using authorized catalogs, review discounts/margins under policy, approve, issue and track customer response.</p>'+
 '<b>No quotation is created or changed by this button.</b><p><a class="btn primary" href="ma-006-quotations.html?opportunity='+encodeURIComponent(o.id)+'">Open MA-006 with this enquiry</a></p><p>Only the seeded customer/opportunity reference is transferred by this link; browser-session records are not shared across wireframe pages.</p>';
 help(title,description);
}
function handleAction(name){
 if(name==="edit")editEnquiry();
 else if(name==="stage")stageForm();
 else if(name==="followup")addFollowup();
 else if(name==="prepare")handoff();
 else if(name==="files")help("Document workflow planned","A future documents module will accept files, evidence status, version and access controls. No files are uploaded or downloaded in MA-005.");
}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-opp],[data-tab],[data-stage],[data-action],[data-quote],[data-planned]");
 if(!t)return;const d=t.dataset;
 if(d.opp){state.selected=d.opp;state.tab="overview";render();return;}
 if(d.tab){state.tab=d.tab;render();return;}
 if(d.stage){state.stage=state.stage===d.stage?"all":d.stage;render();return;}
 if(d.action){handleAction(d.action);return;}
 if(d.quote){help("Quotation module planned","<b>"+esc(d.quote)+"</b> is a sample quotation reference; MA-005 does not contain quotation pricing, approval or issue actions.");return;}
 if(d.planned){help(esc(d.planned)+" — planned","This CPQ module is not built yet. No record is opened or changed.");}
});
$("add-enquiry").addEventListener("click",createForm);
$("company-filter").addEventListener("change",e=>{state.company=e.target.value;state.branch="all";state.owner="all";render();});
$("branch-filter").addEventListener("change",e=>{state.branch=e.target.value;state.owner="all";render();});
$("search-filter").addEventListener("input",e=>{state.query=e.target.value;render();});
$("priority-filter").addEventListener("change",e=>{state.priority=e.target.value;render();});
$("owner-filter").addEventListener("change",e=>{state.owner=e.target.value;render();});
$("clear-stage").addEventListener("click",()=>{state.stage="all";render();});
$("reset-all").addEventListener("click",()=>{state.company="all";state.branch="all";state.stage="all";state.priority="all";state.owner="all";state.query="";render();});
$("modal-body").addEventListener("change",e=>{
 const id=e.target.id;
 if(id==="f-customerId")updateCustomerBuyers();
 if(id==="f-buyerId")updateBuyerLinks();
 if(id==="f-companyId")updateInternalBranches();
 if(id==="f-branchId")updateOwners();
});
function save(){
 if(!submit)return;
 const form=$("op-form");
 if(form&&!form.reportValidity())return;
 submit(form?new FormData(form):null);
}
$("modal-save").addEventListener("click",save);
$("modal-body").addEventListener("submit",e=>{if(e.target.id==="op-form"){e.preventDefault();save();}});
$("modal-close").addEventListener("click",close);
$("modal-cancel").addEventListener("click",close);
$("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))close();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("overlay").classList.contains("open"))close();});
const params=new URLSearchParams(window.location.search);
const ref=params.get("opportunity");if(ref&&opp(ref)){state.selected=ref;render();}
if(params.get("action")==="new")createForm();
})();