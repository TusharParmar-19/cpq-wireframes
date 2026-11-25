/* Browser-only commercial assumptions. Not statutory tax or subsidy policy. */
(()=>{
"use strict";
const W=window,esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=x=>"₹"+Number(x||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const cents=x=>Math.round((Number(x)+Number.EPSILON)*100),round=x=>cents(x)/100;
const n=x=>Number.isFinite(Number(x))&&Number(x)>=0?Number(x):0;
const valid=(x,max=1e12)=>x!==""&&x!=null&&Number.isFinite(Number(x))&&Number(x)>=0&&Number(x)<=max;
const modes=[["none","No discount"],["percent","Percentage (%)"],["fixed","Fixed amount (₹)"]];
const subsidies=[["none","No subsidy"],["estimated","Estimated customer benefit"],["contribution","Confirmed third-party contribution (demo)"]];
const roundingModes=[["none","No rounding (paise)"],["rupee","Nearest rupee"]];
const blank=()=>({mode:"none",value:0});
const defaults=()=>({version:1,overall:blank(),subsidy:{mode:"none",name:"",amount:0,reference:""},rounding:"none"});
const enabled=q=>q.commercial?.version===1;
function enable(q){if(enabled(q))return;const c=defaults();if(Number(q.discount)>0)c.overall={mode:"percent",value:Number(q.discount)};q.commercial=c;}
function disc(d,gross,issues,label){
 if(!d||d.mode==="none")return 0;
 if(!["percent","fixed"].includes(d.mode)||!valid(d.value,d.mode==="percent"?100:1e12)){issues.push(label+": invalid discount.");return 0;}
 const v=d.mode==="percent"?Math.round(gross*Number(d.value)/100):cents(d.value);
 if(v>gross)issues.push(label+": discount exceeds available amount.");
 return Math.min(gross,Math.max(0,v));
}
function plan(q,lines,charges){
 const issues=[],c=q.commercial,rows=[
 ...lines.filter(l=>!l.includedInParent).map(l=>({id:l.id,label:l.description,kind:"line",gross:cents(n(l.quantity)*n(l.unitPrice)),setting:l.commercialDiscount||blank()})),
 ...charges.map(x=>({id:x.id,label:x.label,kind:"charge",gross:cents(x.amount),setting:q.pricing?.costs?.find(y=>y.id===x.id)?.commercialDiscount||blank()}))];
 let gross=rows.reduce((a,x)=>a+x.gross,0);
 if(!Number.isSafeInteger(gross)||gross<0){issues.push("Amount exceeds supported paise precision.");gross=0;rows.forEach(x=>x.gross=0);}
 rows.forEach(x=>{x.item=disc(x.setting,x.gross,issues,x.label||x.id);x.after=x.gross-x.item;});
 const item=rows.reduce((a,x)=>a+x.item,0),remain=gross-item,overall=disc(c.overall,remain,issues,"Overall discount");
 let cumulative=0,allocated=0;
 for(const x of rows){cumulative+=x.after;const share=remain?Number((2n*BigInt(overall)*BigInt(cumulative)+BigInt(remain))/(2n*BigInt(remain))):0;x.overall=share-allocated;allocated=share;x.net=x.after-x.overall;}
 return {rows:rows.map(x=>({...x,gross:x.gross/100,item:x.item/100,after:x.after/100,overall:x.overall/100,net:x.net/100})),subtotal:gross/100,itemDiscount:item/100,overallDiscount:overall/100,discount:(item+overall)/100,net:(remain-overall)/100,issues};
}
function finish(q,p,gst,tax){
 const c=q.commercial,issues=[...p.issues],review=[],beforeRounding=round(p.net+tax);
 if(!roundingModes.some(x=>x[0]===c.rounding))issues.push("Invalid rounding method.");
 const total=c.rounding==="rupee"?Math.round(beforeRounding):beforeRounding,rounding=round(total-beforeRounding);
 const s=c.subsidy||defaults().subsidy,mode=s.mode;
 let subsidy=0,contribution=0,projectedNet=total;
 if(!subsidies.some(x=>x[0]===mode))issues.push("Invalid subsidy treatment.");
 if(mode!=="none"){
  if(!valid(s.amount)||Number(s.amount)>total)issues.push("Subsidy / contribution must not exceed invoice total.");
  if(!(Number(s.amount)>0))review.push("Enter a positive subsidy amount or select No subsidy.");
  if(!String(s.name||"").trim())review.push("Enter a demo scheme / contributor name.");
  if(mode==="contribution"&&!String(s.reference||"").trim())review.push("Enter a demo confirmation reference.");
  subsidy=round(Math.min(total,n(s.amount)));
  if(mode==="contribution")contribution=subsidy;
  if(mode==="estimated")projectedNet=round(total-subsidy);
 }
 const payable=round(total-contribution);
 const checks=[
 ["Gross − item discounts − overall discount = net",cents(p.subtotal)-cents(p.itemDiscount)-cents(p.overallDiscount)===cents(p.net)],
 ["Discount allocations agree",p.rows.reduce((a,x)=>a+cents(x.item)+cents(x.overall),0)===cents(p.discount)],
 ["Line and charge net amounts agree",p.rows.reduce((a,x)=>a+cents(x.net),0)===cents(p.net)],
 ["GST row bases and tax totals agree",!!gst&&gst.rows.reduce((a,x)=>a+cents(x.base),0)===cents(p.net)&&gst.rows.reduce((a,x)=>a+cents(x.gst),0)===cents(tax)],
 ["GST treatment and split complete",!!gst&&gst.ready&&cents(gst.cgst)+cents(gst.sgst)+cents(gst.igst)===cents(tax)],
 ["Net + GST + rounding = invoice total",cents(p.net)+cents(tax)+cents(rounding)===cents(total)],
 ["Customer share + third-party contribution = invoice",cents(payable)+cents(contribution)===cents(total)]];
 if(checks.some((x,i)=>!x[1]&&i!==4))issues.push("Commercial reconciliation mismatch.");
 return {...p,mode,scheme:String(s.name||""),subsidy,contribution,projectedNet,customerPayable:payable,beforeRounding,rounding,total,checks,issues,review,ready:!issues.length&&!review.length&&checks.every(x=>x[1])};
}
function update(q,t){
 if(!enabled(q))throw Error("Enable commercial options first.");
 const c=q.commercial,k=t.dataset.commercialField,v=t.value;
 if(k==="rounding"){if(!roundingModes.some(x=>x[0]===v))throw Error("Invalid rounding.");c.rounding=v;return;}
 if(k==="subsidyMode"){if(!subsidies.some(x=>x[0]===v))throw Error("Invalid subsidy type.");c.subsidy.mode=v;if(v==="none")c.subsidy=defaults().subsidy;return;}
 if(k==="subsidyName"||k==="subsidyReference"){c.subsidy[k==="subsidyName"?"name":"reference"]=String(v||"").trim().slice(0,120);return;}
 if(k==="subsidyAmount"){if(v!==""&&!valid(v))throw Error("Enter a valid subsidy amount.");c.subsidy.amount=round(n(v));return;}
 let target=c,key="overall";
 if(["line","charge"].includes(t.dataset.commercialSource)){
  target=t.dataset.commercialSource==="line"?q.lines.find(x=>x.id===t.dataset.commercialId&&!x.includedInParent):q.pricing?.costs?.find(x=>x.id===t.dataset.commercialId&&x.separate);
  key="commercialDiscount";if(!target)return;
 }
 const old=target[key]||blank();
 if(k==="mode"){if(!modes.some(x=>x[0]===v))throw Error("Invalid discount method.");if(old.mode!==v)target[key]={mode:v,value:0};return;}
 if(k==="value"&&old.mode!=="none"){if(v!==""&&!valid(v,old.mode==="percent"?100:1e12))throw Error("Invalid discount value.");target[key]={mode:old.mode,value:round(n(v))};}
}
const opts=(arr,v)=>arr.map(([k,l])=>'<option value="'+esc(k)+'"'+(k===v?' selected':'')+'>'+esc(l)+'</option>').join("");
const sel=(a,arr,v)=>'<select '+a+'>'+opts(arr,v)+'</select>';
const inp=(a,v,type="number")=>'<input type="'+type+'" '+(type==="number"?'min="0" step="0.01" ':'maxlength="120" ')+a+' value="'+esc(v??"")+'">';
function editor(q,t){
 if(!enabled(q))return W.CPQ_TAX.enabled(q)?'<div class="cpq-price-notice">Existing quotation discount retained. <button type="button" class="btn" data-action="price-enable-commercial">Enable item discounts, subsidy &amp; rounding</button></div>':"";
 const c=q.commercial,z=t.commercial,s=c.subsidy;
 const controls=(d,source,id)=>{d=d||blank();const a='data-commercial-source="'+source+'" data-commercial-id="'+esc(id)+'" ';return [sel(a+'data-commercial-field="mode" aria-label="Discount method '+esc(id)+'"',modes,d.mode),inp(a+'data-commercial-field="value" aria-label="Discount value '+esc(id)+'"'+(d.mode==="none"?' disabled':'')+(d.mode==="percent"?' max="100"':''),d.value)];};
 const ov=controls(c.overall,"overall","overall");
 return '<section class="cpq-price-section"><div class="cpq-price-heading"><div><h4>Discount management</h4><p>Item discounts first, then overall discount on the remaining billable amounts, then GST. A fixed item discount is for the entire line, not per unit.</p></div></div>'+
 '<div class="cpq-price-scroll"><table><thead><tr><th>Billable item / charge</th><th>Gross excl. GST</th><th>Discount method</th><th>Value (% / ₹)</th><th>Item discount</th><th>Overall share</th><th>Net before GST</th></tr></thead><tbody>'+
 z.rows.map(x=>{const [a,b]=controls(x.setting,x.kind,x.id);return '<tr><td><b>'+esc(x.label)+'</b></td><td>'+money(x.gross)+'</td><td>'+a+'</td><td>'+b+'</td><td>'+money(x.item)+'</td><td>'+money(x.overall)+'</td><td>'+money(x.net)+'</td></tr>';}).join("")+
 '</tbody></table></div><div class="cpq-price-settings"><label>Overall discount method'+ov[0]+'</label><label>Overall discount value'+ov[1]+'</label></div>'+
 '<div class="cpq-price-notice">Item discounts: <b>'+money(z.itemDiscount)+'</b> · Overall discount: <b>'+money(z.overallDiscount)+'</b> · Total discounts: <b>'+money(z.discount)+'</b></div></section>'+
 '<section class="cpq-price-section"><div class="cpq-price-heading"><div><h4>Subsidy / third-party contribution &amp; rounding</h4><p>Separate subsidy assumptions do not change GST, invoice revenue or margin. No real eligibility or entitlement is determined.</p></div></div>'+
 '<div class="cpq-price-settings"><label>Subsidy treatment'+sel('data-commercial-field="subsidyMode"',subsidies,s.mode)+'</label>'+
 (s.mode!=="none"?'<label>Scheme / contributor (demo)'+inp('data-commercial-field="subsidyName"',s.name,"text")+'</label><label>Subsidy amount (₹)'+inp('data-commercial-field="subsidyAmount"',s.amount)+'</label>'+
 (s.mode==="contribution"?'<label>Demo confirmation reference'+inp('data-commercial-field="subsidyReference"',s.reference,"text")+'</label>':''):"")+
 '<label>Final invoice rounding'+sel('data-commercial-field="rounding"',roundingModes,c.rounding)+'</label></div>'+
 '<p class="cpq-price-help">Estimated benefit: full invoice remains payable; projected customer cost is informational. Confirmed contribution (demo): invoice settlement is split between customer and third party.</p></section>';
}
function reconciliation(t){
 const z=t.commercial;if(!z)return "";
 return '<section class="cpq-price-section"><div class="cpq-price-heading"><div><h4>Commercial reconciliation</h4><p>Arithmetic checks, not statutory or commercial approval.</p></div><span class="ma6-tag">'+(z.ready?"Reconciled (demo)":"Review needed")+'</span></div>'+
 '<div class="cpq-price-notice">Net '+money(z.net)+' + GST '+money(t.tax)+' + rounding '+(z.rounding<0?"− ":"")+money(Math.abs(z.rounding))+' = invoice '+money(z.total)+'</div>'+
 '<details><summary>Detailed checks ('+z.checks.length+')</summary>'+z.checks.map(([label,ok])=>'<p>'+(ok?'✓':'!')+' '+esc(label)+'</p>').join("")+'</details>'+
 [...z.issues,...z.review].map(x=>'<p class="cpq-price-alert">'+esc(x)+'</p>').join("")+(!t.gst?.ready?'<p class="cpq-price-alert">Complete GST classification and treatment before review.</p>':'')+'</section>';
}
const row=(cls,label,value,final=false)=>'<div class="'+cls+(final?' final':'')+'"><span>'+esc(label)+'</span><strong>'+value+'</strong></div>';
function discountRows(t,cls="ma6-price-row"){const z=t.commercial;return row(cls,"Item discounts","− "+money(z.itemDiscount))+row(cls,"Overall discount","− "+money(z.overallDiscount))+row(cls,"Total discounts","− "+money(z.discount));}
function totalRows(t,cls="ma6-price-row"){const z=t.commercial;return row(cls,"Rounding adjustment",(z.rounding<0?"− ":"+ ")+money(Math.abs(z.rounding)))+row(cls,"Illustrative invoice total",money(z.total),true)+
 (z.mode==="estimated"?row(cls,"Estimated subsidy (not deducted)",money(z.subsidy))+row(cls,"Customer payable",money(z.customerPayable))+row(cls,"Projected cost after estimated subsidy",money(z.projectedNet)):"")+
 (z.mode==="contribution"?row(cls,"Third-party contribution (demo)",money(z.contribution))+row(cls,"Customer share (demo)",money(z.customerPayable),true):"")+
 (z.mode!=="none"?'<p class="cpq-price-help">'+esc(z.scheme||"Scheme pending")+' · '+(z.mode==="estimated"?"Illustrative benefit only; full invoice payable.":"Simulated funding split; not verified entitlement.")+'</p>':'')+
 (!z.ready?'<p class="cpq-price-alert">Commercial totals provisional — review outstanding inputs.</p>':'');}
function lineLabel(t,id){const x=t.commercial?.rows.find(y=>y.id===id);return x&&(x.item||x.overall)?'<small class="cpq-custom-note">'+esc("Item discount "+money(x.item)+" · Overall share "+money(x.overall)+" · Net "+money(x.net))+'</small>':"";}
const discountLabel=q=>enabled(q)?"Item + overall discounts":"Discount "+(Number(q.discount)||0)+"%";
const errors=(q,t)=>enabled(q)?t.commercial.issues:[];
const reviewIssues=(q,t)=>enabled(q)?[...t.commercial.review,...(t.commercial.ready?[]:["Complete commercial reconciliation before review."])]:[];
W.CPQ_COMMERCIAL={defaults,enabled,enable,plan,finish,update,editor,reconciliation,discountRows,totalRows,lineLabel,discountLabel,errors,reviewIssues};
})();
