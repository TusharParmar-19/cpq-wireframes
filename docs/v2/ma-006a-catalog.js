/* MA-006A — Product Catalog & Configuration Management (browser-only wireframe).
   Product families -> manufacturer/model/SKU variants -> technical specs, physical dimensions,
   reusable parts/accessories and illustrative prices. Never production authorization. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const db=clone(window.CPQ_MA006A_CATALOG);
window.CPQ_MA006A_CATALOG=db;
const tpl=window.CPQ_PRODUCT_TEMPLATES,flow=window.CPQ_FLOW;
tpl.apply(db);
const pim=window.CPQ_MA006A_PRODUCT_INFO;
const state={hub:"products",family:"FAM-005",variant:"VAR-009",tab:"variants",category:"all",manufacturer:"all",status:"all",search:"",editor:null};
const family=id=>db.families.find(x=>x.id===id);
const variant=id=>db.variants.find(x=>x.id===id);
const maker=id=>db.manufacturers.find(x=>x.id===id);
const part=id=>db.parts.find(x=>x.id===id);
const siblings=id=>db.variants.filter(x=>x.familyId===id);
const amount=n=>"₹"+Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:0,maximumFractionDigits:2});
const dimension=d=>{
 if(!d)return "Not supplied";
 const x=[d.length,d.width,d.height,d.depth].filter(v=>v!==""&&v!==null&&v!==undefined);
 if(!x.length)return "Not applicable / not supplied";
 if(d.width&&d.height&&d.depth)return [d.width,d.height,d.depth].join(" × ")+" "+(d.unit||"mm")+" (W × H × D)";
 if(d.length&&d.width&&d.height)return [d.length,d.width,d.height].join(" × ")+" "+(d.unit||"mm")+" (L × W × H)";
 return x.join(" × ")+" "+(d.unit||"mm");
};
const badge=s=>'<span class="ma6a-flag '+esc(String(s||"").toLowerCase().replace(/ /g,"-"))+'">'+esc(s||"Draft")+'</span>';
/* Browser-demo model review never represents real technical or price approval. */
const demoEnabled=v=>v?.status==="Active"&&v?.demoReview?.state==="Enabled for demo";
function demoIssues(v){
 const f=family(v.familyId),issues=tpl.missing(f?.solarKind||"general",v).map(x=>"Required specification missing: "+x);
 if(f?.solarKind==="inverter"){
  if(!(Number(v.solar?.ratedAcKw)>0))issues.push("Rated AC output not defined");
  if(!(Number(v.solar?.maxPvInputKwp)>0))issues.push("Supported PV input not verified");
  if(!(Number(v.solar?.maxDcVoltage)>0))issues.push("Maximum DC voltage not verified");
  if(!(Number(v.solar?.mpptMinV)>0)||!(Number(v.solar?.mpptMaxV)>0))issues.push("MPPT voltage range not verified");
 }
 if(!String(v.datasheet||"").trim()||/pending|not attached/i.test(v.datasheet))issues.push("Manufacturer datasheet missing");
 if(f?.solarKind&&!["general","mounting","bos"].includes(f.solarKind)&&(!String(v.solar?.certifications||"").trim()||/demo|not verified|pending/i.test(v.solar?.certifications||"")))issues.push("Certifications not verified");
 if(!(Number(v.price?.sell)>0))issues.push("Selling price unverified (₹0)");
 return issues;
}
const modelBadge=v=>badge(v.status)+(demoEnabled(v)?'<span class="ma6a-flag ma6a-demo-only">Demo-enabled · unverified</span>':"");
function modelReviewPanel(v){
 if(!v||(!["Draft","In Review"].includes(v.status)&&!demoEnabled(v)))return "";
 const warnings=demoIssues(v),events=v.demoReview?.events||[],enabled=demoEnabled(v);
 const next=v.status==="Draft"?'<button type="button" class="btn" data-catalog-action="demo-submit-review">Start Demo Review</button>':
 v.status==="In Review"?'<button type="button" class="btn primary" data-catalog-action="demo-enable-model">Enable for Demo Testing</button>':
 '<button type="button" class="btn" data-catalog-action="demo-revoke-model">Return to Draft</button>';
 return '<section class="ma6a-model-review" aria-label="Model review for browser demo">'+
 '<div class="ma6a-model-review-head"><h4>Model review · browser demo only</h4><span class="ma6a-flag">'+esc(enabled?"Enabled for demo":v.status)+'</span></div>'+
 '<p>This simulated lifecycle is NOT an authenticated technical approval, product certification, permission grant or approved selling price. '+(enabled?"Selectable in demo configuration only.":"Draft/In Review models cannot be used in configuration.")+'</p>'+
 '<div class="ma6a-model-review-warning"><b>Unverified information ('+warnings.length+')</b>'+
 (warnings.length?'<ul>'+warnings.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>':'<p>Basic fields are filled, but production engineering and pricing approval remain separate.</p>')+'</div>'+
 (events.length?'<details class="ma6a-editor-details"><summary>Demo lifecycle history ('+events.length+')</summary><ul>'+events.map(x=>'<li>'+esc(x.at+" · "+x.action)+'</li>').join("")+'</ul></details>':"")+
 '<div class="ma6a-model-review-actions">'+next+'</div></section>';
}
function applyDemoReview(action){
 const v=variant(state.variant);if(!v)return;
 const events=[...(v.demoReview?.events||[])],at=new Date().toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"});
 if(action==="demo-submit-review"){
  if(v.status!=="Draft")return;
  v.status="In Review";events.push({action:"Submitted for simulated catalog review",at,actor:"Demo operator"});
  v.demoReview={state:"In Review",events};
 }else if(action==="demo-enable-model"){
  if(v.status!=="In Review"||v.demoReview?.state!=="In Review")return;
  const f=family(v.familyId),m=maker(v.manufacturerId);
  if(!f||f.status!=="Active"||(v.manufacturerId&&m?.status!=="Active")){window.alert("Use an Active product group and manufacturer for this demo review.");return;}
  if(f.solarKind==="inverter"&&!(Number(v.solar?.ratedAcKw)>0)){window.alert("Enter a positive rated AC output before enabling an inverter for the demo.");return;}
  const required=tpl.missing(f.solarKind||"general",v);if(required.length){window.alert("Complete required specification fields first: "+required.join(", "));return;}
  const warnings=demoIssues(v);
  if(!window.confirm("DEMO ONLY: Enable "+flow.variantLabel(v)+" for browser configuration testing?\n\nThis is NOT engineering approval, supplier verification, pricing approval or authorization to issue a real quote.\n\nUnverified: "+(warnings.join("; ")||"Production certification and approval")+"\n\nContinue with simulated eligibility?"))return;
  v.status="Active";events.push({action:"Enabled for browser demo ONLY; unverified details retained",at,actor:"Demo operator"});
  v.demoReview={state:"Enabled for demo",events,unverified:warnings};
 }else if(action==="demo-revoke-model"){
  if(!demoEnabled(v)||!window.confirm("Return this demo-enabled model to Draft? Existing configurations referencing it will require changes."))return;
  v.status="Draft";events.push({action:"Returned to Draft; demo eligibility revoked",at,actor:"Demo operator"});
  v.demoReview={state:"Returned to Draft",events};
 }else return;
 state.status="all";renderCatalog();
}

const kv=(key,value)=>'<div class="ma6-kv"><small>'+esc(key)+'</small><strong>'+esc(value===0?value:(value||"Not supplied"))+'</strong></div>';
const note=html=>'<div class="ma6-note">'+html+'</div>';
const panel=(title,desc)=>'<div class="ma6-panel-head"><div><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p></div></div>';
const selectOptions=(items,selected)=>items.map(([id,label])=>'<option value="'+esc(id)+'"'+(String(id)===String(selected)?' selected':'')+'>'+esc(label)+'</option>').join("");
function idNext(prefix,collection){
 const next=Math.max(0,...collection.map(x=>Number(String(x.id).replace(/[^0-9]/g,""))||0))+1;
 return prefix+String(next).padStart(3,"0");
}
function visibleFamilies(){
 const search=state.search.trim().toLowerCase();
 return db.families.filter(f=>{
  if(state.category!=="all"&&f.category!==state.category)return false;
  if(state.status!=="all"&&f.status!==state.status&&!siblings(f.id).some(v=>v.status===state.status))return false;
  if(state.manufacturer!=="all"&&!siblings(f.id).some(v=>v.manufacturerId===state.manufacturer))return false;
  if(!search)return true;
  const flat=[f.id,f.name,f.category,f.rating,f.description,f.attributes,
   ...siblings(f.id).flatMap(v=>[v.id,v.sku,v.model,v.variant,v.capacity,maker(v.manufacturerId)?.name,maker(v.manufacturerId)?.brand])]
   .join(" ").toLowerCase();
  return flat.includes(search);
 });
}
function familyVariants(f){
 if(!f)return [];
 return siblings(f.id).filter(v=>{
  if(state.manufacturer!=="all"&&v.manufacturerId!==state.manufacturer)return false;
  if(state.status!=="all"&&v.status!==state.status)return false;
  return true;
 });
}
function renderHub(){
 for(const b of $("catalog-workspace-tabs").querySelectorAll("[data-hub]")){
  const active=b.dataset.hub===state.hub;b.classList.toggle("active",active);
  b.setAttribute("aria-current",active?"page":"false");
 }
 const catalog=state.hub!=="configurations";
 const masterMenu=$("catalog-manage-menu");if(masterMenu)masterMenu.classList.toggle("active",state.hub==="manufacturers"||state.hub==="parts");
 $("catalog-screen").hidden=!catalog;
 $("configuration-screen").hidden=catalog;
 $("catalog-products-panel").hidden=state.hub!=="products";
 $("catalog-manufacturers-panel").hidden=state.hub!=="manufacturers";
 $("catalog-parts-panel").hidden=state.hub!=="parts";
 const add=$("catalog-add-product");if(add)add.hidden=!catalog;
}
function setHub(hub){
 if(!["products","manufacturers","parts","configurations"].includes(hub))return;
 state.hub=hub;
 const menu=$("catalog-manage-menu");if(menu)menu.open=false;
 renderHub();
 if(hub!=="configurations")renderCatalog();
}
function renderStats(){
 const text=[["Product Groups",db.families.length],["Models",db.variants.length],["Manufacturers",db.manufacturers.length],["Parts",db.parts.length]];
 $("catalog-stats").innerHTML='<div class="ma6a-compact-stats">'+text.map(([name,n])=>
 '<span><b>'+n+'</b> '+esc(name)+'</span>').join("")+'</div>';
}
function renderFilterControls(){
 $("catalog-category").innerHTML='<option value="all">All categories</option>'+selectOptions(db.categories.map(x=>[x,x]),state.category);
 $("catalog-manufacturer").innerHTML='<option value="all">All manufacturers</option>'+selectOptions(db.manufacturers.map(x=>[x.id,x.name]),state.manufacturer);
 $("catalog-category").value=state.category;
 $("catalog-manufacturer").value=state.manufacturer;
 $("catalog-status").value=state.status;
 $("catalog-search").value=state.search;
}
function renderFamilyList(rows){
 $("catalog-count").textContent=rows.length+" shown";
 $("catalog-families").innerHTML=rows.length?rows.map(f=>
 '<button type="button" data-family="'+esc(f.id)+'" class="ma6a-family-card'+(f.id===state.family?' active':'')+'" aria-pressed="'+String(f.id===state.family)+'">'+
 '<div class="ma6a-row"><span class="ma6-tag">'+esc(f.id)+'</span>'+badge(f.status)+'</div>'+
 '<strong>'+esc(f.name)+'</strong><small>'+esc(f.category)+' · '+esc(f.unit)+'</small>'+
 '<div class="ma6a-row" style="margin-top:8px"><small>'+siblings(f.id).length+' manufacturer/model variant(s)</small><span class="ma6a-color-quiet">Open</span></div></button>').join(""):
 '<div class="ma6a-empty-note">No products match. Reset filters or add a new product.</div>';
}
function renderFamilyHeader(f){
 $("catalog-family-header").innerHTML='<div class="ma6-detail-top"><div><small>'+esc(f.id)+' · '+esc(f.category)+'</small><h2>'+esc(f.name)+'</h2>'+
 '<p>'+esc(f.rating)+' · '+esc(f.type==="config"?"Configurable product":f.type==="service"?"Service":"Standard product")+' · Unit '+esc(f.unit)+'</p></div>'+
 '<div class="ma6-detail-actions">'+badge(f.status)+
 '<button type="button" class="btn" data-catalog-action="edit-family">Edit Product Group</button>'+
 '<button type="button" class="btn primary" data-catalog-action="add-variant">+ Add Another Model</button></div></div>'+
 '<div class="ma6-quote-meta"><span class="ma6-tag">'+siblings(f.id).length+' model(s)</span><span class="ma6-tag">One group / multiple manufacturers</span>'+
 '<span class="ma6-tag">Catalog master</span></div>'+
 '<div class="ma6-banner">'+esc(f.description)+'</div>';
}
function variantCard(v){
 const m=maker(v.manufacturerId);
 return '<button type="button" data-variant="'+esc(v.id)+'" class="ma6a-variant-card'+(state.variant===v.id?' selected':'')+'" aria-pressed="'+String(state.variant===v.id)+'">'+
 '<div class="ma6a-row"><span class="ma6-tag">'+esc(v.sku)+'</span>'+modelBadge(v)+'</div>'+
 '<h4>'+esc(flow.manufacturerLabel(v,m))+'</h4>'+
 '<p><b>'+esc(flow.variantLabel(v))+'</b>'+(v.model&&v.variant&&v.variant!==v.model?' · '+esc(v.variant):"")+'</p>'+
 '<div class="ma6a-big-rating">'+esc(v.capacity||"Rating not supplied")+'</div>'+
 '<p>Dimensions: '+esc(dimension(v.dimensions))+'</p>'+
 '<div class="ma6a-card-foot"><span>'+esc(v.enclosure||v.mounting||"Details")+'</span><b>'+amount(v.price?.sell)+'</b></div></button>';
}
function selectedVariant(v){
 if(!v)return '<div class="ma6a-empty-note">Select a manufacturer/model variant above.</div>';
 const m=maker(v.manufacturerId),d=v.dimensions||{};
 return '<div class="ma6a-selected-variant"><div class="ma6a-selected-variant-head"><div><h4>'+esc(flow.variantLabel(v))+'</h4>'+
 '<p>'+esc(v.sku)+' · '+esc(flow.manufacturerLabel(v,m))+'</p><div class="ma6a-variant-badges">'+modelBadge(v)+'</div></div>'+
 '<div class="ma6-detail-actions"><button type="button" class="btn" data-catalog-tab="more">View Full Details</button>'+
 '<button type="button" class="btn" data-catalog-tab="documents">Documents &amp; Warranty</button>'+
 '<button type="button" class="btn primary" data-catalog-action="edit-variant">Edit Model</button></div></div>'+
 '<div class="ma6-kvs">'+kv("Manufacturer",flow.manufacturerLabel(v,m))+kv("Manufacturer model number",v.model||"Not supplied")+kv("Manufacturer part number",v.manufacturerPartNo||"Not supplied")+
 kv("Capacity / Rating",v.capacity)+kv("Dimensions",dimension(d))+
 kv("Sample Unit Selling Price",amount(v.price?.sell))+'</div>'+
 '<p class="ma6a-compact-help">Electrical specs, compliance, detailed dimensions, parts and prices are available under <b>More Product Details</b>.</p></div>';
}
function renderVariants(f,v){
 const rows=familyVariants(f);
 return panel("Manufacturer & Model Variants","Compare products with the same general rating but different brands, dimensions, features and sample selling prices.")+
 '<div class="ma6a-variant-comparison">'+(rows.length?rows.map(variantCard).join(""):'<div class="ma6a-empty-note">No variants match the manufacturer / status filters.</div>')+'</div>'+
 (rows.length?selectedVariant(v)+modelReviewPanel(v):"")+
 note('<b>Important distinction:</b> A product family is not one fixed item. Each manufacturer/model/SKU is a separate sellable variant with its own physical dimensions, technical attributes and price-list entry. These are demo examples, not verified engineering specifications.');
}
function renderSpecs(f,v){
 const rows=familyVariants(f);
 const items=rows.length?rows:[...siblings(f.id)];
 const tech=v?.technical||[];
 return panel("Technical details & physical dimensions","Length, width, height, depth, weight and custom specification fields are maintained per model.")+
 '<div class="ma6a-family-overview"><p><b>Product family:</b> '+esc(f.name)+'</p><p><b>Configurable attributes to maintain:</b> '+esc(f.attributes||"To be defined")+'</p></div>'+
 '<div class="ma6a-section-heading"><h3>Compare model dimensions</h3><button type="button" class="btn" data-catalog-action="edit-variant">Edit selected model</button></div>'+
 '<div class="ma6a-details-table"><table><thead><tr><th>Model / Manufacturer</th><th>Rating</th><th>Length</th><th>Width</th><th>Height</th><th>Depth</th><th>Weight</th></tr></thead><tbody>'+
 items.map(item=>{const d=item.dimensions||{};return '<tr><td>'+esc(flow.variantLabel(item))+'<small>'+esc(flow.manufacturerLabel(item,maker(item.manufacturerId)))+'</small></td><td>'+esc(item.capacity||"—")+'</td>'+
 [d.length,d.width,d.height,d.depth].map(n=>'<td>'+esc(n===""||n==null?"—":n+" "+(d.unit||"mm"))+'</td>').join("")+
 '<td>'+esc(d.weight?d.weight+" "+(d.weightUnit||"kg"):"—")+'</td></tr>';}).join("")+
 '</tbody></table></div>'+
 '<div class="ma6a-section-heading"><h3>Selected model: '+esc(v?flow.variantLabel(v):"Not selected")+'</h3></div>'+
 (tech.length?'<div class="ma6-kvs">'+tech.map(t=>kv(t.name,t.value)).join("")+'</div>':
 '<div class="ma6a-empty-note">Select a variant to review its technical attributes.</div>')+
 note('Different product categories require different attributes. Electrical panels, cables, PV modules and services should not all be forced into the same fixed dimensions or technical fields. Actual validation and compatibility rules need authorized catalog administration.');
}
function renderParts(f,v){
 const components=v?.components||[];
 return panel("Components, parts & accessories","Associate required and optional parts with each manufacturer model.")+
 '<div class="ma6a-section-heading"><h3>Selected model: '+esc(v?flow.variantLabel(v):"None")+'</h3><button class="btn" type="button" data-catalog-action="edit-variant">Edit part assignment</button></div>'+
 (components.length?'<div class="ma6a-details-table"><table><thead><tr><th>BOM group</th><th>Part code</th><th>Part / Accessory</th><th>Qty / unit</th><th>Requirement</th><th>Manufacturer</th></tr></thead><tbody>'+
 components.map(item=>{const p=part(item.partId);return '<tr><td>'+esc(item.group||"—")+'</td><td>'+esc(p?.code||item.partId)+'</td><td>'+esc(p?.name||"Unlisted part")+'</td><td>'+esc(item.qty+" "+(p?.unit||"Nos"))+'</td><td>'+esc(item.role)+'</td><td>'+esc(maker(p?.manufacturerId)?.brand||"Not assigned")+'</td></tr>';}).join("")+
 '</tbody></table></div>':'<div class="ma6a-empty-note">No reusable components assigned to this variant. Service and standard products may require none.</div>')+
 '<div class="ma6a-section-heading"><h3>Master parts library</h3><button class="btn" type="button" data-hub="parts">Manage Parts &amp; Accessories</button></div>'+
 '<div class="ma6a-list-inline">'+db.parts.map(p=>'<span class="ma6a-flag">'+esc(p.code)+'</span>').join("")+'</div>'+
 note('Part quantity and "Required / Optional" are descriptive placeholders. A real configurator also needs approved dependency rules, substitutions, BOM versions, stock/sourcing evidence and technical sign-off. None of these are approved here.');
}
function renderPrices(f,v){
 const rows=familyVariants(f);
 return panel("Prices, documents & revisions","Price list is associated with the exact SKU/model. Effective dates, document references and approval status must be controlled.")+
 (rows.length?'<div class="ma6a-details-table"><table><thead><tr><th>SKU / Model</th><th>Manufacturer</th><th>Price List</th><th>Selling Price (demo)</th><th>Internal Cost (demo)</th><th>Effective From</th></tr></thead><tbody>'+
 rows.map(x=>'<tr><td>'+esc(x.sku)+'<small>'+esc(flow.variantLabel(x))+'</small></td><td>'+esc(flow.manufacturerLabel(x,maker(x.manufacturerId)))+'</td><td>'+esc(x.price?.list||"Not assigned")+'</td><td>'+amount(x.price?.sell)+'</td><td>'+amount(x.price?.cost)+'</td><td>'+esc(x.price?.from||"Not supplied")+'</td></tr>').join("")+
 '</tbody></table></div>':'<div class="ma6a-empty-note">No variants match the filters.</div>')+
 '<div class="ma6a-section-heading"><h3>Document references — '+esc(v?flow.variantLabel(v):"No model selected")+'</h3><button class="btn" type="button" data-catalog-action="edit-variant">Edit prices &amp; files</button></div>'+
 '<div class="ma6-kvs">'+kv("Datasheet",v?.datasheet)+kv("Drawing",v?.drawing)+kv("Price-list validity",v?.price?.from?(v.price.from+" to "+(v.price.to||"open end")):"Not supplied")+
 kv("Sample currency",v?.price?.currency)+kv("Lifecycle",v?.status)+kv("Model notes",v?.notes)+'</div>'+
 note('<b>Pricing protection:</b> All costs/prices shown are fictional. Real vendor cost and margin require separate MA-003 grants. Real prices need approval, branch/company price lists, effective dates, currency and tax treatment. The quotation must freeze the price and specifications actually offered; later master edits must not silently rewrite issued quotations.');
}
function renderDetails(){
 const f=family(state.family);
 if(!f){$("catalog-family-header").innerHTML='<div class="ma6a-empty-note">Select a product family.</div>';$("catalog-family-body").innerHTML="";return;}
 const rows=familyVariants(f);
 if(!rows.some(x=>x.id===state.variant))state.variant=rows[0]?.id||"";
 const v=variant(state.variant);
 renderFamilyHeader(f);
 for(const btn of $("catalog-detail-tabs").querySelectorAll("[data-catalog-tab]")){
  const active=btn.dataset.catalogTab===state.tab;btn.classList.toggle("active",active);btn.setAttribute("aria-selected",String(active));
 }
 if(state.tab==="documents"){
  $("catalog-family-body").innerHTML=panel("Product Documents & Warranty","Model-specific documents, warranties and edit history.")+
   pim.renderDocuments(v,window.CPQ_SERVICE_MASTER?.services||[]);
 }else if(state.tab==="more"){
  const schema=solarKindSchema(f.solarKind||"general");
  const val=v?.solar||{},all=schema?[...schema.essential,...schema.advanced]:[];
  const entered=all.filter(([key])=>val[key]!==undefined&&val[key]!==null&&String(val[key]).trim()!=="");
  const missing=all.filter(([key])=>val[key]===undefined||val[key]===null||String(val[key]).trim()==="");
  const present=entered.length?'<div class="ma6-kvs">'+entered.map(([key,label,unit])=>kv(label+(unit?" ("+unit+")":""),val[key])).join("")+'</div>':
   '<div class="ma6a-empty-note">No template-specific technical values added yet. Edit Model to enter them.</div>';
  const solarInfo=all.length?
    '<div class="ma6a-selected-variant"><h4>'+esc(schema.label)+' · '+entered.length+' technical values entered</h4>'+present+
    (missing.length?'<details class="ma6a-editor-details"><summary>Missing values for technical review ('+missing.length+')</summary>'+
    '<div class="ma6a-list-inline">'+missing.map(([,label])=>'<span class="ma6a-flag">'+esc(label)+'</span>').join("")+'</div></details>':"")+'</div>':"";
  $("catalog-family-body").innerHTML=panel("Product Details","Only information needed for this product is shown. Other technical and commercial sections stay available.")+
   (all.length?'<details class="ma6a-view-details"><summary>Technical specifications · '+entered.length+' values entered</summary>'+solarInfo+'</details>':"")+
   (pim.categorySummary(f,v)?'<details class="ma6a-view-details"><summary>Category-specific technical specifications</summary>'+
    '<div class="ma6a-pim-summary"><h4>Model-specific values</h4>'+pim.categorySummary(f,v)+'</div></details>':"")+
   '<details class="ma6a-view-details"><summary>Dimensions & model comparison</summary>'+renderSpecs(f,v)+'</details>'+
   '<details class="ma6a-view-details"><summary>Parts & accessories</summary>'+renderParts(f,v)+'</details>'+
   '<details class="ma6a-view-details"><summary>Pricing and legacy document references</summary>'+renderPrices(f,v)+'</details>'+
   '<details class="ma6a-view-details"><summary>Warranty &amp; guarantee</summary>'+pim.warrantySummary(v)+'</details>'+
   '<div class="ma6a-pim-summary"><b>Documents and version history</b><p class="muted">Open Documents &amp; Warranty to record file metadata and versions. Actual files are not stored in this wireframe.</p>'+
   '<button type="button" class="btn" data-catalog-tab="documents">Manage Documents &amp; Warranty</button></div>'+modelReviewPanel(v);
 }else{
  $("catalog-family-body").innerHTML=renderVariants(f,v);
 }
}
function renderManufacturers(){
 $("catalog-manufacturer-list").innerHTML=db.manufacturers.map(m=>{
  const matches=db.variants.filter(v=>v.manufacturerId===m.id);
  return '<div class="ma6a-directory-card"><div class="ma6a-list-inline"><span class="ma6-tag">'+esc(m.id)+'</span>'+badge(m.status)+'</div>'+
  '<h3>'+esc(m.name)+'</h3><p>Brand: '+esc(m.brand||"Not assigned")+' · Country: '+esc(m.country||"Not supplied")+'</p>'+
  '<p>'+matches.length+' product variant(s) · '+esc(m.notes||"")+'</p>'+
  '<div class="ma6a-directory-foot"><small class="ma6a-color-quiet">Manufacturer, not our selling company</small><button class="btn" type="button" data-catalog-action="edit-manufacturer" data-maker-id="'+esc(m.id)+'">Edit Manufacturer</button></div></div>';
 }).join("");
}
function renderPartLibrary(){
 $("catalog-part-list").innerHTML=db.parts.map(p=>{
  const count=db.variants.filter(v=>(v.components||[]).some(c=>c.partId===p.id)).length;
  return '<div class="ma6a-directory-card"><div class="ma6a-list-inline"><span class="ma6-tag">'+esc(p.kind)+'</span>'+badge(p.status)+'</div>'+
  '<h3>'+esc(p.name)+'</h3><p>'+esc(p.code)+' · '+esc(p.unit)+' · '+esc(maker(p.manufacturerId)?.brand||"No manufacturer")+'</p>'+
  '<p>'+esc(p.spec)+' · Sample rate '+amount(p.sellPrice)+'</p>'+
  '<div class="ma6a-directory-foot"><small class="ma6a-color-quiet">Used by '+count+' variant(s)</small><button class="btn" type="button" data-catalog-action="edit-part" data-part-id="'+esc(p.id)+'">Edit Part</button></div></div>';
 }).join("");
}
function renderCatalog(){
 tpl.apply(db);
 if(window.CPQ_SHARED)window.CPQ_SHARED.save("catalog",db);
 renderHub();renderStats();
 if(state.hub==="products"){
  renderFilterControls();
  const rows=visibleFamilies();if(!rows.some(x=>x.id===state.family))state.family=rows[0]?.id||"";
  renderFamilyList(rows);renderDetails();
 }else if(state.hub==="manufacturers")renderManufacturers();
 else if(state.hub==="parts")renderPartLibrary();
}
const textField=(name,label,value="",type="text",full=false,required=false)=>'<div class="ma6-field'+(full?' full':'')+'"><label for="cat-'+esc(name)+'">'+esc(label)+(required?' *':'')+'</label><input id="cat-'+esc(name)+'" name="'+esc(name)+'" type="'+esc(type)+'" value="'+esc(value)+'"'+(required?' required':'')+'></div>';
const numberField=(name,label,value="",full=false)=>textField(name,label,value,"number",full);
const areaField=(name,label,value="",full=true)=>'<div class="ma6-field'+(full?' full':'')+'"><label for="cat-'+esc(name)+'">'+esc(label)+'</label><textarea name="'+esc(name)+'" id="cat-'+esc(name)+'" rows="3">'+esc(value)+'</textarea></div>';
const selectField=(name,label,values,current="",blank="Choose...",required=false)=>'<div class="ma6-field"><label for="cat-'+esc(name)+'">'+esc(label)+(required?' *':'')+'</label><select name="'+esc(name)+'" id="cat-'+esc(name)+'"><option value="">'+esc(blank)+'</option>'+selectOptions(values,current)+'</select></div>';
const section=(title,desc)=>'<div class="ma6a-editor-section"><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p></div>';
const group=(inner,three=false)=>'<div class="ma6-field-grid'+(three?' three':'')+'">'+inner+'</div>';
const details=(title,inner,open=false)=>'<details class="ma6a-editor-details"'+(open?' open':'')+'><summary>'+esc(title)+'</summary>'+inner+'</details>';
const statuses=["Draft","In Review","Active","Discontinued"];
const familyTypes=[["config","Configurable product"],["standard","Standard catalog product"],["service","Service / EPC"]];

function solarKindSchema(kind){return window.CPQ_MA006A_SOLAR_FIELDS?.templates?.[kind]||window.CPQ_MA006A_SOLAR_FIELDS?.templates?.general;}
function solarField(field,record={}){
 const [key,label,unit,type,choices,required]=field,name="solar_"+key,value=record[key]??"";
 const title=esc(label)+(unit?' <small>('+esc(unit)+')</small>':'')+(required?' <small>· Required before review</small>':'');
 if(type==="select")return '<div class="ma6-field"><label for="cat-'+name+'">'+title+'</label><select id="cat-'+name+'" name="'+name+'"><option value="">Select if applicable</option>'+selectOptions(choices.split(";").map(v=>[v,v]),value)+'</select></div>';
 return '<div class="ma6-field"><label for="cat-'+name+'">'+title+'</label><input id="cat-'+name+'" name="'+name+'" type="'+(type==="number"?"number":"text")+'"'+(type==="number"?' step="any"':'')+' value="'+esc(value)+'" placeholder="Optional until verified"></div>';
}
function solarFields(kind,values={}){
 const schema=solarKindSchema(kind);
 if(!schema||(!schema.essential.length&&!schema.advanced.length))return '<div class="ma6a-editor-section-note">General product: use Additional Technical Attributes below. Solar-specific fields appear when you select a solar equipment template.</div>';
 return details(schema.label+" — essential specifications",'<div class="ma6a-field-hint">Only enter verified datasheet values. Missing engineering data stays incomplete, not assumed.</div>'+group(schema.essential.map(f=>solarField(f,values)).join("")),true)+
 details("Advanced technical specifications & compliance",group(schema.advanced.map(f=>solarField(f,values)).join(""))+
 '<div class="ma6a-editor-section-note">IEC/BIS/ALMM/DCR applicability depends on the equipment and project. Record evidence rather than assuming approval.</div>');
}
function solarDataFromForm(form,kind,old={}){
 const schema=solarKindSchema(kind),out={...old};
 if(!schema)return out;
 for(const [key,label,unit,type,choices] of [...schema.essential,...schema.advanced]){
  const raw=trim(form,"solar_"+key);
  if(raw===""){delete out[key];continue;}
  if(type==="number"){const value=Number(raw);if(!Number.isFinite(value)||Math.abs(value)>1e10)throw Error("Enter a valid value for "+label);out[key]=value;}
  else {if(type==="select"&&!String(choices||"").split(";").includes(raw)&&old[key]!==raw)throw Error("Choose a valid "+label);out[key]=raw.slice(0,400);}
 }
 return out;
}
function familyFields(f={}){
 const typeOptions=window.CPQ_MA006A_SOLAR_FIELDS.types.filter(([id])=>id!=="service"||f.solarKind==="service");
 const types=familyTypes.filter(([id])=>id!=="service"||f.type==="service");
 return section("1 · Product Basics","Start with the product name, category and equipment type. The technical fields below will adapt automatically.")+
 group(textField("familyName","Product Family / Name",f.name,"text",false,true)+
 selectField("familyCategory","Category",db.categories.map(x=>[x,x]),f.category||"Solar Equipment","Choose category",true)+
 selectField("solarKind","Product Specification Template",typeOptions,f.solarKind||state.editor?.solarKind||"general","Select template")+
 selectField("familyType","Product Type",types,f.type||"standard","Choose type",true))+
 details("More family details",group(textField("familyUnit","Default Unit of Measure",f.unit||"Nos")+
 textField("familyRating","General Rating / Size",f.rating||"")+
 selectField("familyStatus","Lifecycle Status",statuses.map(x=>[x,x]),f.status||"Draft")+
 areaField("familyDescription","Description",f.description||"")+
 areaField("familyAttributes","Configurable attribute names",f.attributes||"")));
}
function techToText(items){return (items||[]).map(x=>x.name+": "+x.value).join("\n");}
function partsPicker(v={}){
 return '<div class="ma6a-parts-picker">'+db.parts.map(p=>{
  const x=(v.components||[]).find(c=>c.partId===p.id);
  return '<div class="ma6a-part-choice"><label><input type="checkbox" name="linkedPart" value="'+esc(p.id)+'"'+(x?' checked':'')+'> '+esc(p.name)+'</label>'+
  '<input type="number" name="qty_'+esc(p.id)+'" value="'+esc(x?.qty||1)+'" min="1" step="1" aria-label="Part quantity '+esc(p.name)+'">'+
  '<select name="role_'+esc(p.id)+'" aria-label="Part requirement '+esc(p.name)+'">'+selectOptions([["Required","Required"],["Optional","Optional"]],x?.role||"Required")+'</select><input name="group_'+esc(p.id)+'" value="'+esc(x?.group||"")+'" placeholder="BOM group (optional, e.g. Armour Earth Arrangement)" maxlength="100" aria-label="BOM group for '+esc(p.name)+'"></div>';
 }).join("")+'</div>';
}
function variantFields(v={},f={}){
 const d=v.dimensions||{},p=v.price||{},kind=f.solarKind||state.editor?.solarKind||"general";
 return section("2 · Exact Manufacturer Model","Every model has its own SKU and dimensions. Add a second manufacturer as a separate variant.")+
 group('<div class="ma6-field"><label for="cat-sku">Internal SKU / Product Code</label><input id="cat-sku" name="sku" maxlength="80" value="'+esc(v.sku||"")+'"'+(v.id?' readonly':' placeholder="Auto-generated on save (or enter existing code)"')+'><small class="cpq-identity-help">'+(v.id?"Existing code retained.":"Leave blank to generate a unique PRD code. Existing company codes may be entered manually.")+'</small></div>'+
 selectField("manufacturerId","Manufacturer / Brand",[...db.manufacturers.map(m=>[m.id,m.name+" · "+m.brand]),["__generic__","Unbranded / Generic"],["__inhouse__","In-house assembled"],["__unknown__","Manufacturer not yet known"]],v.manufacturerId||(v.manufacturerSource==="generic"?"__generic__":v.manufacturerSource==="inhouse"?"__inhouse__":v.id?"__unknown__":""),"Choose manufacturer or source")+
 textField("model","Manufacturer Model Number"+(tpl.get(kind)?.modelRequired?" (required)":" (optional)"),v.model||"","text",false,!!tpl.get(kind)?.modelRequired)+
 textField("manufacturerPartNo","Manufacturer Part Number (optional)",v.manufacturerPartNo||"")+
 textField("variantName","Variant / Size Description (optional)",v.variant||"")+
 textField("capacity","Capacity / Main Rating",v.capacity||"")+
 selectField("variantStatus","Model Status",statuses.map(x=>[x,x]),v.status||"Draft"))+
 '<div id="catalog-solar-fields">'+solarFields(kind,v.solar||{})+'</div>'+
 '<div id="catalog-category-spec-fields">'+pim.categoryFields(f,v)+'</div>'+
 details("Physical dimensions, weight & mounting",
 group(selectField("dimensionUnit","Dimensions Unit",[["mm","mm"],["cm","cm"],["m","m"],["in","in"]],d.unit||"mm")+
 numberField("dimLength","Length",d.length)+numberField("dimWidth","Width",d.width)+
 numberField("dimHeight","Height",d.height)+numberField("dimDepth","Depth",d.depth)+
 numberField("weight","Weight",d.weight)+selectField("weightUnit","Weight Unit",[["kg","kg"],["g","g"],["lb","lb"]],d.weightUnit||"kg"),true)+
 group(textField("voltage","Supply / Voltage",v.voltage||"")+
 textField("mounting","Mounting / Installation",v.mounting||"")+
 textField("material","Material / Construction",v.material||"")+
 textField("enclosure","Enclosure / IP",v.enclosure||""))+
 '<div class="ma6a-editor-section-note">For a service, cable or nonphysical item, leave inapplicable dimensions blank.</div>')+
 details("Parts & accessories",
 '<div class="ma6a-editor-section-note">Choose master parts, quantities and Required/Optional. Approved compatibility and BOM rules are future technical controls.</div>'+partsPicker(v))+
 details("Commercial price & availability (demo)",
 group(selectField("currency","Currency",[["INR","INR"],["USD","USD"],["EUR","EUR"]],p.currency||"INR")+
 textField("priceList","Price List Name",p.list||"Demo Base Price List")+
 numberField("sell","Sample Selling Price / Unit",p.sell??0)+
 selectField("availability","Availability",[["Unknown","Unknown"],["In Stock","In Stock"],["Order Basis","Order Basis"],["Not Available","Not Available"]],p.availability||"Unknown")+
 textField("supplierRef","Preferred Supplier / Vendor Reference",p.supplierRef||"")+
 textField("hsnSac","HSN / SAC (requires review)",p.hsnSac||"")+
 numberField("leadTimeDays","Expected Lead Time (days)",p.leadTimeDays??"")+

 numberField("cost","Internal Cost (restricted in production)",p.cost??0)+
 textField("priceFrom","Effective From",p.from||"","date")+
 textField("priceTo","Effective To",p.to||"","date"))+
 '<div class="ma6a-editor-section-note">Production price/cost access is controlled by MA-003 permissions; quote prices are revision snapshots.</div>')+
 details("Documents & other technical details",
 group(textField("datasheet","Datasheet Reference / Version",v.datasheet||"")+
 textField("drawing","Drawing / Diagram Reference",v.drawing||"")+
 areaField("technical","Other technical attributes (Label: Value)",techToText(v.technical))+
 areaField("variantNotes","Internal Model Notes",v.notes||"")))+
 pim.warrantyFields(v)+
 pim.wizardDocumentFields(v)+
 '<div class="ma6a-editor-section-note">Document files can be recorded under Documents &amp; Warranty after saving the model. Customer-specific technical changes belong in a configuration, not a silent edit of the shared product.</div>';
}
function manufacturerFields(m={}){
 return section("Manufacturer & Brand","Separate from our internal legal entity (MA-002) and from the eventual purchasing supplier.")+
 group(textField("name","Manufacturer Company Name",m.name||"","text",false,true)+
 textField("brand","Brand / Trading Name",m.brand||"")+
 textField("country","Country",m.country||"India")+
 selectField("status","Status",statuses.map(x=>[x,x]),m.status||"Active")+
 textField("website","Website / Reference (optional)",m.website||"")+
 areaField("notes","Internal manufacturer notes",m.notes||""));
}
function partFields(p={}){
 return section("Part / Accessory Master","Individual components can be reused in many product variants and future configurations.")+
 group(textField("code","Part Code / SKU",p.code||"","text",false,true)+
 textField("name","Part / Accessory Name",p.name||"","text",false,true)+
 selectField("kind","Type",[["Component","Component"],["Accessory","Accessory"]],p.kind||"Component")+
 selectField("manufacturerId","Manufacturer",db.manufacturers.map(m=>[m.id,m.name]),p.manufacturerId||"","Choose manufacturer")+
 textField("unit","Unit of Measure",p.unit||"Nos")+
 selectField("status","Status",statuses.map(x=>[x,x]),p.status||"Active")+
 numberField("sellPrice","Demo Selling Price / Unit",p.sellPrice??0)+
 areaField("spec","Part Technical Specification",p.spec||"")+
 areaField("notes","Internal Notes",p.notes||""))+
 '<div class="ma6a-editor-section-note">Part prices, SKU compatibility and substitution permissions are separate concerns. This is an editable master-data wireframe, not a purchasing or engineering approval system.</div>';
}
function editorMarkup(){
 const e=state.editor;if(!e)return "";
 if(e.mode==="templates")return tpl.manager(db);
 if(e.mode==="template-new"||e.mode==="template-edit")return tpl.editor(e.templateId?tpl.get(e.templateId,db):{},db);
 if(e.mode==="product-new")return familyFields()+variantFields({}, {solarKind:state.editor?.solarKind||"general"});
 if(e.mode==="family-new")return familyFields({solarKind:e.solarKind||"general"});
 if(e.mode==="family-edit")return familyFields(family(e.familyId));
 if(e.mode==="variant-new")return '<div class="ma6a-editor-section-note"><b>Family:</b> '+esc(family(e.familyId)?.name||"Unknown")+'</div>'+variantFields({},family(e.familyId));
 if(e.mode==="variant-edit")return '<div class="ma6a-editor-section-note"><b>Family:</b> '+esc(family(e.familyId)?.name||"Unknown")+'</div>'+variantFields(variant(e.variantId),family(e.familyId));
 if(e.mode==="manufacturer-new"||e.mode==="manufacturer-edit")return manufacturerFields(e.manufacturerId?maker(e.manufacturerId):{});
 if(e.mode==="part-new"||e.mode==="part-edit")return partFields(e.partId?part(e.partId):{});
 return "";
}
function openEditor(mode,ids={}){
 state.editor={mode,solarKind:mode==="product-new"?"pv-module":"general",...ids};
 const titles={"templates":"Product Specification Templates","template-new":"Add Specification Template","template-edit":"Edit Specification Template","product-new":"Add Product","family-new":"Add Product Group","family-edit":"Edit Product Group","variant-new":"Add Another Model","variant-edit":"Edit Model","manufacturer-new":"Add Manufacturer","manufacturer-edit":"Edit Manufacturer","part-new":"Add Part / Accessory","part-edit":"Edit Part / Accessory"};
 $("catalog-editor-title").textContent=titles[mode]||"Edit Catalog";
 $("catalog-editor-subtitle").textContent="Fictional master-data fields · Demo save only · Not production authorization";
 $("catalog-editor-body").innerHTML=editorMarkup();$("catalog-editor-error").hidden=true;
 const simple=window.CPQ_MA006A_SIMPLE_WIZARD;
 if(simple&&["product-new","variant-new","variant-edit"].includes(mode))simple.mount(state.editor,db);
 else{if(simple)simple.reset();$("catalog-editor-back").hidden=true;$("catalog-editor-next").hidden=true;$("catalog-editor-save").hidden=mode==="templates";$("catalog-editor-save").textContent=mode.startsWith("template-")?"Save Template":"Save Demo";}
 $("catalog-editor-overlay").classList.add("open");$("catalog-editor-overlay").setAttribute("aria-hidden","false");
 $("catalog-editor-close").focus();
}
function closeEditor(){
 $("catalog-editor-overlay").classList.remove("open");$("catalog-editor-overlay").setAttribute("aria-hidden","true");
 state.editor=null;
 if(window.CPQ_MA006A_SIMPLE_WIZARD)window.CPQ_MA006A_SIMPLE_WIZARD.reset();
}
function issue(message){const el=$("catalog-editor-error");el.hidden=false;el.textContent=message;el.scrollIntoView({block:"nearest"});return false;}
const trim=(f,k)=>String(f.get(k)??"").trim();
function positive(f,k,required=false){
 const v=trim(f,k);if(!v)return "";
 const n=Number(v);if(!Number.isFinite(n)||n<0||n>1000000000)throw Error("Enter a valid non-negative number for "+k+".");
 return n;
}
function techParse(raw){
 return String(raw||"").split(/\n/).map(s=>s.trim()).filter(Boolean).map(line=>{
  const i=line.indexOf(":");
  if(i<1)throw Error("Technical attributes must use 'Label: Value', one per line.");
  return {name:line.slice(0,i).trim().slice(0,80),value:line.slice(i+1).trim().slice(0,200)};
 });
}
function getFamilyForm(f){
 const name=trim(f,"familyName"),category=trim(f,"familyCategory"),type=trim(f,"familyType"),kind=trim(f,"solarKind")||"general";
 if(!name||!category||!type||!tpl.get(kind,db))throw Error("Product group name, category, type and valid specification template are required.");
 if((type==="service"||kind==="service")&&state.editor?.mode!=="family-edit")throw Error("Use Service Management to add new services.");
 return {name:name.slice(0,150),category,type,solarKind:trim(f,"solarKind")||"general",unit:trim(f,"familyUnit")||"Nos",
  rating:trim(f,"familyRating"),description:trim(f,"familyDescription"),status:trim(f,"familyStatus")||"Draft",
  attributes:trim(f,"familyAttributes")};
}
function getVariantForm(f,familyType,existing=null,solarKind="general",category="Other"){
 const identity=tpl.identity(db,f,solarKind,existing);
 const dims={unit:trim(f,"dimensionUnit")||"mm",weightUnit:trim(f,"weightUnit")||"kg"};
 for(const [k,fk] of [["length","dimLength"],["width","dimWidth"],["height","dimHeight"],["depth","dimDepth"],["weight","weight"]])dims[k]=positive(f,fk);
 const components=f.getAll("linkedPart").map(id=>{
  if(!part(id))throw Error("A referenced part is not in the master library.");
  const qty=Number(trim(f,"qty_"+id)||1);
  if(!Number.isInteger(qty)||qty<1||qty>100000)throw Error("Part quantities must be positive whole numbers.");
  return {partId:id,qty,role:trim(f,"role_"+id)==="Optional"?"Optional":"Required",group:trim(f,"group_"+id).slice(0,100)};
 });
 const cost=positive(f,"cost"),sell=positive(f,"sell");
  const solar=solarDataFromForm(f,solarKind,existing?.solar||{});
  if(solarKind==="pv-module"){
   for(const key of ["pmaxWp","vocV","vmpV","iscA","impA"])
    if(solar[key]!==undefined&&solar[key]<=0)throw Error("PV electrical ratings must be positive when entered.");
   if(solar.vocV!==undefined&&solar.vmpV!==undefined&&solar.vmpV>=solar.vocV)
    throw Error("Vmp must be lower than Voc. Check the manufacturer's datasheet.");
   if(solar.iscA!==undefined&&solar.impA!==undefined&&solar.impA>solar.iscA)
    throw Error("Imp cannot exceed Isc. Check the manufacturer's datasheet.");
   if(solar.efficiencyPct!==undefined&&(solar.efficiencyPct<=0||solar.efficiencyPct>100))
    throw Error("Module efficiency must be greater than 0% and no more than 100%.");
  }
  if(solarKind==="battery"&&solar.usableKwh!==undefined&&solar.nominalKwh!==undefined&&solar.usableKwh>solar.nominalKwh)
   throw Error("Usable battery energy cannot exceed nominal energy.");
 const categorySpecs=pim.readCategory(f,{category,solarKind},existing?.categorySpecs||{});
 const warranty=pim.readWarranty(f,existing?.warranty||{});
 const from=trim(f,"priceFrom"),to=trim(f,"priceTo");
 if(from&&to&&to<from)throw Error("Price effective-until cannot precede the effective-from date.");
 return {...identity,variant:trim(f,"variantName")||identity.model||tpl.describe(solarKind,solar,trim(f,"capacity"),db)||identity.sku,specTemplate:tpl.capture(solarKind,db),
  status:trim(f,"variantStatus")||"Draft",capacity:trim(f,"capacity"),voltage:trim(f,"voltage"),
  mounting:trim(f,"mounting"),material:trim(f,"material"),enclosure:trim(f,"enclosure"),
  dimensions:dims,technical:techParse(trim(f,"technical")),solar,components,
  ...(Object.keys(categorySpecs).length||existing?.categorySpecs?{categorySpecs}:{}),
  ...(Object.keys(warranty).length||existing?.warranty?{warranty}:{}),
  price:{currency:trim(f,"currency")||"INR",list:trim(f,"priceList")||"Demo Base Price List",
   cost:cost===""?0:cost,sell:sell===""?0:sell,from,to,
   availability:trim(f,"availability")||"Unknown",supplierRef:trim(f,"supplierRef"),
   hsnSac:trim(f,"hsnSac"),leadTimeDays:positive(f,"leadTimeDays")},
  datasheet:trim(f,"datasheet"),drawing:trim(f,"drawing"),notes:trim(f,"variantNotes")};
}
function stagedWizardDocuments(form,old){
 const picker=form.querySelector('[name="wizardDocFiles"]');
 if(!picker?.files?.length)return null;
 const staged={documents:clone(old?.documents||[]),documentHistory:clone(old?.documentHistory||[])};
 pim.addDocuments(staged,form,"wizardDoc");
 return staged;
}
function saveEditor(event){
 event.preventDefault();
 const e=state.editor;if(!e)return;
 const fd=new FormData($("catalog-editor-form"));
 let createdType="",createdId="";
 try{
  if(e.mode==="template-new"||e.mode==="template-edit"){
   const old=e.templateId?tpl.get(e.templateId,db):null;
   const data=tpl.readTemplate(fd,db,old);tpl.save(db,data);createdType=old?"":"template";createdId=data.id;
  }else if(e.mode==="product-new"){
   const chosen=trim(fd,"wizardFamilyId");
   let fam=family(chosen),newFamily=null;
   if(!fam){
    if(chosen!=="__new__")throw Error("Choose an existing product group or Create a new product group.");
    const f=getFamilyForm(fd);f.status="Draft";
    if(db.families.some(x=>x.name.trim().toLowerCase()===f.name.trim().toLowerCase()&&(x.solarKind||"general")===(f.solarKind||"general")))
     throw Error("Product group already exists. Choose that group instead of making a duplicate.");
    newFamily={id:idNext("FAM-",db.families),...f};fam=newFamily;
   }
   const v=getVariantForm(fd,fam.type,null,fam.solarKind||"general",fam.category||"Other");v.status="Draft";
   const docs=stagedWizardDocuments($("catalog-editor-form"),null);
   if(newFamily)db.families.unshift(newFamily);
   const vari={id:idNext("VAR-",db.variants),familyId:fam.id,documents:docs?.documents||[],documentHistory:docs?.documentHistory||[],revisionHistory:[],...v};db.variants.unshift(vari);
   createdType="product";createdId=vari.id;state.family=fam.id;state.variant=vari.id;state.tab="variants";
   state.search="";state.category="all";state.manufacturer="all";state.status="all";state.hub="products";
  }else if(e.mode==="family-new"){
   const data=getFamilyForm(fd);data.status="Draft";
   if(db.families.some(x=>x.name.trim().toLowerCase()===data.name.trim().toLowerCase()&&(x.solarKind||"general")===(data.solarKind||"general")))throw Error("This product group already exists for the equipment template.");
   const f={id:idNext("FAM-",db.families),...data};db.families.unshift(f);createdType="family";createdId=f.id;state.family=f.id;state.variant="";state.hub="products";state.tab="variants";state.search="";state.category="all";state.status="all";state.manufacturer="all";
  }else if(e.mode==="family-edit"){
   const f=family(e.familyId);if(!f)throw Error("Family not found.");
   const data=getFamilyForm(fd);if(siblings(f.id).length&&((data.solarKind||"general")!==(f.solarKind||"general")||data.type!==f.type))throw Error("Existing variants must keep their product type and template. Create another group for a different schema.");if(data.type==="service"&&f.type!=="service")throw Error("Use Service Management for new services.");data.status=f.status;Object.assign(f,data);state.family=f.id;
  }else if(e.mode==="variant-new"||e.mode==="variant-edit"){
   const fam=family(e.familyId);if(!fam)throw Error("Select a valid product family.");
   const orig=e.mode==="variant-edit"?variant(e.variantId):null;
   const input=getVariantForm(fd,fam.type,orig,fam.solarKind||"general",fam.category||"Other");
   const docs=stagedWizardDocuments($("catalog-editor-form"),orig);
   if(!orig)input.status="Draft";
   if(orig){
    const prior=clone(orig);
    const before=JSON.stringify({...orig,status:undefined,demoReview:undefined});
    input.status=orig.status;Object.assign(orig,input);
    if(docs){orig.documents=docs.documents;orig.documentHistory=docs.documentHistory;}
    pim.recordModelChange(orig,prior,input);
    if(orig.demoReview&&before!==JSON.stringify({...orig,status:undefined,demoReview:undefined})){
     orig.status="Draft";orig.demoReview={state:"Returned to Draft",events:[...(orig.demoReview.events||[]),{action:"Model details edited; simulated eligibility reset",at:new Date().toLocaleString("en-GB"),actor:"Demo operator"}]};
    }
   }
   else{
    const v={id:idNext("VAR-",db.variants),familyId:fam.id,documents:docs?.documents||[],documentHistory:docs?.documentHistory||[],revisionHistory:[],...input};db.variants.unshift(v);state.variant=v.id;createdType="product";createdId=v.id;
   }
   state.family=fam.id;state.tab="variants";
   state.manufacturer="all";state.status="all";state.search="";
  }else if(e.mode==="manufacturer-new"||e.mode==="manufacturer-edit"){
   const name=trim(fd,"name");if(!name)throw Error("Manufacturer name is required.");
   if(db.manufacturers.some(m=>m.id!==e.manufacturerId&&m.name.trim().toLowerCase()===name.toLowerCase()))throw Error("This manufacturer already exists. Select its existing record.");
   const input={name:name.slice(0,150),brand:trim(fd,"brand"),country:trim(fd,"country"),
    website:trim(fd,"website"),status:trim(fd,"status")||"Active",notes:trim(fd,"notes")};
   if(e.mode==="manufacturer-edit"){const m=maker(e.manufacturerId);if(!m)throw Error("Manufacturer not found.");input.status=m.status;Object.assign(m,input);}
   else{createdId=idNext("MFG-",db.manufacturers);createdType="manufacturer";db.manufacturers.push({id:createdId,...input,status:"Draft"});}
   state.hub="manufacturers";
  }else if(e.mode==="part-new"||e.mode==="part-edit"){
   const code=trim(fd,"code"),name=trim(fd,"name");if(!code||!name)throw Error("Part code and name are required.");
   const duplicate=db.parts.find(p=>p.code.toLowerCase()===code.toLowerCase()&&p.id!==e.partId);
   if(duplicate)throw Error("Part code already exists.");
   const price=positive(fd,"sellPrice");
   const input={code:code.slice(0,80),name:name.slice(0,150),kind:trim(fd,"kind")||"Component",
    manufacturerId:trim(fd,"manufacturerId"),unit:trim(fd,"unit")||"Nos",
    status:trim(fd,"status")||"Draft",spec:trim(fd,"spec"),notes:trim(fd,"notes"),
    sellPrice:price===""?0:price};
   if(e.mode==="part-edit"){const p=part(e.partId);if(!p)throw Error("Part not found.");input.status=p.status;Object.assign(p,input);}
   else{createdId=idNext("PART-",db.parts);createdType="part";db.parts.push({id:createdId,...input});}
   state.hub="parts";
  }
  closeEditor();renderCatalog();
  if(createdType&&createdId)window.CPQ_QUICK_CREATE?.saved(createdType,createdId);
 }catch(err){issue(err.message||"Unable to save this demo record.");}
}
document.addEventListener("click",event=>{
 const t=event.target.closest("[data-hub],[data-catalog-link],[data-family],[data-variant],[data-catalog-tab],[data-catalog-action]");
 if(!t)return;
 const d=t.dataset;
 if(d.hub){setHub(d.hub);return;}
 if(d.catalogLink){setHub("products");$("catalog-screen").scrollIntoView({block:"start"});return;}
 if(d.family){state.family=d.family;state.variant=siblings(d.family)[0]?.id||"";state.tab="variants";renderCatalog();return;}
 if(d.variant){state.variant=d.variant;renderDetails();return;}
 if(d.catalogTab){state.tab=d.catalogTab;renderDetails();return;}
 const action=d.catalogAction;
 if(!action)return;
 if(["demo-submit-review","demo-enable-model","demo-revoke-model"].includes(action)){applyDemoReview(action);return;}
 if(action==="manage-templates")openEditor("templates");
 else if(action==="add-template")openEditor("template-new");
 else if(action==="edit-template")openEditor("template-edit",{templateId:d.templateId});
 else if(action==="edit-family")openEditor("family-edit",{familyId:state.family});
 else if(action==="add-variant")openEditor("variant-new",{familyId:state.family});
 else if(action==="edit-variant"){
  if(!state.variant){return;}
  openEditor("variant-edit",{familyId:state.family,variantId:state.variant});
 }else if(action==="add-family")openEditor("family-new");
 else if(action==="add-category")window.CPQ_QUICK_CREATE?.open("category",{},()=>renderCatalog(),t);
 else if(action==="add-manufacturer")openEditor("manufacturer-new");
 else if(action==="edit-manufacturer")openEditor("manufacturer-edit",{manufacturerId:d.makerId});
 else if(action==="add-part")openEditor("part-new");
 else if(action==="edit-part")openEditor("part-edit",{partId:d.partId});
});
$("catalog-add-product").addEventListener("click",()=>{setHub("products");openEditor("product-new");});
$("new-configuration").addEventListener("click",()=>setHub("configurations"));
$("catalog-clear").addEventListener("click",()=>{state.search="";state.category="all";state.manufacturer="all";state.status="all";renderCatalog();});
$("catalog-search").addEventListener("input",e=>{state.search=e.target.value;renderCatalog();});
$("catalog-category").addEventListener("change",e=>{state.category=e.target.value;renderCatalog();});
$("catalog-manufacturer").addEventListener("change",e=>{state.manufacturer=e.target.value;renderCatalog();});
$("catalog-status").addEventListener("change",e=>{state.status=e.target.value;renderCatalog();});
$("catalog-editor-form").addEventListener("click",e=>{
 if(e.target.closest("[data-template-add]")){$("cpq-template-fields").insertAdjacentHTML("beforeend",tpl.fieldRow());return;}
 const remove=e.target.closest("[data-template-remove]");if(remove)remove.closest("[data-template-row]").remove();
});
$("catalog-editor-form").addEventListener("change",e=>{
 if(e.target.name!=="solarKind"||!state.editor)return;
 if(state.editor.mode==="family-new"){const t=tpl.get(e.target.value,db);if(t){$("cat-familyCategory").value=t.category;$("cat-familyUnit").value=t.unit;}return;}
 if(state.editor.mode!=="product-new")return;
 state.editor.solarKind=e.target.value;
 const target=$("catalog-solar-fields");if(target)target.innerHTML=solarFields(e.target.value,{});
});
/* Document picker stores safe metadata only. File bytes never enter localStorage. */
$("catalog-family-body").addEventListener("submit",event=>{
 const form=event.target.closest("#catalog-document-form");
 if(!form)return;
 event.preventDefault();
 const v=variant(state.variant),error=form.querySelector("#catalog-document-error");
 if(!v)return;
 try{
  pim.addDocuments(v,form);
  state.tab="documents";renderCatalog();
 }catch(err){
  if(error){error.hidden=false;error.textContent=err.message||"Unable to record document metadata.";}
 }
});
$("catalog-family-body").addEventListener("click",event=>{
 const target=event.target.closest("[data-product-doc-archive]");
 if(!target)return;
 const v=variant(state.variant);if(!v)return;
 if(!window.confirm("Archive this document reference? Earlier metadata and versions will be retained."))return;
 try{
  pim.archiveDocument(v,target.dataset.productDocArchive);state.tab="documents";renderCatalog();
 }catch(err){window.alert(err.message||"Unable to archive this document reference.");}
});
$("catalog-editor-form").addEventListener("submit",saveEditor);
$("catalog-editor-cancel").addEventListener("click",closeEditor);
$("catalog-editor-close").addEventListener("click",closeEditor);
$("catalog-editor-overlay").addEventListener("click",e=>{if(e.target===$("catalog-editor-overlay"))closeEditor();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&state.editor)closeEditor();});
const params=new URLSearchParams(window.location.search);
if(params.get("configuration")||params.get("opportunity")||params.get("hub")==="configurations")state.hub="configurations";
renderCatalog();
window.CPQ_MA006A_CATALOG_UI={db,state,visibleFamilies,familyVariants,renderCatalog,openEditor,saveEditor,dimension,setHub};
window.CPQ_QC_FORMS={
 template:()=>{openEditor("template-new");return $("catalog-editor-overlay");},
 manufacturer:()=>{openEditor("manufacturer-new");return $("catalog-editor-overlay");},
 product:()=>{openEditor("product-new");return $("catalog-editor-overlay");},
 family:ctx=>{openEditor("family-new",{solarKind:ctx.solarKind||"general"});return $("catalog-editor-overlay");},
 part:()=>{openEditor("part-new");return $("catalog-editor-overlay");}
};
})();