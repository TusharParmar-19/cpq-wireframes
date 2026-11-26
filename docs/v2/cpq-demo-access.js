/* Public wireframe only. Fictional session selector, NOT authentication. */
(function(W){
"use strict";
const SESSION="cpq-wireframes-v2-demo-session-v1", STORE="cpq-wireframes-v2-shared-demo-v1";
const operational=["ma-001-dashboard.html","ma-002-organization.html","ma-003-users-roles.html","ma-004-customers.html","ma-005-opportunities.html","ma-006a-configuration.html","ma-006-quotations.html","ma-007-orders.html","service-master.html","vendor-master.html","vendor-quotations.html","commercial-settings.html","reports.html","approval-policies.html","product-rules.html","product-rules-phase3-preview.html"];
const seed={users:W.CPQ_MA003_USERS||[],roles:W.CPQ_MA003_ROLES||[],entities:W.CPQ_MA002_DATA||[]};
const pages=W.CPQ_MA003_PAGE_CATALOG||[], permissions=W.CPQ_MA003_PERMISSIONS||[];
const list=x=>Array.isArray(x)?x:[];
function data(){
 let m={};try{const d=JSON.parse(W.localStorage.getItem(STORE)||"null");if(d?.schema===1)m=d.modules||{};}catch(_){}
 return Object.fromEntries(Object.keys(seed).map(k=>[k,Array.isArray(m[k])?m[k]:seed[k]]));
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
function sessionId(){try{return W.localStorage.getItem(SESSION)||"";}catch(_){return "";}}
function current(){const d=data(),u=user(sessionId(),d);return u?.status==="Active"?u:null;}
function signIn(id){const d=data(),u=user(id,d);if(!u||u.status!=="Active")return {ok:false,error:"Choose an active fictional employee. Invited or inactive accounts cannot enter."};try{W.localStorage.setItem(SESSION,u.id);if(sessionId()!==u.id)throw Error();}catch(_){return {ok:false,error:"Browser storage is unavailable. Demo sign-in could not be saved."};}return {ok:true,master:master(u,d)};}
function signOut(){try{W.localStorage.removeItem(SESSION);return !sessionId();}catch(_){return false;}}
function safeNext(value){return typeof value==="string"&&operational.includes(value.split(/[?#]/)[0])?value:"ma-001-dashboard.html";}
const recordActions=new Set(["customers.view","customers.create","customers.edit","customers.archive","opportunities.view","opportunities.create","opportunities.edit","opportunities.close","quotes.view","quotes.create","quotes.edit","quotes.duplicate","quotes.pdf","quotes.issue","quotes.dispatch","quotes.response","rfq.view","rfq.create","rfq.send","rfq.compare","documents.view","documents.upload","documents.download","documents.delete","orders.view","orders.edit","orders.register","records.archive","selling.view","cost.view","margin.view","discount.approve","approvals.view","approvals.decide"]);
const policyActions=new Set(["discount.approve","approvals.decide","orders.register","quotes.pdf","quotes.issue","rfq.send","documents.delete","reports.export","records.archive","bank.view","commercial.manage","customers.archive"]);
function assess(id,companyId,branchId,pageId,action="__open__",relation="own",d=data()){
 const u=user(id,d),p=pages.find(x=>x.id===pageId),s=scope(u,d).find(x=>x.companyId===companyId&&x.branchId===branchId);
 const roles=s?.roles||[],visibility=["all","team","assigned","own"].find(v=>roles.some(r=>r.visibility===v))||"none";
 const checks=[
 ["Active employee",u?.status==="Active"],["Assigned active company and branch",!!s],["Page grant",!!p&&roles.some(r=>list(r.pages).includes(pageId))],
 ["Action grant",action==="__open__"||!!p&&list(p.actions).includes(action)&&roles.some(r=>list(r.perms).includes(action))],
 ["Record relationship",action==="__open__"||!recordActions.has(action)||visibility==="all"||visibility==="team"&&["own","assigned","team"].includes(relation)||visibility==="assigned"&&["own","assigned"].includes(relation)||visibility==="own"&&relation==="own"]
 ];
 const fail=checks.find(c=>!c[1]);
 return {kind:fail?"deny":p.stage==="Planned"?"planned":policyActions.has(action)?"review":"allow",reason:fail?"Blocked: "+fail[0]+".":p.stage==="Planned"?"Page deferred or not implemented.":policyActions.has(action)?"Grant matches; independent policy or evidence check still needed.":"Example grants match. No business action is performed.",checks,visibility};
}
function route(mode,next){const u=current();if(mode==="login")return null;if(!u)return "login.html"+(mode==="workspace"?"?next="+encodeURIComponent(safeNext(next)):"");if(mode==="workspace"&&!master(u))return "account.html?blocked="+encodeURIComponent(safeNext(next).split(/[?#]/)[0]);return null;}
W.CPQ_DEMO_ACCESS={SESSION,STORE,data,user,scope,master,current,signIn,signOut,safeNext,assess,route,pages,permissions};
const doc=W.document,mode=doc?.currentScript?.dataset?.mode;if(!mode)return;
const next=()=>W.location.pathname.split("/").pop()+W.location.search+W.location.hash;
function check(){const dest=route(mode,next());if(dest){doc.documentElement.style.visibility="hidden";W.location.replace(dest);return false;}return true;}
if(!check())return;
W.addEventListener("pageshow",check);
W.addEventListener("storage",e=>{if(e.key===SESSION||e.key===STORE||e.key===null){if(!check())return;if(e.key===SESSION||e.key===null)W.location.reload();}});
if(mode==="workspace")doc.addEventListener("DOMContentLoaded",()=>{
 if(!check())return;
 const u=current(),avatar=doc.querySelector(".top .avatar");if(!avatar)return;
 const wrap=doc.createElement("details");wrap.className="cpq-account-menu";
 const summary=doc.createElement("summary");summary.className="cpq-account-trigger";summary.setAttribute("aria-label","Open demo account menu");
 const name=doc.createElement("span");name.className="cpq-account-name";name.textContent=u.name+" (demo)";
 const mark=doc.createElement("span");mark.className="avatar";mark.textContent=u.name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"MA";
 summary.append(name,mark);wrap.append(summary);
 const panel=doc.createElement("div");panel.className="cpq-account-panel";
 const info=doc.createElement("p");info.textContent="Master Admin workspace · fictional session";panel.append(info);
 const profile=doc.createElement("a");profile.href="account.html";profile.textContent="My profile & access";panel.append(profile);
 const logout=doc.createElement("button");logout.type="button";logout.textContent="Sign out (demo)";
 logout.addEventListener("click",()=>{if(signOut())W.location.replace("login.html");else W.alert("Could not clear the demo session. Check browser storage.");});panel.append(logout);
 wrap.append(panel);avatar.replaceWith(wrap);
 doc.addEventListener("click",e=>{if(!wrap.contains(e.target))wrap.open=false;});
 doc.addEventListener("keydown",e=>{if(e.key==="Escape"&&wrap.open){wrap.open=false;summary.focus();}});
},{once:true});
})(window);
