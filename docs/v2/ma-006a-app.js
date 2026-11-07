/* MA-006A · Product Configuration workspace.
 * Presentation-only technical workbench. No approved rules, prices, persistence or security enforcement. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const records=clone(window.CPQ_MA006A_DATA.configurations);
const products=window.CPQ_MA006_DATA.products,org=window.CPQ_MA002_DATA,staff=window.CPQ_MA003_USERS,master=window.CPQ_MA004_DATA,opps=window.CPQ_MA005_DATA.opportunities;
const state={selected:"CF-2026-001",tab:"overview",mode:"register",company:"all",branch:"all",search:"",status:"all",builder:null};
const itemProduct=id=>products.find(p=>p.id===id);
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
 const p=itemProduct(line.productId);if(!p)return "Product not found in sample catalog";
 if(p.type!=="config")return "No technical attribute selection required";
 return Object.entries(p.options).map(([key,opt])=>opt.label+": "+(line.options?.[key]||"Not selected")).join(" · ");
}
function lineErrors(item){
 const p=itemProduct(item.productId),errors=[];
 if(!p){errors.push("Product no longer exists in the sample catalog");return errors;}
 if(!Number.isInteger(Number(item.quantity))||Number(item.quantity)<=0||Number(item.quantity)>100000){errors.push("Enter a whole-number quantity between 1 and 100,000");}
 if(p.type==="config"){
  for(const [k,opt] of Object.entries(p.options)){
   if(!opt.choices.some(([key])=>key===item.options?.[k]))errors.push("Select "+opt.label);
  }
  if(item.options?.rating==="630A"&&item.options?.mounting!=="Floor")errors.push("Sample rule: 630A requires Floor mounting");
 }
 return errors;
}
function review(c){
 const errors=[];
 if(!String(c.name||"").trim())errors.push("Enter a configuration name");
 if(c.items.length===0)errors.push("Add at least one product or service");
 c.items.forEach((line,i)=>lineErrors(line).forEach(e=>errors.push("Item "+(i+1)+": "+e)));
 const validCustomer=customer(c.customerId);
 if(c.buyerId&&(!validCustomer||!master.companies.some(x=>x.id===c.buyerId&&x.customerId===c.customerId)))errors.push("Buyer must belong to the selected customer");
 if(c.opportunityId&&(!validCustomer||!opportunity(c.opportunityId)||opportunity(c.opportunityId).customerId!==c.customerId||opportunity(c.opportunityId).buyerId!==c.buyerId))errors.push("Opportunity must match the selected customer and buyer");
 if(c.branchId&&(!c.companyId||!entity(c.companyId)?.branches.some(x=>x.id===c.branchId)))errors.push("Internal branch must belong to the selected selling company");
 if(c.customerId&&c.companyId&&c.branchId&&!validCustomer?.links.some(l=>l.companyId===c.companyId&&l.branchId===c.branchId))errors.push("Selected internal company/branch is not linked to this customer");
 if(c.ownerId&&!staff.some(u=>u.id===c.ownerId&&u.status==="Active"&&(u.assignments||[]).some(a=>a.companyId===c.companyId&&a.branches.includes(c.branchId))))errors.push("Owner must be an active employee assigned to that internal branch");
 return {ok:errors.length===0,errors};
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
 return {v:1,configId:c.id,name:c.name,customerId:c.customerId||"",buyerId:c.buyerId||"",companyId:c.companyId||"",branchId:c.branchId||"",ownerId:c.ownerId||"",opportunityId:c.opportunityId||"",
 items:c.items.map(l=>({productId:l.productId,quantity:l.quantity,options:l.options,note:l.note||""}))};
}
function quotationLink(c){
 return 'ma-006-quotations.html?configData='+encodeURIComponent(JSON.stringify(payload(c)));
}
function renderHead(c){
 $("configuration-header").innerHTML='<div class="ma6-detail-top"><div><small>'+esc(c.id)+' / '+esc(c.revision)+' · '+esc(c.kind)+'</small><h2>'+esc(c.name)+'</h2><p>'+esc(customer(c.customerId)?.name||"Reusable configuration without a customer")+' · '+esc(owner(c.ownerId)?.name||"Unassigned owner")+'</p></div>'+
 '<div class="ma6-detail-actions">'+badge(c)+
 '<button type="button" class="btn" data-action="edit">Edit Configuration</button>'+
 '<button type="button" class="btn" data-action="duplicate">Copy</button>'+
 (review(c).ok?'<a class="btn primary" href="'+quotationLink(c)+'">Use in Quotation</a>':'<button type="button" class="btn" disabled title="Correct the sample rule before handoff">Resolve checks first</button>')+
 '</div></div>'+
 '<div class="ma6-quote-meta"><span class="ma6-tag">'+c.items.length+' selected item(s)</span><span class="ma6-tag">Updated '+esc(c.updated)+'</span><span class="ma6-tag">Technical approval: pending</span></div>'+
 '<div class="ma6-banner"><b>Configuration before quotation:</b> These records store product choices, options, technical notes and quantity. They do not store approved rates, discounts, taxes or customer-issued offers.</div>';
}
function overview(c){
 return panel("Configuration overview","A reusable solution specification that can later be priced and quoted.")+
 '<div class="ma6-kvs">'+kv("Configuration reference",c.id+" / "+c.revision)+kv("Type",c.kind)+
 kv("Customer",customer(c.customerId)?.name||"Unassigned — reusable template")+
 kv("Buyer company",buyer(c.buyerId)?.name)+kv("Source enquiry",c.opportunityId||"Not linked")+
 kv("Our company",entity(c.companyId)?.name)+kv("Internal branch",branch(c.branchId)?.name)+
 kv("Owner",owner(c.ownerId)?.name)+kv("Item count",String(c.items.length))+
 kv("Sample rule check",status(c))+kv("Updated",c.updated)+kv("Linked quotation",c.quoteId||"None")+'</div>'+
 '<div class="ma6-section-sub"><h4>Purpose / internal technical notes</h4></div>'+
 '<div class="ma6a-scope-panel">'+esc(c.notes||"No notes captured")+'</div>'+
 note('A configuration can be customer-specific or customer-neutral. It may include multiple configured/standard/service items. Buyer and selling-company validations remain mandatory before a commercial quotation is saved.');
}
function items(c){
 return panel("Selected technical items","Product attributes, service scope and quantities; pricing happens only in MA-006.")+
 (c.items.length?c.items.map((l,i)=>{
  const p=itemProduct(l.productId),issues=lineErrors(l);
  return '<div class="ma6a-config-item"><div class="ma6a-config-item-head"><div><strong>'+(i+1)+'. '+esc(p?.name||l.productId)+'</strong><small>'+esc(l.productId)+' · '+esc(typeLabel(p?.type))+'</small></div>'+
  '<span class="ma6-tag">'+esc(l.quantity)+' '+esc(p?.unit||"unit")+'</span></div>'+
  '<div class="ma6a-config-options"><span>'+esc(optionText(l))+'</span></div>'+
  (l.note?'<p class="ma6a-table-foot">'+esc(l.note)+'</p>':'')+
  (issues.length?'<div class="ma6-validation">'+issues.map(esc).join("; ")+'</div>':'')+'</div>';
 }).join(""):empty("No selected items. Open the builder to add products."))+
 note('This is not a generated manufacturer BOM or priced BOQ. Engineering will approve the options and component breakdown; quotations will display the commercial quantities, rates and terms.');
}
function checks(c){
 const problems=review(c).errors;
 return panel("Technical checks & readiness","Shows where approved engineering rules will be enforced in development.")+
 '<div class="ma6a-check-row"><span class="ma6a-check-symbol">✓</span><div><strong>Product catalog selection</strong><p>Technical attributes and allowed options are illustrated using the sample product catalog.</p></div></div>'+
 (problems.length?problems.map(x=>'<div class="ma6a-check-row bad"><span class="ma6a-check-symbol">!</span><div><strong>Needs correction</strong><p>'+esc(x)+'</p></div></div>').join(""):
 '<div class="ma6a-check-row"><span class="ma6a-check-symbol">✓</span><div><strong>Sample rule check passed</strong><p>The selected options satisfy this small set of demonstration rules, not a production engineering or safety sign-off.</p></div></div>')+
 '<div class="ma6a-check-row bad"><span class="ma6a-check-symbol">!</span><div><strong>Actual technical approval pending</strong><p>Real compatibility, certified data, accessory dependencies, standard compliance, availability, drawings and BOM generation need an authorized catalog/rules workflow.</p></div></div>'+
 note('A green sample check is not technical approval. Product rules administration remains a separate planned screen, with MA-003 permissions for editing those rules.');
}
function handoff(c){
 const valid=review(c).ok;
 return panel("Use this configuration in a quotation","Pass selected items and reference context into MA-006 for pricing and commercial terms.")+
 '<div class="ma6a-handoff"><h4>'+(valid?"Ready for a demo handoff":"Correct the technical selection first")+'</h4>'+
 '<p>'+esc(valid?"Selected products, quantities and options can be carried to a new quotation draft. The quotation builder will determine illustrative selling rates and require customer/buyer and selling-company details.":"One or more sample technical checks failed. Open Edit Configuration and correct the item(s) before handoff.")+'</p>'+
 (valid?'<a class="btn primary" href="'+quotationLink(c)+'">Use in Quotation Builder</a>':'<button class="btn" type="button" data-action="edit">Edit configuration</button>')+'</div>'+
 '<div class="ma6-section-sub"><h4>Existing quotation link</h4></div>'+
 (c.quoteId?'<a class="btn" href="ma-006-quotations.html?quote='+encodeURIComponent(c.quoteId)+'">View sample '+esc(c.quoteId)+'</a>':empty("This configuration has no previously linked quotation."))+
 note('Handoff creates a new browser-only draft; it does not modify an existing issued quotation. Configuration context travels in the URL for demonstration only and contains fictional non-sensitive data. Never enter real customer, technical or confidential information in this public page.');
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
const steps=["Solution Context","Select & Configure","Items & Quantities","Validate & Save"];
const emptyConfig=()=>({id:"",name:"",kind:"Customer configuration",customerId:"",buyerId:"",opportunityId:"",companyId:"",branchId:"",ownerId:"",quoteId:"",notes:"",updated:"07 Nov 2026 (demo)",revision:"C0",items:[]});
function setProduct(b,id){
 const p=itemProduct(id);
 if(!p)return;b.productId=id;b.quantity=1;b.itemNote="";b.options=p.type==="config"?{...p.defaults}:{};
}
function newBuilder(original=null,duplicate=false){
 const c=original?clone(original):emptyConfig();
 if(duplicate){c.id="";c.quoteId="";c.revision="C0";c.updated="07 Nov 2026 (demo)";c.name=c.name+" — Copy";}
 const b={value:c,isNew:!original||duplicate,step:0,productId:"",quantity:1,options:{},itemNote:""};
 setProduct(b,products[0].id);
 state.builder=b;state.mode="builder";render();
 $("configuration-builder").scrollIntoView({block:"start",behavior:"auto"});
}
function renderContext(c){
 const customerItems=master.customers.filter(x=>x.status!=="Archived").map(x=>[x.id,x.name]);
 const buyers=master.companies.filter(x=>x.customerId===c.customerId).map(x=>[x.id,x.name]);
 const links=customer(c.customerId)?.links||[];
 const companies=org.filter(x=>!c.customerId||links.some(l=>l.companyId===x.id)).map(x=>[x.id,x.name]);
 const branches=(entity(c.companyId)?.branches||[]).filter(x=>!c.customerId||links.some(l=>l.companyId===c.companyId&&l.branchId===x.id)).map(x=>[x.id,x.name]);
 const users=staff.filter(x=>x.status==="Active"&&(x.assignments||[]).some(a=>a.companyId===c.companyId&&a.branches.includes(c.branchId))).map(x=>[x.id,x.name]);
 const enq=opps.filter(x=>x.customerId===c.customerId&&x.buyerId===c.buyerId).map(x=>[x.id,x.title+" · "+x.id]);
 return panel("1 · Solution context","Configure a product independently or associate it with a known customer and project.")+
 '<div class="ma6-field-grid">'+
 field("name","Configuration / solution name *",c.name,true)+
 select("kind","Configuration purpose",[["Customer configuration","Customer configuration"],["Reusable template","Reusable template"]],c.kind)+
 '<div class="ma6-form-section">Customer context (optional)</div>'+
 select("customerId","Customer account",customerItems,c.customerId,"No customer / reusable template")+
 select("buyerId","Exact buyer company",buyers,c.buyerId,"No buyer yet")+
 select("opportunityId","Linked opportunity",enq,c.opportunityId,"Not linked")+
 '<div class="ma6-form-section">Internal ownership (optional at configuration stage)</div>'+
 select("companyId","Our selling legal entity",companies,c.companyId,"Choose later in quotation")+
 select("branchId","Our internal branch",branches,c.branchId,"Not assigned")+
 select("ownerId","Responsible employee",users,c.ownerId,"Not assigned")+
 area("notes","Solution description / internal technical notes",c.notes)+'</div>'+
 note('Customer and buyer may remain blank for a reusable product configuration. Before saving a quotation, MA-006 requires an exact buyer and authorized internal company/branch/owner.');
}
function renderProduct(c,b){
 const p=itemProduct(b.productId)||products[0];
 const errors=lineErrors({productId:p.id,quantity:b.quantity,options:b.options});
 return panel("2 · Select product & configure","Build technical selections before pricing. Standard and service items bypass unnecessary option fields.")+
 '<div class="ma6a-pick-grid"><div><div class="ma6a-catalog">'+products.map(x=>'<button class="ma6-product-card'+(x.id===p.id?' selected':'')+'" type="button" data-product="'+esc(x.id)+'"><div><span class="ma6-tag">'+esc(typeLabel(x.type))+'</span><strong>'+esc(x.name)+'</strong><small>'+esc(x.id)+' · Unit: '+esc(x.unit)+'</small></div><span class="ma6-tag">Select</span></button>').join("")+'</div></div>'+
 '<div class="ma6a-spec-editor"><h3>'+esc(p.name)+'</h3>'+
 (p.type==="config"?'<div class="ma6-field-grid">'+Object.entries(p.options).map(([key,spec])=>select("opt-"+key,spec.label,spec.choices.map(([value])=>[value,value]),b.options[key],"Choose option")).join("")+'</div>':
 '<div class="ma6a-quiet-box">This '+esc(typeLabel(p.type).toLowerCase())+' does not require custom product attributes. Specify quantity and any service scope note.</div>')+
 '<div class="ma6a-editor-qty"><div class="ma6-field"><label for="config-add-qty">Quantity *</label><input type="number" min="1" step="1" id="config-add-qty" data-add-qty value="'+esc(b.quantity)+'"></div><div><small>Unit: '+esc(p.unit)+'</small></div></div>'+
 '<div class="ma6-field"><label for="config-add-note">Item-specific technical notes (optional)</label><textarea id="config-add-note" data-item-note rows="3">'+esc(b.itemNote)+'</textarea></div>'+
 (errors.length?'<div class="ma6-validation">'+errors.map(esc).join("; ")+'</div>':'<div class="ma6-validation ok">Sample option check passed; engineering approval is still required.</div>')+
 '<button class="btn primary" type="button" data-action="add-item">+ Add to Configuration</button></div></div>'+
 '<div class="ma6a-selected-lines"><div class="ma6-section-sub"><h4>Selected solution items ('+c.items.length+')</h4></div>'+itemsCompact(c)+
 '<p class="ma6a-table-foot">No rates, taxes or discounts are entered at this stage.</p></div>';
}
function itemsCompact(c,edit=false){
 return c.items.length?c.items.map((l,i)=>{
  const p=itemProduct(l.productId);return '<div class="ma6a-line-row"><div><h4>'+(i+1)+'. '+esc(p?.name||l.productId)+'</h4><p>'+esc(optionText(l))+'</p>'+(l.note?'<p>'+esc(l.note)+'</p>':'')+'</div>'+
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
 const result=review(c);
 return panel("4 · Review & save configuration","Check the technical choices and store a sample configuration. Quotations will handle pricing separately.")+
 '<div class="ma6-kvs">'+kv("Solution name",c.name||"Required")+
 kv("Customer",customer(c.customerId)?.name||"Reusable / not selected")+
 kv("Buyer",buyer(c.buyerId)?.name)+kv("Items",String(c.items.length))+
 kv("Internal company",entity(c.companyId)?.name||"Select later")+
 kv("Source opportunity",c.opportunityId||"No source enquiry")+'</div>'+
 '<div class="ma6-section-sub"><h4>Sample readiness</h4>'+badge(c)+'</div>'+
 (result.errors.length?result.errors.map(e=>'<div class="ma6a-check-row bad"><span class="ma6a-check-symbol">!</span><div><strong>Action needed</strong><p>'+esc(e)+'</p></div></div>').join(""):
 '<div class="ma6a-check-row"><span class="ma6a-check-symbol">✓</span><div><strong>Demo selection check passed</strong><p>Technical selections are structurally complete for this sample. This is not an engineering approval or permission to issue a customer quotation.</p></div></div>')+
 '<div class="ma6a-check-row bad"><span class="ma6a-check-symbol">!</span><div><strong>Engineering approval is not yet modeled</strong><p>Product catalog, compatibility, BOM, accessories, availability and standards must be managed by authorized technical users in production.</p></div></div>'+
 note('Saving creates or updates a fictional configuration in this browser page. After saving, select "Use in Quotation" to pass the selected items to MA-006, where the customer, pricing, terms and approval policies are controlled.');
}
function renderBuilder(){
 if(state.mode!=="builder"||!state.builder)return;
 const b=state.builder,c=b.value;
 $("configuration-register").hidden=true;$("configuration-builder").hidden=false;
 $("config-builder-title").textContent=(b.isNew?"New Configuration":"Edit "+c.id)+" · "+steps[b.step];
 $("config-builder-subtitle").textContent="No selling prices · "+(b.isNew?"New solution":"Editing sample "+c.revision);
 $("config-builder-steps").innerHTML=steps.map((title,i)=>'<button type="button" data-step="'+i+'" class="'+(i===b.step?'active':'')+'" aria-current="'+(i===b.step?'step':'false')+'"><span class="ma6-step-num">'+(i+1)+'</span><span class="ma6-step-label">'+esc(title)+'</span></button>').join("");
 $("config-builder-body").innerHTML=[renderContext,()=>renderProduct(c,b),renderComponents,renderReview][b.step](c);
 $("config-builder-prev").disabled=b.step===0;$("config-builder-next").hidden=b.step===3;$("config-builder-save").hidden=b.step!==3;
 $("config-builder-hint").textContent=b.step===1?"Sample rules only · No rates":b.step===3?"Engineering approval remains separate":"All changes are browser-only";
}
function render(){
 if(state.mode==="builder"){renderBuilder();return;}
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
 if(!r.ok){dialog("Correct the configuration first",r.errors.map(esc).join("<p>")+"</p>");return;}
 if(b.isNew){
  const next=Math.max(6,...records.map(x=>Number(x.id.split("-").at(-1))||0))+1;
  c.id="CF-2026-"+String(next).padStart(3,"0");
  records.unshift(clone(c));
 }else{
  const idx=records.findIndex(x=>x.id===c.id);if(idx<0){dialog("Not found","Sample configuration is no longer available.");return;}
  const old=records[idx];c.revision="C"+(Number(old.revision.slice(1))||0)+1;
  records[idx]=clone(c);
 }
 c.updated="07 Nov 2026 (demo)";
 const saved=record(c.id);if(saved)saved.updated=c.updated;
 state.selected=c.id;state.tab="overview";state.mode="register";state.builder=null;
 state.company="all";state.branch="all";state.status="all";state.search="";
 render();toast("Configuration "+c.id+" saved (demo only)");
 $("configuration-register").scrollIntoView({block:"start",behavior:"auto"});
}
function addItem(){
 const b=state.builder;if(!b)return;
 const p=itemProduct(b.productId);if(!p)return;
 const l={id:"I"+String(Math.max(0,...b.value.items.map(x=>Number(x.id.replace(/\D/g,""))||0))+1).padStart(2,"0"),
 productId:p.id,quantity:Number(b.quantity),options:p.type==="config"?{...b.options}:{},note:String(b.itemNote||"").trim()};
 const errors=lineErrors(l);
 if(errors.length){dialog("Sample configuration needs correction",errors.map(esc).join("<p>")+"</p>");return;}
 b.value.items.push(l);
 b.itemNote="";b.quantity=1;renderBuilder();toast("Item added to technical configuration");
}
function updateContext(field,value){
 const b=state.builder;if(!b)return;const c=b.value;
 if(field==="customerId"){c.customerId=value;c.buyerId="";c.opportunityId="";c.companyId="";c.branchId="";c.ownerId="";renderBuilder();return;}
 if(field==="buyerId"){c.buyerId=value;c.opportunityId="";renderBuilder();return;}
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
 if(d.step!==undefined){const step=Number(d.step);if(state.builder&&step>=0&&step<=3){state.builder.step=step;renderBuilder();}return;}
 if(d.product){if(state.builder){setProduct(state.builder,d.product);renderBuilder();}return;}
 if(d.remove){if(state.builder){state.builder.value.items=state.builder.value.items.filter(x=>x.id!==d.remove);renderBuilder();}return;}
 if(d.planned){dialog(esc(d.planned)+" (planned)","Separate administration will manage master product catalogs, technical rules and authorizations. No production changes occur on this page.");return;}
 if(d.action==="add-item"){addItem();return;}
 if(d.action==="edit"){const c=record(state.selected);if(c)newBuilder(c);return;}
 if(d.action==="duplicate"){const c=record(state.selected);if(c)newBuilder(c,true);return;}
});
$("config-builder-body").addEventListener("change",e=>{
 if(!state.builder)return;const t=e.target;
 if(t.dataset.cField)updateContext(t.dataset.cField,t.value);
 else if(t.dataset.addQty!==undefined)state.builder.quantity=Number(t.value);
 else if(t.dataset.itemNote!==undefined)state.builder.itemNote=t.value;
 else if(t.dataset.lineQty!==undefined){
  const l=state.builder.value.items.find(x=>x.id===t.dataset.lineQty);if(l){l.quantity=Number(t.value);renderBuilder();}
 }
});
$("config-builder-body").addEventListener("input",e=>{
 if(!state.builder)return;const t=e.target;
 if(t.dataset.cField&&["name","notes"].includes(t.dataset.cField))state.builder.value[t.dataset.cField]=t.value;
 if(t.dataset.itemNote!==undefined)state.builder.itemNote=t.value;
});
$("new-configuration").addEventListener("click",()=>newBuilder());
$("config-builder-exit").addEventListener("click",()=>{state.mode="register";state.builder=null;render();$("configuration-register").scrollIntoView({block:"start",behavior:"auto"});});
$("config-builder-prev").addEventListener("click",()=>{if(state.builder){state.builder.step=Math.max(0,state.builder.step-1);renderBuilder();}});
$("config-builder-next").addEventListener("click",()=>{if(state.builder){state.builder.step=Math.min(3,state.builder.step+1);renderBuilder();}});
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
 Object.assign(c,{kind:"Customer configuration",customerId:o.customerId,buyerId:o.buyerId,opportunityId:o.id,companyId:o.companyId,branchId:o.branchId,ownerId:o.ownerId,name:"Configuration — "+o.title,notes:"From sample enquiry "+o.id+": "+o.summary});
 renderBuilder();
}else render();
window.CPQ_MA006A={state,records,products,review,record,visible,quotationLink,payload,save,newBuilder,addItem};
})();