(function(){
"use strict";
const A=window.CPQ_DEMO_ACCESS,$=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function opts(el,arr,value){el.replaceChildren(...arr.map(([id,name])=>new Option(name,id)));if(arr.some(x=>x[0]===value))el.value=value;}
const params=new URLSearchParams(location.search);
if($("demo-login")){
 const d=A.data(),u=A.current();opts($("demo-user"),d.users.map(x=>[x.id,x.name+" · "+x.status]),u?.id||d.users.find(x=>A.master(x,d))?.id||d.users.find(x=>x.status==="Active")?.id);
 function detail(){const x=A.user($("demo-user").value);$("demo-user-detail").textContent=x?(x.status!=="Active"?"This account cannot sign in.":A.master(x)?"Opens the full Master Admin demo.":"Opens the assigned role and branch access preview."):"No fictional employee selected.";}
 $("demo-user").addEventListener("change",()=>{detail();$("demo-login-error").textContent="";});detail();
 if(u)$("demo-current-session").textContent="Selecting another active employee replaces the current demo session in this browser.";
 $("demo-login").addEventListener("submit",e=>{e.preventDefault();const r=A.signIn($("demo-user").value);if(!r.ok){$("demo-login-error").textContent=r.error;return;}location.replace(r.master?A.safeNext(params.get("next")):"account.html");});
 return;
}
const d=A.data(),u=A.current();if(!u)return;const scopes=A.scope(u,d),master=A.master(u,d);
$("account-title").textContent=u.name;$("account-subtitle").textContent=master?"Master Admin demo account":"Employee access preview · fictional session";
$("account-home").hidden=!master;$("account-manage").hidden=!master;
$("account-notice").textContent=(params.has("blocked")&&!master?"The requested working page is reserved for the Master Admin demo. ":"")+(master?"Master Admin has full access to the working Phase 1 demonstration, including fictional commercial values. The table below shows assigned role grants separately; it does not grant real financial or security permissions.":"Other employee sessions demonstrate only role and branch grants. Operational staff screens and real access enforcement are not implemented in Phase 1.");
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
