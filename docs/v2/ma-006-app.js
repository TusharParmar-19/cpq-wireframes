/* MA-006 — shared demo state and UI rendering. No production calculations or permissions. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const db=JSON.parse(JSON.stringify(window.CPQ_MA006_DATA));
const flow=window.CPQ_FLOW;
const master=window.CPQ_MA004_DATA, org=window.CPQ_MA002_DATA, staff=window.CPQ_MA003_USERS, enquiries=window.CPQ_MA005_DATA.opportunities;
const state={selected:"QT-2026-014",tab:"summary",mode:"register",company:"all",branch:"all",status:"all",owner:"all",search:"",listExpanded:false,builder:null,history:[]};
const quote=id=>db.quotations.find(q=>q.id===id);
const customer=id=>master.customers.find(x=>x.id===id);
const buyer=id=>master.companies.find(x=>x.id===id);
const contact=id=>master.contacts.find(x=>x.id===id);
const site=id=>master.sites.find(x=>x.id===id);
const project=id=>master.projects.find(x=>x.id===id);
const employee=id=>staff.find(x=>x.id===id);
const entity=id=>org.find(x=>x.id===id);
const branch=id=>org.flatMap(x=>x.branches.map(b=>({...b,companyId:x.id}))).find(x=>x.id===id);
const opportunity=id=>enquiries.find(x=>x.id===id);
const product=id=>{
 const old=db.products.find(x=>x.id===id);if(old)return old;
 const service=flow.service(id);
 if(service)return {id:service.id,name:service.name,unit:service.unit||"Job",type:"service",
  basePrice:0,status:service.status,serviceId:service.id,catalogSpec:[service.workType,service.scope].filter(Boolean).join(" · ")};
 const cat=window.CPQ_MA006A_CATALOG,v=cat?.variants.find(x=>x.id===id);
 if(!v)return null;
 const fam=cat.families.find(f=>f.id===v.familyId),maker=cat.manufacturers.find(m=>m.id===v.manufacturerId);
 if(!fam)return null;
 const dims=v.dimensions||{},size=[dims.length,dims.width,dims.height].filter(x=>x!==undefined&&x!=="").join(" × ");
 return {id:v.id,name:fam.name+" — "+v.model,unit:fam.unit||"Nos",type:fam.type==="service"?"service":"standard",
  basePrice:Number(v.price?.sell)||0,status:v.status,sku:v.sku,model:v.model,manufacturer:maker?.brand||maker?.name||"",
  rating:v.capacity||"",catalogSpec:[maker?.brand||maker?.name,v.sku,v.capacity,size?size+" "+(dims.unit||"mm"):""].filter(Boolean).join(" · "),
  sourceVariantId:v.id,demoOnly:v.demoReview?.state==="Enabled for demo"};
};
const text=(x,blank="Not supplied")=>x?esc(x):esc(blank);
const money=n=>"\u20b9"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const numeric=n=>Math.max(0,Number.isFinite(+n)?+n:0);
const opts=(arr,selected)=>arr.map(([v,label])=>'<option value="'+esc(v)+'"'+(String(v)===String(selected)?' selected':'')+'>'+esc(label)+'</option>').join("");
const statusBadge=status=>'<span class="ma6-tag status-'+String(status||"").toLowerCase().replace(/[^a-z]+/g,"-")+'">'+esc(status||"Unspecified")+'</span>';
const typeBadge=type=>'<span class="ma6-tag type-'+esc(type)+'">'+esc(({config:"Configured",standard:"Standard",service:"Service / Project"})[type]||type)+'</span>';
const kv=(k,v)=>'<div class="ma6-kv"><small>'+esc(k)+'</small><strong>'+text(v)+'</strong></div>';
const panel=(title,desc,action="",button="")=>'<div class="ma6-panel-head"><div><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p></div>'+(action?'<button type="button" class="btn" data-action="'+esc(action)+'">'+esc(button)+'</button>':"")+'</div>';
const note=(html,warn=false)=>'<div class="ma6-note'+(warn?' warning':'')+'">'+html+'</div>';
const blank=msg=>'<div class="ma6-empty">'+esc(msg)+'</div>';
const header=(labels)=>'<thead><tr>'+labels.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead>';
const table=(labels,rows)=>'<div class="ma6-table-wrap"><table class="ma6-table">'+header(labels)+'<tbody>'+rows.join("")+'</tbody></table></div>';
function configCheck(prod,selected){
 if(!prod||prod.type!=="config")return {ok:true,message:"Standard catalog or service item; no option-based configuration is required."};
 if(selected.rating==="630A"&&selected.mounting!=="Floor")return {ok:false,message:"Demo sample rule: 630A requires Floor mounting. This is not engineering validation."};
 const missing=Object.keys(prod.options).some(k=>!(selected[k]&&prod.options[k].choices.some(([v])=>v===selected[k])));
 return missing?{ok:false,message:"Choose a value for every required product attribute."}:
 {ok:true,message:"Sample options selected. Actual BOM, safety, compatibility and standards approval are pending product-rule administration."};
}
function configUnit(prod,selected){
 if(!prod)return 0;let v=prod.basePrice||0;
 if(prod.type!=="config")return v;
 for(const [k,spec] of Object.entries(prod.options)){
  const chosen=spec.choices.find(([id])=>id===selected[k]);
  if(chosen)v+=Number(chosen[1]||0);
 }
 return v;
}
const extended=line=>line.includedInParent?0:numeric(line.quantity)*numeric(line.unitPrice);
function totals(q){
 const subtotal=(q.lines||[]).reduce((sum,l)=>sum+extended(l),0);
 const discount=Math.min(subtotal,subtotal*numeric(q.discount)/100);
 const taxable=Math.max(0,subtotal-discount);
 const tax=taxable*numeric(q.taxRate)/100;
 return {subtotal,discount,taxable,tax,total:taxable+tax};
}
function lineConfig(line){
 if(line.serviceSnapshot)return [line.serviceSnapshot.workType,line.serviceSnapshot.scope].filter(Boolean).join(" · ")||"Service scope referenced in master";
 if(line.modelSnapshot){
  const snap=line.modelSnapshot,d=snap.dimensions||{};
  return [snap.manufacturer,snap.sku,snap.capacity,
   d.width&&d.height&&d.depth?[d.width,d.height,d.depth].join(" × ")+" "+(d.unit||"mm"):""].filter(Boolean).join(" · ");
 }
 if(line.catalogSpec)return line.catalogSpec;
 const p=product(line.productId);
 if(line.type!=="config"||!p)return "No option configuration";
 return Object.entries(p.options).map(([k,v])=>v.label+": "+(line.options?.[k]||"—")).join(" · ");
}
function isScopeMatch(q){return(state.company==="all"||q.companyId===state.company)&&(state.branch==="all"||q.branchId===state.branch);}
function visible(){
 const s=state.search.trim().toLowerCase();
 return db.quotations.filter(q=>isScopeMatch(q)&&
 (state.status==="all"||q.status===state.status)&&
 (state.owner==="all"||q.ownerId===state.owner)&&
 (!s||[q.id,q.title,customer(q.customerId)?.name,buyer(q.buyerId)?.name,employee(q.ownerId)?.name].some(x=>String(x||"").toLowerCase().includes(s))));
}
function renderFilters(){
 $("company-filter").innerHTML='<option value="all">All authorized internal companies</option>'+opts(org.map(e=>[e.id,e.name]),state.company);
 $("company-filter").value=state.company;
 const branches=state.company==="all"?org.flatMap(e=>e.branches.map(b=>[b.id,e.name+" / "+b.name])):(entity(state.company)?.branches||[]).map(b=>[b.id,b.name]);
 if(state.branch!=="all"&&!branches.some(x=>x[0]===state.branch))state.branch="all";
 $("branch-filter").innerHTML='<option value="all">All authorized branches</option>'+opts(branches,state.branch);
 $("branch-filter").value=state.branch;
 $("quote-status-filter").innerHTML='<option value="all">All statuses</option>'+opts(db.statuses.map(s=>[s,s]),state.status);
 $("quote-status-filter").value=state.status;
 const ids=[...new Set(db.quotations.filter(isScopeMatch).map(q=>q.ownerId))];
 if(state.owner!=="all"&&!ids.includes(state.owner))state.owner="all";
 $("quote-owner-filter").innerHTML='<option value="all">All owners</option>'+opts(ids.map(id=>[id,employee(id)?.name||id]),state.owner);
 $("quote-owner-filter").value=state.owner;
 $("quote-search").value=state.search;
}
function renderStats(){
 const items=db.quotations.filter(isScopeMatch);
 const cards=[
  ["Quotations",items.length,"Registered sample quotation records"],
  ["Drafts",items.filter(q=>q.status==="Draft").length,"Editable demo draft workflows"],
  ["Awaiting Approval",items.filter(q=>q.status==="Awaiting Approval").length,"Policy decision pending"],
  ["Sent / Won",items.filter(q=>["Sent","Won"].includes(q.status)).length,"Customer-facing outcome statuses"]
 ];
 $("quote-stats").innerHTML=cards.map(x=>'<div class="card ma6-stat"><span>'+esc(x[0])+'</span><strong>'+String(x[1]).padStart(2,"0")+'</strong><small>'+esc(x[2])+'</small></div>').join("");
}
function renderList(qs){
 $("quote-count").textContent=qs.length+" shown";
 $("quote-list").innerHTML=qs.length?qs.map(q=>
 '<button type="button" data-quote="'+esc(q.id)+'" aria-pressed="'+String(q.id===state.selected)+'" class="ma6-quote-card'+(q.id===state.selected?' active':'')+'">'+
 '<span class="ma6-quote-top"><b class="ma6-quote-title">'+esc(q.title)+'</b>'+statusBadge(q.status)+'</span>'+
 '<div class="ma6-quote-sub">'+esc(q.id)+' / '+esc(q.rev)+' · '+text(customer(q.customerId)?.name)+'</div>'+
 '<div class="ma6-quote-bottom"><span class="ma6-tag">'+text(employee(q.ownerId)?.name)+'</span><span class="ma6-quote-sub">'+money(totals(q).total)+'</span></div></button>'
 ).join(""):blank("No quotation matches the filters. Reset filters to see other sample quotations.");
}
function renderFullList(qs){
 const ordered=[...qs].sort((a,b)=>(Number(b.id.split("-").at(-1))||0)-(Number(a.id.split("-").at(-1))||0));
 const cols=["Quotation","Customer / Buyer","Selling company / Branch","Owner","Status","Updated","Total (demo)",""];
 const header='<thead><tr>'+cols.map(x=>'<th scope="col">'+esc(x)+'</th>').join("")+'</tr></thead>';
 const rows=ordered.map(q=>
  '<tr'+(q.id===state.selected?' class="ma6-selected-row"':'')+'><td><strong>'+esc(q.id)+' / '+esc(q.rev)+'</strong><span class="ma6-full-quote-title">'+esc(q.title)+'</span></td>'+
  '<td><strong>'+text(customer(q.customerId)?.name)+'</strong><small>'+text(buyer(q.buyerId)?.name)+'</small></td>'+
  '<td>'+text(entity(q.companyId)?.name)+'<small>'+text(branch(q.branchId)?.name)+'</small></td>'+
  '<td>'+text(employee(q.ownerId)?.name)+'</td>'+
  '<td>'+statusBadge(q.status)+'</td>'+
  '<td class="ma6-nowrap">'+text(q.lastUpdated)+'</td>'+
  '<td class="ma6-money"><strong>'+money(totals(q).total)+'</strong></td>'+
  '<td><button type="button" class="btn ma6-full-view" data-quote="'+esc(q.id)+'" aria-label="View details of quotation '+esc(q.id)+'">View Details</button></td></tr>').join("");
 $("quote-expanded-table").innerHTML=ordered.length?
  '<table class="ma6-table ma6-full-table"><caption>Quotations matching your current filters · Newest quotation number first</caption>'+header+'<tbody>'+rows+'</tbody></table>':
  blank("No quotations match the current filters. Change the search, status or scope to see more.");
}
function draftMissing(q){
 const pending=[];
 if(!customer(q.customerId))pending.push("Customer");
 if(!buyer(q.buyerId))pending.push("Exact buyer");
 if(!entity(q.companyId)||!branch(q.branchId))pending.push("Selling company / branch");
 if(!q.lines?.length)pending.push("BOQ items");
 if(!q.validUntil)pending.push("Validity date");
 const finalTerm=x=>!!String(x||"").trim()&&!/^(to be agreed|to be confirmed|tbd)$/i.test(String(x).trim());
 if(!finalTerm(q.payment))pending.push("Payment terms");
 if(!finalTerm(q.delivery))pending.push("Delivery terms");
 return pending;
}
function renderHeader(q){
 const issues=q.status==="Draft"?draftMissing(q):[];
 $("quote-header").innerHTML='<div class="ma6-detail-top"><div><small>'+esc(q.id)+' / '+esc(q.rev)+' · '+text(customer(q.customerId)?.name)+'</small><h2>'+esc(q.title)+'</h2><p>Buyer: '+text(buyer(q.buyerId)?.name)+' · '+text(entity(q.companyId)?.name)+' / '+text(branch(q.branchId)?.name)+'</p></div>'+
 '<div class="ma6-detail-actions">'+statusBadge(q.status)+
 (q.status==="Draft"?'<button type="button" class="btn primary" data-action="edit-builder">Continue Editing</button>':'<button type="button" class="btn" data-action="preview-pdf">Preview Offer</button>')+
 '<button type="button" class="btn" data-action="duplicate">Duplicate as Draft</button></div></div>'+
 '<div class="ma6-quote-meta"><span class="ma6-tag">Revision '+esc(q.rev)+'</span><span class="ma6-tag">Owner: '+text(employee(q.ownerId)?.name)+'</span><span class="ma6-tag">Updated '+esc(q.lastUpdated)+'</span><span class="ma6-tag">Total (demo): '+money(totals(q).total)+'</span>'+(q.demoDispatch?.response?.decision?'<span class="ma6-tag">Customer response (demo): '+esc(q.demoDispatch.response.decision)+'</span>':'')+'</div>'+
 (issues.length?'<div class="ma6a-draft-alert"><div><strong>Draft saved · '+issues.length+' detail'+(issues.length===1?'':'s')+' to complete</strong><p>'+esc(issues.join(" · "))+'</p></div><button type="button" class="btn" data-action="edit-builder">Complete Draft</button></div>':'')+
 '<div class="ma6-banner"><b>Configuration → BOQ → Quotation:</b> Technical selections and commercial terms are recorded separately. This public demo does not issue an approved customer offer.</div>';
}
function summary(q){
 const solar=q.projectTechnical;
 return panel("Quotation overview","Essential customer, buyer and selling scope; additional details are available on demand")+
 '<div class="ma6-kvs">'+kv("Quotation ID / Revision",q.id+" / "+q.rev)+kv("Status",q.status)+
 kv("Customer account",customer(q.customerId)?.name)+kv("Buyer / bill-to",buyer(q.buyerId)?.name)+
 kv("Our selling legal entity",entity(q.companyId)?.name)+kv("Our branch",branch(q.branchId)?.name)+
 kv("Quotation date",q.date)+kv("Valid until",q.validUntil)+'</div>'+
 '<div class="cpq-scope-panel"><h4>Services &amp; sub-services</h4>'+flow.summary(flow.quotedServiceIds(q))+
 '<p>Service references and BOQ lines remain independent of future master edits.</p></div>'+
 '<div class="ma6-section-sub"><h4>Customer master</h4><a class="btn" href="ma-004-customers.html?customer='+encodeURIComponent(q.customerId)+'">View customer (MA-004)</a></div>'+
 '<details class="ma6a-quote-more"><summary>More customer, project & record details</summary><div class="ma6-kvs">'+
 kv("Customer contact",contact(q.contactId)?.name)+kv("Customer site",site(q.siteId)?.name)+
 kv("Customer project",project(q.projectId)?.name)+kv("Source enquiry",q.opportunityId||"Direct quotation — no enquiry required")+
 kv("Sales owner",employee(q.ownerId)?.name)+kv("Currency",q.currency)+
 (solar?kv("Solar system type",solar.systemType||"Not specified")+
 kv("Target DC capacity",solar.targetDcKwp?solar.targetDcKwp+" kWp":"Not specified")+
 kv("Roof / installation site",[solar.roofType,solar.siteLocation].filter(Boolean).join(" · ")):"")+
 kv("Revision",q.rev)+kv("Last updated",q.lastUpdated)+'</div></details>'+
 (q.sourceConfigId?'<div class="ma6a-quote-source"><b>Source technical configuration:</b> '+esc(q.sourceConfigId)+' / '+esc(q.sourceConfigRevision||"C0")+
 ' · '+esc(q.sourceConfigName||"Saved configuration")+' (snapshot reference) · <a href="ma-006a-configuration.html?configuration='+encodeURIComponent(q.sourceConfigId)+'">View configuration</a></div>':'')+
 (q.opportunityId?'<div class="ma6-section-sub"><h4>Source opportunity</h4><a class="btn" href="ma-005-opportunities.html?opportunity='+encodeURIComponent(q.opportunityId)+'">View MA-005</a></div>':'')+
 note('Customer and buyer are separate records. An issued revision must preserve exact buyer identity, legal selling scope, product details and pricing. Issuing is disabled in this demo.');
}
function items(q){
 return panel("Configuration & Bill of Quantities","Technical items selected from MA-006A or added directly to this quotation.",
  q.status==="Draft"?"edit-builder":"","Continue Editing")+
 (q.sourceConfigId?'<div class="ma6a-quote-source"><b>Imported from:</b> '+esc(q.sourceConfigName||q.sourceConfigId)+
 ' · '+esc(q.sourceConfigId)+' / '+esc(q.sourceConfigRevision||"C0")+'</div>':'')+
 (q.lines.length?table(["Product / Service / Model","Technical specification / scope","Qty","Unit","Selling rate (demo)","Line total"],
 q.lines.map(l=>'<tr><td><strong>'+esc(l.description)+'</strong><small>'+esc(l.productId)+' · '+esc(l.type)+'</small></td>'+
 '<td>'+text(lineConfig(l))+(l.technicalReview?'<small>Project technical changes need review</small>':'')+
 (l.includedInParent?'<small class="cpq-quote-service-included">Included in parent package — not billed separately</small>':'')+
 (l.modelSnapshot?.documentRefs?.length?'<small>'+l.modelSnapshot.documentRefs.length+' captured document reference(s) · metadata only</small>':'')+'</td><td>'+esc(l.quantity)+'</td>'+
 '<td>'+esc(l.unit)+'</td><td class="ma6-money">'+money(l.unitPrice)+'</td><td class="ma6-money">'+money(extended(l))+'</td></tr>')):blank("No BOQ lines yet. Continue Editing to add catalog equipment or services."))+
 '<div class="cpq-model-snapshot"><h4>Captured product specifications and document references</h4>'+
 (q.lines.some(l=>l.modelSnapshot)?q.lines.filter(l=>l.modelSnapshot).map(l=>{
  const m=l.modelSnapshot,docs=m.documentRefs||[],w=m.warranty||{};
  return '<details><summary>'+esc(l.description)+' · '+esc(m.sku)+' ('+docs.length+' document references)</summary>'+
   '<p>'+esc([m.manufacturer,m.model,m.capacity].filter(Boolean).join(" · "))+'</p>'+
   (w.months!==undefined?'<p>Product warranty recorded: '+esc(w.months)+' months</p>':'')+
   (docs.length?'<ul>'+docs.map(d=>'<li>'+esc(d.name)+' · '+esc(d.type)+' · v'+esc(d.version)+
    ' ('+esc(d.visibility)+')</li>').join("")+'</ul>':'<p>No current document references captured.</p>')+
   '<small>Captured model metadata; document contents are not attached or downloadable in this wireframe.</small></details>';
 }).join(""):'<p>No model-specific document references on the current BOQ.</p>')+'</div>'+
 '<div class="ma6a-boq-total"><span>'+q.lines.length+' BOQ item'+(q.lines.length===1?'':'s')+' · Sample subtotal</span><strong>'+money(totals(q).subtotal)+'</strong></div>'+
 note('The BOQ stores selected models, quantities and their offered technical scope. Engineering compatibility, manufacturer data, actual rates and generated BOM require separate approved services.');
}
function financialRows(q){
 const t=totals(q);
 return '<div class="ma6-pricing-summary">'+
 '<div class="ma6-price-row"><span>BOQ subtotal</span><strong>'+money(t.subtotal)+'</strong></div>'+
 '<div class="ma6-price-row"><span>Sample discount ('+esc(q.discount)+'%)</span><strong>− '+money(t.discount)+'</strong></div>'+
 '<div class="ma6-price-row"><span>Illustrative taxable base</span><strong>'+money(t.taxable)+'</strong></div>'+
 '<div class="ma6-price-row"><span>Illustrative tax ('+esc(q.taxRate)+'%)</span><strong>'+money(t.tax)+'</strong></div>'+
 '<div class="ma6-price-row final"><span>Illustrative quote total</span><strong>'+money(t.total)+'</strong></div></div>';
}
function commercial(q){
 const p=draftMissing(q).filter(x=>["Validity date","Payment terms","Delivery terms"].includes(x));
 return panel("Commercial summary","Sample calculations and the conditions intended for the customer")+
 '<div class="ma6a-commercial-top"><div class="ma6a-commercial-aside"><h4>Pricing review</h4><p>Figures are illustrative. Confirm SKU rates, tax treatment, discounts and any price exceptions before submitting for approval.</p>'+
 '<div class="ma6a-commercial-badges"><span class="ma6-tag">Discount: '+esc(q.discount)+'%</span><span class="ma6-tag">Tax assumption: '+esc(q.taxRate)+'%</span></div>'+
 (q.status==="Draft"?'<button type="button" class="btn" data-action="edit-builder">Edit Price & Terms</button>':'')+
 '</div>'+financialRows(q)+'</div>'+
 (q.status==="Draft"&&p.length?'<div class="ma6a-draft-alert"><div><strong>Customer-facing terms are incomplete</strong><p>'+esc(p.join(" · "))+'</p></div>'+
 '<button type="button" class="btn" data-action="edit-builder">Complete Terms</button></div>':'')+
 '<div class="ma6-section-sub"><h4>Customer-facing conditions</h4></div>'+
 '<div class="ma6-kvs">'+kv("Payment terms",q.payment)+kv("Delivery / execution",q.delivery)+
 kv("Warranty / support",q.warranty)+kv("Validity",q.validUntil)+kv("Exclusions",q.exclusions)+'</div>'+
 '<details class="ma6a-quote-more"><summary>Internal commercial notes · Not printed on customer preview</summary><p class="ma6a-note-text">'+text(q.notes)+'</p></details>'+
 note('<b>Pricing safeguard:</b> Demo amounts, discounts and tax rates are not approved. Production needs price lists, HSN/SAC, item-level taxes, jurisdiction, rounding, freight and finance policy enforcement.',true);
}
function reviewChecks(q){
 const hasFinal=(x)=>!!String(x||"").trim()&&!/^(to be agreed|to be confirmed|tbd)$/i.test(String(x).trim());
 const termsOK=hasFinal(q.payment)&&hasFinal(q.delivery)&&!!String(q.validUntil||"").trim()&&Number.isFinite(Date.parse(q.validUntil));
 return [
 ["Buyer / internal scope",Boolean(buyer(q.buyerId)&&entity(q.companyId)&&branch(q.branchId)),"Customer legal buyer and selling branch identified"],
 ["BOQ lines",q.lines.length>0,"At least one item, valid quantity and selling rate"],
 ["Config rules",q.lines.every(l=>l.type!=="config"||configCheck(product(l.productId),l.options).ok),"Sample compatibility check only — engineers must approve rules"],
 ["Terms",termsOK,"Validity, payment and delivery terms must be finalized before issue; placeholders are not approval"],
 ["Pricing/discount policy",false,"Real tax, pricing and approvals are not evaluated in this demo"],
 ["Imported catalog prices",!q.lines.some(l=>l.pricingReview),"Seeded rates are illustration-only. Validate manufacturer/SKU, costs, selling price and exceptions."],
 ["Demo-only model verification",!q.lines.some(l=>l.technicalReview||l.unverified),"Demo-enabled catalog models and incomplete technical data are not production-approved"],
 ["Issuance permission",false,"Requires authorized approval, locked revision and audit in production"],
  ["No double-charge of included sub-services",!q.lines.some(l=>l.includedInParent&&Number(l.unitPrice)>0),
   "Child services bundled under a parent package are not billed separately"]
 ];
}
function demoReadiness(q){
 const missing=[],c=customer(q.customerId),b=buyer(q.buyerId),co=entity(q.companyId),br=branch(q.branchId),own=employee(q.ownerId);
 if(!String(q.title||"").trim())missing.push("Quotation title");
 if(!c||!b||b.customerId!==q.customerId)missing.push("Customer and exact buyer");
 if(!co||!br||br.companyId!==q.companyId||!c?.links?.some(x=>x.companyId===q.companyId&&x.branchId===q.branchId))missing.push("Valid selling company and branch");
 if(!own||own.status!=="Active"||!(own.assignments||[]).some(x=>x.companyId===q.companyId&&(x.branches||[]).includes(q.branchId)))missing.push("Responsible employee assigned to this branch");
 if(!q.lines?.length||q.lines.some(l=>!Number.isInteger(Number(l.quantity))||Number(l.quantity)<=0||!Number.isFinite(Number(l.unitPrice))||Number(l.unitPrice)<0))missing.push("Valid BOQ products, quantities and sample rates");
 if(q.lines?.some(l=>!l.includedInParent&&!(Number(l.unitPrice)>0)))
  missing.push("Enter a positive fictional sample selling rate for each billable line; included sub-services remain ₹0");
 if(!reviewChecks(q)[2][1])missing.push("Complete product option selections");
 if(!reviewChecks(q)[3][1])missing.push("Validity, payment and delivery terms");
 return missing;
}
function approvals(q){
 const checks=reviewChecks(q),passed=checks.filter(x=>x[1]).length,d=q.demoApproval||null;
 const canTry=q.status==="Draft",missing=canTry?demoReadiness(q):[];
 const stage=d?.state||"Not requested";
 const reviewCard=(role,label,desc)=>{
  const current=d?.[role]||"Not requested",pending=d?.state==="In review"&&current==="Pending"&&canTry;
  return '<div class="ma6a-review-card"><div class="ma6a-review-card-title"><b>'+esc(label)+'</b><span class="ma6a-demo-state">'+esc(current)+'</span></div>'+
   '<p>'+esc(desc)+'</p><small>Reviewer assignment comes from policy; this public demo has no signed-in reviewer.</small>'+
   (pending?'<button type="button" class="btn" data-action="simulate-review" data-role="'+role+'">Simulate decision</button>':'')+'</div>';
 };
 const events=d?.events||[];
 return panel("Review & Approvals","Simple employee workflow · role-based approval design","preview-approval","How real approvals work")+
  '<div class="ma6a-demo-approval-intro"><div><span class="ma6a-demo-kicker">BROWSER-ONLY DEMONSTRATION</span><h4>Approval workflow</h4><p>Submit for sample review, then test technical and commercial decisions. These actions do not authenticate an approver or authorize a quotation.</p></div>'+
  '<span class="ma6a-demo-state">'+esc(stage)+'</span></div>'+
  '<div class="ma6a-review-grid">'+
  reviewCard("technical","1 · Technical review","Engineering scope, product compatibility, specifications and site checks.")+
  reviewCard("commercial","2 · Commercial review","SKU pricing, discount, tax assumptions, terms and policy exceptions.")+'</div>'+
  (canTry?'<div class="ma6a-review-next"><div><b>'+(missing.length?'Before sample submission: '+missing.length+' item(s) to complete':stage==="Demo reviewed"?'Both sample decisions recorded':'Next: submit the draft for sample review')+'</b>'+
  '<p>'+(missing.length?esc(missing.join(" · ")):stage==="Demo reviewed"?'This is not a real approval. The production system must validate and authorize the locked revision.':stage==="In review"?'Open a review card to simulate a reviewer response.':'The demo will route this draft to both sample review queues; no actual permission or engineering check is executed.')+'</p></div>'+
  (stage==="In review"||stage==="Demo reviewed"?'':missing.length?
  '<button type="button" class="btn" data-action="edit-builder">Complete draft</button>':
  '<button type="button" class="btn primary" data-action="submit-demo-review">'+(d?'Resubmit Demo Review':'Submit Demo Review')+'</button>')+
  '</div>':'<div class="ma6a-review-next"><div><b>Historical sample / not an editable draft</b><p>This record is read-only here. No validated approval evidence is available in this public demonstration.</p></div></div>')+
  '<details class="ma6a-quote-more"><summary>Quotation checks ('+passed+' of '+checks.length+' sample checks shown as passed)</summary>'+
  '<div class="ma6-checklist">'+checks.map(([title,done,desc])=>
  '<div class="ma6-check-item"><span class="ma6-check-icon">'+(done?'✓':'!')+'</span><div><b>'+esc(title)+'</b><small>'+esc(desc)+'</small></div></div>').join("")+'</div></details>'+
  '<details class="ma6a-quote-more"><summary>Demo review history ('+events.length+')</summary>'+
  (events.length?'<div class="ma6a-review-history">'+[...events].reverse().map(ev=>'<div class="ma6a-review-event"><strong>'+esc(ev.action)+'</strong><small>'+esc(ev.at)+' · '+esc(ev.actor)+' · '+esc(ev.revision||q.rev)+'</small>'+
  (ev.comment?'<p>'+esc(ev.comment)+'</p>':'')+'</div>').join("")+'</div>':blank("No demo review actions recorded yet."))+'</details>'+
  '<div class="ma6-kvs">'+kv("Quotation status",q.status)+kv("Real approval state","Not verified · no actual submission")+
  kv("Discount",q.discount+"% (illustrative)")+kv("Production approver","Assigned by MA-003 rights and approval policy")+'</div>'+
  note('<b>Production boundary:</b> Technical and commercial decisions must be made by authorized, separate reviewers, with policy routing, immutable audit records and locked revision snapshots. This demo cannot approve, issue, email or send a quotation.',true);
}
function revisions(q){
 const sample=db.revisions.filter(x=>x.quoteId===q.id);
 const generated=[...sample,...state.history.filter(h=>h.quoteId===q.id&&h.kind==="revision").map(h=>h.revision)];
 const rows=generated.length?generated:[
 {quoteId:q.id,revision:q.rev,date:q.date,by:employee(q.ownerId)?.name||"Sample",note:q.versionNotes||"Initial sample revision",locked:q.status!=="Draft"}];
 return panel("Quotation versions & snapshots","Each revision belongs to the same quotation. Copying creates a separate quotation.","duplicate","Copy as New Draft")+
 '<div class="ma6a-version-helper"><b>Current record:</b> '+esc(q.id)+' / '+esc(q.rev)+
 ' · '+esc(q.status)+'. A new draft copy is not an R1 revision of this quote.</div>'+
 rows.map(r=>'<div class="ma6-revision-row"><div><strong>'+esc(r.revision)+' · '+(r.locked?'Historical snapshot':'Current draft')+'</strong><p>'+esc(r.note)+'</p>'+
 '<small>'+esc(r.date)+' · '+esc(r.by)+'</small></div><span class="ma6-tag">'+(r.locked?'Historical (sample)':'Draft (sample)')+'</span></div>').join("")+
 note('Revision creation and comparison, locked issued snapshots, reasons for changes, previous PDFs and dispatch evidence require controlled backend storage. Example history is illustrative metadata, not a document store.');
}
function paper(q){
 const t=totals(q);
 return '<div class="ma6-paper"><div class="ma6-paper-head"><div><strong>'+text(entity(q.companyId)?.name)+'</strong><p>Customer quotation preview · fictional information</p></div><span>'+esc(q.id)+' / '+esc(q.rev)+'</span></div>'+
 '<p><b>To:</b> '+text(buyer(q.buyerId)?.name)+'<br><b>Reference:</b> '+esc(q.title)+'<br><b>Valid until:</b> '+text(q.validUntil)+'</p>'+
 '<table><thead><tr><th>Particulars</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead><tbody>'+
 q.lines.map(l=>'<tr><td>'+esc(l.description)+'</td><td>'+esc(l.quantity)+'</td><td>'+esc(l.unit)+'</td><td class="ma6-money">'+money(extended(l))+'</td></tr>').join("")+
 '</tbody></table><p><b>Illustrative total:</b> '+money(t.total)+' (including sample discount / tax inputs)</p>'+
 '<p><b>Payment:</b> '+text(q.payment)+'<br><b>Delivery:</b> '+text(q.delivery)+'<br><b>Warranty:</b> '+text(q.warranty)+'</p>'+
 '<p><b>Exclusions:</b> '+text(q.exclusions)+'</p><p style="border-top:1px solid #e8edf2;padding-top:12px"><b>NOT AN ISSUED QUOTATION.</b> No company signature, approval, verified tax data or legally usable PDF is provided.</p></div>';
}
function documents(q){
 const dispatch=q.demoDispatch||null, events=dispatch?.events||[];
 const simulated=dispatch?.state==="Sent in demo", historical=["Sent","Won","Lost"].includes(q.status);
 const canSimulate=q.status==="Draft"&&!simulated&&q.demoApproval?.state==="Demo reviewed"&&demoReadiness(q).length===0;
 const canRespond=simulated||q.status==="Sent";
 const currentResponse=dispatch?.response?.decision?dispatch.response.decision+" (demo)":q.response||"Not recorded";
 const dispatchLabel=simulated?"Sent in demo":historical?"Historical sample (unverified)":"Not dispatched";
 const formatEvent=ev=>'<div class="ma6a-review-event"><strong>'+esc(ev.action)+'</strong><small>'+esc(ev.at||"")+' · '+esc(ev.actor||"Demo user")+' · '+esc(ev.revision||q.rev)+'</small>'+
  (ev.comment?'<p>'+esc(ev.comment)+'</p>':'')+'</div>';
 return panel("PDF Preview & Customer Response","Preview the customer layout, then review dispatch and customer communication.","preview-pdf","Expand preview")+
 (q.status==="Draft"?'<div class="ma6a-preview-state"><b>Draft preview only.</b> This is not an approved PDF and cannot be issued or sent. Finalize terms and obtain required authorization first.</div>':'')+
 paper(q)+
 '<div class="ma6-section-sub ma6a-dispatch-heading"><h4>Dispatch & customer response</h4><button type="button" class="btn" data-action="preview-dispatch">How the real workflow works</button></div>'+
 '<div class="ma6a-dispatch-intro"><b>Browser-only workflow demo</b><p>Practice the steps below without sending anything to a customer or changing an official quotation status. Simulated review and response records persist only in this browser; Reset demo data clears them.</p></div>'+
 '<div class="ma6a-dispatch-grid">'+
 '<section class="ma6a-dispatch-card"><div class="ma6a-dispatch-card-title"><b>1 · Send quotation</b><span class="ma6a-demo-state">'+esc(dispatchLabel)+'</span></div>'+
 '<p>Production: lock an authorized revision, create the issued PDF, and capture recipient, channel and proof of sending.</p>'+
 (canSimulate?'<button type="button" class="btn primary" data-action="open-demo-dispatch">Simulate dispatch</button>':
 simulated?'<div class="ma6a-dispatch-meta"><b>Recipient:</b> '+esc(dispatch.recipient||"Not recorded")+'<br><b>Channel:</b> '+esc(dispatch.channel||"Not recorded")+'<br><b>Reference:</b> '+esc(dispatch.reference||"Not recorded")+'<br><b>Date:</b> '+esc(dispatch.date||"Not recorded")+'</div>':
 q.status==="Draft"?'<div class="ma6a-dispatch-help">Complete the two demo reviews and essential terms first. <button type="button" class="btn" data-action="go-demo-approvals">Open Reviews</button></div>':
 '<p class="ma6a-dispatch-muted">Existing sample status only. No actual dispatch or authorization can be verified here.</p>')+
 '</section>'+
 '<section class="ma6a-dispatch-card"><div class="ma6a-dispatch-card-title"><b>2 · Customer response</b><span class="ma6a-demo-state">'+esc(currentResponse)+'</span></div>'+
 '<p>Record Accepted, Rejected or Changes Requested, with the reply source, date, reference and notes.</p>'+
 (canRespond?'<button type="button" class="btn primary" data-action="open-demo-response">'+(dispatch?.response?"Update demo response":"Record demo response")+'</button>':
 '<p class="ma6a-dispatch-muted">Available after a simulated dispatch, or for a historical Sent sample.</p>')+
 (dispatch?.response?'<div class="ma6a-dispatch-meta"><b>Source:</b> '+esc(dispatch.response.source)+'<br><b>Received:</b> '+esc(dispatch.response.date)+'<br><b>Evidence:</b> '+esc(dispatch.response.reference||"Not recorded")+'</div>':'')+
 '</section></div>'+
 (dispatch?.response?.decision==="Accepted"?note('A sample acceptance was recorded. Order registration is a separate process; no order has been created.'):'')+
 (dispatch?.response?.decision==="Changes Requested"?note('Customer requested changes. In production create a new controlled quotation revision; never overwrite a sent revision.',true):'')+
 '<details class="ma6a-quote-more"><summary>Dispatch and response demo history ('+events.length+')</summary>'+
 (events.length?'<div class="ma6a-review-history">'+[...events].reverse().map(formatEvent).join("")+'</div>':
 '<p class="ma6a-dispatch-muted">No demo activity has been recorded for this quote. Historical example statuses are not verified dispatch records.</p>')+'</details>'+
 note('Production controls: MA-003 permission and policy checks, immutable approved revision, final buyer and seller identity, issued-PDF reference, dispatch evidence, controlled response history and separate order creation. This demo does not issue, email or authorize offers.',true);
}
const tabs={summary,items,commercial,approvals,revisions,documents};
function detail(){
 const q=quote(state.selected);
 if(!q){$("quote-header").innerHTML=blank("Select a quotation from the register.");$("quote-tab-body").innerHTML="";return;}
 renderHeader(q);
 for(const b of $("quote-tabs").querySelectorAll("[data-tab]")){const yes=b.dataset.tab===state.tab;b.classList.toggle("active",yes);b.setAttribute("aria-selected",String(yes));}
 $("quote-tab-body").innerHTML=(tabs[state.tab]||summary)(q);
}
function renderRegister(){
 renderFilters();renderStats();const qs=visible();
 if(!qs.some(q=>q.id===state.selected))state.selected=qs[0]?.id||"";
 renderList(qs);renderFullList(qs);detail();
}
const steps=[["Customer & Project","Customer and selling scope"],["Products & BOQ","Imported items and sample rates"],["Price & Terms","Totals and offer conditions"],["Review & Save","Draft checks and preview"]];
function formSelect(id,label,values,current,placeholder="Select...",required=false){
 return '<div class="ma6-field"><label for="b-'+esc(id)+'">'+esc(label)+(required?' *':'')+'</label><select id="b-'+esc(id)+'" data-field="'+esc(id)+'"><option value="">'+esc(placeholder)+'</option>'+opts(values,current)+'</select></div>';
}
function formInput(id,label,value="",type="text",full=false,required=false){
 return '<div class="ma6-field'+(full?' full':'')+'"><label for="b-'+esc(id)+'">'+esc(label)+(required?' *':'')+'</label><input id="b-'+esc(id)+'" data-field="'+esc(id)+'" type="'+esc(type)+'" value="'+esc(value)+'"></div>';
}
function formArea(id,label,value="",full=true){
 return '<div class="ma6-field'+(full?' full':'')+'"><label for="b-'+esc(id)+'">'+esc(label)+'</label><textarea id="b-'+esc(id)+'" data-field="'+esc(id)+'" rows="3">'+esc(value)+'</textarea></div>';
}
function contextBuilder(q){
 const links=customer(q.customerId)?.links||[];
 const customers=master.customers.filter(x=>x.status!=="Archived").map(x=>[x.id,x.name+" · "+x.type]);
 const bs=master.companies.filter(x=>x.customerId===q.customerId).map(x=>[x.id,x.name]);
 const contacts=master.contacts.filter(x=>x.customerId===q.customerId&&x.companyId===q.buyerId).map(x=>[x.id,x.name]);
 const sites=master.sites.filter(x=>x.customerId===q.customerId&&x.companyId===q.buyerId).map(x=>[x.id,x.name]);
 const projects=master.projects.filter(x=>x.customerId===q.customerId&&x.companyId===q.buyerId).map(x=>[x.id,x.name]);
 const comps=org.filter(e=>links.some(l=>l.companyId===e.id)).map(e=>[e.id,e.name]);
 const branches=(entity(q.companyId)?.branches||[]).filter(x=>links.some(l=>l.companyId===q.companyId&&l.branchId===x.id)).map(x=>[x.id,x.name+" · "+x.city]);
 const owners=staff.filter(u=>u.status==="Active"&&(u.assignments||[]).some(x=>x.companyId===q.companyId&&x.branches.includes(q.branchId))).map(x=>[x.id,x.name]);
 const opps=enquiries.filter(x=>x.customerId===q.customerId&&x.buyerId===q.buyerId).map(x=>[x.id,x.id+" · "+x.title]);
 return panel("1 · Customer, Buyer & Scope","Use MA-004 master records and optionally link an MA-005 enquiry. A direct quotation is also allowed.")+
 '<div class="ma6-field-grid">'+formSelect("customerId","Customer account",customers,q.customerId,"Choose customer",true)+formSelect("buyerId","Exact buyer / bill-to",bs,q.buyerId,"Choose buyer",true)+
 formSelect("companyId","Our selling legal entity",comps,q.companyId,"Choose legal entity",true)+formSelect("branchId","Our internal branch",branches,q.branchId,"Choose branch",true)+
 formSelect("ownerId","Responsible employee",owners,q.ownerId,"Choose owner",true)+formSelect("opportunityId","Source opportunity (optional)",opps,q.opportunityId,"Direct quotation — no opportunity")+
 formSelect("contactId","Customer contact (optional)",contacts,q.contactId,"Choose contact")+formSelect("siteId","Delivery / project site (optional)",sites,q.siteId,"Choose site")+
 formSelect("projectId","Customer project (optional)",projects,q.projectId,"Choose project")+
 formInput("title","Quotation title",q.title,"text",true,true)+'</div>'+
 note('Selecting a group customer requires an exact buyer company. Contact, site and project choices must refer to that buyer; a customer’s “primary buyer” is only a default, not an authorized substitution. The selling entity and branch must be linked to this customer.');
}
function catalogPicker(q,b){
 const source=window.CPQ_MA006A_CATALOG;
 const catalog=(source?.variants||[]).filter(v=>v.status==="Active").map(v=>product(v.id)).filter(p=>p&&p.type!=="service");
 const builtins=db.products.filter(p=>!q.projectTechnical&&p.type!=="service");
 const serviceChoices=flow.services().filter(s=>s.status==="Active").map(s=>product(s.id));
 const suggested=new Set(flow.quotedServiceIds(q).flatMap(id=>flow.service(id)?.productIds||[]));
 const sortedCatalog=[...catalog].sort((a,b)=>Number(suggested.has(b.id))-Number(suggested.has(a.id)));
 const all=[...sortedCatalog,...builtins,...serviceChoices];
 const search=String(b.catalogSearch||"").trim().toLowerCase();
 const searchText=p=>[p.name,p.id,p.sku,p.model,p.manufacturer,p.rating,p.catalogSpec].filter(Boolean).join(" ").toLowerCase();
 const matches=all.filter(p=>!search||searchText(p).includes(search));
 const selected=product(b.productId);
 const choice=selected&&matches.some(p=>p.id===selected.id)?selected:null;
 const options=choice?.type==="config"?Object.entries(choice.options).map(([key,spec])=>
  formSelect("config-"+key,spec.label,spec.choices.map(([val])=>[val,val]),b.options?.[key]||choice.defaults[key],"Choose option",true)).join(""):"";
 const validation=choice?configCheck(choice,b.options||{}):null;
 const selection=choice?'<h3>'+esc(choice.name)+'</h3>'+
 (options?'<div class="ma6-field-grid">'+options+'</div>':
 '<p class="muted">This model uses the specifications maintained in MA-006A.</p>')+
 '<div class="ma6-field"><label for="b-config-qty">Quantity ('+esc(choice.unit||"Nos")+')</label>'+
 '<input id="b-config-qty" type="number" min="1" step="1" data-config-qty value="'+esc(b.quantity)+'"></div>'+
 (choice.status&&choice.status!=="Active"?'<div class="ma6-validation">This catalog model is a Draft and cannot be selected for a quotation.</div>':
 '<div class="ma6-validation'+(validation.ok?' ok':'')+'">'+esc(validation.message)+'</div>')+
 '<button class="btn primary" type="button" data-action="add-config-item">+ Add to BOQ</button>':
 '<h3>Select a product</h3><p class="ma6a-quote-select-help">Search by name, model or SKU, then click <b>Select</b> on the correct product before entering its quantity.</p>';
 return '<div class="ma6a-product-picker-toolbar"><div class="ma6-field">'+
 '<label for="quote-add-search">Find a product model or service</label><input type="search" id="quote-add-search" data-catalog-search value="'+esc(b.catalogSearch||"")+'" placeholder="Search ST-PV-550, inverter, manufacturer, SKU..." autocomplete="off">'+
 '<p class="ma6a-picker-results-count" id="quote-add-result-count" role="status" aria-live="polite">'+matches.length+' matching product(s)</p></div></div>'+
 '<div class="ma6-config-grid"><div><div class="ma6-product-cards" id="quote-add-results">'+
 matches.map(p=>'<button type="button" data-product="'+esc(p.id)+'" data-search="'+esc(searchText(p))+'" class="ma6-product-card'+(p.id===choice?.id?' selected':'')+'">'+
 '<div>'+typeBadge(p.type)+'<strong>'+esc(p.name)+'</strong>'+
 '<small>'+esc(p.catalogSpec||p.id+" · "+p.unit)+
 (suggested.has(p.id)?' · Suggested for selected service':'')+'</small></div><span class="ma6-tag">Select</span></button>').join("")+
 '<div class="ma6-empty" id="quote-add-no-matches"'+(matches.length?' hidden':'')+'>No matching active catalog products. Check the model/SKU or try a broader search.</div>'+
 '</div></div><div class="ma6-config-form" id="quote-add-selection">'+selection+'</div></div>';
}
function boqBuilder(q,b){
 const source=q.sourceConfigId?
 '<div class="ma6-note"><b>Imported configuration:</b> '+esc(q.sourceConfigName||q.sourceConfigId)+
 ' · '+esc(q.sourceConfigId)+' / '+esc(q.sourceConfigRevision||"C0")+
 '. These lines were already selected in MA-006A. Add or edit only what this quotation needs.</div>':
 '<div class="ma6-note">Add catalog models or services directly, or begin with a saved technical configuration from MA-006A.</div>';
 const lineTable=q.lines.length?table(["BOQ item / specification","Qty","Unit","Sample unit rate","Line total",""],
 q.lines.map(l=>'<tr><td><strong>'+esc(l.description)+'</strong><small>'+esc(lineConfig(l))+'</small>'+
 (l.pricingReview?'<small>Catalog rate requires approval</small>':'')+
 (l.technicalReview?'<small>Technical variation needs review</small>':'')+
 (l.includedInParent?'<small class="cpq-quote-service-included">Included in parent package (₹0 extra)</small>':'')+'</td>'+
 '<td><input class="ma6-qty" type="number" min="1" step="1" data-line-qty="'+esc(l.id)+'" value="'+esc(l.quantity)+'" aria-label="Quantity '+esc(l.description)+'"></td>'+
 '<td>'+esc(l.unit)+'</td><td class="ma6-money"><input class="ma6-rate" type="number" min="0" step="0.01" data-line-rate="'+esc(l.id)+'" value="'+esc(l.unitPrice)+'"'+
 (l.includedInParent?' disabled title="Included in parent package; billed once on parent service"':'')+
 ' aria-label="Sample selling rate '+esc(l.description)+'"></td>'+
 '<td class="ma6-money">'+money(extended(l))+'</td><td><button type="button" class="btn" data-remove-line="'+esc(l.id)+'" aria-label="Remove '+esc(l.description)+'">Remove</button></td></tr>')):
 blank("No BOQ items yet. Add a product or import a configuration.");
 return panel("2 · Products & BOQ",q.sourceConfigId?"Review imported configuration items and add any additional products.":"Select products directly from the catalog, then confirm quantities and sample rates.")+
 source+lineTable+
 '<div class="ma6-section-sub ma6a-quote-add"><h4>'+q.lines.length+' BOQ item(s) · Subtotal '+money(totals(q).subtotal)+'</h4>'+
 '<button type="button" class="btn'+(b.addPickerOpen?'':' primary')+'" data-action="toggle-add-product">'+
 (b.addPickerOpen?'Close Product Picker':'+ Add Catalog Product')+'</button></div>'+
 (b.addPickerOpen?'<div class="ma6a-quote-catalog-picker">'+catalogPicker(q,b)+'</div>':"")+
 note('Catalog prices and taxes are not authorized. Price and technical exceptions require approval; new project-specific specifications do not silently alter Product Catalog.');
}
function isoDate(v){
 if(/^\d{4}-\d{2}-\d{2}$/.test(String(v||"")))return v;
 const date=new Date(v);return Number.isFinite(date.valueOf())?date.toISOString().slice(0,10):"";
}
function priceTermsBuilder(q){
 return panel("3 · Price & Terms","Apply sample commercial assumptions, then set the terms to be offered to the customer.")+
 '<div class="ma6a-pricing-layout"><div class="ma6a-pricing-inputs"><h4>Sample pricing adjustments</h4>'+
 '<div class="ma6-price-controls">'+formInput("discount","Sample discount %",q.discount,"number")+
 formInput("taxRate","Illustrative tax %",q.taxRate,"number")+'</div>'+
 '<p class="ma6a-pricing-help">Rates, discounts and tax are illustrative and require approval before a customer offer can be issued.</p></div>'+
 financialRows(q)+'</div>'+
 '<div class="ma6-section-sub"><h4>Customer-facing terms</h4></div>'+
 '<div class="ma6-field-grid">'+formInput("validUntil","Valid until (required before issue)",isoDate(q.validUntil),"date")+
 formInput("currency","Currency",q.currency,"text")+
 '<div class="ma6-field full"><label for="quote-payment-preset">Payment terms template (optional)</label>'+
 '<select id="quote-payment-preset" data-payment-preset><option value="">Select a sample template...</option>'+
 '<option value="50% advance; 50% before dispatch">50% advance / 50% before dispatch</option>'+
 '<option value="30% advance; 70% after completion">30% advance / 70% after completion</option>'+
 '<option value="Net 30 days from invoice">Net 30 days</option></select></div>'+
 formArea("payment","Payment terms",q.payment)+formArea("delivery","Delivery / execution terms",q.delivery)+'</div>'+
 '<details class="ma6a-quote-more"><summary>Warranty, exclusions & internal notes</summary><div class="ma6-field-grid">'+
 formArea("warranty","Warranty / support",q.warranty)+formArea("exclusions","Exclusions",q.exclusions)+
 formArea("notes","Internal notes (not on PDF)",q.notes)+'</div></details>'+
 note('These are demo values. Real HSN/SAC, applicable GST, customer jurisdiction, freight, price list and discount approvals must come from server-controlled commercial rules.',true);
}
function reviewBuilder(q){
 const rows=reviewChecks(q),ready=Boolean(q.customerId&&q.buyerId&&q.companyId&&q.branchId&&q.ownerId&&q.title&&q.lines.length>0&&q.lines.every(l=>numeric(l.quantity)>0&&numeric(l.unitPrice)>=0&&(l.type!=="config"||configCheck(product(l.productId),l.options).ok)));
 const termsFinalized=Boolean(isoDate(q.validUntil))&&!/^\s*(to be agreed|to be confirmed|tbd)\s*$/i.test(q.payment||"")&&!!String(q.payment||"").trim()&&!/^\s*(to be agreed|to be confirmed|tbd)\s*$/i.test(q.delivery||"");
 return panel("4 · Review & Save Draft","Saving a quote does not approve or send it to the customer.")+
 '<div class="ma6-kvs">'+kv("Customer",customer(q.customerId)?.name)+kv("Buyer",buyer(q.buyerId)?.name)+
 kv("Selling company / branch",(entity(q.companyId)?.name||"Not selected")+" / "+(branch(q.branchId)?.name||"Not selected"))+
 kv("Source configuration",q.sourceConfigId?(q.sourceConfigId+" / "+(q.sourceConfigRevision||"C0")):"Direct quotation")+
 kv("BOQ lines",String(q.lines.length))+kv("Demo total",money(totals(q).total))+'</div>'+
 '<div class="ma6a-quote-review-status">'+
 '<div class="ma6-check-item"><span class="ma6-check-icon">'+(ready?'✓':'!')+'</span><div><b>'+(ready?'Draft information present':'Draft needs information')+'</b>'+
 '<small>'+(ready?'Customer, buyer and BOQ are structurally present.':'Review missing customer, buyer, product or quantities.')+'</small></div></div>'+
 '<div class="ma6-check-item"><span class="ma6-check-icon">'+(termsFinalized?'✓':'!')+'</span><div><b>'+(termsFinalized?'Terms entered':'Commercial terms need confirmation')+'</b>'+
 '<small>Validity, payment and execution conditions should be agreed before issue.</small></div></div>'+
 '<div class="ma6-check-item"><span class="ma6-check-icon">!</span><div><b>Technical and commercial approval pending</b>'+
 '<small>Engineering, catalog rates, discounts and tax policy are not approved by this demo.</small></div></div>'+
 '<div class="ma6-check-item"><span class="ma6-check-icon">!</span><div><b>Issuing or sending disabled</b>'+
 '<small>An approved, locked quotation revision is required in production.</small></div></div></div>'+
 '<details class="ma6a-quote-more"><summary>Detailed review checklist ('+rows.length+')</summary>'+
 '<div class="ma6-checklist">'+rows.map(([k,passed,msg])=>
 '<div class="ma6-check-item"><span class="ma6-check-icon">'+(passed?'✓':'!')+'</span><div><b>'+esc(k)+'</b><small>'+esc(msg)+'</small></div></div>').join("")+'</div></details>'+
 '<div class="ma6a-quote-review-actions"><button type="button" class="btn" data-action="preview-builder">Preview customer layout</button>'+
 '<span class="ma6-tag">Draft only · Not issued</span></div>'+
 '<div class="ma6a-quote-draft-hint"><b>Save Draft is available with unfinished terms.</b> Leave validity or payment/delivery details incomplete while working; an authorized approval and issue workflow must block them later.</div>'+
 note('Production sequence: Save Draft → technical/pricing validation → policy approvals → freeze revision → issue PDF → dispatch → customer response. Order registration is separate.',true);
}
const stepContent=[contextBuilder,boqBuilder,priceTermsBuilder,reviewBuilder];
function renderBuilder(){
 if(state.mode!=="builder"||!state.builder)return;
 const b=state.builder,q=b.quote;
 if(!b.initialQuoteSnapshot)b.initialQuoteSnapshot=JSON.stringify(q);
 $("quote-register").hidden=true;$("quote-builder").hidden=false;
 $("quote-view-toggle").hidden=false;
 $("quote-view-toggle").textContent="View All Quotations (Table)";
 $("quote-view-toggle").setAttribute("aria-pressed","false");
 $("quote-explainer").hidden=true;$("quote-stats").hidden=true;$("quote-scope").hidden=true;
 $("builder-title").textContent=(b.isNew?"New Draft Quotation":"Edit Draft "+q.id)+" · "+steps[b.step][0];
 $("builder-subtitle").textContent=(b.isNew?"New quote":"Existing "+q.rev)+" · Illustrative values · Saved in this browser only";
 $("builder-steps").innerHTML=steps.map((st,i)=>'<button type="button" data-step="'+i+'" class="'+(b.step===i?'active':'')+'" aria-current="'+(b.step===i?'step':'false')+'"><span class="ma6-step-num">'+(i+1)+'</span><span class="ma6-step-label">'+esc(st[0])+'</span></button>').join("");
 $("builder-body").innerHTML=stepContent[b.step](q,b);
 $("builder-prev").disabled=b.step===0;
 $("builder-next").hidden=b.step===steps.length-1;
 $("builder-save").hidden=b.step!==steps.length-1;
 $("builder-hint").textContent=b.step===1?"Review imported items · Catalog approval still pending":b.step===2?"All commercial values are fictional.":"Save Draft only · No customer issue or approval";
}
function render(){
 if(state.mode==="builder"){renderBuilder();return;}
 if(window.CPQ_SHARED)window.CPQ_SHARED.save("quotations",db);
 $("quote-builder").hidden=true;$("quote-register").hidden=false;
 $("quote-view-toggle").hidden=false;
 const expanded=state.listExpanded;
 $("quote-register").classList.toggle("is-expanded",expanded);
 $("quote-list").hidden=expanded;$("quote-expanded-table").hidden=!expanded;
 $("quote-details").hidden=expanded;
 $("quote-explainer").hidden=expanded;$("quote-stats").hidden=expanded;$("quote-scope").hidden=false;
 $("quote-view-toggle").textContent=expanded?"Return to Quotation Details":"View All Quotations (Table)";
 $("quote-view-toggle").setAttribute("aria-pressed",String(expanded));
 $("quote-expand-toggle").textContent=expanded?"Show Details":"Expand as Table";
 $("quote-expand-toggle").setAttribute("aria-pressed",String(expanded));
 $("quote-list-title").textContent=expanded?"Quotation Table · All Quotes":"Quotation Register";
 $("quote-list-subtitle").textContent=expanded?"Full-width list · select View Details to open a quotation":"Select a quotation to inspect";
 renderRegister();
}
window.CPQ_MA006={ $,esc,db,flow,master,org,staff,enquiries,state,quote,customer,buyer,contact,site,project,employee,entity,branch,opportunity,product,opts,text,money,numeric,configCheck,configUnit,extended,totals,lineConfig,visible,render,renderBuilder,financialRows,paper,note,blank,table,reviewChecks,demoReadiness };
render();
})();