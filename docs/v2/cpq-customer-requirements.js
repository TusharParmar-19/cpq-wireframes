/* Demo-only project requirement snapshots. Never read or upload file contents. */
(()=>{
"use strict";
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const types=["Customer BOQ","Technical drawing","Customer specification / RFP","Site / survey document","Other requirement document","Customer requirements","Site evidence","RFP attachment"];
const copy=x=>JSON.parse(JSON.stringify(x));
const empty=()=>({scope:"",instructions:"",documents:[],source:""});
const read=r=>({...empty(),...(r?.requirementPack||{})});
const has=r=>{const p=read(r);return !!(String(p.scope||"").trim()||String(p.instructions||"").trim()||p.documents?.length||String(r?.exclusions||"").trim());};
const clear=r=>{delete r.requirementPack;r.exclusions="";};
function opportunity(o){
 if(!o)return null;
 const out={customerId:o.customerId,buyerId:o.buyerId,exclusions:o.exclusions||"",requirementPack:copy(read(o))};
 if(!o.requirementPack){
  out.requirementPack.documents=(window.CPQ_MA005_DATA?.documents||[]).filter(d=>d.opportunityId===o.id).slice(0,20).map(d=>({name:String(d.title||"Sample document").slice(0,180),type:types.includes(d.type)?d.type:"Other requirement document",size:null,legacyStatus:String(d.state||"Reference only").slice(0,100)}));
 }
 return out;
}
function transfer(target,source,ref=""){
 if(!source){clear(target);return;}
 target.requirementPack=copy(read(source));target.requirementPack.source=String(ref||"").slice(0,180);
 target.exclusions=String(source.exclusions||"");
}
function errors(r){
 const p=read(r),xs=[];
 if(![p.scope,p.instructions,r.exclusions??""].every(x=>typeof x==="string"&&x.length<=4000))xs.push("Keep scope, exclusions and technical instructions within 4,000 characters each.");
 if(typeof p.source!=="string"||p.source.length>180)xs.push("Invalid requirement source reference.");
 if(!Array.isArray(p.documents)||p.documents.length>20||p.documents.some(d=>!d||typeof d.name!=="string"||!d.name.trim()||d.name.length>180||!types.includes(d.type)||(d.size!==null&&(!Number.isSafeInteger(d.size)||d.size<0))||Object.keys(d).some(k=>!["name","type","size","legacyStatus"].includes(k))||("legacyStatus" in d&&(typeof d.legacyStatus!=="string"||d.legacyStatus.length>100))))xs.push("Check document reference details (up to 20 sample files).");
 if(p.documents?.length&&(!r.customerId||!r.buyerId||r.kind==="Reusable template"))xs.push("Select a customer and exact buyer before saving customer document references; reusable templates cannot contain customer files.");
 return xs;
}
function add(r,files,type){
 if(!types.includes(type))throw Error("Select a document type.");
 const p=copy(read(r));
 for(const file of files){
  const name=String(file.name||"").trim(),size=Number(file.size);
  if(!name||name.length>180||!Number.isSafeInteger(size)||size<0)throw Error("Use a sample filename of up to 180 characters.");
  if(!p.documents.some(d=>d.name===name&&d.type===type&&d.size===size)){
   if(p.documents.length>=20)throw Error("A maximum of 20 sample document references can be recorded.");
   p.documents.push({name,type,size});
  }
 }
 r.requirementPack=p;
}
function remove(r,index){const p=copy(read(r));if(Number.isInteger(index)&&index>=0&&index<p.documents.length){p.documents.splice(index,1);r.requirementPack=p;}}
function docList(r,editable=false){
 const p=read(r),ds=p.documents||[];
 return ds.length?'<ul class="cpq-req-files">'+ds.map((d,i)=>'<li><div><b>'+esc(d.name)+'</b><small>'+esc(d.type)+(d.legacyStatus?' · '+esc(d.legacyStatus):'')+' · metadata only</small></div>'+(editable?'<button type="button" class="btn" data-req-remove="'+i+'" aria-label="Remove '+esc(d.name)+'">Remove</button>':'')+'</li>').join("")+'</ul>':'<p class="cpq-req-muted">No customer document references recorded.</p>';
}
function form(r,quotation=false){
 const p=read(r),field=(k,label,value)=>'<label>'+esc(label)+'<textarea rows="3" maxlength="4000" data-req-field="'+k+'">'+esc(value)+'</textarea></label>';
 return '<details class="cpq-req" data-req-panel><summary>Customer BOQ, documents &amp; scope of work <small>(optional)</small></summary><div class="cpq-req-content">'+(p.source?'<p class="cpq-req-muted">Copied from '+esc(p.source)+' · editable local snapshot; source remains unchanged.</p>':'')+
 '<p class="cpq-req-muted">Record the customer’s original requirements. Only scope of work and exclusions appear in the customer quotation. Internal instructions and file references stay internal.</p>'+
 '<div class="cpq-req-grid">'+field("scope","Scope of work / included work",p.scope)+field("exclusions",quotation?"Exclusions / not included (also editable in Step 4)":"Exclusions / not included",r.exclusions||"")+field("instructions","Internal technical instructions (not on customer preview)",p.instructions)+'</div>'+
 '<h4>Customer requirement documents</h4><p class="cpq-req-muted">Choose fictional sample files only. Filename, type and size are recorded; contents are not read, uploaded or downloadable. No automatic Excel/PDF import.</p>'+
 '<div class="cpq-req-pick"><label>Document type<select data-req-type>'+types.slice(0,5).map(t=>'<option>'+esc(t)+'</option>').join("")+'</select></label><label>Choose sample files<input type="file" multiple data-req-files></label></div><div data-req-doc-list>'+docList(r,true)+'</div><p data-req-error role="alert" class="cpq-req-error"></p></div></details>';
}
function detail(r){
 const p=read(r),field=(title,val)=>'<div class="cpq-req-text"><b>'+esc(title)+'</b><p>'+esc(val||"Not recorded")+'</p></div>';
 return '<details class="cpq-req"><summary>Customer BOQ, documents &amp; scope ('+(p.documents?.length||0)+' references)</summary><div class="cpq-req-content">'+(p.source?'<p class="cpq-req-muted">Captured from '+esc(p.source)+'</p>':'')+field("Scope of work",p.scope)+field("Exclusions",r.exclusions)+field("Internal technical instructions",p.instructions)+'<h4>Customer document references</h4>'+docList(r)+'<p class="cpq-req-muted">Internal reference metadata only; not a verified source or actual attachment.</p></div></details>';
}
function publicScope(r){const s=read(r).scope;return s?'<p class="cpq-req-public"><b>Scope of work:</b> '+esc(s)+'</p>':"";}
function bind(root,getRecord){
 const update=e=>{const t=e.target,k=t.dataset.reqField,r=getRecord();if(!r||!["scope","exclusions","instructions"].includes(k))return;
  if(k==="exclusions")r.exclusions=t.value;else{r.requirementPack||=empty();r.requirementPack[k]=t.value;}
 };
 root.addEventListener("input",update);
 root.addEventListener("change",e=>{
  update(e);const t=e.target,r=getRecord();if(!r||t.dataset.reqFiles===undefined)return;
  const panel=t.closest("[data-req-panel]"),error=panel.querySelector("[data-req-error]");
  try{add(r,Array.from(t.files||[]),panel.querySelector("[data-req-type]").value);panel.querySelector("[data-req-doc-list]").innerHTML=docList(r,true);error.textContent="";}
  catch(err){error.textContent=err.message;}
  t.value="";
 });
 root.addEventListener("click",e=>{const t=e.target.closest("[data-req-remove]"),r=getRecord();if(!t||!r)return;remove(r,Number(t.dataset.reqRemove));const panel=t.closest("[data-req-panel]");panel.querySelector("[data-req-doc-list]").innerHTML=docList(r,true);panel.querySelector("[data-req-error]").textContent="";});
}
function confirmReplace(r){return !has(r)||window.confirm("Changing the customer, buyer or requirement source will clear or replace the captured customer documents, scope, exclusions and technical instructions for this draft. Continue?");}
window.CPQ_REQUIREMENTS={read,has,clear,opportunity,transfer,errors,add,remove,form,detail,publicScope,bind,confirmReplace};
})();