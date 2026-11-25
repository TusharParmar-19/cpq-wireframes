/* V2 item-wise GST: configurable demo assumptions, never statutory rates. */
(()=>{
"use strict";
const W=window, esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const categories=[["unconfigured","Not configured"],["taxable","Taxable"],["nil","Nil-rated"],["exempt","Exempt"],["non-gst","Non-GST"]];
const bases=[["exclusive","Excluding GST"],["inclusive","Including GST"]];
const jurisdictions=[["","Choose GST treatment"],["intra","Intra-state (CGST + SGST)"],["inter","Inter-state (IGST)"]];
const round=x=>Math.round((Number(x)+Number.EPSILON)*100)/100;
const money=x=>"₹"+Number(x||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const empty=(kind="product")=>({kind,code:"",category:"unconfigured",rate:null,sellBasis:"exclusive",costBasis:"exclusive"});
function normalize(raw,kind="product"){
 const x={...empty(kind),...(raw||{}),kind};
 x.code=String(x.code||"").trim();
 x.category=categories.some(c=>c[0]===x.category)?x.category:"unconfigured";
 x.rate=x.rate===null||x.rate===undefined||x.rate===""?null:Number(x.rate);
 if(["nil","exempt","non-gst"].includes(x.category))x.rate=0;
 if(x.category==="unconfigured")x.rate=null;
 x.sellBasis=x.sellBasis==="inclusive"?"inclusive":"exclusive";
 x.costBasis=x.costBasis==="inclusive"?"inclusive":"exclusive";
 return x;
}
function invalid(t){
 if(t.code&&!(t.kind==="service"?/^\d{6}$/:/^(?:\d{4}|\d{6}|\d{8})$/).test(t.code))return t.kind==="service"?"Enter a six-digit SAC, or leave it blank for review.":"Enter a 4, 6 or 8 digit HSN, or leave it blank for review.";
 if(t.category==="taxable"&&t.rate!==null&&(!Number.isFinite(t.rate)||t.rate<=0||t.rate>100))return "Enter a positive GST percentage up to 100, or select Nil-rated / Exempt / Non-GST.";
 if((t.sellBasis==="inclusive"||t.costBasis==="inclusive")&&!complete(t))return "Complete the tax classification and rate before using inclusive master prices.";
 return "";
}
function complete(t){return !!t&&t.category!=="unconfigured"&&Number.isFinite(t.rate)&&t.rate>=0&&t.rate<=100&&(t.category!=="taxable"||t.rate>0)&&!!t.code&&(t.kind==="service"?/^\d{6}$/:/^(?:\d{4}|\d{6}|\d{8})$/).test(t.code);}
function opts(list,v){return list.map(([id,label])=>'<option value="'+esc(id)+'"'+(id===v?' selected':'')+'>'+esc(label)+'</option>').join("");}
function fields(prefix,raw,kind="product",cls="ma6-field",basis=true){
 const t=normalize(raw,kind),field=(label,key,body)=>'<div class="'+cls+'"><label for="'+prefix+key+'">'+esc(label)+'</label>'+body+'</div>',
 input=(key,val,attrs)=>'<input id="'+prefix+key+'" name="'+prefix+key+'" value="'+esc(val??"")+'" '+attrs+'>',
 select=(key,list,v)=>'<select id="'+prefix+key+'" name="'+prefix+key+'">'+opts(list,v)+'</select>';
 return field(kind==="service"?"SAC code (demo)":"HSN code (demo)","Code",input("Code",t.code,'inputmode="numeric" maxlength="8"'))+
 field("GST category","Category",select("Category",categories,t.category))+
 field("GST rate (%)","Rate",input("Rate",t.rate,'type="number" min="0" max="100" step="0.01" placeholder="Not configured"'))+
 (basis?field("Selling price basis","SellBasis",select("SellBasis",bases,t.sellBasis))+field("Purchase / cost basis","CostBasis",select("CostBasis",bases,t.costBasis)):"");
}
function read(fd,prefix,kind="product",basis=true){
 const t=normalize({code:fd.get(prefix+"Code"),category:fd.get(prefix+"Category"),rate:fd.get(prefix+"Rate"),sellBasis:basis?fd.get(prefix+"SellBasis"):"exclusive",costBasis:basis?fd.get(prefix+"CostBasis"):"exclusive"},kind);
 const error=invalid(t);if(error)throw Error(error);return t;
}
function product(v,f){
 const p=v?.price||{};
 if(p.tax)return {...normalize(p.tax),source:"Product model"};
 if(f?.tax&&f.tax.category!=="unconfigured")return {...normalize(f.tax),source:"Product group default"};
 return {...normalize({code:p.hsnSac||f?.tax?.code||""}),source:"Unconfigured product"};
}
function service(s){return {...normalize(s?.tax,"service"),source:s?.tax?"Service master":"Unconfigured service"};}
function capture(l){
 if(l.taxSnapshot)return l.taxSnapshot;
 const kind=l.customItem?.kind||((l.serviceId||l.type==="service")?"service":"product");
 let t;
 if(l.serviceId){const s=W.CPQ_FLOW?.service(l.serviceId);t=service(s);}
 else if(!l.customItem){
 const cat=W.CPQ_MA006A_CATALOG,v=cat?.variants?.find(x=>x.id===(l.sourceVariantId||l.productId)),f=cat?.families?.find(x=>x.id===v?.familyId);
 if(v)t=product(v,f);
 }
 l.taxSnapshot=t||{...empty(kind),source:"Manual / unconfigured"};
 return l.taxSnapshot;
}
function net(value,t,basis){const n=Number(value)||0;return basis==="inclusive"&&complete(t)?round(n/(1+t.rate/100)):round(n);}
function describe(raw){const t=normalize(raw,raw?.kind||"product");return [t.code||"Code pending",complete(t)?t.rate+"% · "+categories.find(c=>c[0]===t.category)[1]:"GST not configured"].join(" · ");}
function enabled(q){return q.taxMode==="item";}
function enable(q){q.taxMode="item";q.taxRegion="";for(const l of q.lines||[])capture(l);}
function chargeTax(c){return c?.taxSnapshot||{...empty("service"),source:"Separate charge"};}
function calculate(q,lines,charges,discount){
 const rows=[...lines.filter(l=>!l.includedInParent).map(l=>({id:l.id,label:l.description,amount:round(Number(l.quantity)*Number(l.unitPrice)),tax:l.taxSnapshot||empty(l.customItem?.kind||((l.serviceId||l.type==="service")?"service":"product"))})),...charges.map(c=>({id:c.id,label:c.label,amount:c.amount,tax:chargeTax(q.pricing?.costs?.find(x=>x.id===c.id))}))];
 const subtotal=round(rows.reduce((a,r)=>a+r.amount,0));
 let cumulative=0,allocated=0;const groups={};
 for(const r of rows){
  cumulative=round(cumulative+r.amount);
  const share=subtotal?round(discount*cumulative/subtotal):0;
  r.discount=round(share-allocated);allocated=share;
  r.base=round(Math.max(0,r.amount-r.discount));
  r.configured=complete(r.tax);
  r.gst=r.configured?round(r.base*r.tax.rate/100):0;
  if(r.configured){const key=r.tax.category+"|"+r.tax.rate;const g=groups[key]||={category:r.tax.category,rate:r.tax.rate,base:0,tax:0};g.base=round(g.base+r.base);g.tax=round(g.tax+r.gst);}
 }
 const tax=round(rows.reduce((a,r)=>a+r.gst,0)),missing=rows.filter(r=>!r.configured).length;
 const cgst=q.taxRegion==="intra"?round(tax/2):0,sgst=q.taxRegion==="intra"?round(tax-cgst):0,igst=q.taxRegion==="inter"?tax:0;
 return {rows,groups:Object.values(groups).sort((a,b)=>a.rate-b.rate),tax,missing,cgst,sgst,igst,region:q.taxRegion||"",ready:missing===0&&["intra","inter"].includes(q.taxRegion)};
}
function reviewIssues(q,result){
 if(!enabled(q))return [];
 const d=result?.gst;
 if(!d)return ["Complete item GST details."];
 const out=[];
 if(d.missing)out.push("Complete HSN/SAC, tax category and GST rate for "+d.missing+" billable line(s) / charge(s).");
 if(!["intra","inter"].includes(q.taxRegion))out.push("Select intra-state or inter-state GST treatment after checking the place of supply.");
 return out;
}
function editor(q,result){
 if(!enabled(q))return '<div class="cpq-price-help"><b>Legacy quotation:</b> original single tax assumption retained. <button type="button" class="btn" data-action="price-enable-item-tax">Switch draft to item-wise GST</button></div>';
 const d=result.gst, row=(id,label,raw,kind,sourceType)=>{
 const t=normalize(raw,kind),calculated=d.rows.find(x=>x.id===id),a='data-tax-id="'+esc(id)+'" data-tax-source="'+sourceType+'" ',sel=(key,list,v)=>'<select '+a+'data-tax-field="'+key+'">'+opts(list,v)+'</select>';
 return '<tr><td><b>'+esc(label)+'</b><small>'+esc(raw?.source||"Not configured")+'</small></td><td><input '+a+'data-tax-field="code" aria-label="'+(kind==="service"?"SAC":"HSN")+' '+esc(label)+'" value="'+esc(t.code)+'" inputmode="numeric" maxlength="8"></td><td>'+sel("category",categories,t.category)+'</td><td><input '+a+'data-tax-field="rate" type="number" min="0" max="100" step="0.01" value="'+esc(t.rate??"")+'" aria-label="GST percentage '+esc(label)+'"'+(t.category!=="taxable"?' disabled':'')+'></td><td>'+money(calculated?.base)+'</td><td>'+(complete(t)?money(calculated?.gst):"Pending")+'</td><td>'+ (complete(t)?"Configured":"Review needed")+'</td></tr>';
 };
 return '<section class="cpq-price-section"><div class="cpq-price-heading"><div><h4>Item-wise GST &amp; HSN/SAC</h4><p>Captured from master data; editable only for this draft. Offered rates in this workspace exclude GST. Inclusive master rates are converted when first captured. No statutory rate is preselected.</p></div></div>'+
 '<div class="cpq-price-settings"><label>GST treatment<select data-tax-region>'+opts(jurisdictions,q.taxRegion||"")+'</select></label></div>'+
 '<p class="cpq-price-help">Choose treatment using the actual supplier location and applicable place of supply. This public wireframe does not determine tax law.</p>'+
 '<div class="cpq-price-scroll"><table><thead><tr><th>Billable item / charge</th><th>HSN / SAC</th><th>Category</th><th>GST %</th><th>Net after discount</th><th>GST amount</th><th>Status</th></tr></thead><tbody>'+
 (q.lines||[]).filter(l=>!l.includedInParent).map(l=>row(l.id,l.description,l.taxSnapshot,l.taxSnapshot?.kind||l.customItem?.kind||((l.serviceId||l.type==="service")?"service":"product"),"line")).join("")+
 (result.publicRows||[]).map(c=>row(c.id,c.label,chargeTax(q.pricing?.costs?.find(x=>x.id===c.id)),"service","charge")).join("")+
 '</tbody></table></div><p class="cpq-price-help">Included sub-services are not charged again. Tax edits here do not update the Product or Service Master.</p>'+
 (!d.ready?'<p class="cpq-price-alert">GST incomplete — displayed tax and total are provisional. Finish all classifications and select GST treatment before demo review.</p>':'')+'</section>';
}
function update(q,target){
 if(target.hasAttribute("data-tax-region")){if(!jurisdictions.some(x=>x[0]===target.value))throw Error("Choose a valid GST treatment.");q.taxRegion=target.value;return;}
 const source=target.dataset.taxSource==="charge"?q.pricing?.costs?.find(x=>x.id===target.dataset.taxId):q.lines?.find(x=>x.id===target.dataset.taxId);
 if(!source)return;
 const prev=source.taxSnapshot||empty(target.dataset.taxSource==="charge"?"service":source.customItem?.kind||((source.serviceId||source.type==="service")?"service":"product"));
 const k=target.dataset.taxField;if(!["code","category","rate"].includes(k))return;
 // Quote rates are already net; never reinterpret them when a tax assumption changes.
 const next={...prev,[k]:target.value,sellBasis:"exclusive",costBasis:"exclusive",source:"Quote-specific assumption",capturedSellBasis:prev.capturedSellBasis||prev.sellBasis,capturedCostBasis:prev.capturedCostBasis||prev.costBasis};
 if(k==="category"&&target.value==="taxable"&&prev.category!=="taxable")next.rate=null;
 const t=normalize(next,prev.kind);
 const issue=invalid(t);if(issue)throw Error(issue);source.taxSnapshot=t;
}
function breakdown(result,cls="ma6-price-row"){
 const d=result.gst;if(!d)return "";
 const row=(label,value)=>'<div class="'+cls+'"><span>'+esc(label)+'</span><strong>'+money(value)+'</strong></div>';
 return d.groups.map(g=>row((categories.find(c=>c[0]===g.category)?.[1]||g.category)+" GST "+g.rate+"%",g.tax)).join("")+
 (d.region==="intra"?row("CGST",d.cgst)+row("SGST",d.sgst):d.region==="inter"?row("IGST",d.igst):"")+
 (d.ready?"":'<p class="cpq-price-alert">Provisional GST / total: '+d.missing+' unconfigured line(s) or charge(s); '+(!d.region?"GST treatment not selected.":"review required.")+'</p>');
}
function publicLabel(l){return l.includedInParent?"Included (no separate GST)":describe(l.taxSnapshot||empty(l.customItem?.kind||((l.serviceId||l.type==="service")?"service":"product")));}
W.CPQ_TAX={empty,normalize,complete,fields,read,product,service,capture,net,describe,enabled,enable,calculate,reviewIssues,editor,update,breakdown,publicLabel};
})();
