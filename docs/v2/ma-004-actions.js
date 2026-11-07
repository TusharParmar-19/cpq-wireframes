/* MA-004: in-memory demo forms, validations and interactions. Never sends data. */
(()=>{
"use strict";
const a=window.CPQ_MA004;
const {$,esc,db,own,state,cust,companies,contacts,sites,projects,related,buyer,ent,branch,next,render,audit}=a;
let saveHandler=null,previousFocus=null,toastId=null;
const options=(items,value)=>items.map(([v,t])=>'<option value="'+esc(v)+'"'+(String(v)===String(value)?' selected':'')+'>'+esc(t)+'</option>').join("");
const field=(name,title,value="",required=false,type="text",full=false)=>'<div class="ma4-form-item'+(full?' full':'')+'"><label for="f-'+name+'">'+esc(title)+(required?' *':'')+'</label><input id="f-'+name+'" type="'+esc(type)+'" name="'+esc(name)+'" value="'+esc(value)+'"'+(required?' required':'')+'></div>';
const select=(name,title,items,value="",full=false)=>'<div class="ma4-form-item'+(full?' full':'')+'"><label for="f-'+name+'">'+esc(title)+'</label><select id="f-'+name+'" name="'+esc(name)+'">'+options(items,value)+'</select></div>';
const area=(name,title,value="")=>'<div class="ma4-form-item full"><label for="f-'+name+'">'+esc(title)+'</label><textarea id="f-'+name+'" name="'+esc(name)+'" rows="3">'+esc(value)+'</textarea></div>';
const wrap=(contents,help="")=>(help?'<div class="ma4-dialog-warning">'+help+'</div>':"")+'<form id="ma4-form" class="ma4-form">'+contents+'<div id="ma4-form-error" class="ma4-form-error" role="alert"></div></form>';
const v=(fd,key)=>String(fd.get(key)||"").trim();
function show(title,subtitle,content,onSave=null,label="Save demo"){
 previousFocus=document.activeElement;saveHandler=onSave;
 $("modal-title").textContent=title;$("modal-subtitle").textContent=subtitle;
 $("modal-body").innerHTML=content;$("modal-body").scrollTop=0;
 $("modal-save").hidden=!onSave;$("modal-save").disabled=false;$("modal-save").textContent=label;
 $("modal-cancel").textContent=onSave?"Cancel":"Close";
 $("overlay").classList.add("open");$("overlay").setAttribute("aria-hidden","false");$("modal-close").focus();
}
function close(){
 saveHandler=null;$("overlay").classList.remove("open");$("overlay").setAttribute("aria-hidden","true");$("modal-body").innerHTML="";
 if(previousFocus?.isConnected)previousFocus.focus();
}
function message(title,detail){show(title,"Prototype information",'<div class="ma4-dialog-warning">'+detail+'</div>');}
function invalid(text){const e=$("ma4-form-error");if(e){e.textContent=text;e.scrollIntoView({block:"nearest"});}}
function toast(text){const n=$("toast");n.hidden=false;n.textContent=text;if(toastId)clearTimeout(toastId);toastId=setTimeout(()=>n.hidden=true,4000);}
function saved(c,text,tab=""){
 audit(c,text);if(tab)state.tab=tab;close();render();toast(text+" · demo only");
}
const companyOptions=()=>own.map(x=>[x.id,x.name]);
const branchOptions=companyId=>(ent(companyId)?.branches||[]).map(x=>[x.id,x.name+" · "+x.city]);
function ownFields(companyId="e1",branchId="e1a"){
 return '<div class="ma4-form-item"><label for="ma4-own-company">Our internal company *</label><select id="ma4-own-company" name="ourCompany" required>'+options(companyOptions(),companyId)+'</select></div>'+
 '<div class="ma4-form-item"><label for="ma4-own-branch">Our internal branch *</label><select id="ma4-own-branch" name="ourBranch" required>'+options(branchOptions(companyId),branchId)+'</select></div>';
}
function updateOwnBranches(){
 const company=$("ma4-own-company"),br=$("ma4-own-branch");if(!company||!br)return;
 const opts=branchOptions(company.value),choice=opts.some(x=>x[0]===br.value)?br.value:opts[0]?.[0]||"";
 br.innerHTML=options(opts,choice);
}
function allowedLink(companyId,branchId){return !!ent(companyId)?.branches.some(x=>x.id===branchId);}
const statusOptions=[["Prospect","Prospect"],["Active","Active"],["On Hold","On Hold"]];
const typeOptions=[["Company","Company"],["Individual","Individual person"],["Group","Group / corporate group"]];
const customerTypeHelp={
 Company:"One company buying products or services. If its registered buyer name matches the account name, leave the optional buyer-name field blank.",
 Individual:"One person buying directly. Their buyer identity uses their name automatically; no separate company or tax ID is required to create this account.",
 Group:"A parent customer relationship with multiple buyer companies. Start with the first buyer company, then add more in the Customer Companies tab."
};
function updateCreateType(){
 const pick=$("f-type"),buyerWrap=$("ma4-first-buyer-wrap"),personalFields=$("ma4-personal-fields"),nameLabel=$("ma4-customer-name-label"),buyerLabel=$("ma4-first-buyer-label"),buyerInput=$("f-buyerName"),industryLabel=$("ma4-industry-label"),help=$("ma4-account-type-help");
 if(!pick||!buyerWrap||!buyerInput)return;
 const type=pick.value;
 buyerWrap.hidden=type==="Individual";
 if(personalFields)personalFields.hidden=type!=="Individual";
 buyerInput.required=type==="Group";
 if(nameLabel)nameLabel.textContent=type==="Individual"?"Customer full name *":type==="Group"?"Group / account name *":"Customer / company name *";
 if(buyerLabel)buyerLabel.textContent=type==="Group"?"First buyer company legal name *":"Buyer legal name (only if different)";
 if(industryLabel)industryLabel.textContent=type==="Individual"?"Purchase interest (optional)":"Industry / segment (optional)";
 if(help)help.textContent=customerTypeHelp[type]||"";
}

function createCustomer(){
 const nameField=field("name","Customer / company name","",true,"text",true).replace('for="f-name"','id="ma4-customer-name-label" for="f-name"');
 const industryField=field("industry","Industry / segment (optional)").replace('for="f-industry"','id="ma4-industry-label" for="f-industry"');
 const buyerField=field("buyerName","Buyer legal name (only if different)","",false,"text",true)
  .replace('class="ma4-form-item full"','class="ma4-form-item full" id="ma4-first-buyer-wrap"')
  .replace('for="f-buyerName"','id="ma4-first-buyer-label" for="f-buyerName"');
 const personalFields='<div class="ma4-personal-fields" id="ma4-personal-fields" hidden>'+field("personalEmail","Individual email (example.com only)","",false,"email")+field("personalPhone","Individual phone (fictional)")+'</div>';
 const f=wrap(select("type","1. Customer type",typeOptions,"Company",true)+
  '<div class="ma4-form-item full ma4-type-explanation" id="ma4-account-type-help" role="status">'+esc(customerTypeHelp.Company)+'</div>'+
  nameField+buyerField+personalFields+select("status","Relationship status",statusOptions,"Prospect")+
  industryField+field("owner","Relationship owner")+ownFields()+area("notes","Relationship notes"),
  "Individual, Company and Group customers are supported. Only fictional names and details belong in this public wireframe.");
 show("Add Customer","Choose customer type first, then enter only the relevant details",f,fd=>{
  const type=v(fd,"type"),name=v(fd,"name"),enteredBuyer=v(fd,"buyerName"),ourCompany=v(fd,"ourCompany"),ourBranch=v(fd,"ourBranch");
  if(!["Individual","Company","Group"].includes(type)){invalid("Select a valid customer type.");return;}
  if(!name){invalid("Enter the customer or group name.");return;}
  if(type==="Group"&&!enteredBuyer){invalid("Enter the first buyer company legal name for the group.");return;}
  const buyerName=type==="Individual"?name:(enteredBuyer||name),personalEmail=v(fd,"personalEmail"),personalPhone=v(fd,"personalPhone");
  if(type==="Individual"&&personalEmail&&!personalEmail.toLowerCase().endsWith("@example.com")){invalid("Use a fictional @example.com email for an individual in this public demo.");return;}
  if(db.customers.some(x=>x.name.toLowerCase()===name.toLowerCase())||db.companies.some(x=>x.name.toLowerCase()===buyerName.toLowerCase())){
   invalid("A matching customer or buyer identity already exists. Review the directory before creating a duplicate.");return;
  }
  if(!allowedLink(ourCompany,ourBranch)){invalid("Choose a valid internal legal entity and branch.");return;}
  const id=next("CU-",db.customers),buyerId=next("CC-",db.companies);
  const c={id,name,type,status:v(fd,"status"),industry:v(fd,"industry"),owner:v(fd,"owner"),notes:v(fd,"notes"),links:[{companyId:ourCompany,branchId:ourBranch}],created:"07 Nov 2026 (demo)",updated:"07 Nov 2026 (demo)"};
  db.customers.push(c);
  db.companies.push({id:buyerId,customerId:id,name:buyerName,kind:type==="Individual"?"Individual":"Head office",primary:true,taxStatus:type==="Individual"?"Not applicable":"Not supplied",email:type==="Individual"?personalEmail:"",phone:type==="Individual"?personalPhone:"",city:"",state:"",address:"",billingTerms:"Not configured"});
  state.company="all";state.branch="all";state.status="all";state.type="all";state.q="";
  $("customer-search").value="";$("status-filter").value="all";$("type-filter").value="all";state.selected=id;
  saved(c,type==="Individual"?"Individual customer created":type==="Group"?"Customer group created":"Company customer created","overview");
 },"Create customer (demo)");
 updateCreateType();
}

function editCustomer(){
 const c=cust(state.selected);if(!c||c.status==="Archived")return;
 const currentBuyer=companies(c.id).find(x=>x.kind==="Individual");
 const immutableType='<div class="ma4-form-item"><label>Customer type</label><div class="ma4-readonly-value">'+esc(c.type)+'</div><p class="ma4-form-help">Fixed after creation to protect linked buyer, contact and quotation relationships.</p></div>';
 const f=wrap(field("name",c.type==="Individual"?"Customer full name":"Customer relationship name",c.name,true)+immutableType+
  select("status","Relationship status",statusOptions,c.status)+
  field("industry",c.type==="Individual"?"Purchase interest (optional)":"Industry / segment (optional)",c.industry)+
  field("owner","Relationship owner",c.owner)+area("notes","Internal notes",c.notes));
 show("Edit Customer",c.id+" · customer type cannot be changed here",f,fd=>{
  const name=v(fd,"name");if(!name){invalid("Enter a customer name.");return;}
  if(db.customers.some(x=>x.id!==c.id&&x.name.toLowerCase()===name.toLowerCase())){invalid("A customer with this name already exists.");return;}
  if(currentBuyer&&db.companies.some(x=>x.id!==currentBuyer.id&&x.name.toLowerCase()===name.toLowerCase())){invalid("Another buyer identity already uses this name.");return;}
  Object.assign(c,{name,status:v(fd,"status"),industry:v(fd,"industry"),owner:v(fd,"owner"),notes:v(fd,"notes")});
  if(currentBuyer)currentBuyer.name=name;
  saved(c,"Customer details updated");
 },"Save customer (demo)");
}

function linkScope(){
 const c=cust(state.selected);if(!c||c.status==="Archived")return;
 const f=wrap(ownFields(),"Link the customer to another INTERNAL company and branch. This does not grant permissions to employees, and cross-company record access must be checked by the backend.");
 show("Link Internal Company & Branch",c.name+" · relationship scope",f,fd=>{
  const co=v(fd,"ourCompany"),br=v(fd,"ourBranch");
  if(!allowedLink(co,br)){invalid("The selected branch must belong to that internal company.");return;}
  if(c.links.some(x=>x.companyId===co&&x.branchId===br)){invalid("This internal company/branch relationship already exists.");return;}
  c.links.push({companyId:co,branchId:br});saved(c,"Internal scope linked","overview");
 },"Link scope (demo)");
}
const taxOptions=[["Not supplied","Not supplied"],["Pending","Pending verification"],["Verified sample","Verified (sample only)"]];
function companyForm(id=null){
 const c=cust(state.selected);if(!c||c.status==="Archived")return;
 const personal=c.type==="Individual";
 const old=db.companies.find(x=>x.id===id&&x.customerId===c.id);
 if(!old&&c.type!=="Group"){message("Single-buyer account",c.type==="Individual"?"An Individual customer has one personal buyer identity. Use <b>Edit buyer details</b> instead.":"A Company customer has one buyer legal entity. Add its branches, sites and projects separately. Use a Group customer when multiple distinct buyer companies are required.");return;}
 const x=old||{name:"",kind:c.type==="Group"?"Group company":"Head office",taxStatus:"Not supplied",city:"",state:"",address:"",billingTerms:""};
 const f=wrap(field("name",personal?"Individual buyer full name":"Buyer legal / trading name",x.name,true,"text",true)+
  (personal?field("email","Individual email (example.com only)",x.email||"",false,"email")+field("phone","Individual phone (fictional)",x.phone||""):select("kind","Customer entity type",[["Head office","Head office"],["Group company","Group company"],["Subsidiary","Subsidiary"],["Division","Division"]],x.kind)+select("taxStatus","Tax ID verification state",taxOptions,x.taxStatus))+
  field("city","Billing city",x.city)+field("state","Billing state",x.state)+
  area("address","Billing address (fictional)",x.address)+area("billingTerms","Sample billing terms",x.billingTerms),
  personal?"One individual buyer profile. Business registration and tax-identity fields do not apply in this demo. Only fictional billing information is allowed.":"Buyer/legal entities are different from the INTERNAL companies in MA-002. Never enter real tax identifiers in this public wireframe.");
 show(personal?"Edit Individual Buyer":old?"Edit Customer Company":"Add Customer Company",c.name+" · buyer / billing identity",f,fd=>{
  const name=v(fd,"name");
  if(!name){invalid("Enter a buyer name.");return;}
  if(db.companies.some(y=>y.id!==old?.id&&y.name.toLowerCase()===name.toLowerCase())){invalid("A buyer identity with this name already exists.");return;}
  if(personal&&db.customers.some(y=>y.id!==c.id&&y.name.toLowerCase()===name.toLowerCase())){invalid("Another customer account already uses this name.");return;}
  if(personal&&v(fd,"email")&&!v(fd,"email").toLowerCase().endsWith("@example.com")){invalid("Use a fictional @example.com email in this public demo.");return;}
  const patch={name,kind:personal?"Individual":v(fd,"kind"),taxStatus:personal?"Not applicable":v(fd,"taxStatus"),email:personal?v(fd,"email"):x.email||"",phone:personal?v(fd,"phone"):x.phone||"",city:v(fd,"city"),state:v(fd,"state"),address:v(fd,"address"),billingTerms:v(fd,"billingTerms")};
  if(old)Object.assign(old,patch);
  else db.companies.push({id:next("CC-",db.companies),customerId:c.id,...patch,primary:companies(c.id).length===0});
  if(personal)c.name=name;
  saved(c,personal?"Individual billing profile updated":old?"Buyer company updated":"Buyer company added","companies");
 },"Save buyer details (demo)");
}

function primaryCompany(id){
 const c=cust(state.selected),x=db.companies.find(y=>y.id===id&&y.customerId===c?.id);
 if(!c||!x||c.status==="Archived"||c.type!=="Group")return;
 companies(c.id).forEach(y=>y.primary=y.id===id);
 audit(c,"Primary buyer changed");render();toast("Primary buyer changed · demo only");
}
function contactForm(id=null){
 const c=cust(state.selected);if(!c||c.status==="Archived")return;
 const personal=c.type==="Individual";
 const old=db.contacts.find(x=>x.id===id&&x.customerId===c.id);
 const x=old||{name:"",companyId:companies(c.id)[0]?.id||"",role:"",email:"",phone:"",status:"Active",primary:contacts(c.id).length===0};
 const buyerField=personal?'<div class="ma4-form-item full"><label>Linked individual buyer</label><div class="ma4-readonly-value">'+esc(companies(c.id)[0]?.name||c.name)+'</div><input type="hidden" name="companyId" value="'+esc(x.companyId)+'"></div>':
  select("companyId","Customer legal entity",companies(c.id).map(y=>[y.id,y.name]),x.companyId,true);
 const f=wrap(field("name",personal?"Additional / authorized contact (fictional)":"Contact person (fictional)",x.name,true)+
  buyerField+field("role","Designation / responsibility",x.role)+field("email","Email (example.com only)",x.email,false,"email")+
  field("phone","Phone (fictional)",x.phone)+select("primary","Primary contact for this account",[["false","No"],["true","Yes"]],String(x.primary))+
  select("status","Contact status",[["Active","Active"],["Inactive","Inactive"]],x.status),
  personal?"The individual buyer is already recorded as the purchaser. Add a separate authorized representative only when needed. Use fictional contact details.":"Use only fictional contact details; real personal data and communications consent need production controls.");
 show(old?"Edit Contact":personal?"Add Authorized Contact":"Add Contact",c.name+" · contact directory",f,fd=>{
  const name=v(fd,"name"),co=v(fd,"companyId"),email=v(fd,"email");
  if(!name||!companies(c.id).some(y=>y.id===co)){invalid("Enter a contact name and a valid buyer identity.");return;}
  if(email&&!email.toLowerCase().endsWith("@example.com")){invalid("Use fictional @example.com email addresses in this public demo.");return;}
  if(email&&db.contacts.some(y=>y.id!==old?.id&&y.customerId===c.id&&y.email.toLowerCase()===email.toLowerCase())){invalid("This contact email is already linked to the customer.");return;}
  const primary=v(fd,"primary")==="true"||contacts(c.id).length===0;
  if(primary)contacts(c.id).forEach(y=>y.primary=false);
  const patch={name,companyId:co,role:v(fd,"role"),email,phone:v(fd,"phone"),status:v(fd,"status"),primary};
  if(old)Object.assign(old,patch);
  else db.contacts.push({id:next("CT-",db.contacts),customerId:c.id,...patch});
  saved(c,old?"Contact updated":"Contact added","contacts");
 },"Save contact (demo)");
}

function siteForm(id=null){
 const c=cust(state.selected);if(!c||c.status==="Archived")return;
 const old=db.sites.find(x=>x.id===id&&x.customerId===c.id);
 const x=old||{name:"",companyId:companies(c.id)[0]?.id||"",type:"Project / delivery site",status:"Active",city:"",state:"",address:""};
 const f=wrap(field("name","Site / delivery address label",x.name,true)+select("companyId",c.type==="Individual"?"Individual buyer":"Buyer legal entity",companies(c.id).map(y=>[y.id,y.name]),x.companyId,true)+
 select("type","Location type",[["Customer branch / office","Customer branch / office"],["Project / delivery site","Project / delivery site"],["Delivery address","Delivery address"],["Service site","Service site"],["Billing address","Billing address"]],x.type)+
 select("status","Site status",[["Active","Active"],["Inactive","Inactive"]],x.status)+
 field("city","City",x.city)+field("state","State",x.state)+area("address","Site address (fictional)",x.address));
 show(old?"Edit Site":"Add Site",c.name+" · sites and delivery locations",f,fd=>{
  const name=v(fd,"name"),co=v(fd,"companyId");
  if(!name||!companies(c.id).some(y=>y.id===co)){invalid("Enter a site name and select a buyer company.");return;}
  if(old&&co!==old.companyId&&projects(c.id).some(p=>p.siteId===old.id)){invalid("This site is used by a project. Do not move it to another buyer company.");return;}
  if(sites(c.id).some(y=>y.id!==old?.id&&y.companyId===co&&y.name.toLowerCase()===name.toLowerCase())){invalid("A site with that name already exists for this buyer.");return;}
  const patch={name,companyId:co,type:v(fd,"type"),status:v(fd,"status"),city:v(fd,"city"),state:v(fd,"state"),address:v(fd,"address")};
  if(old)Object.assign(old,patch);
  else db.sites.push({id:next("ST-",db.sites),customerId:c.id,...patch});
  saved(c,old?"Customer site updated":"Customer site added","sites");
 },"Save site (demo)");
}
const stages=[["New","New"],["Planning","Planning"],["In discussion","In discussion"],["Quotation","Quotation"],["In progress","In progress"],["Completed","Completed"],["Cancelled","Cancelled"]];
function siteOptions(c,co,selected){
 const choices=sites(c.id).filter(y=>y.companyId===co).map(y=>[y.id,y.name]);
 return '<option value="">No specific site</option>'+options(choices,selected||"");
}
function projectForm(id=null){
 const c=cust(state.selected);if(!c||c.status==="Archived")return;
 const old=db.projects.find(x=>x.id===id&&x.customerId===c.id);
 const x=old||{name:"",companyId:companies(c.id)[0]?.id||"",siteId:"",stage:"New",owner:c.owner};
 const f=wrap(field("name","Project title",x.name,true)+
 '<div class="ma4-form-item"><label for="ma4-project-company">Buyer identity</label><select id="ma4-project-company" name="companyId">'+options(companies(c.id).map(y=>[y.id,y.name]),x.companyId)+'</select></div>'+
 '<div class="ma4-form-item"><label for="ma4-project-site">Project site</label><select id="ma4-project-site" name="siteId">'+siteOptions(c,x.companyId,x.siteId)+'</select></div>'+
 select("stage","Project stage",stages,x.stage)+field("owner","Project owner",x.owner),
 "Project location is optional. When provided, the selected site must belong to the same buyer legal entity.");
 show(old?"Edit Project":"Add Project",c.name+" · customer projects",f,fd=>{
  const name=v(fd,"name"),co=v(fd,"companyId"),siteId=v(fd,"siteId");
  if(!name||!companies(c.id).some(y=>y.id===co)){invalid("Enter the project name and a valid buyer entity.");return;}
  if(siteId&&!sites(c.id).some(y=>y.id===siteId&&y.companyId===co)){invalid("Selected project site belongs to another buyer legal entity.");return;}
  if(projects(c.id).some(y=>y.id!==old?.id&&y.companyId===co&&y.name.toLowerCase()===name.toLowerCase())){invalid("A project with that name already exists for this buyer.");return;}
  const patch={name,companyId:co,siteId,stage:v(fd,"stage"),owner:v(fd,"owner")};
  if(old)Object.assign(old,patch);
  else db.projects.push({id:next("PR-",db.projects),customerId:c.id,...patch});
  saved(c,old?"Project updated":"Project added","sites");
 },"Save project (demo)");
}
function archiveCustomer(){
 const c=cust(state.selected);if(!c)return;
 if(c.status==="Archived"){
  show("Restore Customer",c.name+" · restore historical customer",'<div class="ma4-dialog-warning">Restoration is a demo. Production must verify permission and preserve an audit trail.</div>',()=>{
   c.status=c.beforeArchive||"Active";delete c.beforeArchive;saved(c,"Customer restored","overview");
  },"Restore (demo)");return;
 }
 const blocking=related(c.id).filter(r=>(r.type==="Opportunity"&&!["Lost","Closed","Cancelled"].includes(r.status))||(r.type==="Quotation"&&["Draft","Sent","Awaiting Approval"].includes(r.status)));
 if(blocking.length){
  message("Archive blocked",'<b>'+esc(c.name)+'</b> has '+blocking.length+' active opportunity or quotation record(s): '+esc(blocking.map(x=>x.id).join(", "))+'. Resolve those records before archiving. No data was changed.');return;
 }
 show("Archive Customer",c.name+" · non-destructive archive",'<div class="ma4-dialog-warning">Archive keeps buyer, contact, site, project and commercial history. It does not delete records. A real operation requires permission and audit.</div>',()=>{
  c.beforeArchive=c.status;c.status="Archived";saved(c,"Customer archived","overview");
 },"Archive (demo)");
}
const handlers={"edit-customer":editCustomer,"link-scope":linkScope,"add-company":()=>companyForm(),"add-contact":()=>contactForm(),"add-site":()=>siteForm(),"add-project":()=>projectForm(),"archive-customer":archiveCustomer};
document.addEventListener("click",event=>{
 const t=event.target.closest("[data-customer],[data-tab],[data-action],[data-edit-company],[data-primary-company],[data-edit-contact],[data-edit-site],[data-edit-project],[data-record],[data-planned]");
 if(!t)return;
 const d=t.dataset;
 if(d.customer){state.selected=d.customer;state.tab="overview";render();return;}
 if(d.tab){state.tab=d.tab;render();return;}
 if(d.action){handlers[d.action]?.();return;}
 if(d.editCompany){companyForm(d.editCompany);return;}
 if(d.primaryCompany){primaryCompany(d.primaryCompany);return;}
 if(d.editContact){contactForm(d.editContact);return;}
 if(d.editSite){siteForm(d.editSite);return;}
 if(d.editProject){projectForm(d.editProject);return;}
 if(d.record){message("Commercial page planned",'<b>'+esc(d.record)+'</b> is a fictional reference; its actual Opportunity, Quotation or Order screen has not been developed yet.');return;}
 if(d.planned){message(esc(d.planned)+" — planned","This module is outside the current MA-004 wireframe. No live record is changed.");}
});
$("new-customer").addEventListener("click",createCustomer);
$("internal-company").addEventListener("change",e=>{state.company=e.target.value;state.branch="all";render();});
$("internal-branch").addEventListener("change",e=>{state.branch=e.target.value;render();});
$("customer-search").addEventListener("input",e=>{state.q=e.target.value;render();});
$("status-filter").addEventListener("change",e=>{state.status=e.target.value;render();});
$("type-filter").addEventListener("change",e=>{state.type=e.target.value;render();});
$("clear-filters").addEventListener("click",()=>{state.company="all";state.branch="all";state.q="";state.status="all";state.type="all";$("customer-search").value="";$("status-filter").value="all";$("type-filter").value="all";render();});
$("modal-close").addEventListener("click",close);
$("modal-cancel").addEventListener("click",close);
function saveForm(){
 if(!saveHandler)return;
 const form=$("ma4-form");
 if(form&&!form.reportValidity())return;
 saveHandler(form?new FormData(form):null);
}
$("modal-save").addEventListener("click",saveForm);
$("modal-body").addEventListener("submit",e=>{if(e.target.id==="ma4-form"){e.preventDefault();saveForm();}});
$("modal-body").addEventListener("change",e=>{
 if(e.target.id==="ma4-own-company")updateOwnBranches();
 if(e.target.id==="f-type")updateCreateType();
 if(e.target.id==="ma4-project-company"){
  const c=cust(state.selected),co=e.target.value,site=$("ma4-project-site");
  if(site)site.innerHTML=siteOptions(c,co,"");
 }
});
$("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))close();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("overlay").classList.contains("open"))close();});
if(new URLSearchParams(window.location.search).get("action")==="new")createCustomer();
})();