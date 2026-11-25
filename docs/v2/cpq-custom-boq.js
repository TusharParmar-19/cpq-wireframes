/* Project-specific BOQ lines; never create catalog records or approved rates. */
(()=>{
"use strict";
const str=x=>typeof x==="string"?x.trim():"",esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const is=l=>!!l&&(l.type==="custom"||Object.prototype.hasOwnProperty.call(l,"customItem"));
const blank=()=>({kind:"product",name:"",quantity:1,unit:"Nos",specification:"",notes:""});
function make(v,id,quote=false){
 const kind=str(v.kind),name=str(v.name),unit=str(v.unit),specification=str(v.specification),notes=str(v.notes),quantity=Number(v.quantity);
 if(!["product","service"].includes(kind))throw Error("Choose product or service.");
 if(!name||name.length>150)throw Error("Enter an item name (up to 150 characters).");
 if(!unit||unit.length>30)throw Error("Enter a unit (up to 30 characters).");
 if(!Number.isInteger(quantity)||quantity<1||quantity>100000)throw Error("Enter a whole quantity from 1 to 100,000.");
 if(specification.length>500||notes.length>500)throw Error("Keep specifications and notes within 500 characters.");
 const l={id,type:"custom",productId:"",variantId:"",quantity,customItem:{kind,name,unit,specification,notes},options:{}};
 if(quote)Object.assign(l,{description:name,unit,unitPrice:0,technicalReview:true,pricingReview:true,unverified:true});
 return l;
}
const read=l=>({...blank(),...l.customItem,quantity:l.quantity});
function errors(l){
 if(!is(l))return [];
 try{
  if(l.type!=="custom"||!l.customItem||l.productId||l.variantId||l.sourceVariantId||l.serviceId||l.modelSnapshot||l.serviceSnapshot||l.includedInParent)throw Error("Custom items cannot have master or bundled service references.");
  const v=make(read(l),l.id);
  if((l.description!==undefined&&l.description!==v.customItem.name)||(l.unit!==undefined&&l.unit!==v.customItem.unit))throw Error("Inconsistent custom item details.");
  return [];
 }catch(e){return [e.message];}
}
const label=l=>l.customItem?.kind==="service"?"Custom service":"Custom product";
const details=l=>[label(l),l.customItem?.specification].filter(Boolean).join(" · ");
const productView=l=>({name:l.customItem?.name||"Custom item",type:label(l),unit:l.customItem?.unit||"unit"});
const nextId=(ls,p)=>p+String(Math.max(0,...ls.map(x=>Number(String(x.id).replace(/\D/g,""))||0))+1).padStart(2,"0");
function start(b,l){b.customDraft=l?read(l):blank();b.customEdit=l?.id||"";b.customOpen=true;}
function clear(b){delete b.customDraft;delete b.customEdit;b.customOpen=false;}
function update(b,t){const k=t.dataset.customBoqField;if(!k||!Object.keys(blank()).includes(k))return false;b.customDraft||=blank();b.customDraft[k]=t.value;b.customOpen=true;return true;}
function form(b){
 const v=b.customDraft||blank(),edit=!!b.customEdit;
 const field=(k,title,type="text",attrs="")=>'<label>'+esc(title)+'<input data-custom-boq-field="'+k+'" type="'+type+'" value="'+esc(v[k])+'" '+attrs+'></label>';
 const area=(k,title)=>'<label class="cpq-custom-wide">'+esc(title)+'<textarea data-custom-boq-field="'+k+'" maxlength="500" rows="2">'+esc(v[k])+'</textarea></label>';
 return '<details class="cpq-custom-boq" id="custom-boq-editor"'+(b.customOpen?' open':'')+'><summary>'+(edit?'Edit Custom Item':'+ Add Custom Item')+' <small>One-off product or service</small></summary><div class="cpq-custom-content"><p class="muted">Only for this project. No new master record. Enter rates later in Pricing &amp; Costing.</p><div class="cpq-custom-grid">'+
 '<label>Item type<select data-custom-boq-field="kind"><option value="product"'+(v.kind==="product"?' selected':'')+'>Product</option><option value="service"'+(v.kind==="service"?' selected':'')+'>Service</option></select></label>'+
 field("name","Item name *","text",'maxlength="150" placeholder="e.g. Custom support frame"')+field("quantity","Quantity *","number",'min="1" max="100000" step="1"')+field("unit","Unit *","text",'maxlength="30" placeholder="Nos, Job, m, Set"')+
 area("specification","Customer-facing specifications / scope (optional)")+area("notes","Internal notes (optional — not on customer preview)")+'</div><div class="cpq-custom-actions"><button type="button" class="btn" data-action="cancel-custom-boq">Cancel</button><button type="button" class="btn primary" data-action="save-custom-boq">'+(edit?'Save Item Changes':'+ Add Custom Item')+'</button></div></div></details>';
}
const editButton=l=>is(l)?'<button type="button" class="btn" data-action="edit-custom-boq" data-custom-id="'+esc(l.id)+'">Edit item</button>':"";
function focusEditor(){const e=document.getElementById("custom-boq-editor");if(e){e.open=true;e.scrollIntoView({block:"nearest"});e.querySelector('[data-custom-boq-field="name"]')?.focus({preventScroll:true});}}
window.CPQ_CUSTOM_BOQ={is,blank,make,read,errors,label,details,productView,nextId,start,clear,update,form,editButton,focusEditor};
})();