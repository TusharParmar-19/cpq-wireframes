/* MA-002 form interactions: in-memory demo; no persistence, uploads or backend. */
(()=>{
"use strict";
const app=window.CPQ_MA002,{records,$,esc,state,current,render}=app;
let before=null,saveAction=null,counter=3;
const schema={
new:[
["name","Company / trading name","text",true],["legalName","Registered legal name","text",true],
["type","Organization type","select",true,["Private Limited","LLP","Partnership","Proprietorship","Other"]],
["address","Registered address","textarea",true],["city","City","text",true],
["state","State","text",true],["pin","PIN code","text",false],
["prefix","Quotation number prefix","text",true],["email","Business email","email",false],["phone","Business phone","text",false]],
legal:[
["name","Company / trading name","text",true],["legalName","Registered legal name","text",true],
["type","Organization type","select",true,["Private Limited","LLP","Partnership","Proprietorship","Other"]],
["address","Registered address","textarea",true],["city","City","text",true],["state","State","text",true],
["pin","PIN code","text",false],["gstin","GSTIN (verified in production)","text",false],
["pan","PAN (verified in production)","text",false],["registration","CIN / license / registration","text",false],
["msme","MSME / Udyam reference","text",false],["phone","Business phone","text",false],
["email","Business email","email",false],["website","Website","text",false],
["status","Company status","select",true,["Active","Inactive"]]],
branding:[
["prefix","Quotation number prefix","text",true],["signatory","Authorized signatory name","text",false],
["logo","Logo (select file name only)","file",false],
["letterhead","Letterhead / header image (filename only)","file",false],
["signature","Signature / stamp image (filename only)","file",false]],
bank:[
["bankName","Bank name","text",false],["accountHolder","Account holder name","text",false],
["bankAccount","Masked bank reference (sample only)","text",false],["ifsc","IFSC (sample only)","text",false],
["terms","Default quotation terms & conditions","textarea",false]],
branch:[
["name","Branch name","text",true],["address","Branch address","textarea",true],
["city","City","text",true],["state","State","text",true],["pin","PIN code","text",false],
["phone","Branch phone","text",false],["email","Branch email","email",false],
["manager","Branch manager (optional)","text",false],
["status","Branch status","select",true,["Active","Inactive"]]]
};
const meta={
new:["Add Legal Entity","Enter the issuing company's identity. You can edit its other settings after creating it."],
legal:["Edit Legal & Contact Details","Changes to the company master must not rewrite already issued quotations."],
branding:["Edit Branding & Quotation Settings","File controls record filename only, and no file is uploaded or stored."],
bank:["Review Bank & Terms","Sensitive details require separate permission and verification in the production system. Use fictional values only."],
branch:["Add / Edit Branch","A branch belongs to the currently selected legal entity."]
};
const tags={
new:"No real GST, PAN or bank details. This is an in-memory example.",
legal:"Tax and legal values are not verified by this prototype.",
branding:"Company logo, letterhead and signature filenames are recorded only. No document will be generated.",
bank:"Do not enter real account numbers, routing details or private terms.",
branch:"Branch users will receive access separately through MA-003, not automatically here."
};
function formField(cfg,record){
 const [key,label,type,required,choices]=cfg;
 const val=String(record[key]??"");
 const attr='id="f-'+key+'" name="'+key+'"'+(required?' required':'');
 let field;
 if(type==="textarea")field='<textarea '+attr+' rows="3">'+esc(val)+'</textarea>';
 else if(type==="select")field='<select '+attr+'>'+choices.map(x=>'<option value="'+esc(x)+'"'+(val===x?' selected':'')+'>'+esc(x)+'</option>').join("")+'</select>';
 else if(type==="file")field='<input '+attr+' type="file" accept="image/png,image/jpeg,image/webp">'+(val?'<div class="hint">Current sample filename: '+esc(val)+'</div>':'')+'<div class="hint">No actual file contents are retained.</div>';
 else field='<input '+attr+' type="'+type+'" value="'+esc(val)+'"'+(key==="prefix"?' maxlength="12" pattern="[A-Za-z0-9_-]{2,12}" title="2–12 letters, numbers, hyphens or underscores"':'')+'>';
 return '<div class="org-form-item'+(type==="textarea"?' full':'')+'"><label for="f-'+key+'">'+esc(label)+(required?' *':'')+'</label>'+field+'</div>';
}
function close(){
 $("overlay").classList.remove("open");$("overlay").setAttribute("aria-hidden","true");
 $("modal-body").innerHTML="";saveAction=null;$("modal-done").textContent="Close";
 if(before?.isConnected)before.focus();
}
function dialog(title,subtitle,body,save){
 before=document.activeElement;saveAction=save||null;
 $("modal-title").textContent=title;$("modal-subtitle").textContent=subtitle;
 $("modal-body").innerHTML=body;$("modal-done").textContent=save?"Save demo information":"Close";
 $("overlay").classList.add("open");$("overlay").setAttribute("aria-hidden","false");$("modal-close").focus();
}
function message(title,body){
 dialog(title,"Prototype information",'<div class="org-dialog-intro">'+body+'</div>',null);
}
function toast(message){
 const x=$("toast");x.textContent=message;x.hidden=false;
}
function saveForm(kind,original,branchId){
 const form=document.getElementById("org-editor");
 const data=Object.fromEntries(new FormData(form).entries());
 for(const [key,label,type] of schema[kind])if(type==="file"){const f=form.elements.namedItem(key)?.files?.[0];data[key]=f?f.name:(original[key]||"Not configured");}
 for(const [key,label,type,required] of schema[kind]){
  if(required&&!String(data[key]||"").trim()){document.getElementById("org-error").textContent=label+" is required.";return;}
  if(type!=="file"&&typeof data[key]==="string")data[key]=data[key].trim();
 }
 const error=document.getElementById("org-error");
 if((kind==="new"||kind==="branding")&&records.some(x=>x.id!==original?.id&&x.prefix.toUpperCase()===data.prefix.toUpperCase())){
  error.textContent="Quotation number prefix already belongs to another legal entity.";return;
 }
 if(kind==="new"&&records.some(x=>x.legalName.toLowerCase()===data.legalName.toLowerCase())){
  error.textContent="A company with this legal name already exists.";return;
 }
 if(kind==="branch"){
  const entity=current();
  if(entity.branches.some(b=>b.id!==branchId&&b.name.toLowerCase()===data.name.toLowerCase())){
   error.textContent="This branch name already exists under the selected company.";return;
  }
  if(branchId){Object.assign(entity.branches.find(x=>x.id===branchId),data);}
  else entity.branches.push({...data,id:entity.id+"b"+(entity.branches.length+1)});
 }else if(kind==="new"){
  counter+=1;
  const id="e"+counter,defaults={id,name:"",legalName:"",type:"Other",address:"",city:"",state:"",pin:"",gstin:"",pan:"",registration:"",msme:"",phone:"",email:"",website:"",logo:"Not configured",letterhead:"Not configured",signature:"Not configured",signatory:"",bankName:"",accountHolder:"",bankAccount:"",ifsc:"",terms:"",prefix:"",status:"Active",branches:[]};
  records.push({...defaults,...data,id});state.selected=id;state.status="all";state.search="";$("entity-search").value="";$("entity-status").value="all";state.tab="overview";
 }else{
  Object.assign(current(),data);
 }
 close();render();toast("Demo changes shown on this page only. They will disappear on refresh.");
}
function edit(kind,branchId=null){
 const source=kind==="new"?{}:kind==="branch"?(current().branches.find(b=>b.id===branchId)||{status:"Active"}):current();
 const [title,subtitle]=meta[kind];
 if(kind==="branch"&&current().status!=="Active"&&!branchId){message("Branch creation unavailable","This sample company is inactive. Reactivate it before adding a branch.");return;}
 const body='<div class="org-dialog-intro">'+tags[kind]+'</div><form id="org-editor"><div class="org-form">'+schema[kind].map(f=>formField(f,source)).join("")+'<div id="org-error" class="org-form-error" role="alert"></div></div></form>';
 dialog(kind==="branch"&&branchId?"Edit Branch":title,subtitle,body,()=>{const f=$("org-editor");if(f.reportValidity())saveForm(kind,source,branchId);});
 $("org-editor").addEventListener("submit",event=>{event.preventDefault();if(event.target.reportValidity())saveForm(kind,source,branchId)});
}
$("account-details").addEventListener("click",()=>{
 const t=window.CPQ_MA002_TENANT;
 const pairs=[["Business account",t.name],["Status",t.status],["Primary contact",t.primaryContact],
 ["Contact email",t.email],["Contact phone",t.phone],["Address",t.address],
 ["Created date",t.created],["Last updated",t.updated]];
 const rows=pairs.map(([label,val])=>'<div class="item"><b>'+esc(label)+'</b><small>'+esc(val)+'</small></div>').join("");
 message("Business Account Details",rows+
 '<div class="org-callout"><strong>Read-only demonstration.</strong> Business-account identity, tenant status and tenant isolation are managed separately from legal entities. This screen cannot change tenant status, permissions or records.</div>');
});
$("new-entity").addEventListener("click",()=>edit("new"));
$("entity-search").addEventListener("input",e=>{state.search=e.target.value;render()});
$("entity-status").addEventListener("change",e=>{state.status=e.target.value;render()});
document.addEventListener("click",e=>{
 const node=e.target.closest("[data-entity],[data-tab],[data-go],[data-edit],[data-edit-branch],[data-planned]");
 if(!node)return;
 if(node.dataset.entity){state.selected=node.dataset.entity;state.tab="overview";render();return;}
 if(node.dataset.tab){state.tab=node.dataset.tab;render();return;}
 if(node.dataset.go){state.tab=node.dataset.go;render();return;}
 if(node.dataset.edit){edit(node.dataset.edit);return;}
 if(node.dataset.editBranch){edit("branch",node.dataset.editBranch);return;}
 if(node.dataset.planned){message(node.dataset.name,"This module will have a separate reviewed screen. No function is executed here.");}
});
$("modal-close").addEventListener("click",close);
$("modal-done").addEventListener("click",()=>saveAction?saveAction():close());
$("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("overlay").classList.contains("open"))close()});
if(new URLSearchParams(window.location.search).get("action")==="new")edit("new");
})();