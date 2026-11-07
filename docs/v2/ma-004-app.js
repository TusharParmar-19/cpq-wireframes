/* MA-004: renderer / shared in-memory state. Fictional data only. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const db=JSON.parse(JSON.stringify(window.CPQ_MA004_DATA));
const own=window.CPQ_MA002_DATA.map(e=>({id:e.id,name:e.name,branches:e.branches.map(b=>({id:b.id,name:b.name,city:b.city}))}));
const state={selected:"CU-001",tab:"overview",company:"all",branch:"all",q:"",status:"all",type:"all",history:[]};
const cust=id=>db.customers.find(x=>x.id===id);
const companies=id=>db.companies.filter(x=>x.customerId===id);
const contacts=id=>db.contacts.filter(x=>x.customerId===id);
const sites=id=>db.sites.filter(x=>x.customerId===id);
const projects=id=>db.projects.filter(x=>x.customerId===id);
const related=id=>db.related.filter(x=>x.customerId===id);
const buyer=id=>db.companies.find(x=>x.id===id);
const ent=id=>own.find(x=>x.id===id);
const branch=id=>own.flatMap(e=>e.branches.map(b=>({...b,companyId:e.id}))).find(b=>b.id===id);
const next=(prefix,list)=>prefix+String(Math.max(0,...list.map(x=>Number(x.id.slice(prefix.length))||0))+1).padStart(3,"0");
const val=(x,blank="Not supplied")=>x?esc(x):esc(blank);
const badge=s=>'<span class="ma4-tag '+({Active:"active",Prospect:"prospect","On Hold":"on-hold",Archived:"archived"}[s]||"neutral")+'">'+esc(s)+'</span>';
const checkScope=c=>c.links.some(l=>(state.company==="all"||l.companyId===state.company)&&(state.branch==="all"||l.branchId===state.branch));
function filtered(){
 const q=state.q.trim().toLowerCase();
 return db.customers.filter(c=>(state.status==="all"||c.status===state.status)&&(state.type==="all"||c.type===state.type)&&checkScope(c)&&(!q||[c.name,c.id,c.industry,c.owner,...companies(c.id).map(x=>x.name),...contacts(c.id).map(x=>x.name)].some(x=>String(x||"").toLowerCase().includes(q))));
}
function scopeControls(){
 $("internal-company").innerHTML='<option value="all">All authorized internal companies</option>'+own.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.name)+'</option>').join("");
 $("internal-company").value=state.company;
 const opts=state.company==="all"?own.flatMap(e=>e.branches.map(b=>[b.id,e.name+" / "+b.name])):(ent(state.company)?.branches||[]).map(b=>[b.id,b.name]);
 if(state.branch!=="all"&&!opts.some(x=>x[0]===state.branch))state.branch="all";
 $("internal-branch").innerHTML='<option value="all">All authorized branches</option>'+opts.map(x=>'<option value="'+esc(x[0])+'">'+esc(x[1])+'</option>').join("");
 $("internal-branch").value=state.branch;
}
function summary(){
 const c=db.customers.filter(checkScope),ids=new Set(c.map(x=>x.id));
 const v=[["Customer accounts",c.length,"Account-level relationships"],["Buyer identities",db.companies.filter(x=>ids.has(x.customerId)).length,"Individuals and legal buyer companies"],["Additional contacts",db.contacts.filter(x=>ids.has(x.customerId)).length,"Linked representatives / contacts"],["Active projects",db.projects.filter(x=>ids.has(x.customerId)&&!["Completed","Cancelled"].includes(x.stage)).length,"Project and site references"]];
 $("customer-summary").innerHTML=v.map(x=>'<div class="card ma4-stat"><small>'+esc(x[0])+'</small><strong>'+String(x[1]).padStart(2,"0")+'</strong><span>'+esc(x[2])+'</span></div>').join("");
}
function directory(rows){
 $("customer-count").textContent=rows.length+" shown";
 $("customer-list").innerHTML=rows.length?rows.map(c=>'<button type="button" class="ma4-customer'+(state.selected===c.id?' active':'')+'" data-customer="'+esc(c.id)+'" aria-pressed="'+String(state.selected===c.id)+'"><span class="ma4-customer-top"><b>'+esc(c.name)+'</b>'+badge(c.status)+'</span><small>'+esc(c.id)+' · '+esc(c.type)+' · '+esc(c.industry)+'</small><span class="ma4-customer-bottom">'+companies(c.id).length+(c.type==="Individual"?' personal buyer':' buyer '+(companies(c.id).length===1?'company':'companies'))+' · '+contacts(c.id).length+' contacts<br>'+val(c.owner,"Unassigned owner")+'</span></button>').join(""):'<div class="ma4-empty">No customers match your search and scope. Reset filters or add a fictional customer.</div>';
}
function heading(c){
 const archived=c.status==="Archived",personal=c.type==="Individual",count=companies(c.id).length;
 $("detail-head").innerHTML='<div class="ma4-detail-heading"><div><small style="color:#7691a5;font-size:10px">'+esc(c.id)+' · '+esc(c.type)+'</small><h2>'+esc(c.name)+'</h2><p>'+val(c.industry)+' · Owner: '+val(c.owner)+' · Updated: '+esc(c.updated)+'</p></div><div class="ma4-head-actions">'+badge(c.status)+'<button type="button" class="btn" data-action="edit-customer"'+(archived?' disabled':'')+'>Edit customer</button><button type="button" class="btn '+(archived?'':'ma4-action-danger')+'" data-action="archive-customer">'+(archived?'Restore':'Archive')+'</button></div></div>'+
 '<div class="ma4-meta-row"><span class="ma4-tag neutral">'+(personal?'Individual buyer profile':count+' buyer '+(count===1?'company':'companies'))+'</span><span class="ma4-tag neutral">'+contacts(c.id).length+' additional contacts</span><span class="ma4-tag neutral">'+sites(c.id).length+' sites</span><span class="ma4-tag neutral">'+projects(c.id).length+' projects</span></div>'+
 '<div class="ma4-header-note">'+(personal?'<b>Individual customer:</b> The purchaser and billing identity are the same person. Contacts are optional representatives. Company tax and registration fields are not needed to create an individual.':
 '<b>Customer relationship ≠ buyer legal entity.</b> A quotation identifies the exact buyer company and, when relevant, a different project/delivery site.')+'</div>';
}

const kv=(name,value)=>'<div class="ma4-kv"><small>'+esc(name)+'</small><strong>'+val(value)+'</strong></div>';
const panel=(title,subtitle,action="",text="")=>'<div class="ma4-panel-top"><div><h3>'+esc(title)+'</h3><p>'+esc(subtitle)+'</p></div>'+(action?'<button type="button" class="btn primary" data-action="'+action+'">'+esc(text)+'</button>':"")+'</div>';
const info=text=>'<div class="ma4-inline-info">'+text+'</div>';
function overview(c){
 const x=companies(c.id),primary=x.find(y=>y.primary)||x[0],contact=contacts(c.id).find(y=>y.primary),personal=c.type==="Individual";
 return panel("Relationship overview",personal?"Individual customer, billing profile and working scope":"Identity, ownership, legal buyer and internal scope")+
 '<div class="ma4-kv-grid">'+kv("Customer ID",c.id)+kv("Type / status",c.type+" / "+c.status)+
 kv("Relationship owner",c.owner)+kv(personal?"Purchase interest":"Industry",c.industry)+
 kv(personal?"Individual buyer / bill-to":"Primary buyer legal entity",primary?.name)+
 kv(personal?"Contact arrangement":"Primary contact",contact?contact.name+" · "+contact.role:personal?"Individual buyer (self)":"")+
 kv("Created",c.created)+kv("Updated",c.updated)+'</div>'+
 '<div class="ma4-subheader"><h4>Linked internal companies and branches</h4>'+(c.status==="Archived"?'':'<button type="button" class="btn" data-action="link-scope">+ Link internal scope</button>')+'</div>'+
 '<div class="ma4-scopes">'+c.links.map(l=>'<span>'+val(ent(l.companyId)?.name)+' / '+val(branch(l.branchId)?.name)+'</span>').join("")+'</div>'+
 info('<b>Scope preview:</b> Linking an internal company never grants employee access. MA-003 company/branch assignment, page/action rights, record scope and approval policy all remain required.')+
 '<div class="ma4-subheader"><h4>Internal notes</h4></div><div class="ma4-small-card"><p>'+val(c.notes,"No notes")+'</p></div>'+
 '<div class="ma4-steps"><b>Customer</b> → <b>'+(personal?'Individual buyer':'Buyer company')+'</b> → <b>Site / project</b> → <b>Quotation / order</b></div>';
}

function legalCompanies(c){
 const items=companies(c.id),editable=c.status!=="Archived",personal=c.type==="Individual";
 const headingText=personal?"Individual buyer & billing":c.type==="Group"?"Group buyer companies":"Customer buyer companies";
 const help=personal?"One personal buyer identity; optional billing address. No business registration or tax ID is required here.":"Select the correct buyer/legal company when issuing a quotation. A group can contain multiple distinct buying entities.";
 const action=editable&&c.type==="Group"?"add-company":"",actionLabel="+ Add group company";
 return panel(headingText,help,action,actionLabel)+
 '<div class="ma4-card-grid">'+items.map(x=>
 '<article class="ma4-small-card"><h4>'+esc(x.name)+'</h4>'+
 '<p>'+(personal?'Individual purchaser':esc(x.kind))+' · '+val(x.city)+', '+val(x.state)+'</p>'+
 '<p>'+(personal?'Billing location: ':'Tax verification: '+val(x.taxStatus)+'<br>Billing: ')+val(x.address)+'</p>'+
 (x.primary?'<span class="ma4-tag active">'+(personal?'Buyer identity':'Primary buyer')+'</span>':'<span class="ma4-tag neutral">Additional buyer</span>')+
 (editable?'<div class="ma4-subheader"><button type="button" class="btn" data-edit-company="'+esc(x.id)+'">'+(personal?'Edit buyer details':'Edit details')+'</button>'+
 (x.primary||personal?'':'<button type="button" class="btn" data-primary-company="'+esc(x.id)+'">Set primary</button>')+'</div>':'')+
 '</article>').join("")+'</div>'+
 info(personal?'An individual is the buyer. You can record a billing address without creating a fake company or an additional contact. Issued commercial documents retain the buyer details used at issuance.':
 c.type==="Company"?'A Company customer uses one buyer legal entity. Add different branches, sites and projects in their dedicated tab. Use a Group customer when multiple separate legal buyer companies must be managed together.':
 'Group buyer companies are separate from your internal MA-002 companies. Add additional legal buyers as needed; each issued quotation preserves the selected buyer identity and revision snapshot.');
}

function contactsTab(c){
 const items=contacts(c.id),personal=c.type==="Individual";
 return panel(personal?"Authorized / additional contacts":"Contact persons",personal?"Optional representatives associated with this individual customer.":"Each contact belongs to a customer buyer company.",c.status!=="Archived"?"add-contact":"",personal?"+ Add representative":"+ Add contact")+
 (items.length?'<div class="ma4-table-scroller"><table class="ma4-table"><thead><tr><th>Contact / role</th><th>Buyer identity</th><th>Email / phone</th><th>Status</th><th></th></tr></thead><tbody>'+
 items.map(x=>'<tr><td><strong>'+esc(x.name)+'</strong><small>'+val(x.role)+'</small>'+(x.primary?'<span class="ma4-tag active">Primary</span>':'')+'</td><td>'+val(buyer(x.companyId)?.name)+'</td><td>'+val(x.email)+'<small>'+val(x.phone)+'</small></td><td>'+badge(x.status)+'</td><td>'+(c.status==="Archived"?'':'<button type="button" class="btn" data-edit-contact="'+esc(x.id)+'">Edit</button>')+'</td></tr>').join("")+'</tbody></table></div>':
 '<div class="ma4-empty">'+(personal?'The individual customer is their own purchaser and contact. Add an authorized representative only when needed.':'No contacts yet. Add a fictional contact for this customer company.')+'</div>')+
 info('Production will validate any real personal data, consent and authorized communications separately. The contact section does not control access to internal company records.');
}

function siteTab(c){
 const s=sites(c.id),p=projects(c.id),edit=c.status!=="Archived";
 return panel("Customer branches, sites & delivery addresses","Each location belongs to a specific customer buyer company.",edit?"add-site":"","+ Add site")+
 (s.length?'<div class="ma4-card-grid">'+s.map(x=>'<article class="ma4-small-card"><h4>'+esc(x.name)+'</h4><p>'+esc(x.type)+' · '+val(x.city)+', '+val(x.state)+'</p><p>'+val(x.address)+'</p><p>Buyer: '+val(buyer(x.companyId)?.name)+'</p>'+(edit?'<div class="ma4-subheader"><button type="button" class="btn" data-edit-site="'+esc(x.id)+'">Edit site</button></div>':'')+'</article>').join("")+'</div>':'<div class="ma4-empty">No sites yet.</div>')+
 '<div class="ma4-subheader"><h4>Customer projects ('+p.length+')</h4>'+(edit?'<button type="button" class="btn" data-action="add-project">+ Add project</button>':'')+'</div>'+
 (p.length?'<div class="ma4-table-scroller"><table class="ma4-table"><thead><tr><th>Project</th><th>Buyer / site</th><th>Stage</th><th>Owner</th><th></th></tr></thead><tbody>'+p.map(x=>'<tr><td><strong>'+esc(x.name)+'</strong><small>'+esc(x.id)+'</small></td><td>'+val(buyer(x.companyId)?.name)+'<small>'+val(s.find(y=>y.id===x.siteId)?.name,"Site not selected")+'</small></td><td>'+esc(x.stage)+'</td><td>'+val(x.owner)+'</td><td>'+(edit?'<button type="button" class="btn" data-edit-project="'+esc(x.id)+'">Edit</button>':'')+'</td></tr>').join("")+'</tbody></table></div>':'<div class="ma4-empty">No linked projects yet.</div>')+
 info('Billing address, delivery/site address, customer legal entity and your own operating branch are separate concepts.');
}
function relatedTab(c){
 const r=related(c.id).filter(x=>(state.company==="all"||x.companyId===state.company)&&(state.branch==="all"||x.branchId===state.branch));
 return panel("Related commercial records","Illustrative references to future Opportunity, Quotation and Order pages.")+
 (r.length?'<div class="ma4-table-scroller"><table class="ma4-table"><thead><tr><th>Reference</th><th>Type / status</th><th>Buyer identity</th><th>Our internal scope</th><th></th></tr></thead><tbody>'+
 r.map(x=>'<tr><td><strong>'+esc(x.id)+'</strong></td><td>'+esc(x.type)+'<small>'+esc(x.status)+'</small></td><td>'+val(buyer(x.customerCompanyId)?.name)+'</td><td>'+val(ent(x.companyId)?.name)+'<small>'+val(branch(x.branchId)?.name)+'</small></td><td><button type="button" class="btn" data-record="'+esc(x.id)+'">Planned page</button></td></tr>').join("")+'</tbody></table></div>':'<div class="ma4-empty">No related records for this internal company/branch scope.</div>')+
 info('Cross-company records must not be combined for an unauthorized employee. Production checks tenant, internal company/branch, record relationship, action and snapshot.');
}
function activityTab(c){
 const h=state.history.filter(x=>x.customerId===c.id);
 return panel("Customer activity","Browser-session changes only; not a permanent or legal audit.")+
 '<div class="ma4-activity-item"><b>Fictional account created</b><small>'+esc(c.created)+' · Sample</small></div>'+
 (h.length?h.map(x=>'<div class="ma4-activity-item"><b>'+esc(x.text)+'</b><small>'+esc(x.when)+'</small></div>').join(""):info('No changes have been recorded in this browser session. Real changes require attributed immutable history.'));
}
function detail(){
 const c=cust(state.selected);
 if(!c){
  $("detail-head").innerHTML='<h2 style="font-size:16px">No customer selected</h2><p class="muted">Adjust the filters to view a customer.</p>';
  $("detail-tabs").hidden=true;$("detail-body").innerHTML='<div class="ma4-empty">No customer records in this filter.</div>';return;
 }
 $("detail-tabs").hidden=false;heading(c);
 for(const b of $("detail-tabs").querySelectorAll("[data-tab]")){
  const active=b.dataset.tab===state.tab;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));
  if(b.dataset.tab==="companies")b.textContent=c.type==="Individual"?"Buyer & Billing":c.type==="Group"?"Group Companies":"Buyer Company";
  if(b.dataset.tab==="contacts")b.textContent=c.type==="Individual"?"Authorized Contacts":"Contacts";
 }
 $("detail-body").innerHTML=({overview,companies:legalCompanies,contacts:contactsTab,sites:siteTab,related:relatedTab,activity:activityTab}[state.tab]||overview)(c);
}
function render(){
 scopeControls();summary();
 const list=filtered();
 if(!list.some(x=>x.id===state.selected))state.selected=list[0]?.id||"";
 directory(list);detail();
}
function audit(c,text){c.updated="07 Nov 2026 (demo)";state.history.unshift({customerId:c.id,text,when:new Date().toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})+" · Demo"});}
window.CPQ_MA004={$,esc,db,own,state,cust,companies,contacts,sites,projects,related,buyer,ent,branch,next,filtered,render,detail,directory,summary,scopeControls,audit,checkScope};
render();
})();