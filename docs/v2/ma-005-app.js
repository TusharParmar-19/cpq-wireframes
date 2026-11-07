/* MA-005 · Opportunitites and Enquiries: read-only presentation and shared demo state. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const source=window.CPQ_MA005_DATA;
const db=JSON.parse(JSON.stringify(source));
const master=window.CPQ_MA004_DATA;
const org=window.CPQ_MA002_DATA;
const staff=window.CPQ_MA003_USERS;
const quoteData=window.CPQ_MA001_DEMO.quotations;
const state={selected:"OP-2026-008",tab:"overview",company:"all",branch:"all",stage:"all",priority:"all",owner:"all",query:"",history:[]};
const opp=id=>db.opportunities.find(x=>x.id===id);
const customer=id=>master.customers.find(x=>x.id===id);
const buyer=id=>master.companies.find(x=>x.id===id);
const person=id=>master.contacts.find(x=>x.id===id);
const site=id=>master.sites.find(x=>x.id===id);
const project=id=>master.projects.find(x=>x.id===id);
const employee=id=>staff.find(x=>x.id===id);
const entity=id=>org.find(x=>x.id===id);
const branch=id=>org.flatMap(e=>e.branches.map(b=>({...b,companyId:e.id}))).find(x=>x.id===id);
const text=(x,blank="Not provided")=>x?esc(x):esc(blank);
const badge=(value)=>'<span class="ma5-tag '+({High:"high",Medium:"medium",Low:"low",Lost:"lost",Won:"won","On Hold":"on-hold"}[value]||"")+'">'+esc(value)+'</span>';
const openStages=["New","In Discussion","Qualified","Quote Preparation","Quoted","On Hold"];
function scopeMatch(o){return(state.company==="all"||o.companyId===state.company)&&(state.branch==="all"||o.branchId===state.branch);}
function visible(){
 const q=state.query.trim().toLowerCase();
 return db.opportunities.filter(o=>scopeMatch(o)&&
 (state.stage==="all"||o.stage===state.stage)&&
 (state.priority==="all"||o.priority===state.priority)&&
 (state.owner==="all"||o.ownerId===state.owner)&&
 (!q||[o.id,o.title,customer(o.customerId)?.name,buyer(o.buyerId)?.name,employee(o.ownerId)?.name,o.summary].some(v=>String(v||"").toLowerCase().includes(q))));
}
function allScopeOptions(){return org.map(e=>[e.id,e.name]);}
function branchOptions(comp){return comp==="all"?org.flatMap(e=>e.branches.map(b=>[b.id,e.name+" / "+b.name])):(entity(comp)?.branches||[]).map(b=>[b.id,b.name]);}
function opts(items,value){return items.map(([id,name])=>'<option value="'+esc(id)+'"'+(String(id)===String(value)?' selected':'')+'>'+esc(name)+'</option>').join("");}
function renderFilters(){
 $("company-filter").innerHTML='<option value="all">All authorized internal companies</option>'+opts(allScopeOptions(),state.company);$("company-filter").value=state.company;
 const branches=branchOptions(state.company);
 if(state.branch!=="all"&&!branches.some(b=>b[0]===state.branch))state.branch="all";
 $("branch-filter").innerHTML='<option value="all">All authorized branches</option>'+opts(branches,state.branch);$("branch-filter").value=state.branch;
 const names=[...new Set(db.opportunities.filter(scopeMatch).map(o=>o.ownerId))].map(id=>employee(id)).filter(Boolean);
 $("owner-filter").innerHTML='<option value="all">All owners</option>'+opts(names.map(u=>[u.id,u.name]),state.owner);
 if(state.owner!=="all"&&!names.some(u=>u.id===state.owner))state.owner="all";
 $("owner-filter").value=state.owner;
 $("priority-filter").value=state.priority;
 $("search-filter").value=state.query;
}
function stats(){
 const base=db.opportunities.filter(scopeMatch);
 const cards=[
 ["Enquiries",base.length,"Total in current internal scope"],
 ["Open opportunities",base.filter(x=>openStages.includes(x.stage)).length,"Not closed as Won or Lost"],
 ["Quote preparation",base.filter(x=>x.stage==="Quote Preparation").length,"Enquiry workflow, not pricing approval"],
 ["Closed / lost",base.filter(x=>x.stage==="Won"||x.stage==="Lost").length,"Outcome recorded separately"]
 ];
 $("opportunity-stats").innerHTML=cards.map(x=>'<div class="card ma5-stat"><span>'+esc(x[0])+'</span><strong>'+String(x[1]).padStart(2,"0")+'</strong><small>'+esc(x[2])+'</small></div>').join("");
}
function pipeline(){
 const base=db.opportunities.filter(scopeMatch);
 $("pipeline-stages").innerHTML=source.stages.map(s=>'<button type="button" data-stage="'+esc(s.id)+'" class="ma5-stage'+(state.stage===s.id?" active":"")+'" aria-pressed="'+String(state.stage===s.id)+'" title="'+esc(s.help)+'"><small>'+esc(s.label)+'</small><strong>'+String(base.filter(x=>x.stage===s.id).length).padStart(2,"0")+'</strong></button>').join("");
}
function list(items){
 $("register-count").textContent=items.length+" shown";
 $("register-list").innerHTML=items.length?items.map(o=>
 '<button type="button" class="ma5-item'+(o.id===state.selected?" active":"")+'" aria-pressed="'+String(o.id===state.selected)+'" data-opp="'+esc(o.id)+'">'+
 '<span class="ma5-item-top"><b class="ma5-item-title">'+esc(o.title)+'</b>'+badge(o.priority)+'</span>'+
 '<span class="ma5-item-sub">'+esc(o.id)+' · '+text(customer(o.customerId)?.name)+'</span>'+
 '<span class="ma5-item-bottom"><span>'+text(employee(o.ownerId)?.name)+'</span>'+badge(o.stage)+'</span></button>').join(""):
 '<div class="ma5-empty">No enquiries match the selected scope and filters. Try Reset filters.</div>';
}
function heading(o){
 $("opportunity-head").innerHTML='<div class="ma5-detail-top"><div><small>'+esc(o.id)+' · '+text(customer(o.customerId)?.name)+'</small><h2>'+esc(o.title)+'</h2><p>Owned by '+text(employee(o.ownerId)?.name,"Unassigned")+' · '+text(entity(o.companyId)?.name)+' / '+text(branch(o.branchId)?.name)+'</p></div>'+
 '<div class="ma5-detail-buttons">'+badge(o.stage)+'<button type="button" class="btn" data-action="edit">Edit enquiry</button><button type="button" class="btn" data-action="stage">Update stage</button><button type="button" class="btn primary" data-action="prepare">Prepare quotation</button></div></div>'+
 '<div class="ma5-head-tags">'+badge(o.priority)+'<span class="ma5-tag">'+esc(o.kind)+'</span><span class="ma5-tag">'+esc(o.source)+'</span><span class="ma5-tag">Updated: '+esc(o.lastUpdated)+'</span></div>'+
 '<div class="ma5-hero-note"><b>Opportunity vs quotation:</b> This record collects the customer need, follow-up and qualification. The quotation builder will manage BOQ, commercial values, approvals and issuance separately.</div>';
}
const kv=(k,v)=>'<div class="ma5-kv"><small>'+esc(k)+'</small><strong>'+text(v)+'</strong></div>';
const panel=(title,desc,action="",label="")=>'<div class="ma5-panel-title"><div><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p></div>'+(action?'<button class="btn primary" type="button" data-action="'+esc(action)+'">'+esc(label)+'</button>':"")+'</div>';
const note=(body,warning=false)=>'<div class="ma5-callout'+(warning?' warning':'')+'">'+body+'</div>';
function overview(o){
 return panel("Opportunity overview","Key enquiry information and the next sales action")+
 '<div class="ma5-kvs">'+kv("Opportunity reference",o.id)+kv("Current stage",o.stage)+kv("Source",o.source)+kv("Enquiry type",o.kind)+
 kv("Priority",o.priority)+kv("Owner",employee(o.ownerId)?.name)+kv("Enquiry received",o.received)+kv("Customer required-by date",o.needBy)+
 kv("Expected decision date",o.expectedClose)+kv("Next follow-up",o.nextFollowUp)+
 kv("Next action",o.nextAction)+kv("Last updated",o.lastUpdated)+'</div>'+
 (o.stage==="Lost"?note('<b>Lost reason:</b> '+text(o.lostReason),true):"")+
 note('The next follow-up and expected decision are planning fields. No automatic notifications, commitments or SLA rules are active in this wireframe.');
}
function requirements(o){
 return panel("Customer requirements","Capture intent and key inputs without building the BOQ here.","edit","Edit enquiry")+
 '<div class="ma5-summary">'+text(o.summary)+'</div>'+
 '<div class="ma5-subhead"><h4>Requirement checklist / line items (initial)</h4></div>'+
 (o.requirements.length?'<ul class="ma5-req-list">'+o.requirements.map(r=>'<li>◇ &nbsp; '+esc(r)+'</li>').join("")+'</ul>':'<div class="ma5-empty">No requirements captured yet.</div>')+
 '<div class="ma5-subhead"><h4>Internal context / qualification notes</h4></div><div class="ma5-summary">'+text(o.remarks,"No notes recorded")+'</div>'+
 note('<b>Boundary:</b> These are discovery notes, not an approved technical specification, formal BOQ, product price, discount, tax calculation or legal customer offer.');
}
function stakeholders(o){
 const c=customer(o.customerId),b=buyer(o.buyerId),p=person(o.contactId),si=site(o.siteId),pr=project(o.projectId);
 return panel("Customer and internal work context","Use MA-004 references so buyer, contact, site and project are not re-entered for every enquiry.")+
 '<div class="ma5-kvs">'+kv("Customer account",c?.name)+kv("Customer type",c?.type)+
 kv("Buyer / bill-to identity",b?.name)+kv("Contact person",p?.name)+kv("Contact role",p?.role)+
 kv("Project",pr?.name)+kv("Customer site",si?.name)+kv("Site city",si?.city)+
 kv("Our legal entity",entity(o.companyId)?.name)+kv("Our branch",branch(o.branchId)?.name)+kv("Owner",employee(o.ownerId)?.name)+kv("Ownership scope","Assigned branch (demo preview)")+'</div>'+
 '<div class="ma5-subhead"><h4>Customer master</h4><a class="btn" href="ma-004-customers.html">Open MA-004</a></div>'+
 note('On a group account, buyer selection must refer to the exact customer legal entity. Contacts, sites and projects offered in the enquiry should belong to that selected buyer. MA-003 rights and backend scope checks will determine who may view or edit each record.');
}
function followups(o){
 const records=db.followups.filter(f=>f.opportunityId===o.id);
 return panel("Follow-ups and next actions","Keep customer discussions and scheduled actions attached to the opportunity.","followup","+ Add follow-up")+
 '<div class="ma5-kvs">'+kv("Next action",o.nextAction)+kv("Next follow-up date",o.nextFollowUp)+'</div>'+
 '<div class="ma5-subhead"><h4>Follow-up log ('+records.length+')</h4></div>'+
 (records.length?'<div class="ma5-timeline">'+records.slice().reverse().map(f=>
 '<div class="ma5-timeline-entry"><b>'+esc(f.type)+'</b><p>'+esc(f.summary)+'</p><small>'+esc(f.date)+' · '+esc(f.owner)+(f.nextDate?' · Next: '+esc(f.nextDate):'')+'</small></div>').join("")+'</div>':
 '<div class="ma5-empty">No follow-up entries yet.</div>')+
 note('No emails, messages, calls or reminders are actually sent. Production should record action type, responsible user, time, next due date and audit history.');
}
function quotations(o){
 const qs=o.linkedQuotes.map(id=>{const r=quoteData.find(q=>q[0]===id);return {id,status:r?.[4]||"Unverified",revision:r?.[5]||"Not supplied"}});
 const files=db.documents.filter(f=>f.opportunityId===o.id);
 return panel("Linked quotations and evidence","Opportunity references only; the quotation editor and document storage belong to separate modules.","prepare","Prepare quotation")+
 '<div class="ma5-subhead"><h4>Quotation references ('+qs.length+')</h4></div>'+
 (qs.length?'<div class="ma5-table-wrap"><table class="ma5-table"><thead><tr><th>Quotation</th><th>Status</th><th>Revision</th><th>Action</th></tr></thead><tbody>'+qs.map(q=>
 '<tr><td><strong>'+esc(q.id)+'</strong></td><td>'+esc(q.status)+'</td><td>'+esc(q.revision)+'</td><td><button type="button" class="btn" data-quote="'+esc(q.id)+'">Planned page</button></td></tr>').join("")+'</tbody></table></div>':
 '<div class="ma5-empty">No quotation has been specifically linked to this opportunity.</div>')+
 '<div class="ma5-subhead"><h4>Requirement documents / source evidence ('+files.length+')</h4><button class="btn" type="button" data-action="files">Document workflow</button></div>'+
 (files.length?'<div class="ma5-cards">'+files.map(f=>
 '<article class="ma5-mini"><h4>'+esc(f.title)+'</h4><p>Type: '+esc(f.type)+'</p><p>Status: '+esc(f.state)+'</p><span class="ma5-tag">Sample metadata only</span></article>').join("")+'</div>':
 '<div class="ma5-empty">No sample evidence is attached. This wireframe does not upload or store files.</div>')+
 note('A single opportunity may have multiple quotations or revisions. Quote pricing, internal costs, approval, issue and customer response are handled by the dedicated quotation workflow.');
}
function activity(o){
 const hist=state.history.filter(h=>h.opportunityId===o.id);
 return panel("Opportunity activity","Illustrative timeline; latest browser-session changes appear first.")+
 (hist.length?'<div class="ma5-timeline">'+hist.map(h=>
 '<div class="ma5-timeline-entry"><b>'+esc(h.title)+'</b><p>'+esc(h.detail)+'</p><small>'+esc(h.when)+'</small></div>').join("")+'</div>':"")+
 '<div class="ma5-timeline-entry"><b>Enquiry recorded (sample)</b><p>'+esc(o.title)+'</p><small>'+esc(o.received)+' · Sample record</small></div>'+
 note('Production activity history must be durable and actor-attributed; it must record stage changes, scope changes, follow-up outcomes and quote links. This timeline resets on refresh.');
}
const tabRender={overview,requirements,stakeholders,followups,quotations,activity};
function detail(){
 const o=opp(state.selected);
 if(!o){$("opportunity-head").innerHTML='<h2>No enquiry selected</h2><p class="muted">Adjust the pipeline and filters.</p>';$("detail-tabs").hidden=true;$("detail-body").innerHTML='<div class="ma5-empty">No opportunity matches the current selection.</div>';return;}
 $("detail-tabs").hidden=false;heading(o);
 for(const b of $("detail-tabs").querySelectorAll("[data-tab]")){const isActive=b.dataset.tab===state.tab;b.classList.toggle("active",isActive);b.setAttribute("aria-selected",String(isActive));}
 $("detail-body").innerHTML=(tabRender[state.tab]||overview)(o);
}
function render(){
 renderFilters();stats();pipeline();
 const records=visible();
 if(!records.some(o=>o.id===state.selected))state.selected=records[0]?.id||"";
 list(records);detail();
}
function audit(o,title,detail){
 state.history.unshift({opportunityId:o.id,title,detail,when:new Date().toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})+" · Demo"});
 o.lastUpdated="07 Nov 2026 (demo)";
}
window.CPQ_MA005={ $,esc,db,master,org,staff,state,customer,buyer,person,site,project,employee,entity,branch,opp,opts,openStages,render,detail,visible,scopeMatch,audit };
render();
})();