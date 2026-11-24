/* Phase 1 V2 supplier offer workspace — no real auth, files, or outbound requests. */
(()=>{
"use strict";
const W=window,D=document,Q=W.CPQ_VENDOR_QUOTE,M=W.CPQ_VENDOR_MODEL,$=id=>D.getElementById(id),copy=x=>JSON.parse(JSON.stringify(x));
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=x=>"₹"+Number(x||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const state={selected:"",editor:null,focus:null,review:null,formOpen:false,reviewOpen:false};
const rows=()=>Q.db().offers,offer=id=>rows().find(x=>x.id===id);
const opt=(id,label,current)=>'<option value="'+esc(id)+'"'+(String(id)===String(current??"")?' selected':'')+'>'+esc(label)+'</option>';
const field=(name,label,value="",type="text",extra="")=>'<label>'+esc(label)+'<input name="'+esc(name)+'" type="'+type+'" value="'+esc(value??"")+'" '+extra+'></label>';
const area=(name,label,value="")=>'<label>'+esc(label)+'<textarea name="'+esc(name)+'" rows="2">'+esc(value||"")+'</textarea></label>';
const select=(name,label,id,inner,extra="")=>'<label>'+esc(label)+'<div class="vq-selector-row"><select name="'+esc(name)+'" id="'+esc(id)+'">'+inner+'</select>'+extra+'</div></label>';
const btn=(label,attr,primary=false)=>'<button type="button" class="btn'+(primary?" primary":"")+'" '+attr+'>'+esc(label)+'</button>';
const badge=s=>'<span class="vq-badge '+(s==="Verified (demo)"?"verified":s==="Pending verification"?"pending":s.toLowerCase())+'">'+esc(s)+'</span>';
const kv=(k,v)=>'<div><small>'+esc(k)+'</small><b>'+esc(v||"Not provided")+'</b></div>';
function say(s){const t=$("vq-toast");t.textContent=s;t.hidden=false;clearTimeout(say.timer);say.timer=setTimeout(()=>t.hidden=true,5500);}
function error(id,s){const t=$(id);t.textContent=s;t.hidden=false;t.scrollIntoView({block:"nearest"});}
function options(xs,current,empty="Select..."){return opt("",empty,current)+xs.map(x=>opt(x.id,x.label||x.name,current)).join("");}
function retain(xs,id,label){return id&&!xs.some(x=>x.id===id)?[...xs,{id,label:label||id+" (historical)"}]:xs;}
function filterOptions(){
 const c=$("vq-company"),v=$("vq-vendor"),oldC=c.value||"all",oldV=v.value||"all";
 c.innerHTML=opt("all","All companies",oldC)+retain(M.entities().map(x=>({id:x.id,name:x.name})),oldC==="all"?"":oldC).map(x=>opt(x.id,x.label||x.name,oldC)).join("");
 v.innerHTML=opt("all","All vendors",oldV)+retain(Q.vendors().filter(x=>c.value==="all"||x.companyIds.includes(c.value)).map(x=>({id:x.id,name:x.name})),oldV==="all"?"":oldV).map(x=>opt(x.id,x.label||x.name,oldV)).join("");
}
function render(){
 const all=rows(),today=Q.today(),states=all.map(o=>Q.status(o,today));
 $("vq-summary").innerHTML=[["Total offers",all.length],["Pending verification",states.filter(x=>x==="Pending verification").length],["Verified & valid (demo)",states.filter(x=>x==="Verified (demo)").length],["Expired",states.filter(x=>x==="Expired").length]].map(([l,n])=>'<div class="card vm-stat"><span>'+esc(l)+'</span><strong>'+n+'</strong></div>').join("");
 const needle=$("vq-search").value.trim().toLowerCase(),list=all.filter(o=>([o.id,o.reference,o.vendorName,o.companyName,...o.lines.map(l=>l.description)].join(" ").toLowerCase().includes(needle))&&($("vq-company").value==="all"||o.companyId===$("vq-company").value)&&($("vq-vendor").value==="all"||o.vendorId===$("vq-vendor").value)&&($("vq-status").value==="all"||Q.status(o,today)===$("vq-status").value));
 $("vq-count").textContent=list.length+" shown";
 $("vq-rows").innerHTML=list.length?list.map(o=>'<tr class="'+(o.id===state.selected?"selected":"")+'"><td><button class="vm-name" type="button" data-vq-view="'+esc(o.id)+'">'+esc(o.reference||"Incomplete draft")+'</button><small>'+esc(o.id)+" · "+esc(o.received)+'</small></td><td>'+esc(o.vendorName)+'<small>'+esc(o.companyName)+'</small></td><td>'+esc(o.validUntil||"Not set")+'</td><td>'+money(Q.totals(o).total)+(Q.totals(o).taxIncomplete?'<small>Tax incomplete</small>':'')+'</td><td>'+badge(Q.status(o,today))+'</td><td>'+btn("View Details",'data-vq-view="'+esc(o.id)+'"')+'</td></tr>').join(""):'<tr><td colspan="6"><div class="vq-empty-actions"><b>No supplier offers match.</b><span class="muted">Record a received quotation or change the filters.</span>'+btn("+ Add Vendor Quotation",'data-vq-new="yes"',true)+'</div></td></tr>';
 const o=offer(state.selected);$("vq-detail").hidden=!o;$("vq-workspace").classList.toggle("is-split",!!o);if(o)renderDetail(o);
}
function renderDetail(o){
 const s=Q.status(o),t=Q.totals(o),editable=["Draft","Pending verification","Returned"].includes(o.status),id=esc(o.id);
 const lineRows=o.lines.map(l=>'<tr><td><b>'+esc(l.description)+'</b><small>'+esc(l.itemSnapshot?.sku||"Custom item")+'</small></td><td>'+esc(l.quantity)+" "+esc(l.unit)+'</td><td>'+(l.rate==null?"Unknown":money(l.rate))+'</td><td>'+(l.taxRate==null?"Unknown":esc(l.taxRate)+"%")+'</td><td>'+money(l.quantity*(l.rate||0))+'</td></tr>').join("");
 const list=arr=>arr.length?'<ul>'+arr.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>':'<p class="muted">None recorded.</p>';
 $("vq-detail-body").innerHTML='<div class="vm-heading"><div><h2>'+esc(o.reference||"Incomplete supplier draft")+'</h2><p class="muted">'+id+' · '+esc(o.vendorName)+'</p>'+badge(s)+'</div></div>'+
 '<div class="vq-actions">'+(editable?btn("Edit offer",'data-vq-edit="'+id+'"',true):"")+(o.status==="Pending verification"?btn("Check & Verify Rates",'data-vq-check="'+id+'"',true):"")+btn("Copy as New Offer",'data-vq-copy="'+id+'"')+(o.status!=="Archived"?btn("Archive",'data-vq-archive="'+id+'"'):"")+'</div>'+
 '<div class="vm-detail-box"><h3>Supplier offer</h3><div class="vm-kv">'+kv("Our company",o.companyName)+kv("Vendor",o.vendorName)+kv("Branch",o.branchId?(Q.company(o.companyId)?.branches?.find(b=>b.id===o.branchId)?.name||o.branchId):"All company branches")+kv("Enquiry",o.opportunityId||"General supplier offer")+kv("Supplier quotation date",o.quoteDate)+kv("Received date",o.received)+kv("Valid until",o.validUntil)+kv("Currency","INR")+'</div><p><a href="vendor-master.html?vendor='+encodeURIComponent(o.vendorId)+'" class="btn">Open vendor details</a></p></div>'+
 '<div class="vm-detail-box"><h3>Quoted items ('+o.lines.length+')</h3><div class="vq-detail-lines"><table><thead><tr><th>Item</th><th>Qty</th><th>Rate before GST</th><th>GST</th><th>Amount</th></tr></thead><tbody>'+lineRows+'</tbody></table></div>'+totalHtml(t)+'</div>'+
 '<details class="vm-detail-box" open><summary>Source document &amp; verification</summary><p><b>Document:</b> '+(o.evidence.length?"Attached (metadata only)":"Missing")+'</p>'+list(o.evidence.map(f=>f.name+" · metadata only"))+'<p><b>Rate verification:</b> '+esc(o.verification?.decision==="verify"?"Verified in demo":o.verification?.decision==="return"?"Returned for correction":"Not verified")+'</p>'+(o.verification?'<p>'+esc(o.verification.actor+" · "+o.verification.at.slice(0,10)+" · "+o.verification.note)+'</p>':"")+'<p class="muted">No file contents are stored or checked by this prototype. Rate verification is a separate simulated decision.</p></details>'+
 '<details class="vm-detail-box"><summary>Commercial terms</summary><div class="vm-kv">'+kv("Freight (before tax)",money(o.freight))+kv("Other charges (before tax)",money(o.otherCharges))+kv("Tax on charges",o.chargeTaxRate==null?"Unknown":o.chargeTaxRate+"%")+kv("Payment terms",o.payment)+kv("Delivery terms",o.delivery)+kv("Remarks",o.remarks)+'</div></details>'+
 '<details class="vm-detail-box"><summary>Change history ('+o.history.length+')</summary>'+list([...o.history].reverse().map(h=>h.at+" · "+h.action+" · "+h.actor+" · "+(h.note||"")))+'</details>'+
 '<div class="vq-review-note"><b>Using this offer:</b> In a customer quotation, open Pricing &amp; Costing, select a verified supplier rate on the matching BOQ line. Only the internal purchase cost changes. Tax and freight are reviewed separately.</div>';
}
function totalHtml(t){return '<div class="vq-totals"><div><span>Items before GST</span><b>'+money(t.subtotal)+'</b></div><div><span>Item GST (known)</span><b>'+money(t.tax)+'</b></div><div><span>Freight &amp; other charges</span><b>'+money(t.charges)+'</b></div><div><span>Tax on charges (known)</span><b>'+money(t.chargeTax)+'</b></div><div class="grand"><span>Estimated supplier total</span><b>'+money(t.total)+'</b></div></div>'+(t.taxIncomplete?'<p class="muted">Some tax information is missing. Total excludes unknown tax.</p>':'');}
function openLayer(id){const el=$(id);el.classList.add("open");el.setAttribute("aria-hidden","false");D.body.classList.add("vm-dialog-open");}
function closeLayer(id){$(id).classList.remove("open");$(id).setAttribute("aria-hidden","true");D.body.classList.remove("vm-dialog-open");state.focus?.focus();}
function updateParents(cId,vId,bId,eId,keepVendor=false){
 const c=Q.company(cId),vSel=$("vq-f-vendor"),bSel=$("vq-f-branch"),eSel=$("vq-f-enquiry");
 const eligible=Q.vendors().filter(x=>x.status==="Active"&&x.companyIds.includes(cId));
 vSel.innerHTML=options(keepVendor?retain(eligible,vId,Q.vendor(vId)?.name+" (inactive or outside scope)"):eligible,vId,"Choose vendor");
 const bs=(c?.branches||[]).filter(x=>x.status!=="Inactive");bSel.innerHTML=options(bs,bId,"Any branch in this company");
 const es=Q.enquiries().filter(x=>x.companyId===cId&&(!bSel.value||x.branchId===bSel.value)).map(x=>({id:x.id,label:x.id+" · "+x.title}));
 eSel.innerHTML=options(es,eId,"No specific enquiry");
 for(const id of ["vq-f-vendor","vq-f-branch","vq-f-enquiry","vq-new-vendor","vq-new-branch"])$(id).disabled=!cId;
}
function refreshCompanies(id){$("vq-f-company").innerHTML=options(M.entities().filter(x=>x.status!=="Inactive"),id,"Choose our purchasing company");}
function lineOpts(kind,id,snapshot){const a=Q.items().filter(x=>x.kind===kind&&x.status==="Active");return options(retain(a,id,snapshot?.label),id,"Choose "+(kind==="service"?"service / sub-service":"product / SKU"));}
function rowHTML(l={}){
 const kind=l.kind||"product",item=Q.items().find(x=>x.id===l.itemId&&x.kind===kind),unit=l.unit||item?.unit||"";
 return '<section class="vq-line"><input type="hidden" name="lineId" value="'+esc(l.id||"")+'"><div class="vq-line-top"><b class="vq-line-index">Item</b>'+btn("Remove",'data-vq-remove-line="yes"')+'</div>'+
 '<div class="vq-line-grid"><label>Item type<select name="kind">'+[["product","Product"],["service","Service"],["custom","Custom / unmapped"]].map(([id,title])=>opt(id,title,kind)).join("")+'</select></label><label class="vq-line-select"'+(kind==="custom"?" hidden":"")+'>Product / service<div class="vq-item-picker"><select name="itemId">'+lineOpts(kind,l.itemId||"",l.itemSnapshot)+'</select>'+btn("+ Add New",'data-vq-new-item="yes"')+'</div></label>'+
 '<label class="vq-custom"'+(kind==="custom"?"":" hidden")+'>Custom item description<input name="customDescription" value="'+esc(kind==="custom"?l.description:"")+'" placeholder="Supplier item not in the catalog"></label></div>'+
 '<div class="vq-num-grid">'+field("quantity","Quantity",l.quantity??1,"number",'min="0.0001" step="any"')+field("unit","Unit",unit,"text",kind==="custom"?"":"readonly")+field("rate","Purchase rate / unit (₹)",l.rate??"","number",'min="0" step="0.01"')+field("taxRate","GST % (optional)",l.taxRate??"","number",'min="0" max="100" step="0.01"')+'</div>'+
 '<details class="vq-line-description"><summary>Item remarks / supplier description (optional)</summary>'+area("remarks","Remarks",l.remarks||"")+'</details><p class="vq-line-total">Before GST: <span>₹0.00</span></p></section>';
}
const rfield=(r,n)=>r.querySelector('[name="'+n+'"]');
function readLines(){
 return Array.from($("vq-lines").querySelectorAll(".vq-line")).map(r=>({id:rfield(r,"lineId").value,kind:rfield(r,"kind").value,itemId:rfield(r,"itemId").value,description:rfield(r,"kind").value==="custom"?rfield(r,"customDescription").value:"",unit:rfield(r,"unit").value,quantity:rfield(r,"quantity").value,rate:rfield(r,"rate").value,taxRate:rfield(r,"taxRate").value,remarks:rfield(r,"remarks").value}));
}
function safeNum(x){const n=Number(x);return Number.isFinite(n)&&n>=0?n:0;}
function recalc(){
 if(!state.formOpen)return;
 const lines=readLines().filter(l=>l.itemId||l.description||l.rate).map(l=>({...l,quantity:safeNum(l.quantity),rate:safeNum(l.rate),taxRate:l.taxRate===""?null:safeNum(l.taxRate)}));
 Array.from($("vq-lines").querySelectorAll(".vq-line")).forEach((r,i)=>{r.querySelector(".vq-line-index").textContent="Item "+(i+1);r.querySelector(".vq-line-total span").textContent=money(safeNum(rfield(r,"quantity").value)*safeNum(rfield(r,"rate").value));});
 const form=$("vq-form"),get=n=>form.querySelector('[name="'+n+'"]').value;
 $("vq-editor-total").innerHTML=totalHtml(Q.totals({lines,freight:safeNum(get("freight")),otherCharges:safeNum(get("otherCharges")),chargeTaxRate:get("chargeTaxRate")===""?null:safeNum(get("chargeTaxRate"))}));
}
function addLine(l){$("vq-lines").insertAdjacentHTML("beforeend",rowHTML(l));recalc();}
function chooseItem(row,id){
 const kind=rfield(row,"kind").value,sel=rfield(row,"itemId"),item=Q.items().find(x=>x.id===id&&x.kind===kind);
 sel.innerHTML=lineOpts(kind,id,item);sel.value=id;rfield(row,"unit").value=item?.unit||"";recalc();
}
function openEditor(id="",prefill={},copyMode=false){
 const orig=id?offer(id):null;if(id&&!orig)return;
 if(orig&&!copyMode&&!["Draft","Pending verification","Returned"].includes(orig.status)){say("Verified or archived offers are locked. Copy as New Offer to record a changed offer.");return;}
 state.editor=orig&&!copyMode?copy(orig):null;state.formOpen=true;state.focus=D.activeElement;
 const o=orig?copy(orig):{companyId:prefill.companyId||"",vendorId:prefill.vendorId||"",received:Q.today(),quoteDate:Q.today(),lines:[],evidence:[]};
 if(copyMode){o.reference="";o.received=Q.today();o.quoteDate=Q.today();o.validUntil="";o.evidence=[];o.lines=o.lines.map(l=>({...l,id:""}));}
 $("vq-title").textContent=orig&&!copyMode?"Edit Vendor Quotation":copyMode?"Copy as New Vendor Quotation":"Add Vendor Quotation";
 $("vq-fields").innerHTML='<div class="vq-section"><h3>1. Supplier and reference</h3><div class="vq-form-grid">'+select("companyId","Our purchasing company *","vq-f-company","",btn("+ Add New",'data-vq-master="company"'))+select("vendorId","Vendor / supplier *","vq-f-vendor","",'<button class="btn" id="vq-new-vendor" type="button" data-vq-master="vendor">+ Add New</button>')+
 field("reference","Supplier quotation reference",o.reference||"","text",'maxlength="150" placeholder="e.g. SUP-2026-001"')+field("quoteDate","Supplier quotation date",o.quoteDate||"","date")+field("received","Received date *",o.received||Q.today(),"date")+field("validUntil","Valid until",o.validUntil||"","date")+'</div><details class="vq-line-description"><summary>Link to a branch or enquiry (optional)</summary><div class="vq-form-grid">'+select("branchId","Branch","vq-f-branch","",'<button class="btn" id="vq-new-branch" type="button" data-vq-master="branch">+ Add New</button>')+select("opportunityId","Related enquiry","vq-f-enquiry","")+'</div><p class="muted">Leave blank for general company-wide supplier rates. Enquiry-specific rates can only be applied within that enquiry.</p></details></div>'+
 '<div class="vq-section"><div class="vm-heading"><div><h3>2. Products &amp; services quoted</h3><p class="muted">Enter the purchase rate before GST. Select exact products or services from the existing masters.</p></div>'+btn("+ Add Item",'data-vq-add-line="yes"',true)+'</div><div id="vq-lines"></div></div>'+
 '<details class="vq-section"><summary><b>Additional charges and terms (optional)</b></summary><div class="vq-form-grid">'+field("freight","Freight / transport before tax (₹)",o.freight??"","number",'min="0" step="0.01"')+field("otherCharges","Other charges before tax (₹)",o.otherCharges??"","number",'min="0" step="0.01"')+field("chargeTaxRate","GST on additional charges %",o.chargeTaxRate??"","number",'min="0" max="100" step="0.01"')+area("payment","Payment terms",o.payment||"")+area("delivery","Delivery terms",o.delivery||"")+area("remarks","Notes / commercial conditions",o.remarks||"")+'</div><p class="muted">Charges are separate from item rates and not automatically copied to customer pricing.</p></details>'+
 '<div class="vq-section"><h3>3. Original quotation evidence</h3><p class="muted">Select fictional files for filename/size references. Files are not uploaded or reviewed here. You can record an offer without evidence, but cannot verify it until evidence metadata is attached.</p><label>Choose sample supplier quotation files<input name="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx,.txt"></label>'+(o.evidence?.length?'<p>Existing references: '+esc(o.evidence.map(f=>f.name).join(", "))+'</p><label class="vq-check"><input name="removeEvidence" type="checkbox"> Remove existing evidence references on save</label>':"")+'</div>'+
 '<div class="vq-section"><h3>Estimated totals (INR)</h3><div id="vq-editor-total"></div><p class="muted">Save Draft allows missing rates and reference details. Record Offer requires complete quoted items, dates and reference. Verification is always a separate action.</p></div>';
 let co=o.companyId||((o.vendorId&&Q.vendor(o.vendorId)?.companyIds.length===1)?Q.vendor(o.vendorId).companyIds[0]:"");
 refreshCompanies(co);updateParents(co,o.vendorId,o.branchId,o.opportunityId,!!state.editor);
 (o.lines.length?o.lines:[{}]).forEach(addLine);
 $("vq-error").hidden=true;openLayer("vq-overlay");$("vq-f-company").focus();recalc();
}
function closeEditor(){state.formOpen=false;state.editor=null;closeLayer("vq-overlay");}
function saveEditor(e){
 e.preventDefault();if(!state.formOpen)return;
 try{
 const form=$("vq-form"),fd=new FormData(form),input={};
 for(const k of ["companyId","vendorId","branchId","opportunityId","reference","received","quoteDate","validUntil","freight","otherCharges","chargeTaxRate","payment","delivery","remarks"])input[k]=fd.get(k);
 input.lines=readLines();input.files=Array.from(form.querySelector('[name="files"]').files||[]).map(f=>({name:f.name,size:f.size,type:f.type}));input.removeEvidence=fd.has("removeEvidence");
 const latest=copy(Q.db()),old=state.editor;if(old&&JSON.stringify(latest.offers.find(x=>x.id===old.id))!==JSON.stringify(old))throw Error("The offer changed in another tab. Cancel and refresh before editing.");
 const o=Q.build(input,old,latest,e.submitter?.dataset.record==="yes");
 if(old)latest.offers=latest.offers.map(x=>x.id===old.id?o:x);else latest.offers.unshift(o);
 if(!W.CPQ_SHARED.save("vendorOffers",latest))throw Error("Browser storage could not save this offer; your form remains open.");
 W.CPQ_VENDOR_OFFERS=latest;state.selected=o.id;closeEditor();$("vq-search").value="";$("vq-status").value="all";$("vq-company").value="all";filterOptions();$("vq-vendor").value="all";render();say(o.status==="Draft"?"Supplier draft saved.":"Offer recorded. Verify its rates separately.");
 }catch(err){error("vq-error",err.message);}
}
function openReview(id,mode){
 const o=offer(id);if(!o)return;state.review={offer:copy(o),mode};state.reviewOpen=true;state.focus=D.activeElement;
 $("vq-review-title").textContent=mode==="archive"?"Archive supplier offer":"Check supplier rates";
 $("vq-review-fields").innerHTML='<p><b>'+esc(o.reference||o.id)+'</b> · '+esc(o.vendorName)+'</p>'+(mode==="archive"?'<div class="vq-review-note">Archive preserves the original and history. New draft quotations cannot select an archived offer.</div>':'<div class="vq-review-note">Simulated reviewer only. Compare each quoted quantity/rate against the original supplier file in the intended production workflow. Evidence metadata: '+esc(o.evidence.map(f=>f.name).join(", ")||"Missing")+'.</div><label>Decision<select name="decision"><option value="verify">Verify rates (demo)</option><option value="return">Return for correction</option></select></label><label class="vq-check"><input type="checkbox" name="ack"> I understand this is only a simulation, and have reviewed the sample rate entries.</label>')+area("note",mode==="archive"?"Archive reason *":"Verification remarks *","");
 $("vq-review-submit").textContent=mode==="archive"?"Archive offer":"Record decision";$("vq-review-error").hidden=true;openLayer("vq-review");$("vq-review-fields").querySelector("textarea").focus();
}
function closeReview(){state.reviewOpen=false;state.review=null;closeLayer("vq-review");}
$("vq-review-form").addEventListener("submit",e=>{
 e.preventDefault();if(!state.review)return;
 try{const fd=new FormData(e.target),latest=copy(Q.db()),{offer:old,mode}=state.review,o=latest.offers.find(x=>x.id===old.id);if(JSON.stringify(o)!==JSON.stringify(old))throw Error("Offer changed. Reopen it before recording a decision.");
 if(mode==="check"&&fd.get("decision")==="verify"&&!fd.has("ack"))throw Error("Confirm the sample verification acknowledgement.");
 const changed=mode==="archive"?Q.archive(o,fd.get("note")):Q.decide(o,fd.get("decision"),fd.get("note"));
 latest.offers=latest.offers.map(x=>x.id===changed.id?changed:x);if(!W.CPQ_SHARED.save("vendorOffers",latest))throw Error("Browser storage could not save the decision.");W.CPQ_VENDOR_OFFERS=latest;closeReview();render();say("Decision saved in demo history.");
 }catch(err){error("vq-review-error",err.message);}
});
$("vq-form").addEventListener("submit",saveEditor);
$("vq-form").addEventListener("input",recalc);
$("vq-form").addEventListener("change",e=>{
 const t=e.target,row=t.closest(".vq-line");
 if(t.id==="vq-f-company")updateParents(t.value,"","","");
 else if(t.id==="vq-f-branch")updateParents($("vq-f-company").value,$("vq-f-vendor").value,t.value,"");
 else if(row&&t.name==="kind"){const kind=t.value;rfield(row,"lineId").value="";row.querySelector(".vq-line-select").hidden=kind==="custom";row.querySelector(".vq-custom").hidden=kind!=="custom";rfield(row,"unit").readOnly=kind!=="custom";rfield(row,"customDescription").value="";chooseItem(row,"");}
 else if(row&&t.name==="itemId"){rfield(row,"lineId").value="";chooseItem(row,t.value);}
 recalc();
});
for(const id of ["vq-close","vq-cancel"])$(id).addEventListener("click",closeEditor);
for(const id of ["vq-review-close","vq-review-cancel"])$(id).addEventListener("click",closeReview);
for(const [id,fn] of [["vq-overlay",closeEditor],["vq-review",closeReview]])$(id).addEventListener("click",e=>{if(e.target===$(id))fn();});
$("vq-add").addEventListener("click",()=>openEditor());
$("vq-expand").addEventListener("click",()=>{state.selected="";render();});
$("vq-clear").addEventListener("click",()=>{$("vq-search").value="";$("vq-company").value="all";filterOptions();$("vq-vendor").value="all";$("vq-status").value="all";render();});
$("vq-search").addEventListener("input",render);
$("vq-company").addEventListener("change",()=>{$("vq-vendor").value="all";filterOptions();render();});
for(const id of ["vq-vendor","vq-status"])$(id).addEventListener("change",render);
D.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("cpq-qc-dialog")?.open){if(state.reviewOpen)closeReview();else if(state.formOpen)closeEditor();}});
D.addEventListener("click",e=>{
 const t=e.target.closest("button");if(!t)return;const d=t.dataset;
 if(d.vqView){state.selected=d.vqView;render();}
 else if(d.vqNew)openEditor();
 else if(d.vqEdit)openEditor(d.vqEdit);
 else if(d.vqCopy)openEditor(d.vqCopy,{},true);
 else if(d.vqCheck)openReview(d.vqCheck,"check");
 else if(d.vqArchive)openReview(d.vqArchive,"archive");
 else if(d.vqAddLine)addLine({});
 else if(d.vqRemoveLine){t.closest(".vq-line").remove();recalc();}
 else if(d.vqNewItem){const row=t.closest(".vq-line"),type=rfield(row,"kind").value;if(type==="custom")return;W.CPQ_QUICK_CREATE?.open(type,{},r=>{rfield(row,"lineId").value="";chooseItem(row,r.id);},t,true);}
 else if(d.vqMaster){
  const type=d.vqMaster,co=$("vq-f-company").value,ve=$("vq-f-vendor").value,br=$("vq-f-branch").value,op=$("vq-f-enquiry").value;
  W.CPQ_QUICK_CREATE?.open(type,{companyId:co},r=>{if(type==="company"){refreshCompanies(r.id);updateParents(r.id,"","","");}else if(type==="vendor")updateParents(co,r.id,br,op);else if(type==="branch")updateParents(co,ve,r.id,"");},t);
 }
 else if(d.planned)W.alert(d.planned+" is a planned wireframe module.");
});
filterOptions();const params=new URLSearchParams(W.location.search),vid=params.get("vendor"),oid=params.get("offer");if(vid&&Q.vendor(vid))$("vq-vendor").value=vid;if(offer(oid))state.selected=oid;render();if(params.get("action")==="new"&&vid&&Q.vendor(vid))openEditor("",{vendorId:vid,companyId:Q.vendor(vid).companyIds.length===1?Q.vendor(vid).companyIds[0]:""});
})();