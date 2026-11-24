/* MA-006A · Product Configuration workspace.
 * Presentation-only technical workbench. No approved rules, prices, persistence or security enforcement. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const records=clone(window.CPQ_MA006A_DATA.configurations);
const flow=window.CPQ_FLOW;
const products=window.CPQ_MA006_DATA.products,org=window.CPQ_MA002_DATA,staff=window.CPQ_MA003_USERS,master=window.CPQ_MA004_DATA,opps=window.CPQ_MA005_DATA.opportunities;
const state={selected:"CF-2026-003",tab:"overview",mode:"register",company:"all",branch:"all",search:"",status:"all",builder:null};
const catalog=()=>window.CPQ_MA006A_CATALOG_UI?.db||window.CPQ_MA006A_CATALOG;
const catalogVariant=id=>catalog().variants.find(x=>x.id===id);
const catalogFamily=id=>catalog().families.find(x=>x.id===id);
const catalogMaker=id=>catalog().manufacturers.find(x=>x.id===id);
function itemProduct(id){
 const old=products.find(p=>p.id===id);if(old)return old;
 const v=catalogVariant(id);if(!v)return null;
 const f=catalogFamily(v.familyId),m=catalogMaker(v.manufacturerId);
 return {id:v.id,name:flow.productName(f,v),type:f?.type==="service"?"service":"standard",unit:f?.unit||"Nos",
 model:v.model||"",displayModel:flow.variantLabel(v),sku:v.sku,manufacturer:flow.manufacturerLabel(v,m),capacity:v.capacity,solarKind:f?.solarKind||"general",variant:v};
}
const record=id=>records.find(c=>c.id===id);
const customer=id=>master.customers.find(c=>c.id===id);
const buyer=id=>master.companies.find(c=>c.id===id);
const entity=id=>org.find(c=>c.id===id);
const branch=id=>org.flatMap(c=>c.branches.map(b=>({...b,companyId:c.id}))).find(b=>b.id===id);
const owner=id=>staff.find(x=>x.id===id);
const opportunity=id=>opps.find(x=>x.id===id);
const opts=(values,selected)=>values.map(([v,label])=>'<option value="'+esc(v)+'"'+(String(v)===String(selected)?' selected':'')+'>'+esc(label)+'</option>').join("");
const kv=(label,value)=>'<div class="ma6-kv"><small>'+esc(label)+'</small><strong>'+esc(value||"Not linked")+'</strong></div>';
const panel=(title,sub)=>'<div class="ma6-panel-head"><div><h3>'+esc(title)+'</h3><p>'+esc(sub)+'</p></div></div>';
const note=message=>'<div class="ma6-note">'+message+'</div>';
const empty=message=>'<div class="ma6-empty">'+esc(message)+'</div>';
const typeLabel=type=>({config:"Configurable product",standard:"Standard product",service:"Service / Project"})[type]||type;
function optionText(line){
 const p=itemProduct(line.productId);if(!p)return "Product unavailable";
 if(p.variant){
  const d=p.variant.dimensions||{},size=d.width&&d.height&&d.depth?[d.width,d.height,d.depth].join(" × ")+" "+(d.unit||"mm"):"";
  return [p.manufacturer,p.displayModel,p.capacity,size,line.customSpec].filter(Boolean).join(" · ");
 }
 if(p.type!=="config")return "No option-level configuration required";
 return Object.entries(p.options).map(([k,v])=>v.label+": "+(line.options?.[k]||"Not selected")).join(" · ");
}
function lineErrors(item){
 const p=itemProduct(item.productId),errors=[];
 if(!p){errors.push("Product not found in catalog");return errors;}
 if(!Number.isInteger(Number(item.quantity))||Number(item.quantity)<=0||Number(item.quantity)>100000)errors.push("Quantity must be an integer from 1 to 100,000");
 if(p.variant){
  if(p.variant.status!=="Active")errors.push("This model is not active in the product catalog.");
  return errors;
 }
 if(p.type==="config"){
  for(const [key,opt] of Object.entries(p.options))if(!opt.choices.some(([v])=>v===item.options?.[key]))errors.push("Select "+opt.label);
  if(item.options?.rating==="630A"&&item.options?.mounting!=="Floor")errors.push("Demo compatibility rule: 630A requires Floor mounting");
 }
 return errors;
}
function solarMetrics(c){
 const out={dcKwp:0,acKw:0,batteryKwh:0,modules:0,ratio:null};
 for(const l of c.items){
  const v=catalogVariant(l.productId);if(!v)continue;
  const f=catalogFamily(v.familyId),qty=Number(l.quantity)||0;
  if(f?.solarKind==="pv-module"){out.dcKwp+=(Number(v.solar?.pmaxWp)||0)*qty/1000;out.modules+=qty;}
  if(f?.solarKind==="inverter")out.acKw+=(Number(v.solar?.ratedAcKw)||0)*qty;
  if(f?.solarKind==="battery")out.batteryKwh+=(Number(v.solar?.usableKwh)||0)*qty;
 }
 out.ratio=out.acKw>0?out.dcKwp/out.acKw:null;return out;
}
function solarWarnings(c){
 if(c.solutionType!=="solar")return [];
 const m=solarMetrics(c),p=c.solar||{},a=[];
 if(!Number(p.targetDcKwp))a.push("Target DC capacity is not supplied.");
 if(!Number(p.usableArea))a.push("Usable area / roof survey is not supplied.");
 if(!m.modules)a.push("Select a PV module and quantity from the product catalog.");
 if(!m.acKw)a.push("Select an inverter model and quantity from the catalog.");
 for(const l of c.items){const v=catalogVariant(l.productId);if(v?.demoReview?.state==="Enabled for demo")a.push(flow.variantLabel(v)+" is enabled for browser demo only: technical specifications and pricing are not approved.");}
 if(Number(p.targetDcKwp)>0&&m.dcKwp>0&&Math.abs(m.dcKwp-Number(p.targetDcKwp))/Number(p.targetDcKwp)>0.1)
  a.push("Selected module DC capacity differs by over 10% from target.");
 a.push("Electrical string/MPPT pairing, structural load, shading and performance require engineering verification.");
 return a;
}
function review(c){
 const errors=[];
 if(!String(c.name||"").trim())errors.push("Enter a configuration name");
 if(!c.items.length)errors.push("Add at least one product or service");
 c.items.forEach((line,i)=>lineErrors(line).forEach(e=>errors.push("Item "+(i+1)+": "+e)));
 const validCustomer=customer(c.customerId);
 if(c.kind==="Customer configuration"){
  if(!validCustomer)errors.push("Choose a customer for the project");
  if(!c.buyerId)errors.push("Choose the exact buyer/legal company");
  if(!c.companyId)errors.push("Choose our selling company");
  if(!c.branchId)errors.push("Choose our selling branch");
  if(!c.ownerId)errors.push("Assign a responsible employee");
 }
 if(c.buyerId&&(!validCustomer||!master.companies.some(x=>x.id===c.buyerId&&x.customerId===c.customerId)))
  errors.push("Buyer must belong to the selected customer");
 for(const [key,label,values] of [["contactId","Contact",master.contacts],["siteId","Site",master.sites],["projectId","Project",master.projects]])
  if(c[key]&&!values.some(x=>x.id===c[key]&&x.customerId===c.customerId&&x.companyId===c.buyerId))
   errors.push(label+" must belong to this customer and buyer");
 if(c.opportunityId&&(!validCustomer||!opportunity(c.opportunityId)||opportunity(c.opportunityId).customerId!==c.customerId||opportunity(c.opportunityId).buyerId!==c.buyerId))
  errors.push("Enquiry must match the selected customer and buyer");
 if(c.branchId&&(!c.companyId||!entity(c.companyId)?.branches.some(x=>x.id===c.branchId)))
  errors.push("Our branch must belong to the selected selling company");
 if(c.customerId&&c.companyId&&c.branchId&&!validCustomer?.links.some(l=>l.companyId===c.companyId&&l.branchId===c.branchId))
  errors.push("Internal company/branch must be linked to this customer");
 if(c.ownerId&&!staff.some(u=>u.id===c.ownerId&&u.status==="Active"&&(u.assignments||[]).some(a=>a.companyId===c.companyId&&a.branches.includes(c.branchId))))
  errors.push("Owner must be active and assigned to that branch");
 const m=solarMetrics(c);
 if(c.solutionType==="solar"){
  if(!(Number(c.solar?.targetDcKwp)>0))errors.push("Enter target DC capacity (kWp)");
  if(!(m.modules>0&&m.dcKwp>0))errors.push("Select active solar modules and quantity");
  if(!(m.acKw>0))errors.push("Select an active inverter and quantity");
  if(c.solar?.batteriesNeeded==="Yes"&&!(m.batteryKwh>0))errors.push("Storage requested: choose a battery model");
 }
 return {ok:errors.length===0,errors,warnings:solarWarnings(c),solar:m};
}
const status=c=>review(c).ok?"Demo check passed":"Needs changes";
const badge=c=>review(c).ok?'<span class="ma6a-chip-ok">Demo check passed</span>':'<span class="ma6a-chip-bad">Needs changes</span>';
function scopeMatch(c){
 const comp=state.company==="all"||c.companyId===state.company,br=state.branch==="all"||c.branchId===state.branch;
 return comp&&br;
}
function visible(){
 const term=state.search.trim().toLowerCase();
 return records.filter(c=>scopeMatch(c)&&
 (state.status==="all"||(state.status==="passed"?review(c).ok:!review(c).ok))&&
 (!term||[c.id,c.name,c.kind,c.notes,customer(c.customerId)?.name,buyer(c.buyerId)?.name,c.items.map(i=>itemProduct(i.productId)?.name).join(" ")].some(v=>String(v||"").toLowerCase().includes(term))));
}
function renderFilters(){
 $("cfg-company-filter").innerHTML='<option value="all">All internal companies / unassigned</option>'+opts(org.map(x=>[x.id,x.name]),state.company);
 $("cfg-company-filter").value=state.company;
 const branches=state.company==="all"?org.flatMap(x=>x.branches.map(b=>[b.id,x.name+" / "+b.name])):(entity(state.company)?.branches||[]).map(b=>[b.id,b.name]);
 if(state.branch!=="all"&&!branches.some(([id])=>id===state.branch))state.branch="all";
 $("cfg-branch-filter").innerHTML='<option value="all">All branches / unassigned</option>'+opts(branches,state.branch);
 $("cfg-branch-filter").value=state.branch;
 $("cfg-status-filter").value=state.status;
 $("cfg-search").value=state.search;
}
function renderStats(){
 const all=records.filter(scopeMatch),counts=[["Configurations",all.length,"Saved technical selections"],["Sample check passed",all.filter(x=>review(x).ok).length,"Not an engineering approval"],["Needs changes",all.filter(x=>!review(x).ok).length,"Resolve sample selection issues"],["Linked to quotes",all.filter(x=>x.quoteId).length,"Existing sample quotation references"]];
 $("configuration-stats").innerHTML=counts.map(x=>'<div class="card ma6-stat"><span>'+esc(x[0])+'</span><strong>'+String(x[1]).padStart(2,"0")+'</strong><small>'+esc(x[2])+'</small></div>').join("");
}
function renderList(items){
 $("configuration-count").textContent=items.length+" shown";
 $("configuration-list").innerHTML=items.length?items.map(c=>
 '<button type="button" data-select-config="'+esc(c.id)+'" class="ma6-quote-card'+(state.selected===c.id?' active':'')+'" aria-pressed="'+String(state.selected===c.id)+'"><span class="ma6-quote-top"><b class="ma6-quote-title">'+esc(c.name)+'</b>'+badge(c)+'</span>'+
 '<div class="ma6-quote-sub">'+esc(c.id)+' / '+esc(c.revision)+' · '+esc(c.kind)+'</div>'+
 '<div class="ma6-quote-bottom"><span class="ma6-tag">'+esc(customer(c.customerId)?.name||"Reusable / no buyer")+'</span><span class="ma6-quote-sub">'+c.items.length+' items</span></div></button>').join(""):empty("No configurations match this scope and search. Try Reset filters.");
}
function payload(c){
 return {v:1,configId:c.id,name:c.name,revision:c.revision||"C0",customerId:c.customerId||"",buyerId:c.buyerId||"",contactId:c.contactId||"",siteId:c.siteId||"",projectId:c.projectId||"",companyId:c.companyId||"",branchId:c.branchId||"",ownerId:c.ownerId||"",opportunityId:c.opportunityId||"",
  solutionType:c.solutionType||"general",solar:c.solutionType==="solar"?c.solar||{}:{},
  serviceIds:flow.normalized(c.serviceIds||[],true),
  items:c.items.map(l=>{
   const v=catalogVariant(l.productId),f=v?catalogFamily(v.familyId):null;
   return {productId:l.productId,variantId:v?.id||"",quantity:l.quantity,options:l.options||{},note:l.note||"",customSpec:l.customSpec||"",
   model:v?{sku:v.sku,model:v.model,manufacturer:catalogMaker(v.manufacturerId)?.brand||"",unit:f?.unit||"Nos",name:f?.name||"",solarKind:f?.solarKind||"general"}:null,
   modelSnapshot:l.modelSnapshot||flow.modelSnapshot(l.productId)};
  })};
}
function quotationLink(c){
 return 'ma-006-quotations.html?configuration='+encodeURIComponent(c.id);
}
function renderHead(c){
 $("configuration-header").innerHTML='<div class="ma6-detail-top"><div><small>'+esc(c.id)+' / '+esc(c.revision)+' · '+esc(c.kind)+'</small><h2>'+esc(c.name)+'</h2><p>'+esc(customer(c.customerId)?.name||"Reusable configuration without a customer")+' · '+esc(owner(c.ownerId)?.name||"Unassigned owner")+'</p></div>'+
 '<div class="ma6-detail-actions">'+badge(c)+
 '<button type="button" class="btn" data-action="edit">Edit Configuration</button>'+
 '<button type="button" class="btn" data-action="duplicate">Copy</button>'+
 (review(c).ok?'<a class="btn primary" href="'+quotationLink(c)+'">Continue to Pricing</a>':'<button type="button" class="btn" disabled title="Correct the sample rule before handoff">Resolve checks first</button>')+
 '</div></div>'+
 '<div class="ma6-quote-meta"><span class="ma6-tag">'+c.items.length+' selected item(s)</span><span class="ma6-tag">Updated '+esc(c.updated)+'</span><span class="ma6-tag">Technical approval: pending</span></div>'+
 '<div class="ma6-banner"><b>Configuration before quotation:</b> These records store product choices, options, technical notes and quantity. They do not store approved rates, discounts, taxes or customer-issued offers.</div>';
}
function overview(c){
 return panel("Configuration overview","Reusable technical selection with optional project/solar site context.")+
 '<div class="ma6-kvs">'+kv("Configuration reference",c.id+" / "+c.revision)+
 kv("Configuration Type",c.solutionType==="solar"?"Solar System":"Product / Other")+
 kv("Customer",customer(c.customerId)?.name||"Reusable template")+kv("Customer site",master.sites.find(x=>x.id===c.siteId)?.name)+kv("Project",master.projects.find(x=>x.id===c.projectId)?.name)+
 kv("Buyer company",buyer(c.buyerId)?.name)+kv("Source enquiry",c.opportunityId||"Not linked")+
 kv("Internal selling company",entity(c.companyId)?.name)+kv("Branch",branch(c.branchId)?.name)+
 kv("Owner",owner(c.ownerId)?.name)+kv("Selected items",String(c.items.length))+
 kv("Basic sample check",status(c))+kv("Updated",c.updated)+'</div>'+
 '<div class="cpq-scope-panel"><h4>Selected services &amp; sub-services</h4>'+flow.summary(c.serviceIds||[])+
  '<p>References from Service Master. Charges are created only in the quotation.</p></div>'+
  (c.solutionType==="solar"?solarOverview(c):"")+
 '<details class="ma6a-builder-details"><summary>Project notes and linked quotation</summary><p>'+esc(c.notes||"No notes")+'</p>'+
 '<p>Quotation: '+esc(c.quoteId||"Not linked")+'</p></details>'+
 '<details class="ma6a-builder-details"><summary>Previous versions ('+(c.history?.length||0)+')</summary>'+
 (c.history?.length?c.history.slice().reverse().map(v=>'<div class="ma6a-compact-history"><strong>'+
 esc(v.revision)+' · '+esc(v.updated)+'</strong><p>'+esc(v.name)+' · '+v.items.length+
 ' lines (previous draft retained)</p></div>').join(""):'<p>No earlier saved revisions.</p>')+'</details>'+
 note('A configuration stores technical selections and project requirements. It is not a priced or engineering-approved customer quotation.');
}
function items(c){
 return panel("Selected technical items","Product attributes, service scope and quantities; pricing happens only in MA-006.")+
 (c.items.length?c.items.map((l,i)=>{
  const p=itemProduct(l.productId),issues=lineErrors(l);
  return '<div class="ma6a-config-item"><div class="ma6a-config-item-head"><div><strong>'+(i+1)+'. '+esc(p?.name||l.productId)+'</strong><small>'+esc(l.productId)+' · '+esc(typeLabel(p?.type))+'</small></div>'+
  '<span class="ma6-tag">'+esc(l.quantity)+' '+esc(p?.unit||"unit")+'</span></div>'+
  '<div class="ma6a-config-options"><span>'+esc(l.modelSnapshot?
 [l.modelSnapshot.manufacturer,l.modelSnapshot.model||l.modelSnapshot.variantLabel||l.modelSnapshot.capacity,l.modelSnapshot.sku,l.customSpec].filter(Boolean).join(" · "):optionText(l))+'</span></div>'+
 (l.modelSnapshot?.documentRefs?.length?'<p class="cpq-scope-caption">'+l.modelSnapshot.documentRefs.length+' product document reference(s) captured when this line was added.</p>':"")+
  (l.note?'<p class="ma6a-table-foot">'+esc(l.note)+'</p>':'')+
  (issues.length?'<div class="ma6-validation">'+issues.map(esc).join("; ")+'</div>':'')+'</div>';
 }).join(""):empty("No selected items. Open the builder to add products."))+
 note('This is not a generated manufacturer BOM or priced BOQ. Engineering will approve the options and component breakdown; quotations will display the commercial quantities, rates and terms.');
}
function checks(c){
 const result=review(c);
 return panel("Technical checks & next steps","We separate basic data checks from real engineering approvals.")+
 (result.errors.length?result.errors.map(e=>'<div class="ma6a-check-row bad"><span class="ma6a-check-symbol">!</span><div><strong>Needs correction</strong><p>'+esc(e)+'</p></div></div>').join(""):
 '<div class="ma6a-check-row"><span class="ma6a-check-symbol">✓</span><div><strong>Basic catalog and quantity check passed</strong><p>Model references and quantities are structurally valid in this wireframe.</p></div></div>')+
 (result.warnings||[]).map(e=>'<div class="ma6a-check-row bad"><span class="ma6a-check-symbol">!</span><div><strong>Engineering follow-up</strong><p>'+esc(e)+'</p></div></div>').join("")+
 '<div class="ma6a-check-row bad"><span class="ma6a-check-symbol">!</span><div><strong>Formal technical approval pending</strong><p>Real string / MPPT limits, structural review, certifications, drawings and itemized BOM must be verified in production.</p></div></div>';
}
function handoff(c){
 const valid=review(c).ok;
 return panel("Continue from configuration to Pricing & Costing","Import selected products, services, quantities and customer context into the pricing stage of MA-006.")+
 '<div class="ma6a-handoff"><h4>'+(valid?"Ready for a demo handoff":"Correct the technical selection first")+'</h4>'+
 '<p>'+esc(valid?"Selected products, quantities and services will open a new Pricing & Costing stage, with automatic sample catalog rates and editable offered prices. Review labour, commission and other costs before preparing the customer quotation.":"One or more sample technical checks failed. Open Edit Configuration and correct the item(s) before handoff.")+'</p>'+
 (valid?'<a class="btn primary" href="'+quotationLink(c)+'">Continue to Pricing &amp; Costing</a>':'<button class="btn" type="button" data-action="edit">Edit configuration</button>')+'</div>'+
 '<div class="ma6-section-sub"><h4>Existing quotation link</h4></div>'+
 (c.quoteId?'<a class="btn" href="ma-006-quotations.html?quote='+encodeURIComponent(c.quoteId)+'">View sample '+esc(c.quoteId)+'</a>':empty("This configuration has no previously linked quotation."))+
 note('Handoff creates a new browser-only draft; it does not modify an existing issued quotation. The saved configuration ID is passed to MA-006; the source configuration and Product Master are not changed by quote-specific pricing. Never enter real customer, technical or confidential information in this public page.');
}
const renderTab={overview,items,validation:checks,handoff};
function renderDetail(){
 const c=record(state.selected);
 if(!c){$("configuration-header").innerHTML=empty("No configuration selected");$("configuration-tab-body").innerHTML="";return;}
 renderHead(c);
 for(const b of $("configuration-tabs").querySelectorAll("[data-tab]")){
  const active=b.dataset.tab===state.tab;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));
 }
 $("configuration-tab-body").innerHTML=(renderTab[state.tab]||overview)(c);
}
const field=(id,label,value="",full=false)=>
 '<div class="ma6-field'+(full?' full':'')+'"><label for="c-'+esc(id)+'">'+esc(label)+'</label><input type="text" id="c-'+esc(id)+'" data-c-field="'+esc(id)+'" value="'+esc(value)+'"></div>';
const area=(id,label,value="")=>'<div class="ma6-field full"><label for="c-'+esc(id)+'">'+esc(label)+'</label><textarea id="c-'+esc(id)+'" data-c-field="'+esc(id)+'">'+esc(value)+'</textarea></div>';
const select=(id,label,values,current,placeholder="Select...")=>
 '<div class="ma6-field"><label for="c-'+esc(id)+'">'+esc(label)+'</label><select id="c-'+esc(id)+'" data-c-field="'+esc(id)+'"><option value="">'+esc(placeholder)+'</option>'+opts(values,current)+'</select></div>';
const steps=["Project Details","Choose Equipment","Review & Save"];
const emptyConfig=()=>({id:"",name:"",kind:"Customer configuration",solutionType:"solar",solar:{systemType:"On-grid Rooftop"},customerId:"",buyerId:"",contactId:"",siteId:"",projectId:"",opportunityId:"",serviceIds:[],companyId:"",branchId:"",ownerId:"",quoteId:"",notes:"",updated:"Not saved",revision:"C0",items:[]});
function setProduct(b,id){
 const p=itemProduct(id);
 if(!p)return;b.productId=id;b.quantity=1;b.itemNote="";b.options=p.type==="config"?{...p.defaults}:{};
}
function newBuilder(original=null,duplicate=false){
 const c=original?clone(original):emptyConfig();
 if(duplicate){c.id="";c.quoteId="";delete c.history;c.revision="C0";c.updated="New copy (demo)";c.name=c.name+" — Copy";}
 const b={value:c,isNew:!original||duplicate,step:0,productId:"",quantity:1,options:{},itemNote:"",customSpec:"",productGroup:c.solutionType==="solar"?"solar":"other",catalogSearch:""};
 setProduct(b,c.solutionType==="solar"?"VAR-009":products[0].id);
 state.builder=b;state.mode="builder";render();
 $("configuration-builder").scrollIntoView({block:"start",behavior:"auto"});
}
function projectField(field,c){
 const [key,label,unit,type,choices]=field,name="solar-"+key,val=c.solar?.[key]??"";
 const title=esc(label)+(unit?' ('+esc(unit)+')':'');
 if(type==="select")return '<div class="ma6-field"><label for="c-'+name+'">'+title+'</label><select id="c-'+name+'" data-solar-field="'+esc(key)+'">'+opts(choices.split(";").map(x=>[x,x]),val)+'</select></div>';
 return '<div class="ma6-field"><label for="c-'+name+'">'+title+'</label><input id="c-'+name+'" data-solar-field="'+esc(key)+'" type="'+(type==="number"?"number":type==="date"?"date":"text")+'"'+(type==="number"?' step="any"':'')+' value="'+esc(val)+'"></div>';
}
function projectFields(group,c){return '<div class="ma6-field-grid">'+window.CPQ_MA006A_SOLAR_FIELDS.project[group].map(x=>projectField(x,c)).join("")+'</div>';}
function solarOverview(c){
 const p=c.solar||{},m=solarMetrics(c);
 return '<div class="ma6a-solar-summary"><div class="ma6a-section-heading"><h3>Solar project & equipment summary</h3></div>'+
 '<div class="ma6-kvs">'+kv("System type",p.systemType)+kv("Site / Roof",[p.siteLocation,p.roofType].filter(Boolean).join(" · "))+
 kv("Target DC",p.targetDcKwp?p.targetDcKwp+" kWp":"Not entered")+
 kv("Selected DC",m.modules?m.dcKwp.toFixed(2)+" kWp":"Not calculated")+
 kv("Selected AC",m.acKw?m.acKw.toFixed(2)+" kW":"Not selected")+
 kv("DC / AC Ratio",m.ratio?m.ratio.toFixed(2):"Pending")+
 kv("PV modules",String(m.modules))+kv("Usable roof area",p.usableArea?p.usableArea+" m²":"Not entered")+'</div>'+
 '<p class="ma6a-compact-help">Only simple module/inverter totals are shown. Electrical matching, structural fit, shading and expected energy yield need engineering verification.</p></div>';
}
function renderContext(c){
 const customers=master.customers.filter(x=>x.status!=="Archived").map(x=>[x.id,x.name]);
 const buyers=master.companies.filter(x=>x.customerId===c.customerId).map(x=>[x.id,x.name]);
 const contactOptions=master.contacts.filter(x=>x.customerId===c.customerId&&x.companyId===c.buyerId).map(x=>[x.id,x.name]);
 const siteOptions=master.sites.filter(x=>x.customerId===c.customerId&&x.companyId===c.buyerId).map(x=>[x.id,x.name]);
 const projectOptions=master.projects.filter(x=>x.customerId===c.customerId&&x.companyId===c.buyerId).map(x=>[x.id,x.name]);
 const links=customer(c.customerId)?.links||[];
 const companies=org.filter(x=>!c.customerId||links.some(l=>l.companyId===x.id)).map(x=>[x.id,x.name]);
 const branches=(entity(c.companyId)?.branches||[]).filter(x=>!c.customerId||links.some(l=>l.companyId===c.companyId&&l.branchId===x.id)).map(x=>[x.id,x.name]);
 const users=staff.filter(x=>x.status==="Active"&&(x.assignments||[]).some(a=>a.companyId===c.companyId&&a.branches.includes(c.branchId))).map(x=>[x.id,x.name]);
 const enq=opps.filter(x=>x.customerId===c.customerId&&x.buyerId===c.buyerId).map(x=>[x.id,x.title+" · "+x.id]);
 return panel("1 · Project & Configuration Basics","Start with the essentials. Optional site, electricity and engineering details are expandable.")+
 '<div class="ma6-field-grid">'+field("name","Configuration / Project Name *",c.name,true)+
 select("solutionType","What are you configuring?",[["solar","Solar System / Project"],["general","Single Product / Other"]],c.solutionType||"general")+
 select("kind","Purpose",[["Customer configuration","Customer project"],["Reusable template","Reusable template"]],c.kind)+
 select("customerId","Customer",customers,c.customerId,"Select later if reusable")+'</div>'+
 '<div class="cpq-scope-panel"><h4>Services &amp; sub-services (optional)</h4>'+
   flow.selector(c.serviceIds||[],"configServiceIds")+
   '<p>Select products in the next step only if technical configuration is required.</p></div>'+
 (c.solutionType==="solar"?
 '<div class="ma6a-quick-fields"><h3>Solar project essentials</h3><p>Target capacity, installation and roof information.</p>'+
 projectFields("essential",c)+'</div>'+
 '<details class="ma6a-builder-details"><summary>Site & roof survey</summary>'+projectFields("site",c)+'</details>'+
 '<details class="ma6a-builder-details"><summary>Electricity bill, utility & sanctioned load</summary>'+projectFields("electrical",c)+'</details>'+
 '<details class="ma6a-builder-details"><summary>Engineering, batteries & compliance</summary>'+projectFields("engineering",c)+'</details>':
 '<div class="ma6a-quiet-box">No solar-site details are needed when configuring a single standard product.</div>')+
 '<details class="ma6a-builder-details"><summary>Customer project links & internal ownership</summary><div class="ma6-field-grid">'+
 select("buyerId","Buyer legal company",buyers,c.buyerId,"Not assigned")+
 select("contactId","Customer contact",contactOptions,c.contactId,"Not assigned")+
 select("siteId","Customer site",siteOptions,c.siteId,"Not assigned")+
 select("projectId","Customer project",projectOptions,c.projectId,"Not assigned")+
 select("opportunityId","Source enquiry",enq,c.opportunityId,"Not linked")+
 select("companyId","Our legal entity",companies,c.companyId,"Not assigned")+
 select("branchId","Our branch",branches,c.branchId,"Not assigned")+
 select("ownerId","Responsible employee",users,c.ownerId,"Not assigned")+
 area("notes","Internal project notes",c.notes)+'</div></details>'+
 note('Site inputs are project-specific. The commercial quotation requires an exact buyer and authorized selling entity; technical engineering approval remains separate.');
}
function renderProduct(c,b){
 const p=itemProduct(b.productId)||itemProduct("VAR-009")||products[0];
 const catalogChoices=catalog().variants.filter(v=>v.status==="Active").map(v=>itemProduct(v.id));
 const suggested=new Set(flow.normalized(c.serviceIds||[],true).flatMap(id=>flow.service(id)?.productIds||[]));
 const choices=[...catalogChoices.filter(p=>p?.type!=="service"),...products.filter(p=>p.type!=="service")];
 const filtered=choices.filter(x=>b.productGroup==="all"||(b.productGroup==="solar"&&x.variant&&x.solarKind!=="general")||
 (b.productGroup==="other"&&(!x.variant||x.solarKind==="general"))).filter(x=>
 !b.catalogSearch||[x.name,x.model,x.sku,x.manufacturer,x.capacity].join(" ").toLowerCase().includes(b.catalogSearch.toLowerCase())).sort((a,b)=>Number(suggested.has(b.id))-Number(suggested.has(a.id)));
 const errors=lineErrors({productId:p.id,quantity:b.quantity,options:b.options}),v=p.variant,d=v?.dimensions||{};
 return panel("2 · Select Products & Models","Select an existing manufacturer model, specify quantity and add a project-specific note only when necessary.")+
 '<div class="ma6a-product-picker-toolbar"><div class="ma6-field"><label>Show product type</label><select data-product-group>'+
 opts([["solar","Solar equipment"],["other","Other / standard products"],["all","All products"]],b.productGroup)+
 '</select></div><div class="ma6-field"><label for="cfg-product-search">Find a model or SKU</label>'+
 '<input type="search" id="cfg-product-search" data-product-search value="'+esc(b.catalogSearch)+'" placeholder="Manufacturer, model, rating..."></div></div>'+
 '<div class="ma6a-pick-grid"><div><div class="ma6a-catalog">'+(filtered.length?filtered.map(x=>
 '<button class="ma6-product-card'+(x.id===p.id?' selected':'')+'" type="button" data-product="'+esc(x.id)+'">'+
 '<div><span class="ma6-tag">'+esc(x.variant?catalogFamily(x.variant.familyId)?.name||"Catalog model":typeLabel(x.type))+'</span>'+
 '<strong>'+esc(x.variant?x.displayModel:x.name)+'</strong><small>'+
 esc(x.variant?[x.manufacturer,x.capacity,x.sku].filter(Boolean).join(" · "):x.id+" · "+x.unit)+(suggested.has(x.id)?' · Suggested for service':'')+'</small></div>'+
 '<span class="ma6-tag">Select</span></button>').join(""):
 '<div class="ma6a-empty-note">No approved matching models. Draft products must pass review before use.</div>')+'</div></div>'+
 '<div class="ma6a-spec-editor"><h3>'+esc(v?p.displayModel:p.name)+'</h3>'+
 (v?'<div class="ma6-kvs">'+kv("Manufacturer",p.manufacturer)+kv("Rating",p.capacity)+kv("SKU",p.sku)+
 kv("Dimensions",d.width&&d.height&&d.depth?[d.width,d.height,d.depth].join(" × ")+" "+(d.unit||"mm"):"Not applicable")+'</div>'+
 '<div class="ma6a-quiet-box">'+(v.demoReview?.state==="Enabled for demo"?'<b>Demo-enabled · not verified.</b> Manufacturer technical evidence and approved selling price are still pending. ':"")+'Specifications come from the selected catalog model. Custom changes below apply only to this project.</div>':
 p.type==="config"?'<div class="ma6-field-grid">'+Object.entries(p.options).map(([key,spec])=>
 select("opt-"+key,spec.label,spec.choices.map(([value])=>[value,value]),b.options[key],"Choose option")).join("")+'</div>':
 '<div class="ma6a-quiet-box">Standard item or service: enter quantity. No product attributes to configure.</div>')+
 (v?'<details class="ma6a-builder-details"><summary>Model technical data, warranty &amp; document references</summary>'+
  '<div class="ma6-kvs">'+
  Object.entries(v.categorySpecs||{}).slice(0,20).map(([key,val])=>kv(key,String(val))).join("")+
  Object.entries(v.solar||{}).slice(0,80).map(([key,val])=>{const field=v.specTemplate?.fields?.find(f=>f.key===key)||window.CPQ_PRODUCT_TEMPLATES?.get(p.solarKind)?.fields?.find(f=>f.key===key);return kv(field?field.label+(field.unit?" ("+field.unit+")":""):key,String(val));}).join("")+
  kv("Product warranty",v.warranty?.months!==undefined?v.warranty.months+" months":"Not specified")+
  kv("Guarantee",v.warranty?.guaranteeMonths!==undefined?v.warranty.guaranteeMonths+" months":"Not specified")+
  '</div>'+
  ((v.documents||[]).some(d=>d.status==="Current")?'<div class="cpq-model-snapshot"><h4>Documents (references only)</h4><ul>'+
   v.documents.filter(d=>d.status==="Current").slice(0,20).map(d=>'<li>'+esc(d.name)+' · v'+esc(d.version)+' · '+esc(d.type)+'</li>').join("")+'</ul></div>':
   '<p class="cpq-scope-caption">No current product document references recorded.</p>')+
  ((v.components||[]).length?'<details class="ma6a-builder-details"><summary>Included / optional BOM per unit</summary><ul>'+(v.components||[]).map(c=>{const part=catalog().parts.find(x=>x.id===c.partId);return '<li>'+esc([c.group,part?.name||c.partId,c.qty+" "+(part?.unit||"Nos"),c.role].filter(Boolean).join(" · "))+'</li>';}).join("")+'</ul><small>BOM information only. Components are not added as separate charges.</small></details>':"")+
  '<p class="cpq-scope-caption">Model metadata is captured when added to configuration. No file contents are stored in this demo.</p></details>':"")+
 '<div class="ma6a-field-inline"><div class="ma6-field"><label for="config-add-qty">Quantity *</label>'+
 '<input id="config-add-qty" type="number" min="1" step="1" data-add-qty value="'+esc(b.quantity)+'"></div><span>'+esc(p.unit||"Nos")+'</span></div>'+
 '<details class="ma6a-builder-details"><summary>Project-specific changes & technical notes</summary>'+
 '<div class="ma6-field"><label>Custom dimensions / special specifications for this project</label>'+
 '<textarea data-custom-spec rows="2" placeholder="Example: customer requires custom height (master unchanged)">'+esc(b.customSpec||"")+'</textarea></div>'+
 '<div class="ma6-field"><label>Internal item notes</label><textarea data-item-note rows="2">'+esc(b.itemNote||"")+'</textarea></div></details>'+
 (errors.length?'<div class="ma6-validation">'+errors.map(esc).join("; ")+'</div>':"")+
 '<button class="btn primary" type="button" data-action="add-item">+ Add to Configuration</button></div></div>'+
 '<div class="ma6a-selected-lines"><div class="ma6-section-sub"><h4>Technical items selected ('+c.items.length+')</h4></div>'+itemsCompact(c,true)+'</div>'+
 note('This is a technical selection, not a certified design or priced quotation. Cost, margin, tax and commercial terms are handled in MA-006.');
}
function itemsCompact(c,edit=false){
 return c.items.length?c.items.map((l,i)=>{
  const p=itemProduct(l.productId);return '<div class="ma6a-line-row"><div><h4>'+(i+1)+'. '+esc(p?.name||l.productId)+'</h4><p>'+esc(optionText(l))+'</p>'+(l.note?'<p>'+esc(l.note)+'</p>':'')+(p?.variant?.demoReview?.state==="Enabled for demo"?'<p><b>Demo-enabled model · technical and price verification pending.</b></p>':'')+'</div>'+
  (edit?'<div class="ma6a-line-row-actions"><div class="ma6-field"><label for="config-qty-'+esc(l.id)+'">Qty ('+esc(p?.unit||"unit")+')</label><input class="ma6a-line-qty" id="config-qty-'+esc(l.id)+'" data-line-qty="'+esc(l.id)+'" type="number" min="1" step="1" value="'+esc(l.quantity)+'"></div><button type="button" class="btn" data-remove="'+esc(l.id)+'">Remove</button></div>':
  '<span class="ma6-tag">'+esc(l.quantity)+' '+esc(p?.unit||"unit")+'</span>')+'</div>';
 }).join(""):empty("No items yet. Add the first product in Select & Configure.");
}
function renderComponents(c){
 return panel("3 · Selected items & quantities","Review all selected products and services. Modify quantities without entering prices.")+
 itemsCompact(c,true)+
 '<div class="ma6a-status-note"><span class="ma6a-chip-neutral">'+c.items.length+' selected item(s)</span><p>Configurator selections may be edited in a future line-edit workflow; for this demo, remove and re-add a line to change its options.</p></div>'+
 '<div class="ma6-section-sub"><h4>Need another item?</h4><button type="button" class="btn" data-step="1">Back to product selection</button></div>'+
 note('Component lists are not a generated BOM, purchase requisition or approved engineering drawing. They are the technical inputs that may be mapped into the quotation BOQ.');
}
function renderReview(c){
 const result=review(c),m=result.solar||solarMetrics(c);
 return panel("3 · Review & Save","Check the product list and save this draft. Pricing follows in Quotations.")+
 '<div class="ma6-kvs">'+kv("Configuration name",c.name||"Required")+
 kv("Customer",customer(c.customerId)?.name||"Reusable / not selected")+
 kv("Selected product lines",String(c.items.length))+kv("Selected services / sub-services",String((c.serviceIds||[]).length))+
 kv("Project type",c.solutionType==="solar"?"Solar system":"Single product / other")+
 (c.solutionType==="solar"?kv("Target DC",c.solar?.targetDcKwp?c.solar.targetDcKwp+" kWp":"Not entered")+
 kv("Proposed module DC",m.modules?m.dcKwp.toFixed(2)+" kWp":"Not calculated")+
 kv("Proposed inverter AC",m.acKw?m.acKw.toFixed(2)+" kW":"Not selected")+
 kv("DC / AC Ratio",m.ratio?m.ratio.toFixed(2):"Pending"):"")+
 '</div><div class="ma6-section-sub"><h4>Readiness</h4>'+badge(c)+'</div>'+
 (result.errors.length?result.errors.map(x=>'<div class="ma6a-check-row bad"><span class="ma6a-check-symbol">!</span><div><strong>Complete before quotation handoff</strong><p>'+esc(x)+'</p></div></div>').join(""):
 '<div class="ma6-validation ok">Basic data check passed. You may save a browser-only draft.</div>')+
 '<details class="ma6a-builder-details"><summary>Open engineering / solar checks ('+(result.warnings?.length||0)+')</summary>'+
 (result.warnings||[]).map(w=>'<p>• '+esc(w)+'</p>').join("")+
 '<p>Formal engineering approval, local regulations and price approval are not completed by this wireframe.</p></details>'+
 note('Save means demo draft only. The technical BOQ and selected models can be carried into MA-006, where rates and commercial terms are reviewed separately.');
}
function renderBuilder(){
 if(state.mode!=="builder"||!state.builder)return;
 const b=state.builder,c=b.value;
 $("configuration-register").hidden=true;$("configuration-builder").hidden=false;
 $("config-builder-title").textContent=(b.isNew?"New Configuration":"Edit "+c.id)+" · "+steps[b.step];
 $("config-builder-subtitle").textContent="No selling prices · "+(b.isNew?"New solution":"Editing sample "+c.revision);
 $("config-builder-steps").innerHTML=steps.map((title,i)=>'<button type="button" data-step="'+i+'" class="'+(i===b.step?'active':'')+'" aria-current="'+(i===b.step?'step':'false')+'"><span class="ma6-step-num">'+(i+1)+'</span><span class="ma6-step-label">'+esc(title)+'</span></button>').join("");
 $("config-builder-body").innerHTML=[renderContext,()=>renderProduct(c,b),renderReview][b.step](c);
 $("config-builder-prev").disabled=b.step===0;$("config-builder-next").hidden=b.step===2;$("config-builder-save").hidden=b.step!==2;
 $("config-builder-hint").textContent=b.step===1?"Choose exact catalog models · No rates":b.step===2?"Save draft · Engineering approval remains separate":"All changes are browser-only";
}
function render(){
 if(state.mode==="builder"){renderBuilder();return;}
 if(window.CPQ_SHARED)window.CPQ_SHARED.save("configurations",window.CPQ_MA006A_DATA={configurations:records});
 $("configuration-builder").hidden=true;$("configuration-register").hidden=false;
 renderFilters();renderStats();
 const rows=visible();if(!rows.some(x=>x.id===state.selected))state.selected=rows[0]?.id||"";
 renderList(rows);renderDetail();
}
let toastTimeout=null,focusBefore=null;
function toast(message){
 const el=$("config-toast");el.textContent=message;el.hidden=false;
 if(toastTimeout)clearTimeout(toastTimeout);
 toastTimeout=setTimeout(()=>{el.hidden=true;},3600);
}
function dialog(title,message){
 focusBefore=document.activeElement;$("config-modal-title").textContent=title;$("config-modal-subtitle").textContent="MA-006A · Wireframe only";
 $("config-modal-body").innerHTML='<div class="ma6-note">'+message+'</div>';$("config-overlay").classList.add("open");
 $("config-overlay").setAttribute("aria-hidden","false");$("config-modal-close").focus();
}
function closeDialog(){
 $("config-overlay").classList.remove("open");$("config-overlay").setAttribute("aria-hidden","true");
 if(focusBefore?.isConnected)focusBefore.focus();
}
function save(){
 const b=state.builder;if(!b)return;const c=b.value,r=review(c);
 if(!String(c.name||"").trim()){dialog("Name needed","Enter a configuration name to save this draft.");return;}
 c.updated=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})+" (demo)";
 if(b.isNew){
  const next=Math.max(6,...records.map(x=>Number(x.id.split("-").at(-1))||0))+1;
  c.id="CF-2026-"+String(next).padStart(3,"0");
  records.unshift(clone(c));
 }else{
  const idx=records.findIndex(x=>x.id===c.id);if(idx<0){dialog("Not found","Sample configuration is no longer available.");return;}
  const old=records[idx],previous=clone(old);delete previous.history;
  c.history=[...(old.history||[]),previous];
  c.revision="C"+((Number(old.revision.slice(1))||0)+1);
  records[idx]=clone(c);
 }

 state.selected=c.id;state.tab="overview";state.mode="register";state.builder=null;
 state.company="all";state.branch="all";state.status="all";state.search="";
 render();toast("Configuration "+c.id+" saved (demo only)");
 $("configuration-register").scrollIntoView({block:"start",behavior:"auto"});
}
function addItem(){
 const b=state.builder;if(!b)return;
 const p=itemProduct(b.productId);if(!p)return;
 const line={id:"I"+String(Math.max(0,...b.value.items.map(x=>Number(x.id.replace(/\D/g,""))||0))+1).padStart(2,"0"),
  productId:p.id,variantId:p.variant?.id||"",quantity:Number(b.quantity),
  options:p.type==="config"?{...b.options}:{},customSpec:String(b.customSpec||"").trim().slice(0,500),
  note:String(b.itemNote||"").trim().slice(0,500),modelSnapshot:flow.modelSnapshot(p.id)};
 const errors=lineErrors(line);
 if(errors.length){dialog("Product selection needs correction",errors.map(x=>esc(x)).join("<p>")+"</p>");return;}
 b.value.items.push(line);b.itemNote="";b.customSpec="";b.quantity=1;
 renderBuilder();toast("Catalog model added to configuration (demo)");
}
function updateContext(field,value){
 const b=state.builder;if(!b)return;const c=b.value;
 if(field==="solutionType"){
  c.solutionType=value;c.solar||={};
  b.productGroup=value==="solar"?"solar":"other";setProduct(b,value==="solar"?"VAR-009":products[0].id);
  renderBuilder();return;
 }
 if(field==="customerId"){
  c.customerId=value;c.buyerId="";c.contactId="";c.siteId="";c.projectId="";c.opportunityId="";c.serviceIds=[];c.companyId="";c.branchId="";c.ownerId="";
  const buyers=master.companies.filter(x=>x.customerId===value);
  if(buyers.length===1)c.buyerId=buyers[0].id;
  const links=customer(value)?.links||[],companies=[...new Set(links.map(x=>x.companyId))];
  if(companies.length===1){
   c.companyId=companies[0];
   const branches=[...new Set(links.filter(x=>x.companyId===c.companyId).map(x=>x.branchId))];
   if(branches.length===1)c.branchId=branches[0];
  }
  renderBuilder();return;
 }
 if(field==="buyerId"){c.buyerId=value;c.contactId="";c.siteId="";c.projectId="";c.opportunityId="";c.serviceIds=[];renderBuilder();return;}
 if(field==="opportunityId"){
  c.opportunityId=value;
  const src=opportunity(value);
  c.serviceIds=src&&src.customerId===c.customerId&&src.buyerId===c.buyerId?
   flow.normalized(src.serviceIds||[],true):[];
  renderBuilder();return;
 }
 if(field==="kind"&&value==="Reusable template"){
  c.kind=value;c.customerId="";c.buyerId="";c.contactId="";c.siteId="";c.projectId="";c.opportunityId="";
  renderBuilder();return;
 }
 if(field==="companyId"){c.companyId=value;c.branchId="";c.ownerId="";renderBuilder();return;}
 if(field==="branchId"){c.branchId=value;c.ownerId="";renderBuilder();return;}
 if(field.startsWith("opt-")){b.options[field.slice(4)]=value;renderBuilder();return;}
 c[field]=value;
}
function reset(){state.company="all";state.branch="all";state.search="";state.status="all";render();}
document.addEventListener("click",e=>{
 const t=e.target.closest("[data-select-config],[data-tab],[data-step],[data-product],[data-action],[data-remove],[data-planned]");
 if(!t)return;const d=t.dataset;
 if(d.selectConfig){state.selected=d.selectConfig;state.tab="overview";render();return;}
 if(d.tab){state.tab=d.tab;render();return;}
 if(d.step!==undefined){const step=Number(d.step);if(state.builder&&step>=0&&step<=2){state.builder.step=step;renderBuilder();}return;}
 if(d.product){if(state.builder){setProduct(state.builder,d.product);renderBuilder();}return;}
 if(d.remove){if(state.builder){state.builder.value.items=state.builder.value.items.filter(x=>x.id!==d.remove);renderBuilder();}return;}
 if(d.planned){dialog(esc(d.planned)+" (planned)","Separate administration will manage master product catalogs, technical rules and authorizations. No production changes occur on this page.");return;}
 if(d.action==="add-item"){addItem();return;}
 if(d.action==="edit"){const c=record(state.selected);if(c)newBuilder(c);return;}
 if(d.action==="duplicate"){const c=record(state.selected);if(c)newBuilder(c,true);return;}
});
$("config-builder-body").addEventListener("change",e=>{
 if(!state.builder)return;const t=e.target,b=state.builder;
 if(t.name==="configServiceIds"){
  const selected=new Set(flow.normalized(b.value.serviceIds||[],true));
  if(t.checked)selected.add(t.value);else selected.delete(t.value);
  b.value.serviceIds=flow.normalized([...selected],true);renderBuilder();return;
 }
 if(t.dataset.cField){updateContext(t.dataset.cField,t.value);return;}
 if(t.dataset.solarField!==undefined){
  b.value.solar||={};const value=t.value;
  b.value.solar[t.dataset.solarField]=t.type==="number"&&value!==""?Number(value):value;return;
 }
 if(t.dataset.productGroup!==undefined){
  b.productGroup=t.value;b.catalogSearch="";
  setProduct(b,t.value==="other"?products[0].id:"VAR-009");
  renderBuilder();return;
 }
 if(t.dataset.productSearch!==undefined){b.catalogSearch=t.value;renderBuilder();return;}
 if(t.dataset.addQty!==undefined){b.quantity=Number(t.value);return;}
 if(t.dataset.customSpec!==undefined){b.customSpec=t.value;return;}
 if(t.dataset.itemNote!==undefined){b.itemNote=t.value;return;}
 if(t.dataset.lineQty!==undefined){
  const l=b.value.items.find(x=>x.id===t.dataset.lineQty);
  if(l){l.quantity=Number(t.value);renderBuilder();}
 }
});
$("config-builder-body").addEventListener("input",e=>{
 if(!state.builder)return;const t=e.target,b=state.builder;
 if(t.dataset.cField&&["name","notes"].includes(t.dataset.cField))b.value[t.dataset.cField]=t.value;
 if(t.dataset.solarField!==undefined){
  b.value.solar||={};b.value.solar[t.dataset.solarField]=t.type==="number"&&t.value!==""?Number(t.value):t.value;
 }
 if(t.dataset.itemNote!==undefined)b.itemNote=t.value;
 if(t.dataset.customSpec!==undefined)b.customSpec=t.value;
 if(t.dataset.productSearch!==undefined){
  b.catalogSearch=t.value;
  const cards=$("config-builder-body").querySelectorAll("[data-product]");
  cards.forEach(el=>{el.hidden=!el.textContent.toLowerCase().includes(t.value.toLowerCase());});
 }
});
$("new-configuration").addEventListener("click",()=>newBuilder());
$("config-builder-exit").addEventListener("click",()=>{state.mode="register";state.builder=null;render();$("configuration-register").scrollIntoView({block:"start",behavior:"auto"});});
$("config-builder-prev").addEventListener("click",()=>{if(state.builder){state.builder.step=Math.max(0,state.builder.step-1);renderBuilder();}});
$("config-builder-next").addEventListener("click",()=>{if(state.builder){state.builder.step=Math.min(2,state.builder.step+1);renderBuilder();}});
$("config-builder-save").addEventListener("click",save);
$("cfg-company-filter").addEventListener("change",e=>{state.company=e.target.value;state.branch="all";render();});
$("cfg-branch-filter").addEventListener("change",e=>{state.branch=e.target.value;render();});
$("cfg-status-filter").addEventListener("change",e=>{state.status=e.target.value;render();});
$("cfg-search").addEventListener("input",e=>{state.search=e.target.value;render();});
$("cfg-reset-filters").addEventListener("click",reset);
$("config-modal-close").addEventListener("click",closeDialog);$("config-modal-ok").addEventListener("click",closeDialog);
$("config-overlay").addEventListener("click",e=>{if(e.target===$("config-overlay"))closeDialog();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("config-overlay").classList.contains("open"))closeDialog();});
const params=new URLSearchParams(window.location.search);
const selected=params.get("configuration"),opRef=params.get("opportunity");
if(selected&&record(selected)){state.selected=selected;render();}
else if(opRef&&opportunity(opRef)){
 const o=opportunity(opRef);
 newBuilder();
 const c=state.builder.value;
 Object.assign(c,{kind:"Customer configuration",customerId:o.customerId,buyerId:o.buyerId,opportunityId:o.id,serviceIds:flow.normalized(o.serviceIds||[],true),companyId:o.companyId,branchId:o.branchId,ownerId:o.ownerId,contactId:o.contactId||"",siteId:o.siteId||"",projectId:o.projectId||"",name:"Configuration — "+o.title,notes:"From sample enquiry "+o.id+": "+o.summary});
 renderBuilder();
}else render();
window.CPQ_MA006A={state,records,products,review,record,visible,quotationLink,payload,save,newBuilder,addItem,quickSelectProduct:id=>{if(!state.builder)return;state.builder.productGroup="all";state.builder.catalogSearch="";setProduct(state.builder,id);renderBuilder();}};
})();