(()=>{
"use strict";
const P=window.CPQ_POLICY,$=id=>document.getElementById(id),m=P.masters(),esc=P.esc;
const opts=(arr,v)=>arr.map(([k,l])=>'<option value="'+esc(k)+'"'+(k===v?' selected':'')+'>'+esc(l)+'</option>').join("");
$("policy-company").innerHTML=opts([["","All companies (global)"],...m.entities.map(e=>[e.id,e.name])],"");
for(const id of ["technical-role","commercial-role","escalation-role"])$(id).innerHTML=opts([["","Select role"],...m.roles.map(r=>[r.id,r.name])],"");
function branches(){const e=m.entities.find(e=>e.id===$("policy-company").value);$("policy-branch").innerHTML=opts([["","All branches"],...(e?.branches||[]).map(b=>[b.id,b.name])],"");$("policy-branch").disabled=!e;}
function load(){
 const companyId=$("policy-company").value,branchId=$("policy-branch").value,p=P.applicable({companyId,branchId});
 $("policy-name").value=p.id===P.scopeId(companyId,branchId)?p.name:(branchId?"Branch approval policy":companyId?"Company approval policy":"Global approval policy");
 for(const [id,key] of [["max-discount","maxDiscount"],["min-margin","minMargin"],["max-total","maxTotal"],["technical-role","technicalRole"],["commercial-role","commercialRole"],["escalation-role","escalationRole"]])$(id).value=p[key];
 for(const [id,key] of [["manual-rate","manualRate"],["tax-override","taxOverride"],["contribution","contribution"]])$(id).checked=!!p[key];
 $("policy-source").textContent=(p.id===P.scopeId(companyId,branchId)?"Current scope: ":"Inherited: ")+p.name+" · v"+p.version+(p.version?"":" (unsaved defaults)");
 $("policy-message").textContent="";
 const list=P.load().policies.slice().reverse();
 $("policy-history").innerHTML=list.length?'<table><thead><tr><th>Version</th><th>Policy / scope</th><th>Discount / margin</th><th>Invoice limit</th><th>Saved</th></tr></thead><tbody>'+list.map(x=>'<tr><td>v'+x.version+'</td><td>'+esc(x.name)+'<br><small>'+esc(x.id)+'</small></td><td>'+esc(x.maxDiscount)+'% / '+esc(x.minMargin)+'%</td><td>'+P.money(x.maxTotal)+'</td><td>'+esc(x.updatedAt)+'</td></tr>').join("")+'</tbody></table>':"No saved policy versions yet.";
}
$("policy-company").addEventListener("change",()=>{branches();load();});$("policy-branch").addEventListener("change",load);
$("policy-form").addEventListener("submit",e=>{e.preventDefault();try{const p=P.savePolicy({companyId:$("policy-company").value,branchId:$("policy-branch").value,name:$("policy-name").value.trim(),maxDiscount:$("max-discount").value,minMargin:$("min-margin").value,maxTotal:$("max-total").value,technicalRole:$("technical-role").value,commercialRole:$("commercial-role").value,escalationRole:$("escalation-role").value,manualRate:$("manual-rate").checked,taxOverride:$("tax-override").checked,contribution:$("contribution").checked});load();$("policy-message").textContent="Saved policy v"+p.version+" in this browser.";}catch(err){$("policy-message").textContent=err.message;}});
branches();load();
const queue=window.CPQ_SHARED.read().modules.quotations?.quotations||[];
const active=queue.filter(q=>q.demoApproval).sort((a,b)=>Number(b.demoApproval.state==="In review")-Number(a.demoApproval.state==="In review"));
$("policy-queue").innerHTML=active.length?'<table><thead><tr><th>Quotation / revision</th><th>Review state</th><th>Captured policy</th><th>Next stage</th><th></th></tr></thead><tbody>'+active.map(q=>{const d=q.demoApproval,s=d.route?.stages?.find(x=>d[x.key]==="Pending");return '<tr><td><b>'+esc(q.id)+' / '+esc(q.rev)+'</b><br>'+esc(q.title)+'</td><td>'+esc(d.state)+'</td><td>'+esc(d.route?d.route.policy.name+" · v"+d.route.policy.version:"Legacy demo")+'</td><td>'+esc(d.state==="In review"?s?.label||"Legacy review":"—")+'</td><td><a class="btn" href="ma-006-quotations.html?quote='+encodeURIComponent(q.id)+'&amp;tab=approvals">Open review</a></td></tr>';}).join("")+'</tbody></table>':"No demo approval submissions yet. Open a saved quotation to evaluate and submit its review.";
})();
