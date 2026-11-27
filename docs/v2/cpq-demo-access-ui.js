(function(){
"use strict";
const A=window.CPQ_DEMO_ACCESS,$=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function opts(el,arr,value){el.replaceChildren(...arr.map(([id,name])=>new Option(name,id)));if(arr.some(x=>x[0]===value))el.value=value;}
const params=new URLSearchParams(location.search);
if($("demo-login")){
 const d=A.data(),u=A.current(),chosen=$("demo-user"),id=$("demo-login-id"),pw=$("demo-password"),fill=$("demo-fill-sample");
 opts(chosen,[["","Choose a sample account"],...d.users.map(x=>[x.id,x.name+" · "+x.status])],u?.id||d.users.find(x=>A.master(x,d))?.id||"");
 function detail(){const x=A.user(chosen.value);id.value=x?.email||"";pw.value="";fill.disabled=!x||x.status!=="Active"||x.credentialVersion!==0;$("demo-user-detail").textContent=!x?"Choose a fictional account.":x.status===A.PENDING?"First login required. Enter the temporary sample password supplied by Master Admin.":x.status!=="Active"?"This account cannot sign in.":fill.disabled?"Enter your current sample password. Ask Master Admin to reset it if needed.":A.master(x)?"Master Admin sample account. Use the fill button to test.":"Existing active sample account. Use the fill button to test.";}
 chosen.addEventListener("change",()=>{detail();$("demo-login-error").textContent="";});detail();
 fill.addEventListener("click",()=>{const x=A.user(chosen.value);if(x?.status==="Active"&&x.credentialVersion===0){id.value=x.email;pw.value=A.samplePassword(x);}});
 if(u||A.setupUser())$("demo-current-session").textContent="Signing in as another employee replaces the current demo session.";
 $("demo-login").addEventListener("submit",e=>{e.preventDefault();const r=A.signIn(id.value,pw.value);if(!r.ok){$("demo-login-error").textContent=r.error;return;}pw.value="";const next=A.safeNext(params.get("next"));location.replace(r.setup?"change-password.html?next="+encodeURIComponent(next):r.working?(A.canOpen(next)?next:"ma-001-dashboard.html"):"account.html");});
 return;
}
if($("demo-change-password")){
 const pending=A.setupUser(),u=pending||A.current();if(!u)return;
 $("password-title").textContent=pending?"Set your password on first login":"Change your password";
 $("password-description").textContent=pending?"Complete the mandatory password change before accessing CPQ.":"Replace your current fictional sample password.";
 $("password-current-row").hidden=!!pending;$("password-current").required=!pending;
 const nextCode=A.samplePassword(u,true);$("password-next-sample").textContent=nextCode;
 $("password-fill").addEventListener("click",()=>{$("password-new").value=nextCode;$("password-confirm").value=nextCode;});
 $("password-exit").addEventListener("click",()=>{if(A.signOut())location.replace("login.html");});
 $("demo-change-password").addEventListener("submit",e=>{
  e.preventDefault();const code=$("password-new").value,err=$("password-error");if(code!==$("password-confirm").value){err.textContent="Sample passwords do not match.";return;}
  const result=A.changePassword($("password-current").value,code);if(!result.ok){err.textContent=result.error;return;}
  $("password-current").value="";$("password-new").value="";$("password-confirm").value="";
  $("demo-change-password").hidden=true;$("password-success").hidden=false;$("password-saved-code").textContent=nextCode;
  const next=A.safeNext(params.get("next"));$("password-continue").href=!result.signedIn?"login.html":result.working?(A.canOpen(next)?next:"ma-001-dashboard.html"):"account.html";$("password-continue").textContent=result.signedIn?"Continue to CPQ":"Sign in with your new sample password";
 });
 return;
}
const d=A.data(),u=A.current();if(!u)return;const scopes=A.scope(u,d),master=A.master(u,d);
$("account-title").textContent=u.name;$("account-subtitle").textContent=master?"Master Admin demo account":A.canOpen("ma-001-dashboard.html")?"Working employee demo account":"Employee access preview · fictional session";
const working=A.canOpen("ma-001-dashboard.html");$("account-home").hidden=!working;$("account-home").textContent=master?"Open Master Admin Dashboard":"Open CPQ Dashboard";$("account-manage").hidden=!master;
$("account-notice").textContent=(params.has("blocked")&&!master?"The requested page is not available to this demo employee. ":"")+(master?"Master Admin has full access to the working Phase 1 demonstration, including fictional commercial values. The table below shows assigned role grants separately; it does not grant real financial or security permissions.":(working?"Complete working modules are available. Combined screens require every listed module capability; catalog data is shared. This is not production security.":"This employee has permission preview only. Master Admin can assign complete working-module grants."));
const box=$("account-working-modules");if(box)for(const [f,b] of Object.entries(A.bundles)){const p=document.createElement("p");p.textContent=b.label+" — "+(A.canOpen(f)?"Working demo available":"No complete working-module grant");if(A.canOpen(f)){const link=document.createElement("a");link.href=f;link.textContent=" · Open";p.append(link);}box.append(p);}
$("account-details").innerHTML=[["Employee ID",u.id],["Email (sample)",u.email],["Status",u.status],["Designation",u.designation],["Department",u.department],["Role(s) across assignments",[...new Set(scopes.flatMap(s=>s.roles.map(r=>r.name)))].join(", ")||"None"]].map(([k,v])=>"<div><dt>"+esc(k)+"</dt><dd>"+esc(v||"Not supplied")+"</dd></div>").join("");
$("account-scopes").innerHTML=scopes.map(s=>"<tr><td>"+esc(s.company)+"</td><td>"+esc(s.branch)+"</td><td>"+esc(s.roles.map(r=>r.name).join(", "))+"</td></tr>").join("")||'<tr><td colspan="3">No active location assignments.</td></tr>';
$("demo-signout").addEventListener("click",()=>{if(A.signOut())location.replace("login.html");else $("account-notice").textContent="Could not clear the demo session. Check browser storage.";});
const company=$("access-company"),branch=$("access-branch"),page=$("access-page"),action=$("access-action"),relation=$("access-relation");
const names={allow:"Passes example checks",deny:"Blocked in preview",planned:"Planned / deferred",review:"Requires policy or evidence"};
function assess(pg,act){return A.assess(u.id,company.value,branch.value,pg,act,relation.value);}
function result(){const r=assess(page.value,action.value),node=$("access-result");node.dataset.kind=r.kind;node.innerHTML="<strong>"+esc(names[r.kind])+"</strong><p>"+esc(r.reason)+"</p><ul class='cpq-access-checks'>"+r.checks.map(c=>"<li>"+esc(c[0])+" — "+(c[1]?"Pass":"Blocked")+"</li>").join("")+"</ul><p class='cpq-access-meta'>Record visibility: "+esc(r.visibility)+". Example only.</p>";}
function actionOptions(){const p=A.pages.find(p=>p.id===page.value);opts(action,[["__open__","Open page only"],...(p?.actions||[]).map(id=>[id,A.permissions.find(a=>a.id===id)?.name||id])],action.value);result();}
function matrix(){const s=scopes.find(x=>x.companyId===company.value&&x.branchId===branch.value);$("access-pages").innerHTML=A.pages.map(p=>{const r=assess(p.id,"__open__");const grants=r.kind==="deny"?[]:p.actions.filter(a=>s?.roles.some(r=>r.perms.includes(a)));return "<tr><td>"+esc(p.name)+"</td><td>"+esc(names[r.kind])+"</td><td>"+esc(grants.map(id=>A.permissions.find(a=>a.id===id)?.name||id).join("; ")||"None")+"</td></tr>";}).join("");actionOptions();}
function branches(){opts(branch,scopes.filter(s=>s.companyId===company.value).map(s=>[s.branchId,s.branch]),branch.value);matrix();}
opts(company,[...new Map(scopes.map(s=>[s.companyId,s.company]))],scopes[0]?.companyId);
opts(page,A.pages.map(p=>[p.id,p.name]),master?"dashboard":"quote-register");
company.addEventListener("change",branches);branch.addEventListener("change",matrix);page.addEventListener("change",actionOptions);action.addEventListener("change",result);relation.addEventListener("change",result);branches();
if(!scopes.length){company.disabled=true;branch.disabled=true;}
})();
