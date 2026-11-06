/* MA-001 — prototype interactions; no backend actions. */
(()=>{
"use strict";
const m=window.CPQ_MA001,{d,$,esc,state,scoped,branches,render}=m;
let previousFocus=null;
function open(title,subtitle,html){
 previousFocus=document.activeElement;
 $("modal-title").textContent=title;
 $("modal-subtitle").textContent=subtitle;
 $("modal-body").innerHTML=html;
 $("overlay").classList.add("open");
 $("overlay").setAttribute("aria-hidden","false");
 $("modal-close").focus();
}
function close(){
 $("overlay").classList.remove("open");
 $("overlay").setAttribute("aria-hidden","true");
 $("modal-body").innerHTML="";
 if(previousFocus?.isConnected)previousFocus.focus();
}
function recordList(data){
 if(!data.length)return '<div class="empty"><b>No matching sample records</b>Choose another company or branch.</div>';
 return data.map(r=>'<div class="item"><b>'+esc(r[1])+'</b><small>'+esc(r[0])+(r[4]?' · '+esc(r[4]):'')+(r[5]?' · '+esc(r[5]):'')+'</small></div>').join("");
}
function preview(key){
 const filter=x=>scoped(x);
 const set={
 employees:["Active employees",filter(d.employees).filter(r=>r[4]==="Active")],
 customers:["Customers",filter(d.customers)],
 opportunities:["Opportunities",filter(d.opportunities)],
 active:["Active opportunities",filter(d.opportunities).filter(r=>["New","In Discussion","Quote Preparation"].includes(r[4]))],
 quotations:["Quotations",filter(d.quotations)],
 drafts:["Draft quotations",filter(d.quotations).filter(r=>r[4]==="Draft")],
 approvals:["Awaiting approval",filter(d.quotations).filter(r=>r[4]==="Awaiting Approval")],
 orders:["Registered orders",filter(d.orders)]
 };
 if(key==="entities"){
 const entities=d.entities.filter(e=>state.entity==="all"||e.id===state.entity);
 open("Legal entities","Fictional organization scope",entities.map(e=>'<div class="item"><b>'+esc(e.name)+'</b><small>'+e.branches.length+' branches in sample master</small></div>').join("")+'<div class="message">The full company setup page will be MA-002.</div>');return;
 }
 if(key==="branches"){
 const branchesInScope=d.entities.filter(e=>state.entity==="all"||e.id===state.entity).flatMap(e=>e.branches.filter(b=>state.branch==="all"||b[0]===state.branch).map(b=>'<div class="item"><b>'+esc(b[1])+'</b><small>'+esc(e.name)+'</small></div>'));
 open("Branches","Fictional branches in selected scope",branchesInScope.join("")+'<div class="message">Branch administration will be MA-002.</div>');return;
 }
 const value=set[key];if(!value)return;
 open(value[0],value[1].length+" accessible sample records",recordList(value[1])+'<div class="message">This is only a record preview. We will develop register pages separately; clicking here cannot alter business data.</div>');
}
$("entity").addEventListener("change",e=>{state.entity=e.target.value;state.branch="all";branches();render()});
$("branch").addEventListener("change",e=>{state.branch=e.target.value;render()});
$("task-filter").addEventListener("change",e=>{state.type=e.target.value;render()});
$("reset").addEventListener("click",()=>{state.entity="all";state.branch="all";state.type="all";$("entity").value="all";$("task-filter").value="all";branches();render()});
document.addEventListener("click",e=>{
 const target=e.target.closest("[data-view],[data-planned],[data-task],[data-event]");
 if(!target)return;
 if(target.dataset.view){preview(target.dataset.view);return;}
 if(target.dataset.planned){open(target.dataset.name,"Planned screen — not yet built",'<div class="message">'+esc(target.dataset.planned)+' will be designed and approved in our page-by-page V2 process. No records are created or changed.</div>');return;}
 if(target.dataset.task){
 const item=scoped(d.tasks,3,4).find(r=>r[0]===target.dataset.task);
 if(item)open(item[1]+" · "+item[2],item[7],'<div class="item"><b>Responsible</b><small>'+esc(item[5])+'</small></div><div class="message">Read-only task example. This does not grant approval or access permission.</div>');
 return;
 }
 const event=scoped(d.activities,3,4).find(r=>r[0]===target.dataset.event);
 if(event)open(event[1],event[2],'<div class="item"><b>Actor and time</b><small>'+esc(event[5])+' · '+esc(event[6])+'</small></div><div class="message">Illustrative activity, not a production audit log.</div>');
});
$("modal-close").addEventListener("click",close);
$("modal-done").addEventListener("click",close);
$("overlay").addEventListener("click",e=>{if(e.target===$("overlay"))close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("overlay").classList.contains("open"))close()});
})();