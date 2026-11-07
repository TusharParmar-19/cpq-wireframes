/* MA-003: interactive, in-memory role and employee demonstration; no network calls or stored credentials. */
(()=>{
"use strict";
const a=window.CPQ_MA003,{users,roles,perms,entities,state,$,esc,userBy,roleBy,render}=a;
let saveHandler=null,cancelHandler=null,restoreFocus=null,userCounter=users.length,roleCounter=0;
const branchItems=entities.flatMap(e=>e.branches.map(b=>({id:b.id,companyId:e.id,companyName:e.name,name:b.name})));
function open(title,subtitle,body,handler=null,label="Save demo"){
 restoreFocus=document.activeElement;
 saveHandler=handler;
 cancelHandler=null;
 $("modal-title").textContent=title;
 $("modal-subtitle").textContent=subtitle;
 $("modal-body").innerHTML=body;
 $("modal-body").scrollTop=0;
 $("modal-tools").innerHTML="";
 $("modal-tools").hidden=true;
 $("modal-cancel").textContent=handler?"Cancel":"Close";
 $("modal-save").hidden=!handler;
 $("modal-save").textContent=label;
 $("modal-save").disabled=false;
 $("modal-save").removeAttribute("title");
 $("overlay").classList.add("open");
 $("overlay").setAttribute("aria-hidden","false");
 $("modal-close").focus();
}
function close(){
 saveHandler=null;cancelHandler=null;$("overlay").classList.remove("open");
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
 const creating=!u;
 const person=u||{name:"",email:"",mobile:"",designation:"",department:"",roles:[],branches:[],assignments:[],status:"Invited"};
 const scopeHtml=entities.map(e=>{
  const assigned=person.assignments.find(a=>a.companyId===e.id)||{roles:[],branches:[]};
  const rolesHtml=roles.map(r=>checkbox("scopeRole",e.id+":"+r.id,r.name,assigned.roles.includes(r.id))).join("");
  const branchesHtml=e.branches.map(b=>checkbox("scopeBranch",e.id+":"+b.id,b.name,assigned.branches.includes(b.id),b.city)).join("");
  const expanded=assigned.roles.length>0||(!u&&e.id===entities[0].id);
  const status=assigned.roles.length?assigned.roles.length+" role(s) · "+assigned.branches.length+" branch(es)":"No access selected";
  return '<details class="ma3-scope-card" data-company-id="'+esc(e.id)+'"'+(expanded?' open':'')+'><summary><span>'+esc(e.name)+'</span><small data-scope-summary>'+esc(status)+'</small></summary>'+
   '<div class="ma3-scope-help">Choose roles and branches for this company only. Leave both empty to grant no access.</div>'+
   '<div class="ma3-scope-heading">Roles in '+esc(e.name)+'</div><div class="ma3-checkbox-grid">'+rolesHtml+'</div>'+
   '<div class="ma3-scope-heading">Allowed operating branches</div><div class="ma3-checkbox-grid">'+branchesHtml+'</div></details>';
 }).join("");
 const notice='<div class="ma3-dialog-warning">Browser-only example. Real employees activate through a secure invitation. Each company has its own selected roles and branches: a manager role in Company A does not automatically apply in Company B. No email is sent or password collected.</div>';
 const html=notice+'<form id="ma3-editor"><div class="ma3-form">'+
 field("name","Employee full name","text",person.name,true)+
 field("email","Work email","email",person.email,true)+
 field("mobile","Mobile number","tel",person.mobile)+
 field("designation","Designation","text",person.designation)+
 field("department","Department","text",person.department)+
 '<div class="ma3-form-item"><label>Business account</label><input type="text" value="Example Business Group (fixed)" readonly><small>Employee access cannot leave this business account.</small></div>'+
 '<div class="ma3-form-item full"><label>Company-specific role &amp; branch assignments *</label>'+
 '<p class="ma3-scope-intro">For each company select one or more roles AND one or more branches. Roles are never automatically copied into another company.</p>'+
 scopeHtml+'</div>'+
 (creating?'<div class="ma3-form-item full"><label>Initial account status</label><input type="text" value="Invited — secure account setup required" readonly></div>':
 '<div class="ma3-form-item full"><label>Current status</label><input type="text" value="'+esc(person.status)+' (use the dedicated status action to change)" readonly></div>')+
 '<div class="ma3-form-error" id="ma3-form-error" role="alert"></div>'+
 '</div></form>';
 open(creating?"Add Employee (demo)":"Edit Employee & Access",creating?"Prepare a fictional employee invitation":"Edit role and branch assignments independently for each company",html,()=>{
  const form=$("ma3-editor");if(!form.reportValidity())return;
  const fd=new FormData(form);
  const roleValues=fd.getAll("scopeRole").map(String);
  const branchValues=fd.getAll("scopeBranch").map(String);
  const name=String(fd.get("name")||"").trim(),email=String(fd.get("email")||"").trim().toLowerCase();
  const assignments=[];
  for(const e of entities){
   const pickedRoles=roles.filter(r=>roleValues.includes(e.id+":"+r.id)).map(r=>r.id);
   const pickedBranches=e.branches.filter(b=>branchValues.includes(e.id+":"+b.id)).map(b=>b.id);
   if(pickedRoles.length&&!pickedBranches.length){formError("Select a branch for "+e.name+" or deselect that company's roles.");return;}
   if(pickedBranches.length&&!pickedRoles.length){formError("Select a role for "+e.name+" or deselect that company's branches.");return;}
   if(pickedRoles.length)assignments.push({companyId:e.id,branches:pickedBranches,roles:pickedRoles});
  }
  if(!assignments.length){formError("Assign at least one role and branch in one company.");return;}
  if(users.some(x=>x.id!==u?.id&&x.email.toLowerCase()===email)){formError("A fictional employee with this email already exists.");return;}
  const newRoles=[...new Set(assignments.flatMap(a=>a.roles))];
  if(u&&u.status==="Active"&&u.roles.includes("master")&&!newRoles.includes("master")&&
     !users.some(x=>x.id!==u.id&&x.status==="Active"&&x.roles.includes("master"))){
   formError("Cannot remove the final active Master Admin from this business account.");return;
  }
  const change={name,email,mobile:String(fd.get("mobile")||"").trim(),designation:String(fd.get("designation")||"").trim(),
   department:String(fd.get("department")||"").trim(),assignments,roles:newRoles,
   branches:[...new Set(assignments.flatMap(a=>a.branches))],updated:"07 Nov 2026 (demo)"};
  if(u){Object.assign(u,change);audit("Company role assignments updated",u.name+" · "+u.id);}
  else{
   userCounter+=1;
   const created={...change,id:"U"+String(userCounter).padStart(3,"0"),created:"07 Nov 2026 (demo)",status:"Invited"};
   users.push(created);state.selectedUser=created.id;state.filters={q:"",role:"all",company:"all",status:"all"};
   $("user-search").value="";$("user-role-filter").value="all";$("user-company-filter").value="all";$("user-status-filter").value="all";
   audit("Employee invitation prepared",created.name+" · "+created.id);
  }
  close();render();toast("Scoped employee roles updated on this demo page only.");
 });
 $("ma3-editor").addEventListener("submit",e=>{e.preventDefault();saveHandler?.()});
 $("ma3-editor").addEventListener("change",e=>{
  if(!e.target.matches('input[type="checkbox"]'))return;
  const section=e.target.closest(".ma3-scope-card");if(!section)return;
  const r=section.querySelectorAll('input[name="scopeRole"]:checked').length;
  const b=section.querySelectorAll('input[name="scopeBranch"]:checked').length;
  section.querySelector("[data-scope-summary]").textContent=r&&b?r+" role(s) · "+b+" branch(es)":r||b?"Incomplete selection":"No access selected";
 });
}
function showEffectivePermissions(id){
 const u=userBy(id);if(!u)return;
 const available=u.assignments.flatMap(x=>x.branches.map(b=>({companyId:x.companyId,branchId:b})));
 const groups=[...new Set(perms.map(p=>p.group))];
 const entries=available.map(c=>'<option value="'+esc(c.companyId+":"+c.branchId)+'">'+
  esc(entities.find(e=>e.id===c.companyId)?.name||c.companyId)+' / '+
  esc(a.branchBy(c.branchId)?.name||c.branchId)+'</option>').join("");
 const build=(c)=>{
  const roleIds=a.roleIdsAt(u,c.companyId,c.branchId);
  const grants=a.granted(u,c.companyId,c.branchId);
  const allowedPages=a.grantedPages(u,c.companyId,c.branchId);
  const pagesHtml='<section class="ma3-role-group"><h3>Role page grants in this company ('+allowedPages.size+')</h3>'+
   '<div class="ma3-effective-pages">'+a.pages.filter(p=>allowedPages.has(p.id)).map(p=>
   '<div class="ma3-page-row"><div><b>'+esc(p.name)+'</b><small>'+esc(p.stage==='Available'?p.code:'Planned screen')+'</small></div>'+
   '<span class="ma3-tag '+(p.stage==='Planned'?'planned':'good')+'">'+(p.stage==='Planned'?'✓ Access planned':'✓ Can open')+'</span></div>').join('')+'</div>'+
   '<details class="ma3-effective-blocked"><summary>Show '+(a.pages.length-allowedPages.size)+' pages without access</summary>'+
   a.pages.filter(p=>!allowedPages.has(p.id)).map(p=>'<div class="ma3-page-row"><b>'+esc(p.name)+'</b><span class="ma3-tag neutral">— Not granted</span></div>').join('')+'</details></section>';
  const groupHtml=groups.map(g=>'<section class="ma3-role-group"><h3>'+esc(g)+'</h3>'+
   perms.filter(p=>p.group===g).map(p=>'<div class="ma3-perm-row"><label>'+esc(p.name)+(p.sensitive?' <span class="ma3-sensitive">· Sensitive</span>':'')+'</label><span class="ma3-tag '+(grants.has(p.id)?"good":"neutral")+'">'+(grants.has(p.id)?"✓ Role grant":"— Not granted")+'</span></div>').join("")+'</section>').join("");
  return '<div class="ma3-effective-context"><b>Assigned role(s) in this company:</b> '+esc(roleIds.map(r=>roleBy(r)?.name||r).join(", ")||"None")+
  '<br><b>Record scope:</b> '+esc(a.visibility(u,c.companyId,c.branchId))+'<br><b>Account:</b> '+esc(u.status)+(u.status!=='Active'?' — cannot log in or open any page until activated':'')+'</div>'+pagesHtml+groupHtml+
  '<div class="ma3-inline-note"><b>Access applies only in this selected company/branch.</b> Roles in another company cannot grant actions here. All record ownership, sensitive-field and approval checks still apply independently in the production backend.</div>';
 };
 const html='<div class="ma3-dialog-warning"><b>Employee:</b> '+esc(u.name)+' · '+esc(u.status)+
 '<br><b>Company assignments:</b> '+esc(u.assignments.map(x=>(entities.find(e=>e.id===x.companyId)?.name||x.companyId)+" = "+x.roles.map(r=>roleBy(r)?.name||r).join(", ")).join(" | "))+
 '</div><div class="ma3-form-item full"><label for="ma3-effective-scope">View permissions in company / branch</label><select id="ma3-effective-scope">'+entries+'</select></div>'+
 '<div id="ma3-effective-list"></div>';
 open("Effective Permissions — "+u.name,"Read-only per-company access preview",html,null);
 const update=()=>{
  const [companyId,branchId]=String($("ma3-effective-scope").value).split(":");
  $("ma3-effective-list").innerHTML=build({companyId,branchId});
 };
 if(available.length){$("ma3-effective-scope").value=available[0].companyId+":"+available[0].branchId;
 $("ma3-effective-scope").addEventListener("change",update);update();}
 else $("ma3-effective-list").innerHTML='<div class="ma3-empty">No company or branch access assigned.</div>';
}
function customRoleForm(source=null,copy=false,restoredDraft=null){
 if(source?.id==="master"&&!copy){msg("Protected Master Admin role","This built-in system example cannot be edited. Use the copy feature to explore a custom role; real elevated access still requires a separately approved policy.");return;}
 const editing=Boolean(source&&!copy);
 const base=source&&copy?{...source,id:"",name:source.name+" - Custom",system:false,pages:[...source.pages],perms:[...source.perms]}:
  source?{...source,pages:[...source.pages],perms:[...source.perms]}:
  {name:"",description:"",visibility:"assigned",pages:[],perms:[],system:false};
 if(restoredDraft)Object.assign(base,{name:restoredDraft.name,description:restoredDraft.description,visibility:restoredDraft.visibility,pages:[...restoredDraft.pages],perms:[...restoredDraft.perms]});
 const pageGroups=[...new Set(a.pages.map(p=>p.section))];
 const permissionGroups=[...new Set(perms.map(p=>p.group))];
 const pageFields=pageGroups.map((g,i)=>{
  const items=a.pages.filter(p=>p.section===g);
  return '<details class="ma3-config-group" data-config-anchor="pages:'+esc(g)+'"'+(i===0?' open':'')+'><summary>'+esc(g)+' <small>'+items.length+' pages</small></summary><div class="ma3-checkbox-grid">'+
   items.map(p=>checkbox("pageGrant",p.id,p.name,base.pages.includes(p.id),p.stage==="Available"?p.code+" · Available":"Planned · no live page yet")).join("")+'</div></details>';
 }).join("");
 const capabilityFields=permissionGroups.map((g,i)=>{
  const items=perms.filter(p=>p.group===g);
  return '<details class="ma3-config-group" data-config-anchor="actions:'+esc(g)+'"'+(i===0?' open':'')+'><summary>'+esc(g)+' <small>'+items.length+' capabilities</small></summary><div class="ma3-checkbox-grid">'+
   items.map(p=>checkbox("grant",p.id,p.name,base.perms.includes(p.id),p.sensitive?"Restricted · extra approval needed":"")).join("")+'</div></details>';
 }).join("");
 const affected=source&&!copy?users.flatMap(u=>u.assignments.filter(x=>x.roles.includes(source.id)).map(x=>({name:u.name,company:entities.find(e=>e.id===x.companyId)?.name||x.companyId,branches:x.branches.length}))):[];
 const warning='<div class="ma3-dialog-warning"><b>Role permissions are separate from employee assignments.</b> All grants are limited to a company and its assigned branches. Page access alone does not allow actions. Sensitive fields and final approvals also require independent checks. Nothing here changes a production system.</div>';
 const roleName=field("name","Role name","text",base.name,true,source?.system&&!copy?'readonly':'');
 const html=warning+'<form id="ma3-editor"><div class="ma3-form">'+
  roleName+
  '<div class="ma3-form-item"><label for="ma3-role-visibility">Record visibility template</label><select name="visibility" id="ma3-role-visibility">'+
  [["own","Own records"],["assigned","Own / assigned records"],["team","Own / assigned / team records"],["all","All authorized records inside assigned branches"]].map(([id,label])=>'<option value="'+id+'"'+(base.visibility===id?' selected':'')+'>'+label+'</option>').join("")+'</select></div>'+
  '<div class="ma3-form-item full"><label for="ma3-role-description">Role purpose</label><textarea name="description" id="ma3-role-description">'+esc(base.description||"")+'</textarea></div>'+
  '<div class="ma3-form-item full"><details class="ma3-config-section" data-config-anchor="pages" open><summary><span>1. Pages this role can open</span><span class="ma3-config-count" id="ma3-page-count">'+base.pages.length+' of '+a.pages.length+' selected</span></summary>'+
  '<p class="ma3-scope-intro">These control the menu and direct page access. Planned pages are included for future phases but do not exist yet.</p>'+pageFields+'</details></div>'+
  '<div class="ma3-form-item full"><details class="ma3-config-section" data-config-anchor="actions"><summary><span>2. Actions &amp; sensitive data</span><span class="ma3-config-count" id="ma3-action-count">'+base.perms.length+' of '+perms.length+' selected</span></summary>'+
  '<p class="ma3-scope-intro">Select view/create/edit/archive, quotation actions, RFQs, reports and confidential-data grants. Opening a page does not enable these actions.</p><div class="ma3-dependency-summary" id="ma3-dependency-summary" role="status" aria-live="polite" hidden></div>'+capabilityFields+'</details></div>'+
  '<div class="ma3-form-item full"><div class="ma3-review-impact" data-config-anchor="impact"><b>3. Employees and approval impact</b><p>'+(
   affected.length?'This role is assigned in '+affected.length+' company context(s). Changes would affect '+new Set(affected.map(x=>x.name)).size+' employee(s) wherever this role is assigned, but never grant access to an unassigned company.':
   'This role currently has no assigned employees. You can assign it to selected companies and branches in Add/Edit Employee.')+
  '</p></div></div>'+
  '<div class="ma3-form-error" id="ma3-form-error" role="alert"></div></div></form>';
 open(editing?"Configure Role — "+source.name:copy?"Copy Role as Custom":"Create Custom Role",editing?"Change the sample role template; review impact before applying":"Choose page access, action grants and record visibility",html,()=>{
  const form=$("ma3-editor");if(!form.reportValidity())return;
  const fd=new FormData(form);
  const name=String(fd.get("name")||"").trim();
  if(!name){formError("Enter a role name.");return;}
  if(roles.some(r=>r.name.toLowerCase()===name.toLowerCase()&&r.id!==(editing?source.id:""))){formError("A role with this name already exists.");return;}
  const chosenPages=[...new Set(fd.getAll("pageGrant").map(String).filter(id=>a.pages.some(p=>p.id===id)))];
  const chosenActions=[...new Set(fd.getAll("grant").map(String).filter(id=>perms.some(p=>p.id===id)))];
  if(!chosenPages.length){formError("Grant access to at least one page, or cancel the role setup.");return;}
  const visibility=String(fd.get("visibility")||"assigned");
  if(!["own","assigned","team","all"].includes(visibility)){formError("Choose a valid record visibility template.");return;}
  const record={name,description:String(fd.get("description")||"").trim(),visibility,pages:chosenPages,perms:chosenActions,system:editing?source.system:false};
  const oldPages=editing?source.pages:[],oldActions=editing?source.perms:[];
  const added=(before,after,lookup)=>after.filter(id=>!before.includes(id)).map(lookup);
  const removed=(before,after,lookup)=>before.filter(id=>!after.includes(id)).map(lookup);
  const pageLabel=id=>a.pageBy(id)?.name||id;
  const actionLabel=id=>perms.find(p=>p.id===id)?.name||id;
  const diff=(title,arr,sign)=>'<div class="ma3-review-diff"><b>'+esc(title)+' ('+arr.length+')</b><div>'+(arr.length?arr.map(x=>'<span class="ma3-review-pill '+(sign==='+'?'added':'removed')+'">'+sign+' '+esc(x)+'</span>').join(""):'<span class="ma3-review-none">None</span>')+'</div></div>';
  const sensitive=chosenActions.filter(id=>perms.some(p=>p.id===id&&p.sensitive));
  const inactiveActions=chosenActions.filter(id=>!a.pages.some(pg=>chosenPages.includes(pg.id)&&pg.actions.includes(id)));
  const dependencyBlock=inactiveActions.length?'<div class="ma3-review-blocker" role="alert"><b>Cannot confirm yet.</b> '+inactiveActions.length+' selected action grant(s) have no matching page access. Use <b>Back to editor</b> to restore the required page or remove the actions.</div>':"";
  const review='<div class="ma3-dialog-warning"><b>Review before applying this demo change.</b> Configuration affects the selected role template. Existing employees retain their own company/branch assignments; no production permissions or records are changed.</div>'+
   '<div class="ma3-review-card"><b>'+esc(name)+'</b><small>'+chosenPages.length+' pages · '+chosenActions.length+' capabilities · '+esc(visibility)+' record scope</small></div>'+
   diff("Pages added",added(oldPages,chosenPages,pageLabel),"+")+
   diff("Pages removed",removed(oldPages,chosenPages,pageLabel),"-")+
   diff("Actions granted",added(oldActions,chosenActions,actionLabel),"+")+
   diff("Actions revoked",removed(oldActions,chosenActions,actionLabel),"-")+
   '<div class="ma3-review-impact"><b>Employees in scope</b><p>'+(affected.length?esc([...new Set(affected.map(x=>x.name+" — "+x.company))].join("; ")):'No employee assignments yet.')+'</p>'+
   '<div class="ma3-review-dependency'+(inactiveActions.length?' has-issues':'')+'"><b>Action/page dependencies: '+(inactiveActions.length?inactiveActions.length+' ineffective grants':'No missing page access')+'</b><p>'+(inactiveActions.length?esc(inactiveActions.map(id=>actionLabel(id)+' → '+a.pages.filter(pg=>pg.actions.includes(id)).map(pg=>pg.name).join(' / ')).join('; '))+' — grant a relevant page or remove the action. These grants cannot be used as currently configured.':'Every selected action has at least one matching page grant. Planned pages remain unavailable until developed.')+'</p></div>'+ 
   dependencyBlock+'<p><b>Restricted grants selected:</b> '+(sensitive.length?esc(sensitive.map(actionLabel).join(", ")):'None')+'. Sensitive permissions, quote issuance and approvals still require separate authorizations and policy checks in production.</p></div>';
  open("Confirm Role Configuration","Inspect proposed page and action changes before saving",review,()=>{
   if(inactiveActions.length)return; // Inconsistent role grants must not be saved.
   if(editing){Object.assign(source,record);state.selectedRole=source.id;audit("Role page & action policy updated",record.name+" · "+record.pages.length+" pages / "+record.perms.length+" actions");}
   else{roleCounter+=1;const id="custom"+roleCounter;roles.push({id,...record});state.selectedRole=id;audit("Custom role created",record.name+" · "+record.pages.length+" pages / "+record.perms.length+" actions");}
   state.roleView="pages";close();refreshRoleFilters();render();toast("Role page and action policy updated on this demo page only.");
  },"Confirm demo changes");
  $("modal-save").disabled=inactiveActions.length>0;
  if(inactiveActions.length)$("modal-save").title="Resolve all ineffective action grants before confirming";
  const proposed={name,description:record.description,visibility,pages:[...chosenPages],perms:[...chosenActions]};
  $("modal-cancel").textContent="Back to editor";
  cancelHandler=()=>customRoleForm(source,copy,proposed);
 },"Review changes");
 // Keep this category navigator outside the form's scrollable body.
 const navOptions='<option value="">Jump to a permission section…</option>'+
  '<option value="pages">1. All pages</option>'+
  pageGroups.map(g=>'<option value="pages:'+esc(g)+'">Pages: '+esc(g)+'</option>').join("")+
  '<option value="actions">2. All actions &amp; data</option>'+
  permissionGroups.map(g=>'<option value="actions:'+esc(g)+'">Actions: '+esc(g)+'</option>').join("")+
  '<option value="impact">3. Employee impact</option>';
 const tools=$("modal-tools");
 tools.innerHTML='<label for="ma3-role-jump">Jump to</label><select id="ma3-role-jump" aria-label="Jump to role permission section">'+navOptions+'</select><span class="ma3-jump-alert" id="ma3-role-alert" role="status" hidden></span>';
 tools.hidden=false;
 $("ma3-role-jump").addEventListener("change",event=>{
  const anchor=event.target.value;
  if(!anchor)return;
  const target=[...$("modal-body").querySelectorAll("[data-config-anchor]")].find(node=>node.dataset.configAnchor===anchor);
  if(target){
   const parent=target.closest(".ma3-config-section");
   if(parent)parent.open=true;
   if(target.tagName==="DETAILS")target.open=true;
   const scroll=$("modal-body");
   scroll.scrollTop+=target.getBoundingClientRect().top-scroll.getBoundingClientRect().top-10;
  }
  event.target.value="";
 });
 const updateCounters=()=>{
  const form=$("ma3-editor");
  const selectedPages=new Set([...form.querySelectorAll('input[name="pageGrant"]:checked')].map(x=>x.value));
  const selectedActions=new Set([...form.querySelectorAll('input[name="grant"]:checked')].map(x=>x.value));
  $("ma3-page-count").textContent=selectedPages.size+" of "+a.pages.length+" selected";
  $("ma3-action-count").textContent=selectedActions.size+" of "+perms.length+" selected";
  const inactive=[...selectedActions].filter(id=>!a.pages.some(pg=>selectedPages.has(pg.id)&&pg.actions.includes(id)));
  const warning=$("ma3-dependency-summary");
  warning.hidden=!inactive.length;
  warning.innerHTML=inactive.length?'<strong>'+inactive.length+' selected action(s) have no accessible page.</strong>'+
   '<p>These action grants are currently ineffective. Grant a matching page or uncheck the action. Page grants alone never add action rights.</p><ul>'+
   inactive.map(id=>{
    const matching=a.pages.filter(p=>p.actions.includes(id)).map(p=>p.name).join(" / ");
    const label=perms.find(p=>p.id===id)?.name||id;
    return '<li><b>'+esc(label)+'</b> — needs '+esc(matching||"a matching page")+'</li>';
   }).join("")+'</ul>':"";
  const alert=$("ma3-role-alert");alert.hidden=!inactive.length;
  alert.textContent=inactive.length+" ineffective action"+(inactive.length===1?"":"s");
  form.querySelectorAll('input[name="grant"]').forEach(box=>{
   box.closest(".ma3-checklabel")?.classList.toggle("ma3-dependency-missing",inactive.includes(box.value));
  });
 };
 $("ma3-editor").addEventListener("change",updateCounters);
 $("ma3-editor").addEventListener("submit",e=>{e.preventDefault();saveHandler?.()});
 updateCounters();
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
for(const [id,key] of [["check-user","user"],["check-page","page"],["check-action","action"],["check-company","company"],["check-branch","branch"],["check-relation","relation"]]){
 $(id).addEventListener("change",e=>{
  state.preview[key]=e.target.value;
  if(key==="company")state.preview.branch=entities.find(x=>x.id===state.preview.company)?.branches[0]?.id||"";
  if(key==="page")state.preview.action=a.pageBy(state.preview.page)?.actions[0]||"__open__";
  render();
 });
}
const presets={
 "sales-own":{user:"U002",page:"quote-register",action:"quotes.view",company:"e1",branch:"e1a",relation:"own"},
 "sales-other-branch":{user:"U002",page:"quote-register",action:"quotes.view",company:"e1",branch:"e1s",relation:"own"},
 "sales-margin":{user:"U002",page:"quote-builder",action:"margin.view",company:"e1",branch:"e1a",relation:"own"},
 "finance-margin":{user:"U007",page:"quote-builder",action:"margin.view",company:"e1",branch:"e1a",relation:"assigned"},
 "manager-reports-a":{user:"U004",page:"reports",action:"reports.view",company:"e1",branch:"e1a",relation:"team"},
 "manager-reports-b":{user:"U004",page:"reports",action:"reports.view",company:"e2",branch:"e2a",relation:"own"},
 "sales-quote-page":{user:"U002",page:"quote-builder",action:"__open__",company:"e1",branch:"e1a",relation:"own"},
 "sales-admin-page":{user:"U002",page:"organization",action:"__open__",company:"e1",branch:"e1a",relation:"own"}
};
document.addEventListener("click",event=>{
 const t=event.target.closest("[data-select-user],[data-edit-user],[data-toggle-user],[data-effective-user],[data-preview-for],[data-select-role],[data-role-view],[data-edit-role],[data-copy-role],[data-scenario],[data-planned]");
 if(!t)return;
 const d=t.dataset;
 if(d.selectUser){state.selectedUser=d.selectUser;render();return;}
 if(d.editUser){employeeForm(userBy(d.editUser));return;}
 if(d.toggleUser){updateAccountStatus(d.toggleUser);return;}
 if(d.effectiveUser){showEffectivePermissions(d.effectiveUser);return;}
 if(d.previewFor){const u=userBy(d.previewFor),b=u?.branches.includes("*")?entities[0].branches[0]:a.scopeBranches(u)[0];setPreview({user:d.previewFor,page:"quote-register",company:b?.companyId||"e1",branch:b?.id||"e1a",action:"quotes.view",relation:"own"});return;}
 if(d.selectRole){state.selectedRole=d.selectRole;state.roleView="pages";render();return;}
  if(d.roleView){state.roleView=d.roleView;render();return;}
 if(d.editRole){const role=roleBy(d.editRole);if(role&&role.id!=="master")customRoleForm(role);else msg("Protected Master Admin role","Use Copy as Custom Role to explore a separate template. Real elevated access requires explicit review.");return;}
 if(d.copyRole){const role=roleBy(d.copyRole);if(role)customRoleForm(role,true);return;}
 if(d.scenario){setPreview(presets[d.scenario]||presets["sales-own"]);return;}
 if(d.planned){msg(d.name||"Module","This module will be designed separately. No access or business data is modified here.");}
});
$("modal-close").addEventListener("click",close);
$("modal-cancel").addEventListener("click",()=>{if(cancelHandler){const back=cancelHandler;cancelHandler=null;back();}else close();});
$("modal-save").addEventListener("click",()=>saveHandler?.());
$("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("overlay").classList.contains("open"))close()});
setupFilters();
render();
const initialPanel=window.location.hash.replace(/^#/, "");
if(["users","roles","preview"].includes(initialPanel))setTab(initialPanel);
if(new URLSearchParams(window.location.search).get("action")==="new")employeeForm();
})();