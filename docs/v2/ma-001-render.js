(()=>{
"use strict";
const d=window.CPQ_MA001_DEMO,$=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={entity:"all",branch:"all",type:"all"};
const legal=id=>d.entities.find(e=>e.id===id)?.name||"";
const branchName=(e,id)=>d.entities.find(x=>x.id===e)?.branches.find(b=>b[0]===id)?.[1]||"";
const scoped=(rows,ei=2,bi=3)=>rows.filter(r=>(state.entity==="all"||r[ei]===state.entity)&&(state.branch==="all"||r[bi]===state.branch));
const tile=(name,n,desc,key,icon)=>'<button type="button" class="card stat" data-view="'+key+'"><span>'+esc(name)+' <span style="float:right;color:#3575a2">'+icon+'</span></span><strong>'+String(n).padStart(2,"0")+'</strong><small>'+esc(desc)+'</small><em>View sample records →</em></button>';
function branches(){
 const list=d.entities.filter(e=>state.entity==="all"||e.id===state.entity).flatMap(e=>e.branches.map(b=>[b[0],(state.entity==="all"?e.name+" / ":"")+b[1]]));
 if(!list.some(x=>x[0]===state.branch))state.branch="all";
 $("branch").innerHTML='<option value="all">All authorized branches</option>'+list.map(x=>'<option value="'+esc(x[0])+'">'+esc(x[1])+'</option>').join("");
 $("branch").value=state.branch;
}
function render(){
 const entities=d.entities.filter(e=>state.entity==="all"||e.id===state.entity);
 const employees=scoped(d.employees),customers=scoped(d.customers),opp=scoped(d.opportunities),quotes=scoped(d.quotations),orders=scoped(d.orders);
 const tasks=scoped(d.tasks,3,4).filter(t=>state.type==="all"||t[1]===state.type),activities=scoped(d.activities,3,4);
 const branchCount=entities.reduce((n,e)=>n+e.branches.filter(b=>state.branch==="all"||b[0]===state.branch).length,0);
 $("scope-label").textContent=state.branch==="all"?(state.entity==="all"?"All authorized entities":legal(state.entity)):branchName(state.entity,state.branch);
 $("scope-help").textContent="Fictional records for "+(state.entity==="all"?"all example companies":legal(state.entity))+(state.branch==="all"?"":" / "+branchName(state.entity,state.branch))+".";
 $("org-stats").innerHTML=tile("Legal entities",entities.length,"Companies in current scope","entities","▤")+tile("Branches",branchCount,"Operating branches in scope","branches","⌁")+tile("Active employees",employees.filter(x=>x[4]==="Active").length,"Active user accounts","employees","♙")+tile("Customers",customers.length,"Customer master records","customers","◉");
 $("business-stats").innerHTML=tile("Active opportunities",opp.filter(x=>["New","In Discussion","Quote Preparation"].includes(x[4])).length,"New / discussing / preparing","active","◇")+tile("Draft quotations",quotes.filter(x=>x[4]==="Draft").length,"Working customer drafts","drafts","▣")+tile("Awaiting approval",quotes.filter(x=>x[4]==="Awaiting Approval").length,"Needs authorized reviewer","approvals","✓")+tile("Registered orders",orders.length,"Direct and accepted-quote","orders","☷");
 $("tasks-count").textContent=tasks.length+" items";
 $("task-rows").innerHTML=tasks.length?tasks.map(t=>'<tr><td><b>'+esc(t[1])+'</b><small>'+esc(t[2])+' · '+esc(t[7])+'</small></td><td>'+esc(legal(t[3]))+'<small>'+esc(branchName(t[3],t[4]))+'</small></td><td>'+esc(t[5])+'</td><td><span class="priority '+(t[6]==="High"?"high":"")+'">'+esc(t[6])+'</span></td><td><button type="button" class="btn" data-task="'+esc(t[0])+'">View</button></td></tr>').join(""):'<tr><td colspan="5"><div class="empty"><b>No matching tasks</b>Try a different company, branch or task type.</div></td></tr>';
 $("quotes-count").textContent=quotes.length+" quotations";
 $("pipeline").innerHTML=[["Draft","#558fb9"],["Awaiting Approval","#dba768"],["Sent","#77a6c7"],["Won","#389b89"]].map(s=>{
  const n=quotes.filter(q=>q[4]===s[0]).length;
  return '<div class="pipe"><div class="pipe-label"><span>'+esc(s[0])+'</span><b>'+n+'</b></div><div class="track"><div class="bar" style="width:'+(100*n/Math.max(1,quotes.length))+'%;background:'+s[1]+'"></div></div></div>';
 }).join("");
 $("activity-count").textContent=activities.length+" events";
 $("activity-list").innerHTML=activities.length?activities.map(a=>'<div class="event"><b>'+esc(a[1])+'</b><p>'+esc(a[2])+' · '+esc(legal(a[3]))+' / '+esc(branchName(a[3],a[4]))+'</p><small>'+esc(a[5])+' · '+esc(a[6])+'</small> <button type="button" class="btn" data-event="'+esc(a[0])+'">View</button></div>').join(""):'<div class="empty"><b>No activity</b>No examples in this scope.</div>';
}
$("entity").innerHTML+=d.entities.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+'</option>').join("");
branches();render();
window.CPQ_MA001={d,$,esc,state,legal,branchName,scoped,branches,render};
})();