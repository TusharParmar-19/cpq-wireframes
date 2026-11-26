/* MA-006 — shared demo state and UI rendering. No production calculations or permissions. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const db=JSON.parse(JSON.stringify(window.CPQ_MA006_DATA));
const flow=window.CPQ_FLOW;
const pricing=window.CPQ_PRICING,custom=window.CPQ_CUSTOM_BOQ,req=window.CPQ_REQUIREMENTS,policy=window.CPQ_POLICY,orders=window.CPQ_ORDERS;
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
 return {id:v.id,name:flow.productName(fam,v),unit:fam.unit||"Nos",type:fam.type==="service"?"service":"standard",
  basePrice:Number(v.price?.sell)||0,status:v.status,sku:v.sku,model:v.model||"",manufacturer:flow.manufacturerLabel(v,maker),
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
const extended=line=>pricing.lineTotal(line);
function totals(q){return pricing.calculate(q);}
function lineConfig(line){
 if(custom.is(line))return custom.details(line);
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
 const issues=!policy.locked(q)?draftMissing(q):[];
 $("quote-header").innerHTML='<div class="ma6-detail-top"><div><small>'+esc(q.id)+' / '+esc(q.rev)+' · '+text(customer(q.customerId)?.name)+'</small><h2>'+esc(q.title)+'</h2><p>Buyer: '+text(buyer(q.buyerId)?.name)+' · '+text(entity(q.companyId)?.name)+' / '+text(branch(q.branchId)?.name)+'</p></div>'+
 '<div class="ma6-detail-actions">'+statusBadge(q.status)+(q.demoApproval?.state?'<span class="ma6-tag">'+esc(q.demoApproval.state)+' (demo)</span>':'')+
 (!policy.locked(q)?'<button type="button" class="btn primary" data-action="edit-builder">Continue Editing</button>':'<button type="button" class="btn" data-action="preview-pdf">Preview Offer</button>')+
 (policy.locked(q)&&policy.canRevise(q)?'<button type="button" class="btn primary" data-action="create-revision">Create New Revision</button>':'')+
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
  !policy.locked(q)?"edit-builder":"","Continue Editing")+
 (q.sourceConfigId?'<div class="ma6a-quote-source"><b>Imported from:</b> '+esc(q.sourceConfigName||q.sourceConfigId)+
 ' · '+esc(q.sourceConfigId)+' / '+esc(q.sourceConfigRevision||"C0")+'</div>':'')+
 (q.lines.length?table(["Product / Service / Model","Technical specification / scope","Qty","Unit","Selling rate (demo)","Line total"],
 q.lines.map(l=>'<tr><td><strong>'+esc(l.description)+'</strong><small>'+esc(custom.is(l)?custom.label(l):l.productId+' · '+l.type)+'</small></td>'+
 '<td>'+text(lineConfig(l))+(l.technicalReview?'<small>Project technical changes need review</small>':'')+
 (l.includedInParent?'<small class="cpq-quote-service-included">Included in parent package — not billed separately</small>':'')+
 (l.modelSnapshot?.documentRefs?.length?'<small>'+l.modelSnapshot.documentRefs.length+' captured document reference(s) · metadata only</small>':'')+'</td><td>'+esc(l.quantity)+'</td>'+
 '<td>'+esc(l.unit)+'</td><td class="ma6-money">'+money(l.unitPrice)+'</td><td class="ma6-money">'+money(extended(l))+'</td></tr>')):blank("No BOQ lines yet. Continue Editing to add catalog equipment or services."))+
 req.detail(q)+'<div class="cpq-model-snapshot"><h4>Captured product specifications and document references</h4>'+
 (q.lines.some(l=>l.modelSnapshot)?q.lines.filter(l=>l.modelSnapshot).map(l=>{
  const m=l.modelSnapshot,docs=m.documentRefs||[],w=m.warranty||{};
  return '<details><summary>'+esc(l.description)+' · '+esc(m.sku)+' ('+docs.length+' document references)</summary>'+
   '<p>'+esc([m.manufacturer,m.model||m.variantLabel||m.variant,m.capacity].filter(Boolean).join(" · "))+'</p>'+
   (m.specTemplate?'<p><b>Specification template:</b> '+esc(m.specTemplate.name)+' · v'+esc(m.specTemplate.version)+'</p><ul>'+(m.specTemplate.fields||[]).filter(f=>m.solar?.[f.key]!==undefined).map(f=>'<li>'+esc(f.label+': '+m.solar[f.key]+(f.unit?" "+f.unit:""))+'</li>').join("")+'</ul>':"")+
   (m.components?.length?'<p><b>Captured BOM per unit</b> · Included / optional references, not separately priced</p><ul>'+m.components.map(c=>'<li>'+esc([c.group,c.name||c.partId,c.qty+" "+c.unit,c.role].filter(Boolean).join(" · "))+'</li>').join("")+'</ul>':"")+
   (w.months!==undefined?'<p>Product warranty recorded: '+esc(w.months)+' months</p>':'')+
   (docs.length?'<ul>'+docs.map(d=>'<li>'+esc(d.name)+' · '+esc(d.type)+' · v'+esc(d.version)+
    ' ('+esc(d.visibility)+')</li>').join("")+'</ul>':'<p>No current document references captured.</p>')+
   '<small>Captured model metadata; document contents are not attached or downloadable in this wireframe.</small></details>';
 }).join(""):'<p>No model-specific document references on the current BOQ.</p>')+'</div>'+
 '<div class="ma6a-boq-total"><span>'+q.lines.length+' BOQ item'+(q.lines.length===1?'':'s')+' · Sample BOQ subtotal</span><strong>'+money(totals(q).boqSubtotal)+'</strong></div>'+
 note('The BOQ stores selected models, quantities and their offered technical scope. Engineering compatibility, manufacturer data, actual rates and generated BOM require separate approved services.');
}
function financialRows(q){
 const t=totals(q);
 return '<div class="ma6-pricing-summary">'+
 '<div class="ma6-price-row"><span>BOQ subtotal</span><strong>'+money(t.boqSubtotal)+'</strong></div>'+
 (t.charges?'<div class="ma6-price-row"><span>Separate customer charges</span><strong>'+money(t.charges)+'</strong></div>':'')+
 '<div class="ma6-price-row"><span>Offer subtotal before discount</span><strong>'+money(t.subtotal)+'</strong></div>'+
 (t.commercial?window.CPQ_COMMERCIAL.discountRows(t):'<div class="ma6-price-row"><span>Sample discount ('+esc(q.discount)+'%)</span><strong>− '+money(t.discount)+'</strong></div>')+
 '<div class="ma6-price-row"><span>Net before GST</span><strong>'+money(t.taxable)+'</strong></div>'+
 '<div class="ma6-price-row"><span>'+(t.gst?"Total GST (demo)":"Illustrative tax ("+esc(q.taxRate)+"%)")+'</span><strong>'+money(t.tax)+'</strong></div>'+window.CPQ_TAX.breakdown(t)+
 (t.commercial?window.CPQ_COMMERCIAL.totalRows(t):'<div class="ma6-price-row final"><span>Illustrative quote total</span><strong>'+money(t.total)+'</strong></div>')+'</div>';
}
function commercial(q){
 const p=draftMissing(q).filter(x=>["Validity date","Payment terms","Delivery terms"].includes(x));
 return panel("Commercial summary","Sample calculations and the conditions intended for the customer")+
 '<div class="ma6a-commercial-top"><div class="ma6a-commercial-aside"><h4>Pricing review</h4><p>Figures are illustrative. Confirm SKU rates, tax treatment, discounts and any price exceptions before submitting for approval.</p>'+
 '<div class="ma6a-commercial-badges"><span class="ma6-tag">'+esc(window.CPQ_COMMERCIAL.discountLabel(q))+'</span><span class="ma6-tag">'+(window.CPQ_TAX.enabled(q)?"Item-wise GST":"Legacy tax: "+esc(q.taxRate)+"%")+'</span></div>'+
 (!policy.locked(q)?'<button type="button" class="btn" data-action="edit-pricing">Edit Pricing &amp; Costing</button>':'')+
 '</div>'+financialRows(q)+'</div>'+
 pricing.internalSummary(q)+window.CPQ_COMMERCIAL.reconciliation(totals(q))+
 (!policy.locked(q)&&p.length?'<div class="ma6a-draft-alert"><div><strong>Customer-facing terms are incomplete</strong><p>'+esc(p.join(" · "))+'</p></div>'+
 '<button type="button" class="btn" data-action="edit-builder">Complete Terms</button></div>':'')+
 '<div class="ma6-section-sub"><h4>Customer-facing conditions</h4></div>'+
 '<div class="ma6-kvs">'+kv("Payment terms",q.payment)+kv("Delivery / execution",q.delivery)+
 kv("Warranty / support",q.warranty)+kv("Validity",q.validUntil)+kv("Exclusions",q.exclusions)+'</div>'+
 '<details class="ma6a-quote-more"><summary>Internal commercial notes · Not printed on customer preview</summary><p class="ma6a-note-text">'+text(q.notes)+'</p></details>'+
 note('<b>Pricing safeguard:</b> Demo amounts, discounts and tax rates are not approved. Production needs price lists, HSN/SAC, item-level taxes, jurisdiction, rounding, freight and finance policy enforcement.',true);
}
function reviewChecks(q){
 const hasFinal=(x)=>!!String(x||"").trim()&&!/^(to be agreed|to be confirmed|tbd)$/i.test(String(x).trim());
 const termsOK=hasFinal(q.payment)&&hasFinal(q.delivery)&&(q.directOrderDraft||!!String(q.validUntil||"").trim()&&Number.isFinite(Date.parse(q.validUntil)));
 return [
 ["Buyer / internal scope",Boolean(buyer(q.buyerId)&&entity(q.companyId)&&branch(q.branchId)),"Customer legal buyer and selling branch identified"],
 ["BOQ lines",q.lines.length>0&&q.lines.every(l=>!custom.errors(l).length),"At least one item, valid quantity and selling rate"],
 ["Config rules",q.lines.every(l=>l.type!=="config"||configCheck(product(l.productId),l.options).ok)&&!window.CPQ_PRODUCT_RULES.quotation(q).some(x=>x.severity==="block"),"Basic options and configured demo model selection rules; engineering approval remains separate"],
 ["Terms",termsOK,"Validity, payment and delivery terms must be finalized before issue; placeholders are not approval"],
 ["Pricing/discount policy",false,"Real tax, pricing and approvals are not evaluated in this demo"],
 ["Imported catalog prices",!q.lines.some(l=>l.pricingReview),"Seeded rates are illustration-only. Validate manufacturer/SKU, costs, selling price and exceptions."],
 ["Demo-only model verification",!q.lines.some(l=>l.technicalReview||l.unverified),"Demo-enabled catalog models and incomplete technical data are not production-approved"],
 ["Issuance permission",false,"Requires authorized approval, locked revision and audit in production"],
  ["No double-charge of included sub-services",!q.lines.some(l=>l.includedInParent&&Number(l.unitPrice)>0),
   "Child services bundled under a parent package are not billed separately"],
  ["Pricing data and override reasons",pricing.errors(q).length===0&&(!q.pricing||!q.lines.some(l=>pricing.requiresReason(l)&&!String(l.pricing?.overrideReason||"").trim())),"Changes to captured or missing list rates need an explanation before review"],
  ["Cost and margin estimate",!!q.pricing&&totals(q).missing===0,"Internal costs and profitability remain estimated; actual commercial approval is separate"],
 ["Item GST completeness",!window.CPQ_TAX.reviewIssues(q,totals(q)).length,"Configured tax classification and GST treatment"],
 ["Commercial reconciliation",!window.CPQ_COMMERCIAL.enabled(q)||!!totals(q).commercial?.ready,"Discounts, taxes, rounding and invoice share agree"]
 ];
}
function demoReadiness(q){
 const missing=[],c=customer(q.customerId),b=buyer(q.buyerId),co=entity(q.companyId),br=branch(q.branchId),own=employee(q.ownerId);
 if(!String(q.title||"").trim())missing.push("Quotation title");
 if(!c||!b||b.customerId!==q.customerId)missing.push("Customer and exact buyer");
 if(!co||!br||br.companyId!==q.companyId||!c?.links?.some(x=>x.companyId===q.companyId&&x.branchId===q.branchId))missing.push("Valid selling company and branch");
 if(!own||own.status!=="Active"||!(own.assignments||[]).some(x=>x.companyId===q.companyId&&(x.branches||[]).includes(q.branchId)))missing.push("Responsible employee assigned to this branch");
 if(!q.lines?.length||q.lines.some(l=>!Number.isInteger(Number(l.quantity))||Number(l.quantity)<=0||!Number.isFinite(Number(l.unitPrice))||Number(l.unitPrice)<0))missing.push("Valid BOQ products, quantities and sample rates");
 if(q.lines?.some(l=>custom.errors(l).length))missing.push("Correct invalid custom BOQ items.");
 missing.push(...req.errors(q));
 missing.push(...window.CPQ_TAX.reviewIssues(q,totals(q)),...window.CPQ_COMMERCIAL.reviewIssues(q,totals(q)));
 if(q.lines?.some(l=>!l.includedInParent&&!(Number(l.unitPrice)>0)))
  missing.push("Enter a positive fictional sample selling rate for each billable line; included sub-services remain ₹0");
 if(q.lines.some(l=>l.type==="config"&&!configCheck(product(l.productId),l.options).ok))missing.push("Complete product option selections");
 missing.push(...window.CPQ_PRODUCT_RULES.quotation(q).filter(x=>x.severity==="block").map(x=>x.message));
 if(!reviewChecks(q)[3][1])missing.push(q.directOrderDraft?"Payment and delivery terms":"Validity, payment and delivery terms");
 if(totals(q).missing||totals(q).margin===null)missing.push("Complete internal costs and profit margin.");
 if(q.pricing){
  missing.push(...new Set([...pricing.errors(q),...pricing.supplierIssues(q,true)]));
  if(q.lines.some(l=>pricing.requiresReason(l)&&!String(l.pricing?.overrideReason||"").trim()))
   missing.push("Enter a reason for each manual or changed offered rate in Pricing & Costing.");
 }
 return missing;
}
function approvals(q){
 const checks=reviewChecks(q),passed=checks.filter(x=>x[1]).length,d=q.demoApproval,stage=d?.state||"Not requested",simple=d?.mode==="phase1-master",pending=policy.phase1Pending(q),ready=policy.phase1Reviewed(q);
 const missing=policy.locked(q)?[]:demoReadiness(q),events=d?.events||[],t=totals(q);
 const discount=t.subtotal>0?t.discount/t.subtotal*100:0;
 return panel("Review & Approvals","Phase 1 · Single Master Admin review","preview-approval","How review works")+
 '<div class="ma6a-demo-approval-intro"><div><span class="ma6a-demo-kicker">BROWSER-ONLY DEMONSTRATION</span><h4>Master Admin review</h4><p>Review the BOQ, prices, taxes and customer terms together. No configurable approval policy or separate reviewer assignment is required in Phase 1.</p></div><span class="ma6a-demo-state">'+esc(stage)+'</span></div>'+
 '<div class="ma6-kvs">'+kv("Invoice total",money(t.total))+kv("Combined discount",discount.toFixed(2)+"%")+kv("Estimated margin",t.margin==null?"Unavailable":t.margin.toFixed(2)+"%")+kv("Review authority","Master Admin (demo)")+'</div>'+
 (!policy.locked(q)?'<div class="ma6a-review-next"><div><b>'+(missing.length?"Complete quotation details":"Ready for Master Admin review")+'</b><p>'+esc(missing.join(" · ")||"Submit the current revision for a single demo review.")+'</p></div>'+
 (missing.length?'<button class="btn" data-action="edit-builder">Complete Draft</button>':'<button class="btn primary" type="button" data-action="submit-demo-review">Submit Demo Review</button>')+'</div>':
 '<div class="ma6a-review-next"><div><b>'+(ready?"Master Admin review complete (demo)":pending?"Awaiting Master Admin decision":"Revision locked for review / history")+'</b><p>'+esc(ready?"Continue to PDF & Response for simulated dispatch.":pending?"Review the quotation and choose a decision.":!simple&&d?.state==="In review"?"Prior policy-based review retained. Create a new revision to use the Phase 1 review.":"Create a new revision for corrections; historical data is preserved.")+'</p></div>'+
 (pending?'<button class="btn primary" data-action="simulate-review" data-role="master">Review Quotation</button>':ready?'<button class="btn primary" data-action="go-demo-documents">Continue to PDF &amp; Response</button>':policy.canRevise(q)?'<button class="btn" data-action="create-revision">Create New Revision</button>':'')+'</div>')+
 ruleNotices(q)+'<details class="ma6a-quote-more"><summary>Quotation checks ('+passed+' of '+checks.length+')</summary><div class="ma6-checklist">'+checks.map(([title,done,desc])=>'<div class="ma6-check-item"><span class="ma6-check-icon">'+(done?'✓':'!')+'</span><div><b>'+esc(title)+'</b><small>'+esc(desc)+'</small></div></div>').join("")+'</div></details>'+
 '<details class="ma6a-quote-more"><summary>Demo review history ('+events.length+')</summary>'+(events.length?'<div class="ma6a-review-history">'+[...events].reverse().map(ev=>'<div class="ma6a-review-event"><strong>'+esc(ev.action)+'</strong><small>'+esc(ev.at)+' · '+esc(ev.actor)+' · '+esc(ev.revision||q.rev)+'</small><p>'+esc(ev.comment||"")+'</p></div>').join("")+'</div>':blank("No demo review actions recorded yet."))+'</details>'+
 note("Phase 3: configurable approval rules, separate approvers, financial thresholds and escalation. The present review is simulated and does not authorize a real offer.",true);
}
function revisions(q){
 const snapshots=(db.revisionSnapshots||[]).filter(x=>x.quoteId===q.id).slice().reverse(),metadata=(db.revisions||[]).filter(x=>x.quoteId===q.id&&x.revision!==q.rev&&!snapshots.some(s=>s.rev===x.revision));
 return panel("Quotation versions & snapshots","Retain the same quotation ID; create a new revision instead of overwriting a reviewed record.",policy.canRevise(q)?"create-revision":"",policy.canRevise(q)?"Create New Revision":"")+
 '<div class="ma6a-version-helper"><b>Current:</b> '+esc(q.id)+" / "+esc(q.rev)+' · '+esc(q.demoApproval?.state||q.status)+' · '+money(totals(q).total)+'</div>'+
 '<div class="ma6-revision-row"><div><strong>'+esc(q.rev)+' · Current revision</strong><p>'+esc(q.versionNotes||"Initial draft")+'</p></div><span class="ma6-tag">'+(policy.locked(q)?"Locked (demo)":"Editable draft")+'</span></div>'+
 snapshots.map(s=>'<div class="ma6-revision-row"><div><strong>'+esc(s.rev)+' · '+money(s.amounts.total)+' · Historical snapshot</strong><p>'+esc(s.reason)+'</p><small>'+esc(s.archivedAt)+' · '+esc(s.archivedBy)+'</small></div><div><button class="btn" data-action="view-revision" data-revision="'+esc(s.rev)+'">View Snapshot</button> <button class="btn" data-action="compare-revision" data-revision="'+esc(s.rev)+'">Compare</button></div></div>').join("")+
 metadata.map(s=>'<div class="ma6-revision-row"><div><strong>'+esc(s.revision)+' · Seeded metadata only</strong><p>'+esc(s.note)+'</p></div><span class="ma6-tag">No stored snapshot</span></div>').join("")+
 note("Historical snapshots contain copied BOQ, tax, pricing, commercial amounts, terms and simulated approval/response evidence. Browser-only; not production immutability. Duplicate as Draft creates a new quotation ID.");
}
function paper(q){
 const t=totals(q);
 return '<div class="ma6-paper"><div class="ma6-paper-head"><div><strong>'+text(q.revisionIdentity?.seller||entity(q.companyId)?.name)+'</strong><p>Customer quotation preview · fictional information</p></div><span>'+esc(q.id)+' / '+esc(q.rev)+'</span></div>'+
 '<p><b>To:</b> '+text(q.revisionIdentity?.buyer||buyer(q.buyerId)?.name)+'<br><b>Reference:</b> '+esc(q.title)+'<br><b>Valid until:</b> '+text(q.validUntil)+'</p>'+
 '<table><thead><tr><th>Particulars</th><th>Qty</th><th>Unit</th><th>Offered rate</th><th>Amount</th></tr></thead><tbody>'+
 q.lines.map(l=>'<tr><td>'+esc(l.description)+(custom.is(l)&&l.customItem?.specification?'<small class="cpq-custom-note">'+esc(l.customItem.specification)+'</small>':'')+(l.includedInParent?' <small>(included in package)</small>':'')+(t.gst?'<small class="cpq-custom-note">'+esc(window.CPQ_TAX.publicLabel(l))+'</small>':'')+window.CPQ_COMMERCIAL.lineLabel(t,l.id)+'</td><td>'+esc(l.quantity)+'</td><td>'+esc(l.unit)+'</td><td class="ma6-money">'+(l.includedInParent?"Included":money(l.unitPrice))+'</td><td class="ma6-money">'+money(extended(l))+'</td></tr>').join("")+
 t.publicRows.map(c=>'<tr><td>'+esc(c.label)+(t.gst?'<small class="cpq-custom-note">'+esc(window.CPQ_TAX.describe(q.pricing?.costs?.find(x=>x.id===c.id)?.taxSnapshot||window.CPQ_TAX.empty("service")))+'</small>':'')+window.CPQ_COMMERCIAL.lineLabel(t,c.id)+'</td><td>1</td><td>Job</td><td class="ma6-money">'+money(c.amount)+'</td><td class="ma6-money">'+money(c.amount)+'</td></tr>').join("")+
 '</tbody></table><div class="cpq-customer-totals"><div><span>Offer subtotal</span><strong>'+money(t.subtotal)+'</strong></div>'+
 (t.commercial?window.CPQ_COMMERCIAL.discountRows(t,"cpq-gst-paper-row"):'<div><span>Discount ('+esc(q.discount)+'%)</span><strong>− '+money(t.discount)+'</strong></div>')+
 '<div><span>Net before tax</span><strong>'+money(t.taxable)+'</strong></div>'+
 '<div><span>'+(t.gst?"Total GST (demo)":"Illustrative tax ("+esc(q.taxRate)+"%)")+'</span><strong>'+money(t.tax)+'</strong></div>'+window.CPQ_TAX.breakdown(t,"cpq-gst-paper-row")+
 (t.commercial?window.CPQ_COMMERCIAL.totalRows(t,"cpq-gst-paper-row"):'<div class="final"><span>Illustrative quotation total</span><strong>'+money(t.total)+'</strong></div>')+'</div>'+
 '<p><b>Payment:</b> '+text(q.payment)+'<br><b>Delivery:</b> '+text(q.delivery)+'<br><b>Warranty:</b> '+text(q.warranty)+'</p>'+
 req.publicScope(q)+'<p class="cpq-req-public"><b>Exclusions:</b> '+text(q.exclusions)+'</p><p style="border-top:1px solid #e8edf2;padding-top:12px"><b>NOT AN ISSUED QUOTATION.</b> No company signature, approval, verified tax data or legally usable PDF is provided.</p></div>';
}
function documents(q){
 const dispatch=q.demoDispatch||null, events=dispatch?.events||[];
 const simulated=dispatch?.state==="Sent in demo", historical=["Sent","Won","Lost"].includes(q.status);
 const canSimulate=q.status==="Draft"&&!simulated&&policy.phase1Reviewed(q)&&demoReadiness(q).length===0;
 const linkedOrder=orders.linked(q.id),canRespond=!linkedOrder&&(simulated||q.status==="Sent");
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
 q.status==="Draft"?'<div class="ma6a-dispatch-help">Complete the Master Admin demo review and essential terms first. <button type="button" class="btn" data-action="go-demo-approvals">Open Reviews</button></div>':
 '<p class="ma6a-dispatch-muted">Existing sample status only. No actual dispatch or authorization can be verified here.</p>')+
 '</section>'+
 '<section class="ma6a-dispatch-card"><div class="ma6a-dispatch-card-title"><b>2 · Customer response</b><span class="ma6a-demo-state">'+esc(currentResponse)+'</span></div>'+
 '<p>Record Accepted, Rejected or Changes Requested, with the reply source, date, reference and notes.</p>'+
 (canRespond?'<button type="button" class="btn primary" data-action="open-demo-response">'+(dispatch?.response?"Update demo response":"Record demo response")+'</button>':
 '<p class="ma6a-dispatch-muted">'+(linkedOrder?"Response locked because an order is linked.":"Available after simulated dispatch, or for a historical Sent sample.")+'</p>')+
 (dispatch?.response?'<div class="ma6a-dispatch-meta"><b>Source:</b> '+esc(dispatch.response.source)+'<br><b>Received:</b> '+esc(dispatch.response.date)+'<br><b>Evidence:</b> '+esc(dispatch.response.reference||"Not recorded")+'</div>':'')+
 '</section></div>'+
 (linkedOrder?note('<b>Linked order:</b> '+esc(linkedOrder.id)+' · '+esc(linkedOrder.status)+' (demo). <a class="btn" href="ma-007-orders.html?order='+encodeURIComponent(linkedOrder.id)+'">View Order</a>'):dispatch?.response?.decision==="Accepted"?note('Sample acceptance recorded. '+(orders.available(q)?'<button type="button" class="btn primary" data-action="create-order-draft">Create Order Draft</button>':'A valid reviewed and dispatched revision with dated acceptance evidence is required.')):'')+
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
const steps=[["Customer & Project","Customer and selling scope"],["Products & BOQ","Imported technical selections"],["Pricing & Costing","Internal costs and offered rates"],["Final Quotation","Customer offer and terms"],["Review & Save","Draft checks and preview"]];
function formSelect(id,label,values,current,placeholder="Select...",required=false,helpHtml=""){
 const helpId="b-"+id+"-help";
 return '<div class="ma6-field"><label for="b-'+esc(id)+'">'+esc(label)+(required?' *':'')+'</label><select id="b-'+esc(id)+'" data-field="'+esc(id)+'"'+(helpHtml?' aria-describedby="'+esc(helpId)+'"':'')+'><option value="">'+esc(placeholder)+'</option>'+opts(values,current)+'</select>'+(helpHtml?'<div class="ma6-field-note" id="'+esc(helpId)+'">'+helpHtml+'</div>':'')+'</div>';
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
 const comps=window.CPQ_SCOPE_DEFAULTS.companies(org,links).map(e=>[e.id,e.name]);
 const branches=window.CPQ_SCOPE_DEFAULTS.branches(org,q.companyId,links).map(x=>[x.id,x.name+" · "+x.city]);
 const owners=staff.filter(u=>u.status==="Active"&&(u.assignments||[]).some(x=>x.companyId===q.companyId&&x.branches.includes(q.branchId))).map(x=>[x.id,x.name]);
 const opps=enquiries.filter(x=>x.customerId===q.customerId&&x.buyerId===q.buyerId).map(x=>[x.id,x.id+" · "+x.title]);
 const companyHelp=q.customerId?
  (comps.length===1?'One eligible company — automatically selected when choosing the customer.':comps.length?'Showing '+comps.length+' linked internal companies.':'No active company/branch is linked to this customer yet.')+
  '<div class="ma6-scope-links"><button class="btn ma6-scope-refresh" type="button" data-action="link-selling-scope">+ Use another company / branch</button></div><details class="ma6-scope-links"><summary>Manage existing links</summary><a href="ma-004-customers.html?customer='+encodeURIComponent(q.customerId)+'" target="_blank" rel="noopener">Open customer ↗</a> <button class="btn ma6-scope-refresh" type="button" data-action="refresh-customer-scope">Refresh links</button></details>'
  :'Select a customer first. Only its linked selling companies will be available.';
 const branchHelp=q.companyId?(branches.length===1?'One eligible branch — automatically selected when choosing the company.':'Only active branches linked to this customer under the selected selling company.'):'Choose a selling company first.';
 return panel("1 · Customer, Buyer & Scope",q.directOrderDraft?"Select customer, buyer and selling scope for a direct order. No quotation required.":"Use MA-004 master records and optionally link an MA-005 enquiry. A direct quotation is also allowed.")+
 '<div class="ma6-field-grid">'+formSelect("customerId","Customer account",customers,q.customerId,"Choose customer",true)+formSelect("buyerId","Exact buyer / bill-to",bs,q.buyerId,"Choose buyer",true)+
 formSelect("companyId","Our selling legal entity",comps,q.companyId,"Choose linked company",true,companyHelp)+formSelect("branchId","Our internal branch",branches,q.branchId,"Choose linked branch",true,branchHelp)+
 formSelect("ownerId","Responsible employee",owners,q.ownerId,"Choose owner",true)+formSelect("opportunityId","Source opportunity (optional)",opps,q.opportunityId,q.directOrderDraft?"Direct order — no opportunity":"Direct quotation — no opportunity")+
 formSelect("contactId","Customer contact (optional)",contacts,q.contactId,"Choose contact")+formSelect("siteId","Delivery / project site (optional)",sites,q.siteId,"Choose site")+
 formSelect("projectId","Customer project (optional)",projects,q.projectId,"Choose project")+
 formInput("title",q.directOrderDraft?"Order title":"Quotation title",q.title,"text",true,true)+'</div>'+
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
function ruleNotices(q){const f=window.CPQ_PRODUCT_RULES.quotation(q);return f.length?note("<b>Product selection checks (demo)</b><ul>"+f.map(x=>"<li>"+esc((x.severity==="block"?"Resolve before review: ":"Warning: ")+x.message)+"</li>").join("")+"</ul>",f.some(x=>x.severity==="block")):"";}
function boqBuilder(q,b){
 const source=q.sourceConfigId?
 '<div class="ma6-note"><b>Imported configuration:</b> '+esc(q.sourceConfigName||q.sourceConfigId)+
 ' · '+esc(q.sourceConfigId)+' / '+esc(q.sourceConfigRevision||"C0")+
 '. These lines were already selected in MA-006A. Add or edit only what this quotation needs.</div>':
 '<div class="ma6-note">Add catalog models or services directly, or begin with a saved technical configuration from MA-006A.</div>';
 const lineTable=q.lines.length?table(["BOQ item / specification","Qty","Unit","Captured selling rate","Current offered amount",""],
 q.lines.map(l=>'<tr><td><strong>'+esc(l.description)+'</strong><small>'+esc(lineConfig(l))+'</small>'+
 (l.pricingReview?'<small>'+(custom.is(l)?'Custom line · manual pricing':'Catalog rate requires approval')+'</small>':'')+
 (l.technicalReview?'<small>Technical variation needs review</small>':'')+
 (l.includedInParent?'<small class="cpq-quote-service-included">Included in parent package (₹0 extra)</small>':'')+'</td>'+
 '<td><input class="ma6-qty" type="number" min="1" step="1" data-line-qty="'+esc(l.id)+'" value="'+esc(l.quantity)+'" aria-label="Quantity '+esc(l.description)+'"></td>'+
 '<td>'+esc(l.unit)+'</td><td class="ma6-money">'+(l.includedInParent?"Included":l.pricing?.defaultRate==null?"Manual rate":money(l.pricing.defaultRate))+'</td>'+
 '<td class="ma6-money">'+money(extended(l))+'</td><td>'+custom.editButton(l)+'<button type="button" class="btn" data-remove-line="'+esc(l.id)+'" aria-label="Remove '+esc(l.description)+'">Remove</button></td></tr>')):
 blank("No BOQ items yet. Add a catalog product, service or custom item, or import a configuration.");
 return panel("2 · Products & BOQ",q.sourceConfigId?"Review imported configuration items and quantities. Pricing is handled separately.":"Select products and services, confirm quantities, then continue to Pricing & Costing.")+
 source+lineTable+ruleNotices(q)+custom.form(b)+req.form(q,true)+
 '<div class="ma6-section-sub ma6a-quote-add"><h4>'+q.lines.length+' BOQ item(s) · Current offered BOQ '+money(totals(q).boqSubtotal)+'</h4>'+
 '<button type="button" class="btn'+(b.addPickerOpen?'':' primary')+'" data-action="toggle-add-product">'+
 (b.addPickerOpen?'Close Product / Service Picker':'+ Add Product or Service')+'</button></div>'+
 (b.addPickerOpen?'<div class="ma6a-quote-catalog-picker">'+catalogPicker(q,b)+'</div>':"")+
 note('Confirm technical scope here. Open the next Pricing &amp; Costing stage to change selling rates, add expenses, set profit and check totals. Product Master and saved source configurations remain unchanged.');
}
function isoDate(v){
 if(/^\d{4}-\d{2}-\d{2}$/.test(String(v||"")))return v;
 const date=new Date(v);return Number.isFinite(date.valueOf())?date.toISOString().slice(0,10):"";
}
function pricingBuilder(q){return pricing.pricingView(q,financialRows);}
function finalQuotationBuilder(q){
 return panel(q.directOrderDraft?"4 · Order Terms":"4 · Final Quotation",q.directOrderDraft?"Review order totals and enter payment and delivery terms.":"Review the customer-facing offer, add the commercial terms and preview the final quotation.")+
 '<div class="ma6a-commercial-top"><div class="ma6a-commercial-aside"><h4>Offer prepared from Pricing &amp; Costing</h4>'+
 '<p>Only offered rates, selected customer charges, discount, tax and customer terms appear here. Internal costs and margins stay in Pricing &amp; Costing.</p>'+
 '<button type="button" class="btn" data-step="2">Edit Pricing &amp; Costing</button></div>'+financialRows(q)+'</div>'+
 '<div class="ma6-section-sub"><h4>Customer-facing terms</h4></div>'+
 '<div class="ma6-field-grid">'+(q.directOrderDraft?"":formInput("validUntil","Valid until (required before issue)",isoDate(q.validUntil),"date"))+
 '<div class="ma6-field"><label>Currency (demo)</label><input value="'+esc(q.currency)+'" readonly></div>'+
 '<div class="ma6-field full"><label for="quote-payment-preset">Payment terms template (optional)</label>'+
 '<select id="quote-payment-preset" data-payment-preset><option value="">Select a sample template...</option>'+
 '<option value="50% advance; 50% before dispatch">50% advance / 50% before dispatch</option>'+
 '<option value="30% advance; 70% after completion">30% advance / 70% after completion</option>'+
 '<option value="Net 30 days from invoice">Net 30 days</option></select></div>'+
 formArea("payment","Payment terms",q.payment)+formArea("delivery","Delivery / execution terms",q.delivery)+'</div>'+
 '<details class="ma6a-quote-more"><summary>Warranty, exclusions & internal notes</summary><div class="ma6-field-grid">'+
 formArea("warranty","Warranty / support",q.warranty)+formArea("exclusions","Exclusions",q.exclusions)+
 formArea("notes","Internal notes (not on PDF)",q.notes)+'</div></details>'+
 (q.directOrderDraft?note("Direct order: no quotation or dispatch is created. Review saved order details in Orders."):'<div class="cpq-quote-customer-layout"><div class="ma6-section-sub"><h4>Customer quotation preview</h4><button type="button" class="btn" data-action="preview-builder">Expand preview</button></div>'+
 '<p class="muted">Review the latest entered terms and offered prices. No internal costs, commission, markup or margin are printed.</p><div id="cpq-final-customer-paper">'+paper(q)+'</div></div>')+
 note('These are demo values. Real HSN/SAC, applicable GST, customer jurisdiction, freight, price list and discount approvals must come from server-controlled commercial rules.',true);
}
function reviewBuilder(q){
 if(q.directOrderDraft){const issues=demoReadiness(q);return panel("5 · Review & Save Direct Order","No quotation record is generated. Register the saved order separately.")+'<div class="ma6-kvs">'+kv("Customer",customer(q.customerId)?.name)+kv("Buyer",buyer(q.buyerId)?.name)+kv("Selling company / branch",(entity(q.companyId)?.name||"Not selected")+" / "+(branch(q.branchId)?.name||"Not selected"))+kv("Order items",String(q.lines.length))+kv("Payment",q.payment)+kv("Delivery",q.delivery)+'</div>'+financialRows(q)+(issues.length?note("<b>Complete before saving:</b> "+esc(issues.join(" · ")),true):note("Order details ready. Registration requires a customer confirmation / PO reference."));}

 const rows=reviewChecks(q),ready=Boolean(q.customerId&&q.buyerId&&q.companyId&&q.branchId&&q.ownerId&&q.title&&q.lines.length>0&&q.lines.every(l=>numeric(l.quantity)>0&&numeric(l.unitPrice)>=0&&(l.type!=="config"||configCheck(product(l.productId),l.options).ok)&&!custom.errors(l).length));
 const termsFinalized=Boolean(isoDate(q.validUntil))&&!/^\s*(to be agreed|to be confirmed|tbd)\s*$/i.test(q.payment||"")&&!!String(q.payment||"").trim()&&!/^\s*(to be agreed|to be confirmed|tbd)\s*$/i.test(q.delivery||"");
 return panel("5 · Review & Save Draft","Saving a quote does not approve or send it to the customer.")+
 '<div class="ma6-kvs">'+kv("Customer",customer(q.customerId)?.name)+kv("Buyer",buyer(q.buyerId)?.name)+
 kv("Selling company / branch",(entity(q.companyId)?.name||"Not selected")+" / "+(branch(q.branchId)?.name||"Not selected"))+
 kv("Source configuration",q.sourceConfigId?(q.sourceConfigId+" / "+(q.sourceConfigRevision||"C0")):"Direct quotation")+
 kv("BOQ lines",String(q.lines.length))+kv("Demo invoice total",money(totals(q).total))+(totals(q).commercial?.mode==="contribution"?kv("Customer share (demo)",money(totals(q).commercial.customerPayable)):"")+'</div>'+
 '<div class="ma6a-quote-review-status">'+
 '<div class="ma6-check-item"><span class="ma6-check-icon">'+(ready?'✓':'!')+'</span><div><b>'+(ready?'Draft information present':'Draft needs information')+'</b>'+
 '<small>'+(ready?'Customer, buyer and BOQ are structurally present.':'Review missing customer, buyer, product or quantities.')+'</small></div></div>'+
 '<div class="ma6-check-item"><span class="ma6-check-icon">'+(termsFinalized?'✓':'!')+'</span><div><b>'+(termsFinalized?'Terms entered':'Commercial terms need confirmation')+'</b>'+
 '<small>Validity, payment and execution conditions should be agreed before issue.</small></div></div>'+
 '<div class="ma6-check-item"><span class="ma6-check-icon">!</span><div><b>Master Admin review pending</b>'+
 '<small>Engineering, catalog rates, discounts and tax policy are not approved by this demo.</small></div></div>'+
 '<div class="ma6-check-item"><span class="ma6-check-icon">!</span><div><b>Issuing or sending disabled</b>'+
 '<small>An approved, locked quotation revision is required in production.</small></div></div></div>'+
 '<details class="ma6a-quote-more"><summary>Detailed review checklist ('+rows.length+')</summary>'+
 '<div class="ma6-checklist">'+rows.map(([k,passed,msg])=>
 '<div class="ma6-check-item"><span class="ma6-check-icon">'+(passed?'✓':'!')+'</span><div><b>'+esc(k)+'</b><small>'+esc(msg)+'</small></div></div>').join("")+'</div></details>'+
 '<div class="ma6a-quote-review-actions"><button type="button" class="btn" data-action="preview-builder">Preview customer layout</button>'+
 '<span class="ma6-tag">Draft only · Not issued</span></div>'+
 '<div class="ma6a-quote-draft-hint"><b>Save Draft is available with unfinished terms.</b> Leave validity or payment/delivery details incomplete while working; an authorized approval and issue workflow must block them later.</div>'+
 note('Phase 1 demo sequence: Save Draft → Master Admin review → lock revision → PDF preview / simulated dispatch → customer response. Order registration is separate.',true);
}
const stepContent=[contextBuilder,boqBuilder,pricingBuilder,finalQuotationBuilder,reviewBuilder];
function renderBuilder(){
 if(state.mode!=="builder"||!state.builder)return;
 const b=state.builder,q=b.quote;
 pricing.prepare(q);
 if(!b.initialQuoteSnapshot)b.initialQuoteSnapshot=JSON.stringify(q);
 $("quote-register").hidden=true;$("quote-builder").hidden=false;
 $("quote-view-toggle").hidden=false;
 $("quote-view-toggle").textContent="View All Quotations (Table)";
 $("quote-view-toggle").setAttribute("aria-pressed","false");
 $("quote-explainer").hidden=true;$("quote-stats").hidden=true;$("quote-scope").hidden=true;
 const direct=!!q.directOrderDraft,stepLabel=direct&&b.step===3?"Order Terms":steps[b.step][0];
 $("new-quote").hidden=direct;$("quote-view-toggle").hidden=direct;
 $("builder-close").textContent=direct?"Back to Orders":"Back to Quotation Table";
 $("builder-title").textContent=(direct?(b.orderId?"Edit "+b.orderId:"New Direct Order"):b.isNew?"New Draft Quotation":"Edit Draft "+q.id)+" · "+stepLabel;
 $("builder-subtitle").textContent=(direct?"Direct order · No quotation required":b.isNew?"New quote":"Existing "+q.rev)+" · Illustrative values · Saved in this browser only";
 $("builder-steps").innerHTML=steps.map((st,i)=>'<button type="button" data-step="'+i+'" class="'+(b.step===i?'active':'')+'" aria-current="'+(b.step===i?'step':'false')+'"><span class="ma6-step-num">'+(i+1)+'</span><span class="ma6-step-label">'+esc(direct&&i===3?"Order Terms":st[0])+'</span></button>').join("");
 $("builder-body").innerHTML=stepContent[b.step](q,b);
 $("builder-prev").disabled=b.step===0;
 $("builder-next").hidden=b.step===steps.length-1;
 $("builder-save").hidden=b.step!==steps.length-1;$("builder-save").textContent=direct?"Save Order Draft":"Save Draft";
 $("builder-next").textContent=b.step===1?"Continue to Pricing":b.step===2?(direct?"Review Order Terms":"Prepare Final Quotation"):b.step===3?"Review & Save":"Next step";
 $("builder-hint").textContent=direct?"Direct order · Browser only · Registration is separate":b.step===0?"Select customer and selling scope":b.step===1?"Confirm technical items before pricing":b.step===2?"Internal costs and offered rates · Fictional estimates":b.step===3?"Customer-facing offer and terms":"Save Draft only · No customer issue or approval";
}
function render(){
 if(state.mode==="builder"){renderBuilder();return;}
 if(window.CPQ_SHARED)window.CPQ_SHARED.save("quotations",db);
 $("new-quote").hidden=false;$("quote-builder").hidden=true;$("quote-register").hidden=false;
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
window.CPQ_MA006={ $,esc,db,flow,pricing,steps,master,org,staff,enquiries,state,quote,customer,buyer,contact,site,project,employee,entity,branch,opportunity,product,opts,text,money,numeric,configCheck,configUnit,extended,totals,lineConfig,visible,render,renderBuilder,financialRows,paper,note,blank,table,reviewChecks,demoReadiness };
render();
})();