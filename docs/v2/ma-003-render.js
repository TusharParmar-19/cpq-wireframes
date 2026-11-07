/* MA-003 sample rendering and permission reasoning — not an authentication engine. */
(()=>{
"use strict";
const entities=window.CPQ_MA002_DATA.map(e=>({id:e.id,name:e.name,branches:e.branches.map(b=>({id:b.id,name:b.name,city:b.city,status:b.status}))}));
const users=window.CPQ_MA003_USERS.map(u=>({...u,roles:[...u.roles],branches:[...u.branches],assignments:u.assignments.map(a=>({...a,branches:[...a.branches],roles:[...a.roles]}))}));
const roles=window.CPQ_MA003_ROLES.map(r=>({...r,perms:[...r.perms],pages:[...r.pages]}));
const pages=window.CPQ_MA003_PAGE_CATALOG.map(p=>({...p,actions:[...p.actions]}));
const perms=window.CPQ_MA003_PERMISSIONS.map(p=>({...p}));
const state={panel:"users",roleView:"pages",selectedUser:"U002",selectedRole:"sales",filters:{q:"",role:"all",company:"all",status:"all"},preview:{user:"U002",page:"quote-register",action:"quotes.view",company:"e1",branch:"e1a",relation:"own"},history:[]};
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const roleBy=id=>roles.find(r=>r.id===id);
const pageBy=id=>pages.find(p=>p.id===id);
const userBy=id=>users.find(u=>u.id===id);
const companyBy=id=>entities.find(e=>e.id===id);
const branchBy=id=>entities.flatMap(e=>e.branches.map(b=>({...b,companyId:e.id,companyName:e.name}))).find(b=>b.id===id);
const roleName=id=>roleBy(id)?.name||"Unknown role";
const allBranches=()=>entities.flatMap(e=>e.branches.map(b=>({id:b.id,name:b.name,companyId:e.id,companyName:e.name})));
const assignmentsAt=(u,companyId,branchId)=>u?.assignments?.filter(a=>a.companyId===companyId&&(!branchId||a.branches.includes(branchId)))||[];
const scopeBranches=u=>[...new Set((u?.assignments||[]).flatMap(a=>a.branches))].map(id=>branchBy(id)).filter(Boolean);
const scopeEntities=u=>[...new Set((u?.assignments||[]).map(a=>a.companyId))];
const scopeShort=u=>{
 const ent=scopeEntities(u),b=scopeBranches(u);
 return ent.length+" "+(ent.length===1?"company":"companies")+" / "+b.length+" "+(b.length===1?"branch":"branches");
};
const roleIdsAt=(u,companyId,branchId)=>[...new Set(assignmentsAt(u,companyId,branchId).flatMap(a=>a.roles))];
const granted=(u,companyId,branchId)=>new Set(roleIdsAt(u,companyId,branchId).flatMap(id=>roleBy(id)?.perms||[]));
const grantedPages=(u,companyId,branchId)=>new Set(roleIdsAt(u,companyId,branchId).flatMap(id=>roleBy(id)?.pages||[]));
const visibility=(u,companyId,branchId)=>{
 const v=roleIdsAt(u,companyId,branchId).map(id=>roleBy(id)?.visibility||"own");
 for(const x of ["all","team","assigned","own"])if(v.includes(x))return x;
 return "none";
};
const isRoleMember=(u,id,companyId=null)=>companyId?assignmentsAt(u,companyId).some(a=>a.roles.includes(id)):u.roles.includes(id);
const badge=(v)=>'<span class="ma3-tag '+(v==="Active"?"good":v==="Invited"?"warn":v==="Inactive"?"danger":"neutral")+'">'+esc(v)+'</span>';
const roleChips=u=>'<span class="ma3-badges">'+u.roles.map(id=>'<span class="ma3-tag">'+esc(roleName(id))+'</span>').join("")+'</span>';
const shortScope=u=>{
 if(!u.assignments.length)return '<b>No access assigned</b>';
 const lines=u.assignments.map(a=>{
  const name=companyBy(a.companyId)?.name||a.companyId;
  return '<b>'+esc(name)+'</b><small>'+esc(a.branches.map(id=>branchBy(id)?.name||id).join(", "))+' · '+esc(a.roles.map(roleName).join(", "))+'</small>';
 });
 return lines.join('<div class="ma3-scope-divider"></div>');
};
const groups=[...new Set(perms.map(p=>p.group))];
function assess(input){
 const u=userBy(input.user),b=branchBy(input.branch);
 if(!u||!b)return {kind:"deny",reason:"Choose a valid employee and branch.",checks:[]};
 const targetPage=pageBy(input.page)||pages.find(p=>p.actions.includes(input.action))||pages[0];
 const openOnly=input.action==="__open__";
 const tenantOk=true; // Single fictional business account.
 const locationOk=b.companyId===input.company&&assignmentsAt(u,input.company,input.branch).length>0;
 const activeOk=u.status==="Active";
 const pageOk=grantedPages(u,input.company,input.branch).has(targetPage.id);
 const grantOk=openOnly||(targetPage.actions.includes(input.action)&&granted(u,input.company,input.branch).has(input.action));
 const recordActions=["customers.view","customers.create","customers.edit","customers.archive","opportunities.view","opportunities.create","opportunities.edit","opportunities.close","quotes.view","quotes.create","quotes.edit","quotes.duplicate","quotes.pdf","quotes.issue","quotes.dispatch","quotes.response","rfq.view","rfq.create","rfq.send","rfq.compare","documents.view","documents.upload","documents.download","documents.delete","orders.view","orders.edit","orders.register","records.archive","selling.view","cost.view","margin.view","discount.approve","approvals.view","approvals.decide"];
 const related=()=>{
  if(openOnly||!recordActions.includes(input.action))return true;
  const v=visibility(u,input.company,input.branch),rel=input.relation;
  if(v==="all")return true;
  if(v==="team")return ["own","assigned","team"].includes(rel);
  if(v==="assigned")return ["own","assigned"].includes(rel);
  return rel==="own";
 };
 const recordOk=related();
 const policyNeeded=["discount.approve","approvals.decide","orders.register","quotes.pdf","quotes.issue","rfq.send","documents.delete","reports.export","records.archive","bank.view","commercial.manage","customers.archive"].includes(input.action);
 const checks=[
  {label:"Active employee account",pass:activeOk},
  {label:"Correct business account (demo tenant)",pass:tenantOk},
  {label:"Assigned legal entity and branch",pass:locationOk},
  {label:"Page access granted in this company",pass:pageOk},
  {label:openOnly?"Page-opening request (no additional action)":"Role grants this action on the selected page",pass:grantOk},
  {label:"Permitted record relationship",pass:recordOk}
 ];
 const fail=checks.find(x=>!x.pass);
 const kind=fail?"deny":policyNeeded?"review":"allow";
 const reason=fail?"Blocked in this example: "+fail.label.toLowerCase()+".":policyNeeded?
  "Page and action grants pass, but an independent policy or evidence check is still required before this sensitive or final action.":
  "The sample page, action, company, branch and record checks pass. A production server must still authorize each request.";
 const stageNote=targetPage.stage==="Planned"?" This screen is not implemented in Version 2 yet.":"";
 return {kind,reason:reason+stageNote,checks,employee:u,page:targetPage,branch:b,action:openOnly?"Open page":perms.find(p=>p.id===input.action)?.name||input.action,visibility:visibility(u,input.company,input.branch)};
}
function renderStats(){
 const figures=[
  ["Employee accounts",users.length,"All fictional staff profiles"],
  ["Active employees",users.filter(u=>u.status==="Active").length,"Able to log in after real setup"],
  ["Invited / inactive",users.filter(u=>u.status!=="Active").length,"Not allowed to log in"],
  ["Role templates",roles.length,"Multiple roles can be assigned"]
 ];
 $("summary-cards").innerHTML=figures.map(([a,b,c])=>'<div class="card ma3-stat"><span>'+a+'</span><strong>'+String(b).padStart(2,"0")+'</strong><small>'+c+'</small></div>').join("");
}
function filterUsers(){
 const f=state.filters;
 return users.filter(u=>{
  if(f.status!=="all"&&u.status!==f.status)return false;
  if(f.role!=="all"&&!isRoleMember(u,f.role,f.company==="all"?null:f.company))return false;
  if(f.company!=="all"&&!scopeEntities(u).includes(f.company))return false;
  const s=(u.name+" "+u.email+" "+u.id+" "+u.department).toLowerCase();
  if(f.q&&!s.includes(f.q.toLowerCase()))return false;
  return true;
 });
}
function renderUserRows(){
 const list=filterUsers();
 $("user-match-count").textContent=list.length+" "+(list.length===1?"employee":"employees");
 $("user-rows").innerHTML=list.length?list.map(u=>'<tr class="'+(u.id===state.selectedUser?'selected':'')+'"><td><b>'+esc(u.name)+'</b><small>'+esc(u.id)+' · '+esc(u.email)+'</small></td><td>'+roleChips(u)+'</td><td>'+shortScope(u)+'</td><td>'+badge(u.status)+'</td><td><button class="btn" type="button" data-select-user="'+esc(u.id)+'">View</button></td></tr>').join(""):'<tr><td colspan="5" class="ma3-empty">No employees match these filters.</td></tr>';
}
function renderProfile(){
 const u=userBy(state.selectedUser)||users[0];if(!u)return;
 const branches=scopeBranches(u);
 const scopedRoles=u.assignments.map(a=>(companyBy(a.companyId)?.name||a.companyId)+": "+a.roles.map(roleName).join(", ")+" ["+a.branches.map(id=>branchBy(id)?.name||id).join(", ")+"]").join(" | ");
 $("user-profile").innerHTML=
 '<div class="ma3-panel-title"><div><h2>Employee profile</h2><p class="muted">Identity, roles and access scope</p></div>'+badge(u.status)+'</div>'+
 '<div class="ma3-profile-content"><div class="ma3-profile-head"><div class="ma3-avatar">'+esc(u.name.split(" ").map(x=>x[0]).join("").slice(0,2))+'</div><div><h3>'+esc(u.name)+'</h3><p>'+esc(u.designation||u.department)+'</p></div></div>'+
 '<div class="ma3-key-values">'+
 ['Email',u.email,'Department',u.department,'Roles (all companies)',roleChips(u),'Roles by company',scopedRoles,'Legal entities',scopeEntities(u).map(id=>companyBy(id)?.name).join(", "),'Branches',branches.map(b=>b.companyName+" / "+b.name).join(", "),'Record visibility','Depends on selected company and role','Last updated',u.updated||"Not recorded"].reduce((out,item,i,arr)=>{
  if(i%2)return out;const label=arr[i],val=arr[i+1];return out+'<div class="ma3-kv"><label>'+esc(label)+'</label><strong>'+(label==="Roles (all companies)"?val:esc(val||"Not assigned"))+'</strong></div>';
 },"")+'</div>'+
 '<div class="ma3-profile-actions"><button type="button" class="btn primary" data-edit-user="'+esc(u.id)+'">Edit Employee &amp; Access</button><button type="button" class="btn" data-effective-user="'+esc(u.id)+'">Effective Permissions</button><button type="button" class="btn" data-preview-for="'+esc(u.id)+'">Preview Access</button><button type="button" class="btn" data-toggle-user="'+esc(u.id)+'">'+(u.status==="Active"?"Deactivate":u.status==="Invited"?"Invitation Details":"Reactivate")+' (demo)</button></div>'+
 '<p class="ma3-profile-note">This account belongs to the demo business tenant. Deactivation keeps historical employee and quotation references. Password setup uses secure invitations in the real system.</p></div>';
}
function renderAudit(){
 const entries=state.history;
 $("access-history").innerHTML='<div class="ma3-audit-list">'+(entries.length?
 entries.map(x=>'<div class="ma3-audit-event"><b>'+esc(x.title)+'</b><span>'+esc(x.detail)+'</span></div>').join(""):
 '<div class="ma3-empty">No access changes in this browser session. Demonstration edits will appear here until refresh.</div>')+'</div>';
}
function renderRoleList(){
 const roleRows=roles.map(r=>{
 const n=users.filter(u=>u.roles.includes(r.id)).length;
 return '<button type="button" class="ma3-role-option'+(r.id===state.selectedRole?' active':'')+'" data-select-role="'+esc(r.id)+'"><span><b>'+esc(r.name)+'</b><br><small>'+esc(r.system?"Built-in example":"Custom demo role")+'</small></span><span class="ma3-tag neutral">'+n+' users</span></button>';
 }).join("");
 $("role-list").innerHTML='<div class="ma3-role-list-items">'+roleRows+'</div>';
}
function renderRoleDetail(){
 const r=roleBy(state.selectedRole)||roles[0];if(!r)return;
 const allPageSections=[...new Set(pages.map(p=>p.section))];
 const pageBody=allPageSections.map(g=>'<section class="ma3-role-group"><h3>'+esc(g)+'</h3>'+
  pages.filter(p=>p.section===g).map(p=>{
   const enabled=r.pages.includes(p.id);
   return '<div class="ma3-page-row"><div><b>'+esc(p.name)+'</b><small>'+esc(p.code==='Planned'?"Planned screen":p.code)+' · '+esc(p.stage)+'</small></div>'+
    '<span class="ma3-tag '+(enabled?"good":"neutral")+'">'+(enabled?"✓ Can open":"— No page access")+'</span></div>';
  }).join("")+'</section>').join("");
 const actionBody=groups.map(g=>'<section class="ma3-role-group"><h3>'+esc(g)+'</h3>'+
  perms.filter(x=>x.group===g).map(x=>'<div class="ma3-perm-row"><label>'+esc(x.name)+(x.sensitive?' <span class="ma3-sensitive">· Restricted</span>':'')+'</label><span class="ma3-tag '+(r.perms.includes(x.id)?"good":"neutral")+'">'+(r.perms.includes(x.id)?"✓ Granted":"— No grant")+'</span></div>').join("")+'</section>').join("");
 const assignments=users.flatMap(u=>u.assignments.filter(a=>a.roles.includes(r.id)).map(a=>({name:u.name,status:u.status,company:companyBy(a.companyId)?.name||a.companyId,branches:a.branches.map(b=>branchBy(b)?.name||b)})));
 const effect=assignments.length?'<div class="ma3-assigned-list">'+assignments.map(a=>'<div class="ma3-page-row"><div><b>'+esc(a.name)+'</b><small>'+esc(a.company)+' / '+esc(a.branches.join(", "))+'</small></div>'+badge(a.status)+'</div>').join("")+'</div>':'<div class="ma3-empty">No employees assigned to this role in the sample.</div>';
 const impactBody='<div class="ma3-role-advice"><b>How the role applies</b><p>These permissions apply only where the employee has this role in a particular company and branch. Multiple roles combine within the assigned company, never across companies.</p></div>'+
  '<div class="ma3-impact-stats"><div><b>'+assignments.length+'</b><span>Company-role assignments</span></div><div><b>'+new Set(assignments.map(x=>x.name)).size+'</b><span>Employees using this role</span></div><div><b>'+esc(r.visibility)+'</b><span>Record visibility template</span></div></div>'+
  '<h3 class="ma3-impact-title">Who would be affected by a template change?</h3>'+effect;
 const views=[["pages","Page Access",r.pages.length+"/"+pages.length],["actions","Actions & Data",r.perms.length+"/"+perms.length],["impact","Scope & Impact",""]];
 const tabs='<div class="ma3-role-subtabs" role="tablist" aria-label="Role configuration details">'+views.map(([k,n,c])=>'<button type="button" role="tab" data-role-view="'+k+'" aria-selected="'+(state.roleView===k)+'" class="'+(state.roleView===k?'active':'')+'">'+esc(n)+(c?'<small>'+c+'</small>':'')+'</button>').join("")+'</div>';
 const configure=r.id==="master"?'<span class="ma3-tag neutral">Protected system example</span>':'<button type="button" class="btn primary" data-edit-role="'+esc(r.id)+'">Configure Permissions</button>';
 const copy='<button type="button" class="btn" data-copy-role="'+esc(r.id)+'">Copy as Custom Role</button>';
 $("role-detail").innerHTML='<div class="ma3-role-inner"><div class="ma3-role-header"><div><h2>'+esc(r.name)+'</h2><p>'+esc(r.description)+'</p></div><div class="ma3-role-controls">'+configure+copy+'</div></div>'+
  '<div class="ma3-role-meta"><span class="ma3-tag neutral">'+(r.system?"Built-in example":"Custom demo role")+'</span><span class="ma3-tag">'+r.pages.length+' page grants</span><span class="ma3-tag">'+r.perms.length+' action grants</span><span class="ma3-tag neutral">Record visibility: '+esc(r.visibility)+'</span></div>'+
  tabs+'<div class="ma3-role-view">'+(state.roleView==="pages"?pageBody:state.roleView==="actions"?actionBody:impactBody)+'</div>'+
  '<div class="ma3-inline-note"><b>Page access ≠ action permission.</b> Both are needed. Record ownership, company/branch assignment and protected financial/approval policies remain separate. Only MA-001, MA-002 and MA-003 are built so far; the other pages are planned.</div></div>';
}
function updatePreviewInputs(){
 const p=state.preview;
 $("check-user").innerHTML=users.map(u=>'<option value="'+esc(u.id)+'">'+esc(u.name)+' ('+esc(u.id)+')</option>').join("");
 $("check-page").innerHTML=pages.map(pg=>'<option value="'+esc(pg.id)+'">'+esc(pg.name)+(pg.stage==="Planned"?" (planned)":"")+'</option>').join("");
 const current=pageBy(p.page)||pages[0];p.page=current.id;
 if(p.action!=="__open__"&&!current.actions.includes(p.action))p.action="__open__";
 $("check-action").innerHTML='<option value="__open__">Open page only (no additional action)</option>'+current.actions.map(id=>'<option value="'+esc(id)+'">'+esc(perms.find(k=>k.id===id)?.name||id)+'</option>').join("");
 $("check-company").innerHTML=entities.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+'</option>').join("");
 if(!companyBy(p.company))p.company=entities[0].id;
 const available=companyBy(p.company).branches;
 if(!available.some(b=>b.id===p.branch))p.branch=available[0]?.id||"";
 $("check-branch").innerHTML=available.map(b=>'<option value="'+esc(b.id)+'">'+esc(b.name)+'</option>').join("");
 $("check-user").value=p.user;$("check-page").value=p.page;$("check-action").value=p.action;$("check-company").value=p.company;$("check-branch").value=p.branch;$("check-relation").value=p.relation;
}
function renderPreviewResult(){
 const result=assess(state.preview),u=userBy(state.preview.user);
 const outcome=result.kind==="deny"?"Would be denied":result.kind==="review"?"Requires policy check":"Passes example checks";
 const css=result.kind==="allow"?"good":"danger";
 const msg=result.kind==="review"?"Needs further review":outcome;
 $("preview-result").innerHTML='<div class="ma3-result-header"><span class="ma3-result-icon '+css+'">'+(result.kind==="allow"?"✓":result.kind==="review"?"!":"×")+'</span><div><h2>'+esc(msg)+'</h2><p>'+esc(u?.name||"No employee")+' · '+esc(perms.find(k=>k.id===state.preview.action)?.name||"Unknown action")+'</p></div></div>'+
 '<div class="ma3-preview-explanation"><b>Page:</b> '+esc(result.page?.name||"Not selected")+'<br>'+esc(result.reason)+'</div><h3 style="font-size:13px;margin:20px 0 15px">Illustrative access checks</h3><div class="ma3-checks">'+result.checks.map(x=>'<div class="ma3-check"><span>'+esc(x.label)+'</span><span class="ma3-tag '+(x.pass?"good":"danger")+'">'+(x.pass?"✓ Pass":"× Blocked")+'</span></div>').join("")+'</div>'+
 '<div class="ma3-inline-note">Selected record: '+esc(companyBy(state.preview.company)?.name||"—")+' / '+esc(branchBy(state.preview.branch)?.name||"—")+'. Record relationship: '+esc(state.preview.relation)+'. No real database record or financial data is accessed.</div>';
}
function render(){
 renderStats();
 for(const key of ["users","roles","preview"]){
  const on=state.panel===key;
  $("panel-"+key).hidden=!on;
  const b=$("tab-"+key);b.setAttribute("aria-selected",String(on));b.classList.toggle("active",on);
 }
 renderUserRows();renderProfile();renderAudit();renderRoleList();renderRoleDetail();updatePreviewInputs();renderPreviewResult();
}
window.CPQ_MA003={entities,users,roles,perms,pages,state,$,esc,roleBy,pageBy,userBy,companyBy,branchBy,scopeBranches,scopeEntities,assignmentsAt,roleIdsAt,granted,grantedPages,visibility,assess,render,filterUsers};
render();
})();