/* Public wireframe only. Fictional session selector, NOT authentication. */
(function(W){
"use strict";
const SESSION="cpq-wireframes-v2-demo-session-v1", STORE="cpq-wireframes-v2-shared-demo-v1";
const operational=["ma-001-dashboard.html","ma-002-organization.html","ma-003-users-roles.html","ma-004-customers.html","ma-005-opportunities.html","ma-006a-configuration.html","ma-006-quotations.html","ma-007-orders.html","service-master.html","vendor-master.html","vendor-quotations.html","commercial-settings.html","reports.html","approval-policies.html","product-rules.html","product-rules-phase3-preview.html"];
const seed={users:W.CPQ_MA003_USERS||[],roles:W.CPQ_MA003_ROLES||[],entities:W.CPQ_MA002_DATA||[]};
const pages=W.CPQ_MA003_PAGE_CATALOG||[], permissions=W.CPQ_MA003_PERMISSIONS||[];
const list=x=>Array.isArray(x)?x:[];
const PENDING="Pending first login";
function normalizeUser(u){return {...u,status:u.status==="Invited"?PENDING:u.status,credentialVersion:Number.isSafeInteger(u.credentialVersion)&&u.credentialVersion>=0?u.credentialVersion:0};}
function samplePassword(u,following=false){if(!u)return "";const v=normalizeUser(u);return "CPQ-DEMO-"+v.id+"-"+(following||v.status!==PENDING?"PASS":"TEMP")+"-"+(v.credentialVersion+(following?1:0));}
function accountEvent(u,action,actor){u.updated=new Date().toISOString();u.accountEvents=[{action,actor,at:u.updated},...list(u.accountEvents)].slice(0,30);return u;}
function data(){
 let m={};try{const d=JSON.parse(W.localStorage.getItem(STORE)||"null");if(d?.schema===1)m=d.modules||{};}catch(_){}
 return Object.fromEntries(Object.keys(seed).map(k=>[k,k==="users"?(Array.isArray(m[k])?m[k]:seed[k]).map(normalizeUser):Array.isArray(m[k])?m[k]:seed[k]]));
}
function user(id,d=data()){return d.users.find(u=>u.id===id)||null;}
function scope(u,d=data()){
 if(!u||u.status!=="Active")return [];
 return d.entities.filter(e=>e.status==="Active").flatMap(e=>list(e.branches).filter(b=>b.status==="Active").map(b=>{
  const ids=[...new Set(list(u.assignments).filter(a=>a.companyId===e.id&&list(a.branches).includes(b.id)).flatMap(a=>list(a.roles)))];
  return {companyId:e.id,company:e.name,branchId:b.id,branch:b.name,roles:d.roles.filter(r=>ids.includes(r.id))};
 }).filter(x=>x.roles.length));
}
function master(u,d=data()){return scope(u,d).some(x=>x.roles.some(r=>r.id==="master"));}
function session(){try{const raw=W.localStorage.getItem(SESSION);if(!raw)return null;const s=JSON.parse(raw);return s&&typeof s.id==="string"&&Number.isSafeInteger(s.version)?s:null;}catch(_){return null;}}
function sessionUser(status,setup){const s=session(),u=s&&user(s.id);return u?.status===status&&u.credentialVersion===s.version&&s.setup===setup?u:null;}
function current(){return sessionUser("Active",false);}
function setupUser(){return sessionUser(PENDING,true);}
function setSession(u,setup){try{const raw=JSON.stringify({id:u.id,version:u.credentialVersion,setup});W.localStorage.setItem(SESSION,raw);return W.localStorage.getItem(SESSION)===raw;}catch(_){return false;}}
function signIn(login,password){const d=data(),id=String(login||"").trim().toLowerCase(),u=d.users.find(x=>String(x.email||"").toLowerCase()===id&&!!id||String(x.id).toLowerCase()===id);
 if(!u||!["Active",PENDING].includes(u.status)||password!==samplePassword(u))return {ok:false,error:"Sample login ID or password is incorrect, or the account is disabled. Ask Master Admin for demo login details."};
 const setup=u.status===PENDING;if(!setSession(u,setup))return {ok:false,error:"Browser storage is unavailable. Demo sign-in could not be saved."};
 return {ok:true,setup,master:!setup&&master(u,d),working:!setup&&(master(u,d)||workspaceScopes(u,d).length>0)};
}
function signOut(){try{W.localStorage.removeItem(SESSION);return !W.localStorage.getItem(SESSION);}catch(_){return false;}}
function changePassword(oldCode,newCode){
 const pending=setupUser(),u=pending||current();
 if(!u)return {ok:false,error:"Sign in again before changing the demo password."};
 if(!pending&&oldCode!==samplePassword(u))return {ok:false,error:"Current sample password is incorrect."};
 if(newCode!==samplePassword(u,true))return {ok:false,error:"Use the displayed next sample password. Never enter a real password."};
 try{
  const raw=W.localStorage.getItem(STORE),doc=raw?JSON.parse(raw):{schema:1,modules:{}};
  if(doc.schema!==1||!doc.modules||typeof doc.modules!=="object")throw Error("Invalid demo storage");
  const users=Array.isArray(doc.modules.users)?doc.modules.users:seed.users;
  const idx=users.findIndex(x=>x.id===u.id),latest=idx>=0?normalizeUser(users[idx]):null;
  if(!latest||latest.status!==u.status||latest.credentialVersion!==u.credentialVersion)return {ok:false,error:"Account changed. Sign in again."};
  const updated=accountEvent({...latest,status:"Active",credentialVersion:latest.credentialVersion+1},pending?"First login completed":"Own demo password changed",latest.name+" (demo)");
  doc.modules.users=users.map((x,i)=>i===idx?updated:x);doc.updatedAt=new Date().toISOString();
  const payload=JSON.stringify(doc);if(payload.length>3800000)throw Error("Demo storage limit");
  W.localStorage.setItem(STORE,payload);if(W.localStorage.getItem(STORE)!==payload)throw Error("Save failed");
  const signedIn=setSession(updated,false);if(!signedIn)signOut();
  return {ok:true,signedIn,working:signedIn&&(master(updated)||workspaceScopes(updated).length>0)};
 }catch(_){return {ok:false,error:"Could not save the demo account. No real password was stored."};}
}
function resetAccount(u,allUsers,mode="reset"){
 const actor=current();if(!actor||!isMaster()||!u||actor.id===u.id)return {ok:false,error:"Only Master Admin can change another employee's account. Use your own profile for your password."};
 const old=normalizeUser(u);
 if(old.status==="Active"&&master(old)&&!allUsers.some(x=>x.id!==u.id&&master(x)))return {ok:false,error:"Keep at least one active Master Admin."};
 if(mode==="reset"&&!["Active",PENDING].includes(old.status))return {ok:false,error:"Reactivate this account first."};
 if(mode==="disable"&&!["Active",PENDING].includes(old.status))return {ok:false,error:"Account is already disabled."};
 if(mode==="reactivate"&&!["Inactive","Locked"].includes(old.status))return {ok:false,error:"Account is not disabled."};
 if(!["reset","disable","reactivate"].includes(mode))return {ok:false,error:"Unknown account action."};
 const status=mode==="disable"?"Inactive":PENDING;
 const record=accountEvent({...old,status,credentialVersion:old.credentialVersion+1},mode==="disable"?"Account deactivated":mode==="reactivate"?"Account reactivated; temporary password generated":"Temporary password reset",actor.name+" (demo)");
 return {ok:true,record};
}
function safeNext(value){return typeof value==="string"&&operational.includes(value.split(/[?#]/)[0])?value:"ma-001-dashboard.html";}
const recordActions=new Set(["customers.view","customers.create","customers.edit","customers.archive","opportunities.view","opportunities.create","opportunities.edit","opportunities.close","quotes.view","quotes.create","quotes.edit","quotes.duplicate","quotes.pdf","quotes.issue","quotes.dispatch","quotes.response","rfq.view","rfq.create","rfq.send","rfq.compare","documents.view","documents.upload","documents.download","documents.delete","orders.view","orders.edit","orders.register","records.archive","selling.view","cost.view","margin.view","discount.approve","approvals.view","approvals.decide"]);
const policyActions=new Set(["discount.approve","approvals.decide","orders.register","quotes.pdf","quotes.issue","rfq.send","documents.delete","reports.export","records.archive","bank.view","commercial.manage","customers.archive"]);
function assess(id,companyId,branchId,pageId,action="__open__",relation="own",d=data()){
 const u=user(id,d),p=pages.find(x=>x.id===pageId),s=scope(u,d).find(x=>x.companyId===companyId&&x.branchId===branchId);
 const roles=s?.roles||[],visibility=["all","team","assigned","own"].find(v=>roles.some(r=>r.visibility===v))||"none";
 const checks=[
 ["Active employee",u?.status==="Active"],["Assigned active company and branch",!!s],["Page grant",!!p&&roles.some(r=>list(r.pages).includes(pageId))],
 ["Action grant",action==="__open__"||!!p&&list(p.actions).includes(action)&&roles.some(r=>list(r.perms).includes(action))],
 ["Master Admin account management",pageId!=="users"||master(u,d)],
 ["Record relationship",action==="__open__"||!recordActions.has(action)||visibility==="all"||visibility==="team"&&["own","assigned","team"].includes(relation)||visibility==="assigned"&&["own","assigned"].includes(relation)||visibility==="own"&&relation==="own"]
 ];
 const fail=checks.find(c=>!c[1]);
 return {kind:fail?"deny":p.stage==="Planned"?"planned":policyActions.has(action)?"review":"allow",reason:fail?"Blocked: "+fail[0]+".":p.stage==="Planned"?"Page deferred or not implemented.":policyActions.has(action)?"Grant matches; independent policy or evidence check still needed.":"Example grants match. No business action is performed.",checks,visibility};
}
const bundles=W.CPQ_MA003_DEMO_BUNDLES||{};
const dashboard="ma-001-dashboard.html",fileOf=v=>String(v||"").split(/[?#]/)[0];
function isMaster(){return master(current());}
function allowedScopes(file,u=current(),d=data()){
 const b=bundles[fileOf(file)];if(!b||!u)return [];
 return scope(u,d).filter(s=>s.roles.some(r=>r.visibility==="all")&&b.pages.every(id=>s.roles.some(r=>list(r.pages).includes(id)))&&[b.grant,...b.actions].every(id=>s.roles.some(r=>list(r.perms).includes(id))));
}
function workspaceScopes(u=current(),d=data()){
 return [...new Map(Object.keys(bundles).flatMap(f=>allowedScopes(f,u,d)).map(s=>[s.companyId+"|"+s.branchId,s])).values()];
}
function canOpen(value,u=current(),d=data()){
 const f=fileOf(value);if(!u||u.status!=="Active"||!operational.includes(f))return false;
 if(master(u,d))return true;
 if(f===dashboard)return workspaceScopes(u,d).length>0;
 if(f==="ma-006-quotations.html"&&/(?:[?&])action=direct-order(?:[&#]|$)/.test(String(value)))return false;
 return allowedScopes(f,u,d).length>0;
}
function canRecord(file,r,u=current(),d=data()){return master(u,d)||!!r&&allowedScopes(file,u,d).some(s=>s.companyId===r.companyId&&s.branchId===r.branchId);}
function organizationsFor(file,org,u=current(),d=data()){
 if(master(u,d))return org;
 const ss=fileOf(file)===dashboard?workspaceScopes(u,d):allowedScopes(file,u,d);
 return list(org).map(e=>({...e,branches:list(e.branches).filter(b=>ss.some(s=>s.companyId===e.id&&s.branchId===b.id))})).filter(e=>e.branches.length);
}
function customerVisible(file,c){return isMaster()||list(c?.links).some(l=>canRecord(file,l));}
function canWriteModule(name){if(isMaster())return true;const f=({catalog:"ma-006a-configuration.html",configurations:"ma-006a-configuration.html",quotations:"ma-006-quotations.html"})[name];return !!f&&canOpen(f);}
function operatorTemplate(){const bs=Object.values(bundles);return {name:"CPQ Operator",description:"Maintain shared fictional products and prepare scoped configurations and quotation drafts. Master Admin retains accounts, review decisions, dispatch and orders.",visibility:"all",pages:[...new Set(bs.flatMap(b=>b.pages))],perms:[...new Set(bs.flatMap(b=>[b.grant,...b.actions]))],system:false};}
function route(mode,next){const u=current(),pending=setupUser();if(mode==="login")return null;if(mode==="password")return u||pending?null:"login.html";if(pending)return "change-password.html";if(!u)return "login.html"+(mode==="workspace"?"?next="+encodeURIComponent(safeNext(next)):"");if(mode==="workspace"&&!canOpen(next,u))return "account.html?blocked="+encodeURIComponent(fileOf(safeNext(next)));return null;}

W.CPQ_DEMO_ACCESS={SESSION,STORE,data,user,scope,master,current,signIn,signOut,safeNext,assess,route,pages,permissions,isMaster,bundles,allowedScopes,workspaceScopes,canOpen,canRecord,organizationsFor,customerVisible,canWriteModule,operatorTemplate,PENDING,normalizeUser,samplePassword,setupUser,changePassword,resetAccount,accountEvent};
const doc=W.document,mode=doc?.currentScript?.dataset?.mode;if(!mode)return;
const next=()=>W.location.pathname.split("/").pop()+W.location.search+W.location.hash;
function check(){const dest=route(mode,next());if(dest){doc.documentElement.style.visibility="hidden";W.location.replace(dest);return false;}return true;}
if(!check())return;
if(mode==="workspace"&&!isMaster())doc.documentElement.classList.add("cpq-operator");
const signature=()=>JSON.stringify(Object.keys(bundles).map(f=>allowedScopes(f).map(s=>[s.companyId,s.branchId])));
const accessSignature=signature();
W.addEventListener("pageshow",check);
W.addEventListener("storage",e=>{if(e.key===SESSION||e.key===STORE||e.key===null){if(!check())return;let accountsChanged=false;if(e.key===STORE&&mode==="workspace"&&fileOf(next())==="ma-003-users-roles.html"){try{const before=JSON.parse(e.oldValue||"{}").modules||{},after=JSON.parse(e.newValue||"{}").modules||{};accountsChanged=JSON.stringify([before.users,before.roles])!==JSON.stringify([after.users,after.roles]);}catch(_){accountsChanged=true;}}if(e.key===SESSION||e.key===null||signature()!==accessSignature||accountsChanged)W.location.reload();}});
if(mode==="workspace")doc.addEventListener("DOMContentLoaded",()=>{
 if(!check())return;
 const u=current(),admin=isMaster(),avatar=doc.querySelector(".top .avatar");
 if(!admin){
  function restrictLinks(root){
   const links=[...(root.matches?.("a[href]")?[root]:[]),...(root.querySelectorAll?.("a[href]")||[])];
   for(const link of links){const target=link.getAttribute("href");if(operational.includes(fileOf(target))&&!canOpen(target))link.hidden=true;}
  }
  restrictLinks(doc);
  if(W.MutationObserver)new W.MutationObserver(entries=>{for(const entry of entries)for(const node of entry.addedNodes)if(node.nodeType===1)restrictLinks(node);}).observe(doc.body,{childList:true,subtree:true});
  for(const section of doc.querySelectorAll(".sidebar nav .nav-title")){let n=section.nextElementSibling,show=false;while(n&&!n.classList.contains("nav-title")){if(!n.hidden&&n.matches("a"))show=true;n=n.nextElementSibling;}if(!show)section.hidden=true;}
  for(const el of doc.querySelectorAll(".sidebar .logo small"))el.textContent="CPQ Workspace";
  const foot=doc.querySelector(".sidebar-foot");if(foot)foot.textContent="Employee workspace · Fictional demo only";
  const main=doc.querySelector("main,.content,.page");if(main){const n=doc.createElement("div");n.className="info cpq-operator-notice";n.textContent="Working employee demo: shared fictional catalog and assigned-scope quotation/configuration records. Master Admin handles accounts, review, dispatch and orders. No real security.";const hero=main.querySelector(".hero");if(hero)hero.insertAdjacentElement("afterend",n);else main.prepend(n);}
 }
 if(!avatar)return;
 const wrap=doc.createElement("details");wrap.className="cpq-account-menu";
 const summary=doc.createElement("summary");summary.className="cpq-account-trigger";summary.setAttribute("aria-label","Open demo account menu");
 const name=doc.createElement("span");name.className="cpq-account-name";name.textContent=u.name+" (demo)";
 const mark=doc.createElement("span");mark.className="avatar";mark.textContent=u.name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"MA";
 summary.append(name,mark);wrap.append(summary);
 const panel=doc.createElement("div");panel.className="cpq-account-panel";
 const info=doc.createElement("p");info.textContent=(admin?"Master Admin":"Employee")+" workspace · fictional session";panel.append(info);
 const profile=doc.createElement("a");profile.href="account.html";profile.textContent="My profile & access";panel.append(profile);
 const password=doc.createElement("a");password.href="change-password.html";password.textContent="Change password (demo)";panel.append(password);
 const logout=doc.createElement("button");logout.type="button";logout.textContent="Sign out (demo)";
 logout.addEventListener("click",()=>{if(signOut())W.location.replace("login.html");else W.alert("Could not clear the demo session. Check browser storage.");});panel.append(logout);
 wrap.append(panel);avatar.replaceWith(wrap);
 doc.addEventListener("click",e=>{if(!wrap.contains(e.target))wrap.open=false;});
 doc.addEventListener("keydown",e=>{if(e.key==="Escape"&&wrap.open){wrap.open=false;summary.focus();}});
},{once:true});
})(window);
