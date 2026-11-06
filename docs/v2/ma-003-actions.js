/* MA-003: interactive, in-memory role and employee demonstration; no network calls or stored credentials. */
(()=>{
"use strict";
const a=window.CPQ_MA003,{users,roles,perms,entities,state,$,esc,userBy,roleBy,render}=a;
let saveHandler=null,restoreFocus=null,userCounter=users.length,roleCounter=0;
const branchItems=entities.flatMap(e=>e.branches.map(b=>({id:b.id,companyId:e.id,companyName:e.name,name:b.name})));
function open(title,subtitle,body,handler=null,label="Save demo"){
 restoreFocus=document.activeElement;
 saveHandler=handler;
 $("modal-title").textContent=title;
 $("modal-subtitle").textContent=subtitle;
 $("modal-body").innerHTML=body;
 $("modal-cancel").textContent=handler?"Cancel":"Close";
 $("modal-save").hidden=!handler;
 $("modal-save").textContent=label;
 $("overlay").classList.add("open");
 $("overlay").setAttribute("aria-hidden","false");
 $("modal-close").focus();
}
function close(){
 saveHandler=null;$("overlay").classList.remove("open");
 $("overlay").setAttribute("aria-hidden","true");
 $("modal-body").innerHTML="";
 if(restoreFocus?.isConnected)restoreFocus.focus();
}
function msg(title,content){
 open(title,"Prototype information",'<div class="ma3-dialog-warning">'+content+'</div>',null);
}
function toast(s){const t=$("toast");t.hidden=false;t.textContent=s;}
function audit(title,detail){
 const when=new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true});
 state.history.unshift({title,detail:"Master Admin (demo) · "+when+" · "+detail});
 state.history=state.history.slice(0,7);
}
function formError(message){const e=$("ma3-form-error");if(e)e.textContent=message;}
function field(name,label,type,value="",required=false,extra=""){
 const id="ma3-form-"+name,req=required?" required":"";
 const input=type==="textarea"?
 '<textarea name="'+name+'" id="'+id+'"'+req+' rows="3">'+esc(value)+'</textarea>':
 '<input type="'+type+'" id="'+id+'" name="'+name+'" value="'+esc(value)+'"'+req+' '+extra+'>';
 return '<div class="ma3-form-item"><label for="'+id+'">'+esc(label)+(required?' *':'')+'</label>'+input+'</div>';
}
function checkbox(name,id,label,checked=false,meta=""){
 return '<label class="ma3-checklabel"><input type="checkbox" name="'+esc(name)+'" value="'+esc(id)+'"'+(checked?' checked':'')+'><span>'+esc(label)+(meta?'<br><span class="ma3-branch-meta">'+esc(meta)+'</span>':'')+'</span></label>';
}
function employeeForm(u=null){
 const creating=!u,person=u||{name:"",email:"",mobile:"",designation:"",department:"",roles:[],branches:[],status:"Invited"};
 const roleHtml=roles.map(r=>checkbox("role",r.id,r.name,person.roles.includes(r.id))).join("");
 const locHtml=entities.map(e=>'<div class="ma3-form-item full"><label>'+esc(e.name)+'</label><div class="ma3-checkbox-grid">'+e.branches.map(b=>checkbox("branch",b.id,b.name,person.branches.includes("*")||person.branches.includes(b.id),b.city)).join("")+'</div></div>').join("");
 const all=person.branches.includes("*");
 const notice='<div class="ma3-dialog-warning">This is a browser-only example. Real employees will activate their account through a secure invitation/password-setup process. No email is sent and no password is collected here.</div>';
 const html=notice+'<form id="ma3-editor"><div class="ma3-form">'+
 field("name","Employee full name","text",person.name,true)+
 field("email","Work email","email",person.email,true)+
 field("mobile","Mobile number","tel",person.mobile)+
 field("designation","Designation","text",person.designation)+
 field("department","Department","text",person.department)+
 '<div class="ma3-form-item"><label>Business account</label><input type="text" value="Example Business Group (fixed)" readonly><small>Tenant cannot be expanded using roles or branch filters.</small></div>'+
 '<div class="ma3-form-item full"><label>Roles (select one or more) *</label><div class="ma3-checkbox-grid">'+roleHtml+'</div><small>Multiple roles combine their action grants. Confidential grants remain separate and all actions stay scoped to assigned branches.</small></div>'+
 '<div class="ma3-form-item full"><label>Legal entity &amp; branch assignments *</label><div class="ma3-checkbox-grid">'+checkbox("allScope","*", "All branches inside this business account (explicit broad grant)",all,"For Master Admin / Owner example only")+'</div></div>'+
 locHtml+
 (creating?'<div class="ma3-form-item full"><label>Initial account status</label><input type="text" value="Invited — secure account setup required" readonly></div>':
 '<div class="ma3-form-item full"><label>Current status</label><input type="text" value="'+esc(person.status)+' (use the dedicated status action to change)" readonly></div>')+
 '<div class="ma3-form-error" id="ma3-form-error" role="alert"></div>'+
 '</div></form>';
 open(creating?"Add Employee (demo)":"Edit Employee & Access",creating?"Create a fictional employee invitation":"Update example identity, roles and branch scope",html,()=>{
  const form=$("ma3-editor");if(!form.reportValidity())return;
  const formData=new FormData(form);
  const rolesSelected=formData.getAll("role");
  const branchesSelected=formData.getAll("branch");
  const allScopes=formData.getAll("allScope").includes("*");
  const name=String(formData.get("name")||"").trim();
  const email=String(formData.get("email")||"").trim().toLowerCase();
  if(!rolesSelected.length){formError("Assign at least one role.");return;}
  if(!allScopes&&!branchesSelected.length){formError("Assign at least one operating branch.");return;}
  if(allScopes&&!rolesSelected.some(id=>id==="master"||id==="owner")){formError("This demo-wide scope is reserved for the Master Admin or Owner example role.");return;}
  if(users.some(x=>x.id!==u?.id&&x.email.toLowerCase()===email)){formError("A fictional employee with this email already exists.");return;}
  if(u&&u.status==="Active"&&u.roles.includes("master")&&!rolesSelected.includes("master")&&users.filter(x=>x.id!==u.id&&x.status==="Active"&&x.roles.includes("master")).length===0){
   formError("Cannot remove the final active Master Admin from this business account.");return;
  }
  const change={name,email,mobile:String(formData.get("mobile")||"").trim(),designation:String(formData.get("designation")||"").trim(),department:String(formData.get("department")||"").trim(),roles:rolesSelected,branches:allScopes?["*"]:branchesSelected,updated:"06 Nov 2026 (demo)"};
  if(u){Object.assign(u,change);audit("Employee access updated",u.name+" · "+u.id);}
  else{
   userCounter+=1;
   const created={...change,id:"U"+String(userCounter).padStart(3,"0"),created:"06 Nov 2026 (demo)",status:"Invited"};
   users.push(created);state.selectedUser=created.id;state.filters={q:"",role:"all",company:"all",status:"all"};
   $("user-search").value="";$("user-role-filter").value="all";$("user-company-filter").value="all";$("user-status-filter").value="all";
   audit("Employee invitation prepared",created.name+" · "+created.id);
  }
  close();render();toast("Demo employee information updated on this page only.");
 });
 $("ma3-editor").addEventListener("submit",e=>{e.preventDefault();saveHandler?.()});
}
function showEffectivePermissions(id){
 const u=userBy(id);if(!u)return;
 const grants=a.granted(u),all=a.scopeBranches(u);
 const groups=[...new Set(perms.map(x=>x.group))];
 const groupHtml=groups.map(g=>'<section class="ma3-role-group"><h3>'+esc(g)+'</h3>'+
 perms.filter(x=>x.group===g).map(p=>'<div class="ma3-perm-row"><label>'+esc(p.name)+(p.sensitive?' <span class="ma3-sensitive">· Sensitive</span>':'')+'</label><span class="ma3-tag '+(grants.has(p.id)?"good":"neutral")+'">'+(grants.has(p.id)?"✓ Role grant":"— Not granted")+'</span></div>').join("")+'</section>').join("");
 const companies=[...new Set(all.map(b=>b.companyId))].map(id=>entities.find(x=>x.id===id)?.name||id).join(", ");
 const branches=all.map(b=>b.name).join(", ");
 const html='<div class="ma3-dialog-warning"><b>Employee:</b> '+esc(u.name)+' · '+esc(u.status)+'<br><b>Roles:</b> '+esc(u.roles.map(r=>roleBy(r)?.name||r).join(", "))+'<br><b>Companies:</b> '+esc(companies)+'<br><b>Branches:</b> '+esc(branches)+'</div>'+
 groupHtml+'<div class="ma3-inline-note"><b>How to interpret this:</b> Action grants are combined from assigned roles, but records remain within selected branches and their own/team/assigned relationship. This initial sample applies all selected roles across all assigned branches. If different roles are needed in different companies, their role-to-company assignments must be agreed before development. Sensitive approvals require separate policy checks.</div>';
 open("Effective Permissions — "+u.name,"Read-only sample permissions, not an authorization decision",html,null);
}
function customRoleForm(source=null,copy=false){
 const base=source&&copy?{...source,id:"",name:source.name+" - Custom",system:false}:source||{name:"",description:"",visibility:"assigned",perms:[],system:false};
 const groups=[...new Set(perms.map(p=>p.group))];
 const fields=groups.map(g=>'<div class="ma3-form-item full"><label>'+esc(g)+'</label><div class="ma3-checkbox-grid">'+perms.filter(x=>x.group===g).map(p=>checkbox("grant",p.id,p.name,base.perms.includes(p.id),p.sensitive?"Sensitive: explicit approval required":"")).join("")+'</div></div>').join("");
 const html='<div class="ma3-dialog-warning">Role templates define actions, not company/branch assignments. New sensitive permissions are examples only, and approval actions still require a separately approved policy.</div>'+
 '<form id="ma3-editor"><div class="ma3-form">'+
 field("name","Role name","text",base.name,true)+
 '<div class="ma3-form-item"><label for="ma3-role-visibility">Record visibility template</label><select name="visibility" id="ma3-role-visibility">'+[["own","Own records"],["assigned","Own / assigned records"],["team","Own / assigned / team records"],["all","All records within assigned branches"]].map(([id,label])=>'<option value="'+id+'"'+(base.visibility===id?' selected':'')+'>'+label+'</option>').join("")+'</select></div>'+
 '<div class="ma3-form-item full"><label for="ma3-role-description">Purpose / description</label><textarea name="description" id="ma3-role-description">'+esc(base.description||"")+'</textarea></div>'+
 fields+'<div class="ma3-form-error" id="ma3-form-error" role="alert"></div></div></form>';
 const editing=Boolean(source&&!copy);
 open(editing?"Edit Custom Role":"Create Custom Role","Choose capabilities for an example role",html,()=>{
  const f=$("ma3-editor");if(!f.reportValidity())return;
  const fd=new FormData(f),name=String(fd.get("name")||"").trim();
  if(roles.some(r=>r.name.toLowerCase()===name.toLowerCase()&&r.id!==source?.id)){formError("A role with this name already exists.");return;}
  const record={name,description:String(fd.get("description")||"").trim(),visibility:String(fd.get("visibility")||"assigned"),perms:[...new Set(fd.getAll("grant"))],system:false};
  if(source&&!copy){Object.assign(source,record);state.selectedRole=source.id;audit("Custom role updated",record.name);}
  else{roleCounter+=1;const id="custom"+roleCounter;roles.push({id,...record});state.selectedRole=id;audit("Custom role created",record.name);}
  close();refreshRoleFilters();render();toast("Custom role saved as an in-memory example.");
 });
 $("ma3-editor").addEventListener("submit",e=>{e.preventDefault();saveHandler?.()});
}
function updateAccountStatus(id){
 const u=userBy(id);if(!u)return;
 if(u.status==="Invited"){msg("Invitation requires acceptance","In the real CPQ, invited employees must complete a secure setup before activation. This prototype does not send invitations or bypass acceptance.");return;}
 const deactivating=u.status==="Active";
 if(deactivating&&u.roles.includes("master")&&!users.some(x=>x.id!==u.id&&x.status==="Active"&&x.roles.includes("master"))){
  msg("Master Admin cannot be deactivated","This is the only active business Master Admin in the fictional example. At least one active administrator must be retained.");return;
 }
 const next=deactivating?"Inactive":"Active";
 open(deactivating?"Deactivate employee?":"Reactivate employee?","Account status demonstration",
  '<div class="ma3-dialog-warning">'+(deactivating?"Access would be blocked without deleting the employee's audit history or references.":"Restoring login access must use verified credentials in production.")+'</div><p style="font-size:13px;color:#2d4c66"><b>'+esc(u.name)+'</b> · '+esc(u.email)+'</p>',
 ()=>{u.status=next;u.updated="06 Nov 2026 (demo)";audit("Account "+next.toLowerCase(),u.name+" · "+u.id);close();render();toast("Account status changed in local sample only.");},
 deactivating?"Confirm deactivation (demo)":"Confirm reactivation (demo)");
}
function refreshRoleFilters(){
 const value=state.filters.role;
 $("user-role-filter").innerHTML='<option value="all">All roles</option>'+roles.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name)+'</option>').join("");
 $("user-role-filter").value=roles.some(x=>x.id===value)?value:"all";
}
function setupFilters(){
 refreshRoleFilters();
 $("user-company-filter").innerHTML='<option value="all">All companies</option>'+entities.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+'</option>').join("");
}
function setTab(tab){
 if(!["users","roles","preview"].includes(tab))return;
 state.panel=tab;render();
}
function setPreview(values){
 Object.assign(state.preview,values);setTab("preview");
}
$("new-user").addEventListener("click",()=>employeeForm());
$("new-role").addEventListener("click",()=>customRoleForm());
for(const key of ["users","roles","preview"])$("tab-"+key).addEventListener("click",()=>setTab(key));
$("user-search").addEventListener("input",e=>{state.filters.q=e.target.value;render()});
$("user-role-filter").addEventListener("change",e=>{state.filters.role=e.target.value;render()});
$("user-company-filter").addEventListener("change",e=>{state.filters.company=e.target.value;render()});
$("user-status-filter").addEventListener("change",e=>{state.filters.status=e.target.value;render()});
for(const [id,key] of [["check-user","user"],["check-action","action"],["check-company","company"],["check-branch","branch"],["check-relation","relation"]]){
 $(id).addEventListener("change",e=>{
  state.preview[key]=e.target.value;
  if(key==="company")state.preview.branch=entities.find(x=>x.id===state.preview.company)?.branches[0]?.id||"";
  render();
 });
}
const presets={
"sales-own":{user:"U002",action:"quotes.view",company:"e1",branch:"e1a",relation:"own"},
"sales-other-branch":{user:"U002",action:"quotes.view",company:"e1",branch:"e1s",relation:"own"},
"sales-margin":{user:"U002",action:"margin.view",company:"e1",branch:"e1a",relation:"own"},
"finance-margin":{user:"U007",action:"margin.view",company:"e1",branch:"e1a",relation:"assigned"}
};
document.addEventListener("click",event=>{
 const t=event.target.closest("[data-select-user],[data-edit-user],[data-toggle-user],[data-effective-user],[data-preview-for],[data-select-role],[data-edit-role],[data-copy-role],[data-scenario],[data-planned]");
 if(!t)return;
 const d=t.dataset;
 if(d.selectUser){state.selectedUser=d.selectUser;render();return;}
 if(d.editUser){employeeForm(userBy(d.editUser));return;}
 if(d.toggleUser){updateAccountStatus(d.toggleUser);return;}
 if(d.effectiveUser){showEffectivePermissions(d.effectiveUser);return;}
 if(d.previewFor){const u=userBy(d.previewFor),b=u?.branches.includes("*")?entities[0].branches[0]:a.scopeBranches(u)[0];setPreview({user:d.previewFor,company:b?.companyId||"e1",branch:b?.id||"e1a",action:"quotes.view",relation:"own"});return;}
 if(d.selectRole){state.selectedRole=d.selectRole;render();return;}
 if(d.editRole){const role=roleBy(d.editRole);if(role&&!role.system)customRoleForm(role);else msg("Protected example template","Copy built-in roles to create editable sample role templates.");return;}
 if(d.copyRole){const role=roleBy(d.copyRole);if(role)customRoleForm(role,true);return;}
 if(d.scenario){setPreview(presets[d.scenario]||presets["sales-own"]);return;}
 if(d.planned){msg(d.name||"Module","This module will be designed separately. No access or business data is modified here.");}
});
$("modal-close").addEventListener("click",close);
$("modal-cancel").addEventListener("click",close);
$("modal-save").addEventListener("click",()=>saveHandler?.());
$("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("overlay").classList.contains("open"))close()});
setupFilters();
render();
const initialPanel=window.location.hash.replace(/^#/, "");
if(["users","roles","preview"].includes(initialPanel))setTab(initialPanel);
if(new URLSearchParams(window.location.search).get("action")==="new")employeeForm();
})();