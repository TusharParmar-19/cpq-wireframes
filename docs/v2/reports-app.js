(function(){
"use strict";
const $=id=>document.getElementById(id), esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cash=x=>x==null?"Not available":"₹"+Number(x).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}), pct=x=>x==null?"Not available":x.toFixed(2)+"%";
let tab="orders",s=window.CPQ_REPORTS.source();
const tabs={customers:"Customers",enquiries:"Enquiries",quotations:"Quotations",orders:"Orders",activity:"Activity logs"};
const defs={customers:[["id","Customer ID"],["title","Customer"],["type","Type"],["status","Status"],["owner","Owner"],["company","Company"],["branch","Branch"]],
 enquiries:[["id","Enquiry ID"],["title","Enquiry"],["customer","Customer"],["status","Stage"],["source","Source"],["date","Received"],["owner","Owner"],["company","Company"],["branch","Branch"]],
 quotations:[["id","Quotation"],["revision","Revision"],["title","Title"],["customer","Customer"],["status","Outcome / status"],["total","Quote total (demo)",cash],["company","Company"],["branch","Branch"]],
 orders:[["id","Order"],["title","Title"],["customer","Customer"],["source","Source"],["status","Status"],["date","Registered on"],["total","Order value",cash],["net","Net excl. GST",cash],["cost","Est. cost",cash],["profit","Est. profit",cash],["margin","Margin",pct],["company","Company"],["branch","Branch"]],
 activity:[["date","Recorded time"],["module","Module"],["id","Reference"],["revision","Revision"],["action","Action"],["actor","Recorded actor"],["detail","Detail"],["company","Company"],["branch","Branch"]]};
function options(el,values,placeholder){const old=el.value;el.replaceChildren(new Option(placeholder,""),...values.map(x=>new Option(x.label,x.id)));if(Array.from(el.options).some(x=>x.value===old))el.value=old;}
function setup(){options($("report-company"),s.entities.map(e=>({id:e.id,label:e.name})),"All companies");branches();}
function branches(){const co=$("report-company").value;options($("report-branch"),s.entities.filter(e=>!co||e.id===co).flatMap(e=>(e.branches||[]).map(b=>({id:b.id,label:(co?"":e.name+" / ")+b.name}))),"All branches");}
function card(label,value,note){return '<div class="card report-stat"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note)+'</small></div>';}
function render(){
 const f={company:$("report-company").value,branch:$("report-branch").value},r=window.CPQ_REPORTS.build(s,f),m=r.metrics;
 $("report-counts").innerHTML=card("Customers",m.customers,"Unique accounts in scope")+card("Enquiries",m.enquiries,"All saved stages")+card("Quotations",m.quotations,"Current revisions only")+card("Orders",m.orders,m.registered+" registered or later · "+m.completed+" completed");
 $("report-finance").innerHTML=card("Registered order value (incl. GST)",cash(m.orderValue),m.pricedCount+" orders · drafts and cancelled excluded")+card("Net selling value (excl. GST)",cash(m.net),"Cost-known registered orders only")+card("Estimated costs",cash(m.cost),m.knownCount+" of "+m.registered+" orders have complete estimates")+card("Estimated profit / margin",cash(m.profit),pct(m.margin)+" · weighted by net sale; not realized profit");
 $("report-tabs").querySelectorAll("button").forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
 const filterKey=tab==="activity"?"module":"status",all=r[tab];
 options($("report-status"),Array.from(new Set(all.map(x=>x[filterKey]).filter(Boolean))).sort().map(v=>({id:v,label:v})),tab==="activity"?"All modules":"All statuses");
 const status=$("report-status").value,q=$("report-search").value.trim().toLowerCase();
 const rows=all.filter(row=>(!status||row[filterKey]===status)&&(!q||Object.values(row).some(v=>String(v??"").toLowerCase().includes(q))));
 $("report-heading").textContent=tabs[tab]+" report";
 $("report-note").textContent=tab==="activity"?"Existing recorded events only. Customer and settings events have no branch attribution and appear only in the all-company/all-branch view. Actor or timestamp may be unavailable. Not a complete or tamper-proof audit log.":tab==="orders"?"Order totals come from the saved commercial snapshot, not current master rates. No payment collection or invoice revenue is inferred.":tab==="quotations"?"One current revision per quotation; sample statuses and simulated outcomes are distinguished. Provisional totals are labeled. Quotation totals are not counted as order sales.":"Records use saved master data and the selected company / branch.";
 $("report-row-count").textContent=rows.length+" of "+all.length+" records in scope";
 $("report-table").innerHTML="<thead><tr>"+defs[tab].map(d=>"<th>"+esc(d[1])+"</th>").join("")+"<th>Open</th></tr></thead><tbody>"+(rows.length?rows.map(row=>"<tr>"+defs[tab].map(([key,label,fmt])=>"<td>"+esc(fmt?fmt(row[key]):row[key]||"—")+(key==="total"&&row.provisional?'<small>Provisional</small>':"")+"</td>").join("")+'<td><a class="btn" href="'+esc(row.url)+'">View</a></td></tr>').join(""):'<tr><td colspan="'+(defs[tab].length+1)+'">No records match the selected filters.</td></tr>')+"</tbody>";
}
$("report-tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-tab]");if(!b)return;tab=b.dataset.tab;$("report-status").value="";$("report-search").value="";render();});
$("report-company").addEventListener("change",()=>{$("report-branch").value="";branches();render();});
$("report-branch").addEventListener("change",render);$("report-status").addEventListener("change",render);$("report-search").addEventListener("input",render);
$("report-clear").addEventListener("click",()=>{$("report-company").value="";$("report-branch").value="";$("report-status").value="";$("report-search").value="";branches();render();});
$("report-refresh").addEventListener("click",()=>{s=window.CPQ_REPORTS.source();setup();render();});
window.addEventListener("storage",()=>{s=window.CPQ_REPORTS.source();setup();render();});
setup();render();
})();