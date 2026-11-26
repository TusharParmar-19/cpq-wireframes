(()=>{
"use strict";
const O=window.CPQ_ORDERS,$=id=>document.getElementById(id),esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),money=x=>"₹"+Number(x||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}),stamp=()=>new Date().toLocaleString("en-GB");
let selected=new URLSearchParams(window.location.search).get("order")||"",timer;
const opt=(k,v=k)=>'<option value="'+esc(k)+'">'+esc(v)+'</option>';
const field=(k,v)=>'<div><small>'+esc(k)+'</small><b>'+esc(v||"Not supplied")+'</b></div>';
const rows=(arr)=>arr.map(([k,v,final])=>'<div class="order-total-row'+(final?" final":"")+'"><span>'+esc(k)+'</span><b>'+esc(v)+'</b></div>').join("");
const table=(headers,lines)=>'<div class="order-scroll"><table class="order-table"><thead><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+lines.join("")+'</tbody></table></div>';
const section=(title,html)=>'<section class="order-section"><h3>'+esc(title)+'</h3>'+html+'</section>';
function notice(msg){clearTimeout(timer);$("order-message").textContent=msg;$("order-message").hidden=false;timer=setTimeout(()=>$("order-message").hidden=true,5500);}
function filters(all){
 const company=$("order-company").value,branch=$("order-branch").value;
 const companies=new Map(all.map(o=>[o.companyId,o.snapshot.labels.seller]));
 $("order-company").innerHTML=opt("","All companies")+[...companies].map(([k,v])=>opt(k,v)).join("");
 $("order-company").value=companies.has(company)?company:"";
 const branches=new Map(all.filter(o=>!$("order-company").value||o.companyId===$("order-company").value).map(o=>[o.branchId,o.snapshot.labels.branch]));
 $("order-branch").innerHTML=opt("","All branches")+[...branches].map(([k,v])=>opt(k,v)).join("");$("order-branch").value=branches.has(branch)?branch:"";
}
function render(){
 const all=O.load().orders;filters(all);
 $("order-metrics").innerHTML=[["All orders",all.length],["Drafts",all.filter(o=>o.status==="Draft").length],["Registered / in progress",all.filter(o=>["Registered","In Progress"].includes(o.status)).length],["Completed",all.filter(o=>o.status==="Completed").length]].map(([l,v])=>'<div class="card order-metric"><small>'+esc(l)+'</small><strong>'+v+'</strong></div>').join("");
 const search=$("order-search").value.toLowerCase(),source=$("order-source").value,status=$("order-status").value,company=$("order-company").value,branch=$("order-branch").value;
 const list=all.filter(o=>(!source||o.source===source)&&(!status||o.status===status)&&(!company||o.companyId===company)&&(!branch||o.branchId===branch)&&[o.id,o.title,o.quoteId,o.reference,o.snapshot.labels.customer,o.snapshot.labels.buyer].join(" ").toLowerCase().includes(search));
 if(!list.some(o=>o.id===selected))selected=list[0]?.id||"";
 $("order-count").textContent=list.length+" shown";
 $("order-list").innerHTML=list.length?list.map(o=>'<button class="order-pick" data-order="'+esc(o.id)+'" aria-current="'+String(o.id===selected)+'"><strong>'+esc(o.id)+' · '+esc(o.title)+'</strong><small>'+esc(o.snapshot.labels.customer)+' · '+esc(o.source)+'</small><small>'+esc(o.status)+' · '+money(o.snapshot.calculation.total)+'</small></button>').join(""):'<div class="order-empty">No matching saved orders. Create a direct order or convert an accepted quotation.</div>';
 const o=list.find(x=>x.id===selected);$("order-detail").innerHTML=o?detail(o):'<div class="order-empty"><h2>Order details</h2>Select a saved order to review its contents.</div>';
}
function detail(o){
 const s=o.snapshot,q=s.quote,t=s.calculation,l=s.labels,c=t.commercial,netRows=c?.rows||[],gstRows=t.gst?.rows||[];
 const line=(id,name,qty,unit,rate,amount,included=false)=>{const g=gstRows.find(x=>x.id===id),d=netRows.find(x=>x.id===id);return '<tr><td><b>'+esc(name)+'</b><small>'+esc(included?"Included in parent":g?.tax?String(g.tax.code||"")+" · "+String(g.tax.rate??"")+"%":"")+'</small></td><td>'+esc(qty)+' '+esc(unit)+'</td><td>'+money(rate)+'</td><td>'+money(amount)+'</td><td>'+money(d?d.item+d.overall:0)+'</td><td>'+money(g?.gst||0)+'</td></tr>';};
 const items=(q.lines||[]).map(x=>line(x.id,x.description,x.quantity,x.unit||"",x.unitPrice,x.includedInParent?0:Number(x.quantity)*Number(x.unitPrice),x.includedInParent)).concat((t.publicRows||[]).map(x=>line(x.id,x.label,1,"Job",x.amount,x.amount)));
 const allowed=O.transitionMap[o.status]||[];
 return '<div class="order-head"><div><small>'+esc(o.id)+' · '+esc(o.source)+'</small><h2>'+esc(o.title)+'</h2><span class="ma6-tag">'+esc(o.status)+' (demo)</span></div><div class="order-actions">'+(o.quoteId?'<a class="btn" href="ma-006-quotations.html?quote='+encodeURIComponent(o.quoteId)+'&amp;tab=documents">View Source Quotation</a>':o.status==="Draft"?'<a class="btn primary" href="ma-006-quotations.html?action=direct-order&amp;order='+encodeURIComponent(o.id)+'">Edit Direct Order</a>':"")+'<a class="btn" href="ma-004-customers.html?customer='+encodeURIComponent(o.customerId)+'">View Customer</a></div></div>'+
 section("Order information",'<div class="order-fields">'+field("Customer",l.customer)+field("Buyer / bill-to",l.buyer)+field("Selling company",l.seller)+field("Branch",l.branch)+field("Responsible employee",l.owner)+field("Delivery site / project",[l.site,l.project].filter(Boolean).join(" / "))+field("Source quotation",o.quoteId?o.quoteId+" / "+o.quoteRev:"Direct order")+field("Customer acceptance reference",o.acceptance?.reference)+field("Order date",o.orderDate)+field("Customer PO / confirmation",o.reference)+field("Registration note",o.notes)+'</div>')+
 section("Products, services & charges",table(["Description","Qty","Rate excl. GST","Gross","Discount allocation","GST"],items)+
 '<div class="order-totals">'+rows([["Offer subtotal",money(t.subtotal)],["Total discounts","− "+money(t.discount)],["Net before GST",money(t.taxable)],["GST",money(t.tax)],...(t.gst?.region==="intra"?[["CGST",money(t.gst.cgst)],["SGST",money(t.gst.sgst)]]:t.gst?.region==="inter"?[["IGST",money(t.gst.igst)]]:[]),["Rounding",money(c?.rounding||0)],["Order value",money(t.total),true],...(c?.mode==="contribution"?[["Third-party contribution",money(c.contribution)],["Customer payable",money(c.customerPayable),true]]:c?.mode==="estimated"?[["Estimated subsidy (not deducted)",money(c.subsidy)],["Customer payable",money(c.customerPayable),true]]:[])])+'</div><details><summary>Internal commercial estimate (demo)</summary><div class="order-fields">'+field("Internal cost",money(t.totalCost))+field("Profit",money(t.profit))+field("Margin",t.margin==null?"Unavailable":Number(t.margin).toFixed(2)+"%")+'</div></details><p class="muted">Captured values, not recalculated from current master prices.</p>')+
 section("Commercial terms",'<div class="order-fields">'+field("Payment",q.payment)+field("Delivery",q.delivery)+field("Warranty",q.warranty)+field("Exclusions",q.exclusions)+'</div>')+
 section("Order registration & status",allowed.length?'<form class="order-form" id="order-status-form"><div><label>Next status</label><select name="status" id="next-status">'+allowed.map(x=>opt(x)).join("")+'</select></div><div id="order-ref-wrap"><label>Customer PO / confirmation reference</label><input name="reference" maxlength="120" placeholder="PO-DEMO-001"></div><div id="order-date-wrap"><label>Registration date</label><input name="date" type="date" value="'+O.today()+'" max="'+O.today()+'"></div><div class="full"><label>Notes / cancellation reason</label><textarea name="note" rows="2" maxlength="500"></textarea></div><button class="btn primary" type="submit">Save Status (demo)</button></form><p class="muted">Registered commercial details stay locked. Completion is a simulated tracking status only.</p>':'<div class="order-note">Final status: '+esc(o.status)+'. Commercial snapshot and history retained.</div>')+
 section("Document references",o.documents.length?table(["Type","Reference","Date","Note"],o.documents.map(d=>'<tr><td>'+esc(d.kind)+'</td><td>'+esc(d.reference)+'</td><td>'+esc(d.date)+'</td><td>'+esc(d.note)+'</td></tr>')):'<p class="muted">No references recorded.</p>')+
 (o.status!=="Cancelled"?'<form id="order-document-form" class="order-form"><div><label>Document type</label><select name="kind"><option>Customer PO</option><option>Order confirmation</option><option>Delivery reference</option><option>Completion evidence</option><option>Other</option></select></div><div><label>Reference</label><input name="reference" maxlength="120" required></div><div><label>Date</label><input name="date" type="date" required value="'+O.today()+'" max="'+O.today()+'"></div><div><label>Notes</label><input name="note" maxlength="500"></div><button class="btn" type="submit">Add Reference</button></form><p class="muted">Metadata only; no actual file upload or document issuance.</p>':"")+
 section("Order history",o.events.slice().reverse().map(e=>'<div class="order-event"><b>'+esc(e.action)+'</b><small>'+esc(e.at)+'</small><p>'+esc(e.comment)+'</p></div>').join(""));
}
function showRegistration(){const sel=$("next-status");if(!sel)return;const yes=sel.value==="Registered";$("order-ref-wrap").hidden=!yes;$("order-date-wrap").hidden=!yes;}
$("order-status").innerHTML+=O.statuses.map(x=>opt(x)).join("");
for(const id of ["order-search","order-source","order-status","order-company","order-branch"])$(id).addEventListener(id==="order-search"?"input":"change",()=>{render();showRegistration();});
$("order-list").addEventListener("click",e=>{const b=e.target.closest("[data-order]");if(b){selected=b.dataset.order;render();showRegistration();}});
$("order-detail").addEventListener("change",e=>{if(e.target.id==="next-status")showRegistration();});
$("order-detail").addEventListener("submit",e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));try{if(e.target.id==="order-status-form"){if(!window.confirm("Save "+d.status+" for "+selected+" in this demo?"))return;O.update(selected,d.status,d,stamp());}else if(e.target.id==="order-document-form")O.addDocument(selected,d,stamp());else return;render();showRegistration();notice("Order record saved.");}catch(err){notice(err.message);}});
render();showRegistration();
})();
