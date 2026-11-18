/* MA-006 — shared demo state and UI rendering. No production calculations or permissions. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const db=JSON.parse(JSON.stringify(window.CPQ_MA006_DATA));
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
 const cat=window.CPQ_MA006A_CATALOG,v=cat?.variants.find(x=>x.id===id);
 if(!v)return null;
 const fam=cat.families.find(f=>f.id===v.familyId),maker=cat.manufacturers.find(m=>m.id===v.manufacturerId);
 if(!fam)return null;
 const dims=v.dimensions||{},size=[dims.length,dims.width,dims.height].filter(x=>x!==undefined&&x!=="").join(" × ");
 return {id:v.id,name:fam.name+" — "+v.model,unit:fam.unit||"Nos",type:"standard",
  basePrice:Number(v.price?.sell)||0,status:v.status,sku:v.sku,model:v.model,manufacturer:maker?.brand||maker?.name||"",
  rating:v.capacity||"",catalogSpec:[maker?.brand||maker?.name,v.sku,v.capacity,size?size+" "+(dims.unit||"mm"):""].filter(Boolean).join(" · "),
  sourceVariantId:v.id};
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
const extended=line=>numeric(line.quantity)*numeric(line.unitPrice);
function totals(q){
 const subtotal=(q.lines||[]).reduce((sum,l)=>sum+extended(l),0);
 const discount=Math.min(subtotal,subtotal*numeric(q.discount)/100);
 const taxable=Math.max(0,subtotal-discount);
 const tax=taxable*numeric(q.taxRate)/100;
 return {subtotal,discount,taxable,tax,total:taxable+tax};
}
function lineConfig(line){
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
function renderHeader(q){
 $("quote-header").innerHTML='<div class="ma6-detail-top"><div><small>'+esc(q.id)+' / '+esc(q.rev)+' · '+text(customer(q.customerId)?.name)+'</small><h2>'+esc(q.title)+'</h2><p>Buyer: '+text(buyer(q.buyerId)?.name)+' · '+text(entity(q.companyId)?.name)+' / '+text(branch(q.branchId)?.name)+'</p></div>'+
 '<div class="ma6-detail-actions">'+statusBadge(q.status)+
 (q.status==="Draft"?'<button type="button" class="btn primary" data-action="edit-builder">Open Builder</button>':'<button type="button" class="btn" data-action="preview-pdf">Preview Offer</button>')+
 '<button type="button" class="btn" data-action="duplicate">Duplicate as Draft</button></div></div>'+
 '<div class="ma6-quote-meta"><span class="ma6-tag">Revision '+esc(q.rev)+'</span><span class="ma6-tag">Owner: '+text(employee(q.ownerId)?.name)+'</span><span class="ma6-tag">Updated '+esc(q.lastUpdated)+'</span><span class="ma6-tag">Total (demo): '+money(totals(q).total)+'</span></div>'+
 '<div class="ma6-banner"><b>Configuration → Pricing → Quotation:</b> Configuration defines the approved product/option selection; pricing applies commercial rates and controls; a quotation is a reviewed, versioned customer offer. No customer-facing document is issued by this demo.</div>';
}
function summary(q){
 return panel("Quotation overview","Customer/legal buyer, selling company, source and commercial intent")+
 '<div class="ma6-kvs">'+kv("Quotation ID / Revision",q.id+" / "+q.rev)+kv("Status",q.status)+
 kv("Customer account",customer(q.customerId)?.name)+kv("Buyer / bill-to",buyer(q.buyerId)?.name)+
 kv("Customer contact",contact(q.contactId)?.name)+kv("Customer site",site(q.siteId)?.name)+
 kv("Customer project",project(q.projectId)?.name)+kv("Source enquiry",q.opportunityId||"Direct quotation — no enquiry required")+
 kv("Our selling legal entity",entity(q.companyId)?.name)+kv("Our branch",branch(q.branchId)?.name)+
 kv("Sales owner",employee(q.ownerId)?.name)+kv("Currency",q.currency)+
 (q.projectTechnical?kv("Solar system type",q.projectTechnical.systemType||"Not specified")+
 kv("Target DC capacity",q.projectTechnical.targetDcKwp?q.projectTechnical.targetDcKwp+" kWp":"Not specified")+
 kv("Roof / installation site",[q.projectTechnical.roofType,q.projectTechnical.siteLocation].filter(Boolean).join(" · ")):"")+
 kv("Quotation date",q.date)+kv("Valid until",q.validUntil)+
 kv("Revision",q.rev)+kv("Last updated",q.lastUpdated)+'</div>'+
 (q.opportunityId?'<div class="ma6-section-sub"><h4>Source opportunity</h4><a class="btn" href="ma-005-opportunities.html?opportunity='+encodeURIComponent(q.opportunityId)+'">View MA-005</a></div>':'')+
 note('Group customers can have multiple buyer companies. Each issued quotation must preserve the selected buyer’s legal identity, address, tax details and issued revision as a fixed snapshot. A source opportunity is optional.');
}
function items(q){
 return panel("Configuration & Bill of Quantities","One quote can include configurable products, standard items and services.","edit-builder","Open in Builder")+
 (q.lines.length?table(["Item / type","Selected options & scope","Qty","Unit","Selling rate (demo)","Line total"],
 q.lines.map(l=>'<tr><td><strong>'+esc(l.description)+'</strong><small>'+esc(l.productId)+' · '+esc(l.type)+'</small></td>'+
 '<td>'+text(lineConfig(l))+'</td><td>'+esc(l.quantity)+'</td><td>'+esc(l.unit)+'</td><td class="ma6-money">'+money(l.unitPrice)+'</td><td class="ma6-money">'+money(extended(l))+'</td></tr>')):blank("No BOQ lines have been added."))+
 note('<b>Configuration rule boundary:</b> Options and illustrative dependencies are modeled in the builder. Engineering compatibility, approved product catalog, generated BOM, availability, specifications and vendor evidence will need a separate rules/data service. Internal costs and margins are not displayed in this public demo.');
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
 return panel("Commercial summary","Illustrative selling-side calculations and customer-facing conditions")+
 financialRows(q)+
 '<div class="ma6-kvs" style="margin-top:15px">'+kv("Payment terms",q.payment)+kv("Delivery / execution",q.delivery)+
 kv("Warranty / support",q.warranty)+kv("Validity",q.validUntil)+
 kv("Exclusions",q.exclusions)+kv("Commercial notes",q.notes)+'</div>'+
 note('<b>Pricing safeguard:</b> These INR amounts, discounts and tax percentages are synthetic. Production needs approved price lists, item-level taxes, HSN/SAC, jurisdiction, rounding, freight handling and discount policies. Cost/margin disclosure requires separate MA-003 grants.',true);
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
 ["Issuance permission",false,"Requires authorized approval, locked revision and audit in production"]
 ];
}
function approvals(q){
 return panel("Review & Approval","Technical, commercial and authorization requirements before issuing any quotation","preview-approval","Approval workflow (planned)")+
 '<div class="ma6-checklist">'+reviewChecks(q).map(([title,done,desc])=>
 '<div class="ma6-check-item"><span class="ma6-check-icon">'+(done?'✓':'!')+'</span><div><b>'+esc(title)+'</b><small>'+esc(desc)+'</small></div></div>').join("")+'</div>'+
 '<div class="ma6-kvs">'+kv("Sample quote status",q.status)+kv("Review state",q.review)+kv("Discount",q.discount+"% (illustrative)")+
 kv("Approved-by", "Not verified in this public wireframe")+'</div>'+
 note('<b>Required for development:</b> MA-003 action grants + company/branch record scope + approval matrix (discount/margin/exception) + supplier evidence + technical validation. Approver must not be assumed from a user’s role label alone. Issue only an approved and immutable revision.',true);
}
function revisions(q){
 const sample=db.revisions.filter(x=>x.quoteId===q.id);
 const generated=[...sample,...state.history.filter(h=>h.quoteId===q.id&&h.kind==="revision").map(h=>h.revision)];
 const rows=generated.length?generated:[
 {quoteId:q.id,revision:q.rev,date:q.date,by:employee(q.ownerId)?.name||"Sample",note:q.versionNotes||"Initial sample revision",locked:q.status!=="Draft"}];
 return panel("Quotation versions & snapshots","A revision is distinct from an opportunity status or a copy of an editable draft")+
 rows.map(r=>'<div class="ma6-revision-row"><div><strong>'+esc(r.revision)+' · '+(r.locked?'Historical snapshot':'Current draft')+'</strong><p>'+esc(r.note)+'</p><small>'+esc(r.date)+' · '+esc(r.by)+'</small></div><span class="ma6-tag">'+(r.locked?'Locked (sample)':'Editable draft (sample)')+'</span></div>').join("")+
 note('Production must retain immutable issued revision snapshots with buyer identity, BOQ, configured selections, pricing, tax, terms, approvals, evidence and dispatch records. Historical sample revisions here are illustrative metadata, not a document store.');
}
function paper(q){
 const t=totals(q);
 return '<div class="ma6-paper"><div class="ma6-paper-head"><div><strong>'+text(entity(q.companyId)?.name)+'</strong><p>Customer quotation preview · fictional information</p></div><span>'+esc(q.id)+' / '+esc(q.rev)+'</span></div>'+
 '<p><b>To:</b> '+text(buyer(q.buyerId)?.name)+'<br><b>Reference:</b> '+esc(q.title)+'<br><b>Valid until:</b> '+esc(q.validUntil)+'</p>'+
 '<table><thead><tr><th>Particulars</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead><tbody>'+
 q.lines.map(l=>'<tr><td>'+esc(l.description)+'</td><td>'+esc(l.quantity)+'</td><td>'+esc(l.unit)+'</td><td class="ma6-money">'+money(extended(l))+'</td></tr>').join("")+
 '</tbody></table><p><b>Illustrative total:</b> '+money(t.total)+' (including sample discount / tax inputs)</p>'+
 '<p><b>Payment:</b> '+text(q.payment)+'<br><b>Delivery:</b> '+text(q.delivery)+'<br><b>Warranty:</b> '+text(q.warranty)+'</p>'+
 '<p><b>Exclusions:</b> '+text(q.exclusions)+'</p><p style="border-top:1px solid #e8edf2;padding-top:12px"><b>NOT AN ISSUED QUOTATION.</b> No company signature, approval, verified tax data or legally usable PDF is provided.</p></div>';
}
function documents(q){
 return panel("PDF Preview, Dispatch & Customer Response","Separated from quotation editing, approval and order registration","preview-pdf","Expand preview")+
 paper(q)+
 '<div class="ma6-section-sub"><h4>Customer response / dispatch record</h4><button type="button" class="btn" data-action="preview-dispatch">Dispatch controls (planned)</button></div>'+
 '<div class="ma6-response-card"><h4>'+esc(q.response)+'</h4><p>'+text(q.responseNote,"Customer response evidence has not been recorded in this demo.")+'</p><p><b>Issue status:</b> '+esc(q.status)+' · Actual issue/dispatch needs a controlled production process.</p></div>'+
 note('Customer-facing PDF may show approved commercial items, specifications, amount and terms; confidential vendor costs, internal margin and unapproved pricing rules must never leak into the customer document. Recording acceptance is not the same as registering an order.');
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
 const choice=product(b.productId)||db.products[0];
 const options=choice.type==="config"?Object.entries(choice.options).map(([key,spec])=>
  formSelect("config-"+key,spec.label,spec.choices.map(([val])=>[val,val]),b.options?.[key]||choice.defaults[key],"Choose option",true)).join(""):"";
 const source=window.CPQ_MA006A_CATALOG;
 const solar=(source?.variants||[]).filter(v=>v.status==="Active").map(v=>product(v.id)).filter(Boolean);
 const old=db.products.filter(p=>!q.projectTechnical||p.type==="service");
 const all=[...solar,...old];
 const matches=all.filter(p=>!b.catalogSearch||[p.name,p.sku,p.model,p.manufacturer,p.rating].join(" ").toLowerCase().includes(b.catalogSearch.toLowerCase()));
 const validation=configCheck(choice,b.options||{});
 return '<div class="ma6a-product-picker-toolbar"><div class="ma6-field">'+
 '<label for="quote-add-search">Find a model or service</label><input type="search" id="quote-add-search" data-catalog-search value="'+esc(b.catalogSearch||"")+'" placeholder="Module, inverter, manufacturer, SKU..."></div></div>'+
 '<div class="ma6-config-grid"><div><div class="ma6-product-cards">'+
 (matches.length?matches.map(p=>'<button type="button" data-product="'+esc(p.id)+'" class="ma6-product-card'+(p.id===choice.id?' selected':'')+'">'+
 '<div>'+typeBadge(p.type)+'<strong>'+esc(p.name)+'</strong>'+
 '<small>'+esc(p.catalogSpec||p.id+" · "+p.unit)+'</small></div><span class="ma6-tag">Select</span></button>').join(""):
 blank("No matching Active catalog models. Try another search."))+
 '</div></div><div class="ma6-config-form"><h3>'+esc(choice.name)+'</h3>'+
 (options?'<div class="ma6-field-grid">'+options+'</div>':
 '<p class="muted">Exact catalog model or service. Its technical master is maintained in MA-006A.</p>')+
 '<div class="ma6-field"><label for="b-config-qty">Quantity ('+esc(choice.unit||"Nos")+')</label>'+
 '<input id="b-config-qty" type="number" min="1" step="1" data-config-qty value="'+esc(b.quantity)+'"></div>'+
 (choice.status&&choice.status!=="Active"?'<div class="ma6-validation">This catalog model is a Draft and cannot be selected for a quotation.</div>':
 '<div class="ma6-validation'+(validation.ok?' ok':'')+'">'+esc(validation.message)+'</div>')+
 '<button class="btn primary" type="button" data-action="add-config-item">+ Add to BOQ</button></div></div>';
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
 (l.technicalReview?'<small>Technical variation needs review</small>':'')+'</td>'+
 '<td><input class="ma6-qty" type="number" min="1" step="1" data-line-qty="'+esc(l.id)+'" value="'+esc(l.quantity)+'" aria-label="Quantity '+esc(l.description)+'"></td>'+
 '<td>'+esc(l.unit)+'</td><td class="ma6-money"><input class="ma6-rate" type="number" min="0" step="0.01" data-line-rate="'+esc(l.id)+'" value="'+esc(l.unitPrice)+'" aria-label="Sample selling rate '+esc(l.description)+'"></td>'+
 '<td class="ma6-money">'+money(extended(l))+'</td><td><button type="button" class="btn" data-remove-line="'+esc(l.id)+'" aria-label="Remove '+esc(l.description)+'">Remove</button></td></tr>')):
 blank("No BOQ items yet. Add a product or import a configuration.");
 return panel("2 · Products & BOQ","The selected configuration is already here. Check models, quantities and sample rates.")+
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
 $("quote-register").hidden=true;$("quote-builder").hidden=false;
 $("quote-view-toggle").hidden=true;
 $("quote-explainer").hidden=true;$("quote-stats").hidden=true;$("quote-scope").hidden=true;
 $("builder-title").textContent=(b.isNew?"New Draft Quotation":"Edit Draft "+q.id)+" · "+steps[b.step][0];
 $("builder-subtitle").textContent=(b.isNew?"New quote":"Existing "+q.rev)+" · Illustrative values · Browser session only";
 $("builder-steps").innerHTML=steps.map((st,i)=>'<button type="button" data-step="'+i+'" class="'+(b.step===i?'active':'')+'" aria-current="'+(b.step===i?'step':'false')+'"><span class="ma6-step-num">'+(i+1)+'</span><span class="ma6-step-label">'+esc(st[0])+'</span></button>').join("");
 $("builder-body").innerHTML=stepContent[b.step](q,b);
 $("builder-prev").disabled=b.step===0;
 $("builder-next").hidden=b.step===steps.length-1;
 $("builder-save").hidden=b.step!==steps.length-1;
 $("builder-hint").textContent=b.step===1?"Review imported items · Catalog approval still pending":b.step===2?"All commercial values are fictional.":"Save Draft only · No customer issue or approval";
}
function render(){
 if(state.mode==="builder"){renderBuilder();return;}
 $("quote-builder").hidden=true;$("quote-register").hidden=false;
 $("quote-view-toggle").hidden=false;
 const expanded=state.listExpanded;
 $("quote-register").classList.toggle("is-expanded",expanded);
 $("quote-list").hidden=expanded;$("quote-expanded-table").hidden=!expanded;
 $("quote-details").hidden=expanded;
 $("quote-explainer").hidden=expanded;$("quote-stats").hidden=expanded;$("quote-scope").hidden=false;
 $("quote-view-toggle").textContent=expanded?"Return to Details":"View Full List";
 $("quote-view-toggle").setAttribute("aria-pressed",String(expanded));
 $("quote-expand-toggle").textContent=expanded?"Show Details":"Expand List";
 $("quote-expand-toggle").setAttribute("aria-pressed",String(expanded));
 $("quote-list-title").textContent=expanded?"All Quotations":"Quotation Register";
 $("quote-list-subtitle").textContent=expanded?"Full-width list · select View Details to open a quotation":"Select a quotation to inspect";
 renderRegister();
}
window.CPQ_MA006={ $,esc,db,master,org,staff,enquiries,state,quote,customer,buyer,contact,site,project,employee,entity,branch,opportunity,product,opts,text,money,numeric,configCheck,configUnit,extended,totals,lineConfig,visible,render,renderBuilder,financialRows,paper,note,blank,table,reviewChecks };
render();
})();