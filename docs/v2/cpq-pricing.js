/* CPQ V2 pricing workspace. All prices/costs are fictional; no server-side policy. */
(()=>{
"use strict";
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const n=x=>Number.isFinite(Number(x))?Math.max(0,Number(x)):0;
const round=x=>Math.round((Number(x)+Number.EPSILON)*100)/100;
const fmt=x=>"₹"+n(x).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const signed=x=>x<0?"−"+fmt(-x):fmt(x);
const validNumber=x=>x!==""&&x!==null&&x!==undefined&&Number.isFinite(Number(x))&&Number(x)>=0&&Number(x)<=1e12;
const pricePositive=x=>validNumber(x)&&Number(x)>0;
const equal=(a,b)=>Math.abs(Number(a)-Number(b))<0.005;
const kinds=[["labour","Labour"],["installation","Installation"],["transport","Transportation"],["handling","Loading / unloading"],["engineering","Engineering & design"],["survey","Site survey"],["subcontract","Subcontractor"],["commission","Commission"],["admin","Administrative expenses"],["overhead","Overhead"],["contingency","Contingency"],["other","Other custom cost"]];
const privateKinds=new Set(["commission","admin","overhead","contingency"]);
const methods=[["fixed","Fixed amount"],["quantity","Quantity × rate"],["percent-cost","% of direct BOQ cost"],["percent-sale","% of net sale (before tax)"]];
const defaultPricing=()=>({version:1,method:"standard",markup:20,costs:[],history:[]});
const variant=id=>window.CPQ_MA006A_CATALOG?.variants?.find(v=>v.id===id);
function captureLine(line,fresh=false){
 const tax=fresh?window.CPQ_TAX.capture(line):line.taxSnapshot;
 if(line.pricing)return line.pricing;
 const v=window.CPQ_CUSTOM_BOQ?.is(line)?null:variant(line.sourceVariantId||line.productId),p=v?.price||{};
 const isMasterService=Boolean(line.serviceId);
 const original=n(line.unitPrice);
 const validCurrency=!p.currency||p.currency==="INR";
 const knownCatalogPrice=fresh&&v&&validCurrency&&pricePositive(p.sell);
 const knownLegacyPrice=fresh&&!v&&!isMasterService&&!window.CPQ_CUSTOM_BOQ?.is(line)&&original>0;
 const base=fresh?(knownCatalogPrice?window.CPQ_TAX.net(p.sell,tax,tax?.sellBasis):knownLegacyPrice?round(original):null):(original>0?round(original):null);
 const cost=fresh&&v&&validCurrency&&pricePositive(p.cost)?window.CPQ_TAX.net(p.cost,tax,tax?.costBasis):null;
 const source=fresh?(v?(knownCatalogPrice?(p.list||"Sample Product Master"):(validCurrency?"Catalog rate unavailable":"Catalog currency mismatch")):
  window.CPQ_CUSTOM_BOQ?.is(line)?"Custom item — manual rate":isMasterService?"Service Master — manual rate":knownLegacyPrice?"Legacy sample rate":"Manual rate required"):
  "Existing draft rate retained — original list not captured";
 line.pricing={defaultRate:base,unitCost:cost,source,currency:"INR",effectiveFrom:fresh&&v?String(p.from||""):"",
  effectiveTo:fresh&&v?String(p.to||""):"",capturedAt:new Date().toISOString(),overrideReason:""};
 if(fresh)line.unitPrice=line.includedInParent?0:(base??0);
 return line.pricing;
}
function prepare(q,fresh=false){
 if(!q.pricing)q.pricing=defaultPricing();
 for(const l of q.lines||[])captureLine(l,fresh);
 return q.pricing;
}
function lineTotal(l){return l.includedInParent?0:round(n(l.quantity)*n(l.unitPrice));}
function publicCharges(q){
 return (q.pricing?.costs||[]).filter(c=>c.separate&&!privateKinds.has(c.kind)&&pricePositive(c.chargeAmount))
  .map(c=>({id:c.id,label:String(c.customerLabel||kinds.find(k=>k[0]===c.kind)?.[1]||"Additional service").trim(),amount:round(c.chargeAmount)}));
}
function costAmount(c,direct,net){
 if(c.method==="quantity")return round(n(c.quantity)*n(c.rate));
 if(c.method==="percent-cost")return round(direct*n(c.rate)/100);
 if(c.method==="percent-sale")return round(net*n(c.rate)/100);
 return round(n(c.rate));
}
function calculate(q){
 const lines=q.lines||[],pricing=q.pricing||defaultPricing(),costs=pricing.costs||[];
 const boqSubtotal=round(lines.reduce((a,l)=>a+lineTotal(l),0));
 const publicRows=publicCharges(q);
 const charges=round(publicRows.reduce((a,c)=>a+c.amount,0));
 const subtotal=round(boqSubtotal+charges);
 const cm=window.CPQ_COMMERCIAL,plan=cm.enabled(q)?cm.plan(q,lines,publicRows):null;
 const discountRate=plan?(q.commercial.overall.mode==="percent"?Math.min(100,n(q.commercial.overall.value))/100:0):Math.min(100,n(q.discount))/100;
 const discount=plan?plan.discount:round(subtotal*discountRate);
 const taxable=plan?plan.net:round(Math.max(0,subtotal-discount));
 const gst=window.CPQ_TAX.enabled(q)?window.CPQ_TAX.calculate(q,lines,publicRows,discount,plan):null;
 const tax=gst?gst.tax:round(taxable*Math.min(100,n(q.taxRate))/100);
 const commercial=plan?cm.finish(q,plan,gst,tax):null;
 const missing=lines.filter(l=>!validNumber(l.pricing?.unitCost)).length;
 const directCost=round(lines.reduce((a,l)=>a+(validNumber(l.pricing?.unitCost)?round(n(l.quantity)*n(l.pricing.unitCost)):0),0));
 const extraCost=round(costs.reduce((a,c)=>a+costAmount(c,directCost,taxable),0));
 const totalCost=round(directCost+extraCost);
 const profit=missing?null:round(taxable-totalCost);
 const margin=profit===null||taxable<=0?null:profit/taxable*100;
 const actualMarkup=profit===null||totalCost<=0?null:profit/totalCost*100;
 const markup=n(pricing.markup)/100;
 const fixedCosts=round(directCost+costs.filter(c=>c.method!=="percent-sale").reduce((a,c)=>a+costAmount(c,directCost,0),0));
 const salePct=costs.filter(c=>c.method==="percent-sale").reduce((a,c)=>a+n(c.rate)/100,0);
 const denominator=1-salePct*(1-discountRate)*(1+markup);
 const targetBlocked=!!plan&&(plan.itemDiscount>0||(q.commercial.overall.mode==="fixed"&&plan.overallDiscount>0));
 const target=missing||denominator<=0||targetBlocked?null:round(fixedCosts*(1+markup)/denominator);
 return {boqSubtotal,charges,publicRows,subtotal,discount,taxable,tax,gst,commercial,total:commercial?commercial.total:round(taxable+tax),directCost,extraCost,totalCost,missing,profit,margin,actualMarkup,target,denominator,targetBlocked};
}
function requiresReason(l){
 return !l.includedInParent&&pricePositive(l.unitPrice)&&
  (l.pricing?.defaultRate==null||!equal(l.unitPrice,l.pricing.defaultRate));
}
function setRate(q,l,value,reason=""){
 prepare(q);const p=l.pricing;
 if(l.includedInParent)return false;
 if(!validNumber(value))throw Error("Enter a non-negative selling rate.");
 const next=round(value),old=n(l.unitPrice);
 if(equal(next,old)){
  if(reason&&requiresReason(l))setReason(q,l,reason);
  return false;
 }
 l.unitPrice=next;p.overrideReason=requiresReason(l)?String(reason||"").trim().slice(0,300):"";
 q.pricing.history.push({at:new Date().toISOString(),actor:"Demo employee",lineId:l.id,item:l.description,
  before:old,after:next,reason:reason||(!requiresReason(l)?"Restored captured default":"Reason pending")});
 return true;
}
function setReason(q,l,reason){
 prepare(q);l.pricing.overrideReason=String(reason||"").trim().slice(0,300);
 const last=[...q.pricing.history].reverse().find(h=>h.lineId===l.id&&equal(h.after,l.unitPrice));
 if(last&&requiresReason(l))last.reason=l.pricing.overrideReason||"Reason pending";
}
function addCost(q){
 const p=prepare(q);
 if(p.costs.length>=100)throw Error("The wireframe supports up to 100 additional cost rows.");
 const id="C"+(Math.max(0,...p.costs.map(c=>Number(String(c.id).replace(/\D/g,""))||0))+1);
 p.costs.push({id,kind:"labour",name:"Labour",method:"fixed",rate:0,quantity:1,separate:false,customerLabel:"Labour charges",chargeAmount:0});
 return id;
}
function updateCost(q,id,field,value){
 const c=prepare(q).costs.find(x=>x.id===id);
 if(!c)return;
 if(field==="kind"){
  if(String(value).startsWith("custom:")){
   const name=String(value).slice(7);
   if(!(window.CPQ_MA006_DATA?.customCostTypes||[]).includes(name))return;
   c.kind="other";c.customType=name;c.name=name;c.customerLabel=name+" charges";c.separate=false;c.chargeAmount=0;return;
  }
  if(!kinds.some(x=>x[0]===value))return;
  delete c.customType;
  c.kind=value;c.name=kinds.find(x=>x[0]===value)[1];
  c.customerLabel=c.name+" charges";
  if(privateKinds.has(value)){c.separate=false;c.chargeAmount=0;}
 }else if(field==="method"){
  if(!methods.some(x=>x[0]===value))return;
  if(c.method!==value){c.method=value;c.rate=0;}
 }else if(field==="separate"){
  const was=c.separate;c.separate=value==="yes"&&!privateKinds.has(c.kind);
  if(!was&&c.separate){
   const t=calculate(q);c.chargeAmount=costAmount(c,t.directCost,t.taxable);
  }
  if(!c.separate)c.chargeAmount=0;
 }else if(["name","customerLabel"].includes(field))c[field]=String(value||"").slice(0,150);
 else if(["rate","quantity","chargeAmount"].includes(field)){
  if(!validNumber(value))throw Error("Use a valid non-negative numeric amount.");
  if(field==="rate"&&c.method.startsWith("percent")&&Number(value)>100)throw Error("Percentages must be between 0 and 100.");
  if(field==="quantity"&&Number(value)<=0)throw Error("Enter a positive quantity.");
  c[field]=round(value);
 }
}
function removeCost(q,id){const p=prepare(q);p.costs=p.costs.filter(c=>c.id!==id);}
function applyVendorRate(q,l,key){
 prepare(q);
 if(!window.CPQ_VENDOR_QUOTE)throw Error("Vendor quotations are unavailable.");
 const s=window.CPQ_VENDOR_QUOTE.snapshot(q,l,key),before=l.pricing.unitCost,old=l.pricing.vendorRate||null;
 l.pricing.unitCost=round(s.rate);l.pricing.vendorRate=s;
 (q.pricing.vendorHistory??=[]).push({at:new Date().toISOString(),lineId:l.id,item:l.description,action:"Supplier rate applied",before,after:l.pricing.unitCost,previous:old,source:s});
}
function clearVendorRate(q,l,newCost=null){
 prepare(q);const old=l.pricing.vendorRate;
 if(old)(q.pricing.vendorHistory??=[]).push({at:new Date().toISOString(),lineId:l.id,item:l.description,action:"Supplier source cleared / manual costing",before:l.pricing.unitCost,after:newCost,previous:old});
 delete l.pricing.vendorRate;l.pricing.unitCost=newCost;
}
function supplierIssues(q,review=false){return (q.lines||[]).map(l=>window.CPQ_VENDOR_QUOTE?.snapshotIssues(q,l,review)||"").filter(Boolean);}
function errors(q){
 if(!q.pricing)return [];
 const p=q.pricing,err=[...supplierIssues(q),...window.CPQ_COMMERCIAL.errors(q,calculate(q))];
 if(q.currency!=="INR")err.push("This pricing wireframe uses INR only; no currency conversion is available.");
 if(!["standard","cost-plus"].includes(p.method)||!validNumber(p.markup)||n(p.markup)>500)err.push("Choose a valid pricing method and markup between 0 and 500%.");
 for(const l of q.lines||[]){
  if(l.pricing?.unitCost!=null&&!validNumber(l.pricing.unitCost))err.push("Invalid unit cost: "+l.description);
 }
 for(const c of p.costs||[]){
  if(!String(c.name||"").trim())err.push("Enter a name for each additional cost.");
  if(!kinds.some(x=>x[0]===c.kind)||!methods.some(x=>x[0]===c.method)||!validNumber(c.rate))err.push("Invalid additional cost: "+(c.name||c.id));
  if(c.method==="quantity"&&(!validNumber(c.quantity)||n(c.quantity)<=0))err.push("Enter a positive quantity for "+c.name);
  if(c.method.startsWith("percent")&&n(c.rate)>100)err.push("Percentage cannot exceed 100% for "+c.name);
  if(c.separate&&(privateKinds.has(c.kind)||!String(c.customerLabel||"").trim()||!validNumber(c.chargeAmount)))err.push("Invalid customer-facing charge for "+c.name);
 }
 return err;
}
function applyTarget(q){
 prepare(q);
 const issues=errors(q);if(issues.length)throw Error(issues[0]);
 const t=calculate(q);
 if(t.targetBlocked)throw Error("Clear item and fixed overall discounts before applying a cost-plus target, then negotiate and review actual margin.");
 if(t.missing)throw Error("Enter a unit cost for every BOQ line first. Use 0 only where there is genuinely no additional direct cost.");
 if(t.target===null||t.denominator<=0)throw Error("This cost/commission/markup combination has no valid cost-plus target.");
 const billable=q.lines.filter(l=>!l.includedInParent);
 const desired=round(t.target-t.charges);
 if(!billable.length||desired<=0)throw Error("The target must cover positive billable BOQ rates after separate customer charges.");
 const weights=billable.map(l=>n(l.quantity)*(n(l.pricing.unitCost)||n(l.unitPrice)||1));
 const sum=weights.reduce((a,v)=>a+v,0);
 const rates=billable.map((l,i)=>round(desired*weights[i]/sum/n(l.quantity)));
 if(rates.some(r=>!pricePositive(r)))throw Error("The target produces a zero or invalid billable rate. Adjust costs/markup or set the rates manually.");
 q.pricing.method="cost-plus";
 billable.forEach((l,i)=>setRate(q,l,rates[i],"Applied cost-plus target: "+q.pricing.markup+"% markup on estimated cost"));
 return calculate(q);
}
const input=(attrs,value,type="number")=>'<input type="'+type+'" '+(type==="number"?'min="0" step="0.01" ':'maxlength="300" ') +attrs+' value="'+esc(value??"")+'">';
const select=(attrs,choices,current)=>'<select '+attrs+'>'+choices.map(([id,label])=>'<option value="'+esc(id)+'"'+(String(current)===String(id)?" selected":"")+'>'+esc(label)+'</option>').join("")+'</select>';
const metric=(label,value,small="")=>'<div class="cpq-price-metric"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong>'+(small?'<span>'+esc(small)+'</span>':'')+'</div>';
function metrics(q){
 const t=calculate(q);
 return '<div class="cpq-price-metrics">'+metric("BOQ direct cost",fmt(t.directCost),t.missing?t.missing+" line cost(s) not entered":"Captured estimates")+
 metric("Additional internal costs",fmt(t.extraCost))+
 metric(t.missing?"Known cost only":"Total estimated cost",fmt(t.totalCost),t.missing?"Incomplete estimate":"Before tax")+
 metric("Net selling price",fmt(t.taxable),"After discount · before tax")+
 metric("Estimated profit",t.profit===null?"Not available":signed(t.profit),t.profit===null?"Complete missing costs":t.profit<0?"Below estimated cost":"Before tax")+
 metric("Estimated margin",t.margin===null?"Not available":t.margin.toFixed(2)+"%",t.actualMarkup===null?"":"Markup on cost: "+t.actualMarkup.toFixed(2)+"%")+'</div>';
}
function history(q){
 const rows=q.pricing?.history||[];
 if(!rows.length)return '<p class="cpq-price-help">No offered-rate changes recorded yet.</p>';
 return '<details class="cpq-price-history"><summary>Quotation-specific offered-rate history ('+rows.length+')</summary>'+
 '<div class="cpq-price-scroll"><table><thead><tr><th>Item</th><th>Previous rate</th><th>New rate</th><th>Reason</th><th>Recorded</th></tr></thead><tbody>'+
 [...rows].reverse().map(h=>'<tr><td>'+esc(h.item)+'</td><td>'+fmt(h.before)+'</td><td>'+fmt(h.after)+'</td><td>'+esc(h.reason)+'</td><td>'+esc(h.actor)+'<small>'+esc(String(h.at||"").replace("T"," ").slice(0,19))+'</small></td></tr>').join("")+'</tbody></table></div></details>';
}
function offerLink(q,l){
 const id=l.serviceId||l.sourceVariantId||l.modelSnapshot?.variantId||"";
 if(!id||!q.companyId)return "vendor-quotations.html";
 const p=new URLSearchParams({action:"new",company:q.companyId,branch:q.branchId||"",enquiry:q.opportunityId||"",kind:l.serviceId?"service":"product",item:id,quantity:String(l.quantity||1)});
 return "vendor-quotations.html?"+p.toString();
}
function vendorRatePicker(q,l){
 if(window.CPQ_CUSTOM_BOQ?.is(l))return '<small>Custom item: enter a manually reviewed purchase cost. No automatic SKU rate matching.</small>';
 const s=l.pricing?.vendorRate,choices=window.CPQ_VENDOR_QUOTE?.choices(q,l)||[],issue=window.CPQ_VENDOR_QUOTE?.snapshotIssues(q,l,true)||"";
 if(l.includedInParent&&!s)return "";
 return '<details class="cpq-vendor-rate"'+(s||choices.length?' open':'')+'><summary>Supplier rate'+(s?' · captured':choices.length?' · available':'')+'</summary>'+(s?'<small><b>Supplier source:</b> '+esc(s.vendorName)+" · "+esc(s.reference)+'<br>Valid until '+esc(s.validUntil)+' · '+fmt(s.rate)+' before GST</small>'+(issue?'<small class="cpq-price-warning">'+esc(issue)+'</small>':"")+'<button type="button" class="btn cpq-price-small" data-action="price-clear-vendor" data-price-line="'+esc(l.id)+'">Clear supplier source</button>':"")+
 (choices.length?'<select data-vendor-rate-select aria-label="Verified supplier rate for '+esc(l.description)+'"><option value="">Select verified supplier rate</option>'+choices.map(c=>'<option value="'+esc(c.key)+'">'+esc(c.offer.vendorName+" · "+c.offer.reference+" · "+fmt(c.line.rate))+'</option>').join("")+'</select><button type="button" class="btn cpq-price-small" data-action="price-apply-vendor" data-price-line="'+esc(l.id)+'">Use supplier rate</button>':'<small>No eligible verified offer for this company, item, unit and quantity.</small>')+
 '<small><a href="'+esc(offerLink(q,l))+'" target="_blank" rel="noopener">+ Record supplier offer ↗</a> · <button class="btn cpq-price-small" type="button" data-action="price-refresh-vendor">Refresh rates</button></small></details>';
}
function supplierSummary(q){
 const xs=(q.lines||[]).filter(l=>l.pricing?.vendorRate),hs=q.pricing?.vendorHistory||[];
 if(!xs.length&&!hs.length)return "";
 return '<details class="cpq-price-history"><summary>Internal supplier cost sources ('+xs.length+') &amp; changes ('+hs.length+')</summary>'+xs.map(l=>{const s=l.pricing.vendorRate;return '<p><b>'+esc(l.description)+'</b> · '+esc(s.vendorName)+' · '+esc(s.reference)+' / '+esc(s.offerId)+' · '+fmt(s.rate)+' before GST · valid until '+esc(s.validUntil)+'</p>';}).join("")+
 hs.slice().reverse().map(h=>'<p><small>'+esc(h.at)+' · '+esc(h.action)+' · '+esc(h.item)+' · '+esc((h.source||h.previous)?.reference||"")+'</small></p>').join("")+'<p class="cpq-price-help">Internal only. Freight and tax are not copied into unit cost. Review separate expenses and tax treatment.</p></details>';
}
function pricingView(q,financialRows){
 const p=prepare(q),t=calculate(q);
 const defaultRows=(q.lines||[]).map(l=>{
  const x=l.pricing,attr='data-price-line="'+esc(l.id)+'" ',included=l.includedInParent;
  const changed=requiresReason(l);
  return '<tr><td><strong>'+esc(l.description)+'</strong><small>'+esc(window.CPQ_CUSTOM_BOQ?.is(l)?window.CPQ_CUSTOM_BOQ.label(l):l.modelSnapshot?.sku||l.serviceSnapshot?.code||l.productId)+'</small>'+
   (included?'<small class="cpq-price-included">Included in parent package — no additional revenue</small>':'')+'</td><td>'+esc(l.quantity)+' '+esc(l.unit)+'</td>'+
   '<td>'+ (x.defaultRate==null?'<span class="cpq-price-warning">Not available</span>':fmt(x.defaultRate))+
   '<small>'+esc(x.source)+'</small>'+
   (x.effectiveFrom?'<small>List dates: '+esc(x.effectiveFrom)+(x.effectiveTo?' to '+esc(x.effectiveTo):' onward')+'</small>':'')+'</td>'+
   '<td>'+input(attr+'data-price-field="cost" aria-label="Estimated unit cost '+esc(l.description)+'" placeholder="Unknown"',x.unitCost??"")+
   '<small class="cpq-price-warning" data-cost-missing="'+esc(l.id)+'"'+(x.unitCost==null?'':' hidden')+'>Cost not entered</small>'+vendorRatePicker(q,l)+'</td>'+
   '<td>'+input(attr+'data-price-field="rate" aria-label="Offered selling rate excluding GST '+esc(l.description)+'"'+(included?' disabled':''),l.unitPrice)+
   '<small class="cpq-price-warning" data-rate-changed="'+esc(l.id)+'"'+(changed?'':' hidden')+'>Quote-specific override</small></td>'+
   '<td><strong data-offered-total="'+esc(l.id)+'">'+fmt(lineTotal(l))+'</strong></td>'+
   '<td>'+(!included?input(attr+'data-price-field="reason" aria-label="Price change reason '+esc(l.description)+'" placeholder="'+(changed?"Reason required before review":"Optional change reason")+'"',x.overrideReason,"text")+
    (x.defaultRate!=null?'<button type="button" class="btn cpq-price-small" data-action="price-reset" data-price-line="'+esc(l.id)+'">Reset to default</button>':'<small>Manual rate / RFQ if required</small>'):'<small>Price on parent only</small>')+'</td></tr>';
 }).join("");
 const rows=(p.costs||[]).map(c=>{
  const a='data-cost-id="'+esc(c.id)+'" ',priv=privateKinds.has(c.kind);
  return '<section class="cpq-cost-row"><div class="cpq-cost-head"><strong data-cost-title="'+esc(c.id)+'">'+esc(c.name||"Additional cost")+'</strong><button type="button" class="btn cpq-price-small" data-action="price-remove-cost" data-cost-id="'+esc(c.id)+'">Remove</button></div>'+
   '<div class="cpq-cost-grid"><label>Cost type'+select(a+'data-cost-field="kind"',[...kinds,...(window.CPQ_MA006_DATA?.customCostTypes||[]).map(name=>["custom:"+name,name])],c.customType?"custom:"+c.customType:c.kind)+'</label>'+
   '<label>Internal cost name'+input(a+'data-cost-field="name"',c.name,"text")+'</label>'+
   '<label>Calculation method'+select(a+'data-cost-field="method"',methods,c.method)+'</label>'+
   (c.method==="quantity"?'<label>Quantity'+input(a+'data-cost-field="quantity"',c.quantity)+'</label>':'')+
   '<label>'+(c.method.startsWith("percent")?"Percentage (%)":c.method==="quantity"?"Cost per unit (₹)":"Cost amount (₹)")+
   input(a+'data-cost-field="rate"'+(c.method.startsWith("percent")?' max="100"':''),c.rate)+'</label>'+
   '<div class="cpq-cost-computed"><small>Calculated internal cost</small><strong data-cost-total="'+esc(c.id)+'">'+fmt(costAmount(c,t.directCost,t.taxable))+'</strong></div>'+
   '<label>Customer treatment'+select(a+'data-cost-field="separate"'+(priv?' disabled':''),[["no","Internal / included in offered rates"],["yes","Separate customer charge"]],c.separate?"yes":"no")+'</label>'+
   (c.separate&&!priv?'<label>Customer-facing label'+input(a+'data-cost-field="customerLabel"',c.customerLabel,"text")+'</label>'+
    '<label>Customer charge amount (₹)'+input(a+'data-cost-field="chargeAmount"',c.chargeAmount)+'</label>':'')+
   '</div>'+(priv?'<p class="cpq-price-help">Internal only; this expense is never printed as a customer charge.</p>':'')+'</section>';
 }).join("");
 return '<div class="cpq-pricing-workspace">'+
 '<div class="cpq-price-heading"><div><h3>3 · Pricing &amp; Costing</h3><p>Internal working sheet · Configure the commercial offer without changing Product Master.</p></div><span class="ma6-tag">INR · Demo only</span></div>'+
 '<div class="cpq-price-notice"><b>Default vs offered rate:</b> Product list rates and available purchase costs are captured when items enter this draft. Modify the offered rate for this quotation only. Service rates or unavailable catalog prices can be entered manually. Rates and documents remain fictional.</div>'+
 '<section class="cpq-price-section"><div class="cpq-price-heading"><div><h4>Product &amp; service pricing</h4><p>Exact model/SKU, quantity, original rate, cost estimate, offered rate and change reason.</p></div><button type="button" class="btn" data-step="1">Edit BOQ</button></div>'+
 (defaultRows?'<div class="cpq-price-scroll"><table class="cpq-price-table"><thead><tr><th>BOQ item</th><th>Qty</th><th>Captured net rate / unit</th><th>Internal net cost / unit (₹)</th><th>Offered rate excl. GST / unit (₹)</th><th>Offered amount</th><th>Override reason</th></tr></thead><tbody>'+defaultRows+'</tbody></table></div>':
  '<p class="cpq-price-help">No products or services selected. Go back to Products &amp; BOQ.</p>')+
 '<p class="cpq-price-help">For included children, estimate their direct cost only if not already counted in the parent. Enter 0 explicitly if no separate cost. Quotation rates can be restored to the captured default, not to a silently refreshed master price.</p></section>'+
 '<section class="cpq-price-section"><div class="cpq-price-heading"><div><h4>Additional costs</h4><p>Labour, freight, installation, commission, subcontractors, overhead and any custom costs.</p></div><button type="button" class="btn primary" data-action="price-add-cost">+ Add Cost</button></div>'+
 (rows||'<p class="cpq-price-help">No additional expenses yet. Add a cost only if it is not already included in another direct cost.</p>')+
 '<p class="cpq-price-help">Internal / included costs reduce profitability; they do not automatically increase the offered amount. Recover them in offered rates or use an explicit separate customer charge. Commission based on net sale is calculated after discount, before tax.</p></section>'+
 '<section class="cpq-price-section"><div class="cpq-price-heading"><div><h4>Pricing method &amp; profitability</h4><p>Standard selling prices may already contain profit. Add a markup only by explicitly applying a cost-plus target.</p></div></div>'+
 '<div class="cpq-price-settings"><label>Pricing method'+select('data-pricing-field="method"',[["standard","Standard / negotiated selling prices"],["cost-plus","Cost-plus target"]],p.method)+'</label>'+
 (window.CPQ_COMMERCIAL.enabled(q)?"":'<label>Customer discount (%)'+input('data-field="discount" max="100"',q.discount)+'</label>')+
 ''+(window.CPQ_TAX.enabled(q)?"":'<label>Legacy illustrative tax (%)'+input('data-field="taxRate" max="100"',q.taxRate)+'</label>')+
 (p.method==="cost-plus"?'<label>Target markup on cost (%)'+input('data-pricing-field="markup" max="500"',p.markup)+'</label>':'')+'</div>'+
 (p.method==="cost-plus"?'<div class="cpq-price-target"><div><b data-price-target>Suggested selling amount before discount: '+(t.targetBlocked?"Clear item / fixed discounts to apply target":t.target===null?"Complete cost data / check inputs":fmt(t.target))+'</b><p>Apply once to distribute the target among billable BOQ rates after deducting any separate customer charges. Rates remain editable; unit rounding may produce a small difference. Discounts reduce final profit.</p></div><button type="button" class="btn primary" data-action="price-apply-target">Apply Cost-plus Target</button></div>':'')+
 '<div data-commercial-editor>'+window.CPQ_COMMERCIAL.editor(q,t)+'</div><div data-tax-editor>'+window.CPQ_TAX.editor(q,t)+'</div><div data-commercial-reconciliation>'+window.CPQ_COMMERCIAL.reconciliation(t)+'</div><div data-price-metrics>'+metrics(q)+'</div><div data-price-loss>'+(t.profit!==null&&t.profit<0?'<p class="cpq-price-alert">Below estimated cost — requires a commercial exception review in production.</p>':'')+'</div>'+
 '<div class="cpq-price-final"><div><b>Internal pricing only</b><p>Costs, commission, profit, margin and override history are not included in the customer-facing layout. No actual permission is enforced in this public demo.</p></div><div data-price-summary>'+financialRows(q)+'</div></div>'+
 '<div data-price-history>'+history(q)+'</div></section></div>';
}
function refresh(q,root,financialRows){
 const t=calculate(q);
 const get=selector=>root?.querySelector?.(selector);
 const html=(selector,value)=>{const el=get(selector);if(el)el.innerHTML=value;};
 const text=(selector,value)=>{const el=get(selector);if(el)el.textContent=value;};
 const show=(selector,value)=>{const el=get(selector);if(el)el.hidden=!value;};
 html("[data-commercial-editor]",window.CPQ_COMMERCIAL.editor(q,t));
 html("[data-tax-editor]",window.CPQ_TAX.editor(q,t));
 html("[data-commercial-reconciliation]",window.CPQ_COMMERCIAL.reconciliation(t));
 html("[data-price-metrics]",metrics(q));
 html("[data-price-loss]",t.profit!==null&&t.profit<0?'<p class="cpq-price-alert">Below estimated cost — requires a commercial exception review in production.</p>':"");
 html("[data-price-summary]",financialRows(q));
 const historyOpen=get("[data-price-history] details")?.open;
 html("[data-price-history]",history(q));
 const detail=get("[data-price-history] details");if(detail&&historyOpen)detail.open=true;
 text("[data-price-target]","Suggested selling amount before discount: "+(t.targetBlocked?"Clear item / fixed discounts to apply target":t.target===null?"Complete cost data / check inputs":fmt(t.target)));
 for(const l of q.lines||[]){
  const id=String(l.id).replace(/[^A-Za-z0-9_-]/g,"");
  text('[data-offered-total="'+id+'"]',fmt(lineTotal(l)));
  show('[data-rate-changed="'+id+'"]',requiresReason(l));
  show('[data-cost-missing="'+id+'"]',l.pricing?.unitCost==null);
  const reason=get('[data-price-line="'+id+'"][data-price-field="reason"]');
  if(reason){reason.value=l.pricing?.overrideReason||"";reason.placeholder=requiresReason(l)?"Reason required before review":"Optional change reason";}
 }
 for(const c of q.pricing?.costs||[]){
  const id=String(c.id).replace(/[^A-Za-z0-9_-]/g,"");
  text('[data-cost-total="'+id+'"]',fmt(costAmount(c,t.directCost,t.taxable)));
  text('[data-cost-title="'+id+'"]',c.name||"Additional cost");
 }
}
function internalSummary(q){
 if(!q.pricing)return '<p class="cpq-price-help">Legacy sample: detailed pricing was not captured on this record.</p>';
 return '<section class="cpq-price-section"><div class="cpq-price-heading"><div><h4>Internal Pricing &amp; Costing</h4><p>Estimated internal values · not included in the customer preview.</p></div><span class="ma6-tag">'+esc(q.pricing.method==="cost-plus"?"Cost-plus target":"Standard / negotiated")+'</span></div>'+
 metrics(q)+
 ((q.pricing.costs||[]).length?'<details class="cpq-price-history"><summary>Additional internal expenses ('+q.pricing.costs.length+')</summary><div class="cpq-price-scroll"><table><thead><tr><th>Cost</th><th>Method</th><th>Calculated cost</th><th>Separate customer charge</th></tr></thead><tbody>'+
 q.pricing.costs.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+esc(methods.find(m=>m[0]===c.method)?.[1]||c.method)+'</td><td>'+fmt(costAmount(c,calculate(q).directCost,calculate(q).taxable))+'</td><td>'+(c.separate&&!privateKinds.has(c.kind)?fmt(c.chargeAmount):'Internal / included')+'</td></tr>').join("")+
 '</tbody></table></div></details>':'')+history(q)+supplierSummary(q)+'</section>';
}
window.CPQ_PRICING={prepare,captureLine,lineTotal,publicCharges,calculate,requiresReason,setRate,setReason,addCost,updateCost,removeCost,errors,applyTarget,pricingView,refresh,internalSummary,validNumber,applyVendorRate,clearVendorRate,supplierIssues};
})();
