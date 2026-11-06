/* MA-003 sample rendering and permission reasoning — not an authentication engine. */
(()=>{
"use strict";
const entities=window.CPQ_MA002_DATA.map(e=>({id:e.id,name:e.name,branches:e.branches.map(b=>({id:b.id,name:b.name,city:b.city,status:b.status}))}));
const users=window.CPQ_MA003_USERS.map(u=>({...u,roles:[...u.roles],branches:[...u.branches]}));
const roles=window.CPQ_MA003_ROLES.map(r=>({...r,perms:[...r.perms]}));
const perms=window.CPQ_MA003_PERMISSIONS.map(p=>({...p}));
const state={panel:"users",selectedUser:"U002",selectedRole:"sales",filters:{q:"",role:"all",company:"all",status:"all"},preview:{user:"U002",action:"quotes.view",company:"e1",branch:"e1a",relation:"own"},history:[]};
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const roleBy=id=>roles.find(r=>r.id===id);
const userBy=id=>users.find(u=>u.id===id);
const companyBy=id=>entities.find(e=>e.id===id);
const branchBy=id=>entities.flatMap(e=>e.branches.map(b=>({...b,companyId:e.id,companyName:e.name}))).find(b=>b.id===id);
const roleName=id=>roleBy(id)?.name||"Unknown role";
const allBranches=()=>entities.flatMap(e=>e.branches.map(b=>({id:b.id,name:b.name,companyId:e.id,companyName:e.name})));
const scopeBranches=u=>u.branches.includes("*")?allBranches():u.branches.map(id=>branchBy(id)).filter(Boolean);
const scopeEntities=u=>[...new Set(scopeBranches(u).map(b=>b.companyId))];
const scopeShort=u=>{
 if(u.branches.includes("*"))return "All 3 tenant entities / 5 branches (sample grant)";
 const labels=scopeBranches(u);
 const ent=scopeEntities(u);
 return ent.length+" "+(ent.length===1?"company":"companies")+" / "+labels.length+" "+(labels.length===1?"branch":"branches");
};
const granted=u=>new Set(u.roles.flatMap(id=>roleBy(id)?.perms||[]));
const visibility=u=>{
 const v=u.roles.map(id=>roleBy(id)?.visibility||"own");
 for(const x of ["all","team","assigned","own"])if(v.includes(x))return x;
 return "own";
};
const isRoleMember=(u,id)=>u.roles.includes(id);
const badge=(v)=>'<span class="ma3-tag '+(v==="Active"?"good":v==="Invited"?"warn":v==="Inactive"?"danger":"neutral")+'">'+esc(v)+'</span>';
const roleChips=u=>'<span class="ma3-badges">'+u.roles.map(id=>'<span class="ma3-tag">'+esc(roleName(id))+'</span>').join("")+'</span>';
const shortScope=u=>{
 if(u.branches.includes("*"))return '<b>All tenant branches</b><small>Explicit demo-wide assignment</small>';
 const b=scopeBranches(u);const ent=scopeEntities(u);
 return '<b>'+esc(ent.map(id=>companyBy(id)?.name||id).join(", "))+'</b><small>'+esc(b.map(x=>x.name).join(", "))+'</small>';
};
const groups=[...new Set(perms.map(p=>p.group))];
function assess(input){
 const u=userBy(input.user),b=branchBy(input.branch);
 if(!u||!b)return {kind:"deny",reason:"Choose a valid employee and branch.",checks:[]};
 const tenantOk=true; // The sample selector contains this one demo business account only.
 const locationOk=b.companyId===input.company&&(u.branches.includes("*")||u.branches.includes(input.branch));
 const activeOk=u.status==="Active";
 const grantOk=granted(u).has(input.action);
 const recordActions=["customers.view","customers.create","opportunities.view","opportunities.create","quotes.view","quotes.create","quotes.edit","quotes.pdf","rfq.view","rfq.create","documents.view","documents.upload","orders.view","orders.register","records.archive"];
 const related=()=>{
  if(!recordActions.includes(input.action))return true;
  const v=visibility(u),rel=input.relation;
  if(v==="all")return true;
  if(v==="team")return ["own","assigned","team"].includes(rel);
  if(v==="assigned")return ["own","assigned"].includes(rel);
  return rel==="own";
 };
 const recordOk=related();
 const policyNeeded=input.action==="discount.approve"||input.action==="orders.register"||input.action==="quotes.pdf";
 const checks=[
  {label:"Active employee account",pass:activeOk},
  {label:"Correct business account (demo tenant)",pass:tenantOk},
  {label:"Assigned legal entity and branch",pass:locationOk},
  {label:"One of the employee's roles grants this action",pass:grantOk},
  {label:"Permitted record relationship",pass:recordOk}
 ];
 const fail=checks.find(x=>!x.pass);
 const kind=fail?"deny":policyNeeded?"review":"allow";
 const reason=fail?"Blocked in this example: "+fail.label.toLowerCase()+".":policyNeeded?
  "Role and branch checks pass, but additional issuance, registration or approval policy must be verified before the action is permitted.":
  "The sample role, branch and record checks pass. A production server must still authorize the request.";
 return {kind,reason,checks,employee:u,branch:b,action:perms.find(p=>p.id===input.action)?.name||input.action,visibility:visibility(u)};
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
  if(f.role!=="all"&&!isRoleMember(u,f.role))return false;
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
 $("user-profile").innerHTML=
 '<div class="ma3-panel-title"><div><h2>Employee profile</h2><p class="muted">Identity, roles and access scope</p></div>'+badge(u.status)+'</div>'+
 '<div class="ma3-profile-content"><div class="ma3-profile-head"><div class="ma3-avatar">'+esc(u.name.split(" ").map(x=>x[0]).join("").slice(0,2))+'</div><div><h3>'+esc(u.name)+'</h3><p>'+esc(u.designation||u.department)+'</p></div></div>'+
 '<div class="ma3-key-values">'+
 ['Email',u.email,'Department',u.department,'Role assignments',roleChips(u),'Legal entities',scopeEntities(u).map(id=>companyBy(id)?.name).join(", "),'Branches',u.branches.includes("*")?"All tenant branches (explicit grant)":branches.map(b=>b.name).join(", "),'Record visibility example',visibility(u).toUpperCase(),'Last updated',u.updated||"Not recorded"].reduce((out,item,i,arr)=>{
  if(i%2)return out;const label=arr[i],val=arr[i+1];return out+'<div class="ma3-kv"><label>'+esc(label)+'</label><strong>'+(label==="Role assignments"?val:esc(val||"Not assigned"))+'</strong></div>';
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
 const byGroup=groups.map(g=>{
 const p=perms.filter(x=>x.group===g);
 return '<section class="ma3-role-group"><h3>'+esc(g)+'</h3>'+p.map(x=>'<div class="ma3-perm-row"><label>'+esc(x.name)+(x.sensitive?' <span class="ma3-sensitive">· Restricted</span>':'')+'</label><span class="ma3-tag '+(r.perms.includes(x.id)?"good":"neutral")+'">'+(r.perms.includes(x.id)?"✓ Granted":"— No grant")+'</span></div>').join("")+'</section>';
 }).join("");
 $("role-detail").innerHTML='<div class="ma3-role-inner"><div class="ma3-role-header"><div><h2>'+esc(r.name)+'</h2><p>'+esc(r.description)+'</p></div>'+(!r.system?'<button type="button" class="btn" data-edit-role="'+esc(r.id)+'">Edit Custom Role</button>':'<button type="button" class="btn" data-copy-role="'+esc(r.id)+'">Copy as Custom Role</button>')+'</div>'+
 '<div class="ma3-role-meta"><span class="ma3-tag neutral">'+(r.system?"Built-in example":"Custom demo")+'</span><span class="ma3-tag">'+r.perms.length+' capability grants</span><span class="ma3-tag neutral">Record visibility: '+esc(r.visibility)+'</span></div>'+byGroup+
 '<div class="ma3-inline-note"><b>Role ≠ record access.</b> Even a granted action is restricted by assigned company/branch and record ownership. Approvals, quote issuance and order registration need their separate policy checks.</div></div>';
}
function updatePreviewInputs(){
 const p=state.preview;
 $("check-user").innerHTML=users.map(u=>'<option value="'+esc(u.id)+'">'+esc(u.name)+' ('+esc(u.id)+')</option>').join("");
 $("check-action").innerHTML=perms.map(k=>'<option value="'+esc(k.id)+'">'+esc(k.name)+'</option>').join("");
 $("check-company").innerHTML=entities.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+'</option>').join("");
 if(!companyBy(p.company))p.company=entities[0].id;
 const available=companyBy(p.company).branches;
 if(!available.some(b=>b.id===p.branch))p.branch=available[0]?.id||"";
 $("check-branch").innerHTML=available.map(b=>'<option value="'+esc(b.id)+'">'+esc(b.name)+'</option>').join("");
 $("check-user").value=p.user;$("check-action").value=p.action;$("check-company").value=p.company;$("check-branch").value=p.branch;$("check-relation").value=p.relation;
}
function renderPreviewResult(){
 const result=assess(state.preview),u=userBy(state.preview.user);
 const outcome=result.kind==="deny"?"Would be denied":result.kind==="review"?"Requires policy check":"Passes example checks";
 const css=result.kind==="allow"?"good":"danger";
 const msg=result.kind==="review"?"Needs further review":outcome;
 $("preview-result").innerHTML='<div class="ma3-result-header"><span class="ma3-result-icon '+css+'">'+(result.kind==="allow"?"✓":result.kind==="review"?"!":"×")+'</span><div><h2>'+esc(msg)+'</h2><p>'+esc(u?.name||"No employee")+' · '+esc(perms.find(k=>k.id===state.preview.action)?.name||"Unknown action")+'</p></div></div>'+
 '<div class="ma3-preview-explanation">'+esc(result.reason)+'</div><h3 style="font-size:13px;margin:20px 0 15px">Illustrative access checks</h3><div class="ma3-checks">'+result.checks.map(x=>'<div class="ma3-check"><span>'+esc(x.label)+'</span><span class="ma3-tag '+(x.pass?"good":"danger")+'">'+(x.pass?"✓ Pass":"× Blocked")+'</span></div>').join("")+'</div>'+
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
window.CPQ_MA003={entities,users,roles,perms,state,$,esc,roleBy,userBy,companyBy,branchBy,scopeBranches,scopeEntities,granted,visibility,assess,render,filterUsers};
render();
})();