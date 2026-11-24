/* MA-006A guided form UI: keeps all original named inputs in the form.
 * Three visible steps; internal classification and advanced specs are never deleted. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const E=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const modeIsWizard=m=>["product-new","variant-new","variant-edit"].includes(m);
let current=null,step=0,db=null;
const node=(tag,css="",html="")=>{const el=document.createElement(tag);if(css)el.className=css;if(html)el.innerHTML=html;return el;};
function formField(form,name){
 const input=form.querySelector('[name="'+name+'"]');return input?.closest(".ma6-field")||null;
}
function sectionHeading(title,desc){
 return node("div","ma6a-wizard-title",'<h3>'+E(title)+'</h3><p>'+E(desc)+'</p>');
}
function group(){return node("div","ma6-field-grid ma6a-wizard-grid");}
function move(form,names,dest){
 for(const name of names){const el=formField(form,name);if(el)dest.appendChild(el);}
}
function status(text){
 const el=$("catalog-editor-error");if(el){el.hidden=false;el.textContent=text;el.scrollIntoView({block:"nearest"});}
 return false;
}
function closeStatus(){$("catalog-editor-error").hidden=true;}
function updateCategory(form,kind){
 const cat=form.querySelector('[name="familyCategory"]'),
 typ=form.querySelector('[name="familyType"]'),
 unit=form.querySelector('[name="familyUnit"]');
 if(cat)cat.value=kind==="service"?"Services & EPC":kind==="general"?"Other":kind==="cable"?"Cables & Conductors":"Solar Equipment";
 if(typ)typ.value=kind==="service"?"service":"standard";
 if(unit)unit.value=kind==="service"?"Job":kind==="cable"?"m":kind==="mounting"?"Set":"Nos";
 const typeLabel=window.CPQ_MA006A_SOLAR_FIELDS?.templates?.[kind]?.label||"General Product";
 const hint=$("catalog-wizard-autofill");
 if(hint)hint.innerHTML='The catalog will use <b>'+E(typeLabel)+'</b> specifications and set the internal classification automatically.';
}

function groupsFor(kind){return db.families.filter(f=>(f.solarKind||"general")===kind&&f.status!=="Discontinued").sort((a,b)=>a.name.localeCompare(b.name));}
function selectedGroup(form){const id=form.querySelector('[name="wizardFamilyId"]')?.value;return id&&id!=="__new__"?db.families.find(f=>f.id===id):null;}
function refreshCategoryFields(form){
 const target=form.querySelector("#catalog-category-spec-fields");
 if(!target)return;
 const selected=selectedGroup(form);
 const category=selected?.category||form.querySelector('[name="familyCategory"]')?.value||"Other";
 const solarKind=selected?.solarKind||form.querySelector('[name="solarKind"]')?.value||"general";
 target.innerHTML=window.CPQ_MA006A_PRODUCT_INFO?.categoryFields({category,solarKind,type:selected?.type||"standard"},{})||"";
}
function updateGroupMode(form){
 if(current?.mode!=="product-new")return;
 const reused=selectedGroup(form),nameField=formField(form,"familyName");
 if(nameField){
  nameField.hidden=!!reused;
  const input=nameField.querySelector('[name="familyName"]');if(input){input.required=!reused;input.placeholder="Name of new product group";}
  const label=nameField.querySelector("label");if(label)label.textContent="New Product Group Name *";
 }
 const advanced=form.querySelector(".ma6a-wizard-advanced");if(advanced){advanced.hidden=!!reused;advanced.open=false;}
 const hint=$("catalog-wizard-group-help");
 if(hint)hint.textContent=reused?"A new model will be added under "+reused.name+". No duplicate group needed.":
 "Only create a new group when none fits. Different wattages and brands normally belong in the same group.";
 refreshCategoryFields(form);
}
function refreshGroupOptions(form,kind){
 const sel=form.querySelector('[name="wizardFamilyId"]');if(!sel)return;
 const groups=groupsFor(kind);
 sel.innerHTML=groups.map(f=>'<option value="'+E(f.id)+'">'+E(f.name)+'</option>').join("")+
  '<option value="__new__">Create a group with this product</option>';
 sel.value=groups[0]?.id||"__new__";updateGroupMode(form);
}
function checkBasics(){
 if(!current)return false;
 const form=$("catalog-editor-form");
 const existing=current.mode==="product-new"&&!!selectedGroup(form);
 const fields=[...(current.mode==="product-new"&&!existing?[["familyName","New Product Group Name"]]:[]),["model","Manufacturer Model Number"],["sku","Unique SKU"]];
 for(const [name,label] of fields){
  const input=form.querySelector('[name="'+name+'"]');
  if(input&&!String(input.value||"").trim()){status("Enter "+label+" before continuing.");input.focus();return false;}
 }
 const sku=String(form.querySelector('[name="sku"]')?.value||"").trim();
 if(db?.variants.some(v=>v.sku.toLowerCase()===sku.toLowerCase()&&v.id!==current.variantId))
  return status("This SKU already exists. Enter a unique stock code.");
 const type=selectedGroup(form)?.type||form.querySelector('[name="familyType"]')?.value||current.productType;
 if(type!=="service"&&!form.querySelector('[name="manufacturerId"]')?.value)
  return status("Select a manufacturer, or use + Add New Manufacturer in the dropdown.");
 return true;
}
function updateReview(){
 const form=$("catalog-editor-form"),target=$("catalog-wizard-review");if(!target)return;
 const kind=selectedGroup(form)?.solarKind||form.querySelector('[name="solarKind"]')?.value||current?.solarKind||"general";
 const schema=window.CPQ_MA006A_SOLAR_FIELDS?.templates?.[kind];
 const fields=schema?.essential||[];
 const entered=fields.filter(([key])=>String(form.querySelector('[name="solar_'+key+'"]')?.value??"").trim()!=="").length;
 target.innerHTML='<b>Draft summary</b>'+
  '<p><strong>'+E(form.querySelector('[name="model"]')?.value||"Model not provided")+'</strong> · '+E(form.querySelector('[name="sku"]')?.value||"SKU missing")+
  '</p><p>'+ (fields.length?'Technical values entered: '+entered+' of '+fields.length+'. ':'')+
  'Missing specifications or documents can be completed during review.</p>';
}
function showStep(next){
 if(!current||next<0||next>2)return false;
 if(next>step&&step===0&&!checkBasics())return false;
 closeStatus();step=next;
 for(const el of $("catalog-editor-body").querySelectorAll("[data-product-wizard-panel]"))el.hidden=Number(el.dataset.productWizardPanel)!==step;
 for(const el of $("catalog-editor-body").querySelectorAll("[data-product-wizard-step]")){
  const active=Number(el.dataset.productWizardStep)===step;
  el.classList.toggle("active",active);el.setAttribute("aria-current",active?"step":"false");
 }
 $("catalog-editor-back").hidden=step===0;
 $("catalog-editor-next").hidden=step===2;
 $("catalog-editor-save").hidden=step!==2;
 $("catalog-editor-save").textContent=current.mode==="variant-edit"?"Save Changes":"Save as Draft";
 $("catalog-editor-subtitle").textContent="Step "+(step+1)+" of 3 · Demo draft only";
 if(step===2)updateReview();
 $("catalog-editor-body").scrollTop=0;return true;
}
function mount(editor,database){
 current=editor;db=database;step=0;
 current.productType=db.families.find(x=>x.id===editor.familyId)?.type||"standard";
 const form=$("catalog-editor-form"),body=$("catalog-editor-body");if(!form||!body)return;
 const original=Array.from(body.children),basic=node("section","ma6a-wizard-panel"),spec=node("section","ma6a-wizard-panel"),
  price=node("section","ma6a-wizard-panel");
 basic.dataset.productWizardPanel="0";spec.dataset.productWizardPanel="1";price.dataset.productWizardPanel="2";
 basic.appendChild(sectionHeading("1. Basic Details","What is the product, and which manufacturer/model are you adding?"));
 const basicGrid=group();
 if(editor.mode==="product-new"){
  const kind=formField(form,"solarKind");if(kind){
   const label=kind.querySelector("label");if(label)label.textContent="What are you adding? *";
   basicGrid.appendChild(kind);
   const hint=node("div","ma6a-wizard-autofill");hint.id="catalog-wizard-autofill";basic.appendChild(hint);
  }
 }
 if(editor.mode==="product-new"){
   const chooser=node("div","ma6-field ma6a-group-select",
   '<label for="catalog-wizard-family">Product Group *</label><select name="wizardFamilyId" id="catalog-wizard-family" required></select>'+
   '<small id="catalog-wizard-group-help" class="ma6a-group-help"></small>');
   basicGrid.appendChild(chooser);
  }
  move(form,["familyName","model","sku","capacity","variantName","manufacturerId"],basicGrid);
 basic.appendChild(basicGrid);
 if(editor.mode!=="product-new")basic.appendChild(node("div","ma6a-wizard-tip",
  'Adding or updating a manufacturer model inside <b>'+E(db.families.find(f=>f.id===editor.familyId)?.name||"the selected family")+'</b>.'));
 if(editor.mode==="product-new"){
  const adv=node("details","ma6a-editor-details ma6a-wizard-advanced",
   '<summary>Advanced catalog classification (optional)</summary><p>Category and behavior are set automatically. Authorized staff can adjust them here.</p>');
  const advancedGrid=group();move(form,["familyCategory","familyType"],advancedGrid);adv.appendChild(advancedGrid);
  for(const el of original){
   if(el.tagName==="DETAILS"&&el.querySelector('[name="familyUnit"]'))adv.appendChild(el);
  }
  basic.appendChild(adv);
  updateCategory(form,form.querySelector('[name="solarKind"]')?.value||"pv-module");
  refreshGroupOptions(form,form.querySelector('[name="solarKind"]')?.value||"pv-module");
 }
 if(editor.mode==="variant-edit"){
  const st=formField(form,"variantStatus");if(st){
   const oldStatus=db.variants.find(v=>v.id===editor.variantId)?.status||"Draft";
   const input=st.querySelector('[name="variantStatus"]');if(input)input.disabled=true;
   st.hidden=true;basic.appendChild(st);
   basic.appendChild(node("div","ma6a-wizard-tip",'Current status: <b>'+E(oldStatus)+
   '</b>. Only authorized review and approval can activate a model.'));
  }
 }else{
  const statusField=formField(form,"variantStatus");
  if(statusField){const sel=statusField.querySelector("select");if(sel)sel.value="Draft";
   const box=node("div","ma6a-wizard-tip","New products are saved as <b>Draft</b> until verified.");
   basic.appendChild(box);
   const input=statusField.querySelector('[name="variantStatus"]');
   if(input){input.value="Draft";input.type==="select-one"&&(input.disabled=true);}
   basic.appendChild(statusField);
   statusField.classList.add("ma6a-wizard-status-hidden");
  }
 }
 spec.appendChild(sectionHeading("2. Technical Specifications","Fill values from the manufacturer datasheet. You can finish unknown details later."));
 const solar=$("catalog-solar-fields");
 if(solar){
  solar.querySelectorAll("details").forEach(el=>{if(String(el.querySelector("summary")?.textContent||"").toLowerCase().includes("advanced"))el.open=false;});
  spec.appendChild(solar);
 }
 const categorySpecs=$("catalog-category-spec-fields");
 if(categorySpecs)spec.appendChild(categorySpecs);
 const dims=original.find(el=>el.tagName==="DETAILS"&&String(el.querySelector("summary")?.textContent||"").includes("Physical dimensions"));
 if(dims){dims.open=false;spec.appendChild(dims);}
 const otherTech=original.find(el=>el.tagName==="DETAILS"&&String(el.querySelector("summary")?.textContent||"").includes("Documents & other technical"));
 if(otherTech){otherTech.open=false;otherTech.querySelector("summary").textContent="Additional technical specifications, drawings & notes";spec.appendChild(otherTech);}
 const warranty=original.find(el=>el.tagName==="DETAILS"&&el.hasAttribute("data-product-warranty"));
 if(warranty){warranty.open=false;spec.appendChild(warranty);}
 const docs=original.find(el=>el.tagName==="DETAILS"&&el.hasAttribute("data-product-documents"));
 if(docs){docs.open=false;spec.appendChild(docs);}
 spec.appendChild(node("div","ma6a-wizard-tip",
 'A draft can be saved with missing details. Technical review is required before the model is approved for commercial use.'));
 price.appendChild(sectionHeading("3. Price & Save","Optional commercial information may be completed later by an authorized employee."));
 const commercial=original.find(el=>el.tagName==="DETAILS"&&String(el.querySelector("summary")?.textContent||"").includes("Commercial price"));
 if(commercial){
  const grid=commercial.querySelector(".ma6-field-grid"),quick=group();
  if(grid){move(form,["sell","availability","datasheet"],quick);}
  price.appendChild(quick);
  commercial.querySelector("summary").textContent="More price and sourcing fields (commercial team)";
  commercial.open=false;price.appendChild(commercial);
 }
 const parts=original.find(el=>el.tagName==="DETAILS"&&String(el.querySelector("summary")?.textContent||"").includes("Parts & accessories"));
 if(parts){parts.open=false;price.appendChild(parts);}
 const review=node("div","ma6a-wizard-review");review.id="catalog-wizard-review";price.appendChild(review);
 price.appendChild(node("div","ma6a-wizard-tip",
  'Choose <b>Save as Draft</b>. You may attach document filenames during step 2, or add and revise them later in <b>Documents &amp; Warranty</b>. The wireframe never stores file contents.'));
 // Keep all unmoved fields and existing values for the original save/validation function.
 const moved=new Set([basicGrid,solar,categorySpecs,dims,otherTech,warranty,docs,commercial,parts]);
 const leftovers=node("details","ma6a-editor-details ma6a-wizard-extra",'<summary>Other advanced information</summary>');
 for(const el of original){
  if(el.parentElement===body&&el.querySelector("input,select,textarea"))leftovers.appendChild(el);
 }
 if(leftovers.children.length>1)price.appendChild(leftovers);
 const nav=node("nav","ma6a-wizard-progress",
  [["Basic Details","Product and model"],["Specifications","Technical information"],["Price & Save","Draft review"]]
  .map(([t,sub],i)=>'<button type="button" data-product-wizard-step="'+i+'">'+
   '<span class="ma6a-progress-number">'+(i+1)+'</span><span><b>'+t+'</b><small>'+sub+'</small></span></button>').join(""));
 body.replaceChildren(nav,basic,spec,price);
 const manufacturer=form.querySelector('[name="manufacturerId"]');
 if(manufacturer&&manufacturer.closest(".ma6-field")){
  const label=manufacturer.closest(".ma6-field").querySelector("label");
  if(label)label.textContent="Manufacturer / Brand *";
 }
 const statusField=form.querySelector('[name="familyStatus"]');
 if(statusField&&editor.mode==="product-new")statusField.value="Draft";
 // Existing form logic consumes all fields across all (including hidden) wizard panels.
 showStep(0);
 if(editor.mode==="product-new")updateCategory(form,form.querySelector('[name="solarKind"]')?.value||"pv-module");
}
function init(){
 $("catalog-editor-back").addEventListener("click",()=>showStep(step-1));
 $("catalog-editor-next").addEventListener("click",()=>showStep(step+1));
 $("catalog-editor-form").addEventListener("click",e=>{
  const action=e.target.closest("[data-product-wizard-step]");if(!current||!action)return;
  e.preventDefault();showStep(Number(action.dataset.productWizardStep));
 });
 $("catalog-editor-form").addEventListener("change",e=>{
  if(current?.mode!=="product-new")return;
  const form=$("catalog-editor-form");
  if(e.target.name==="wizardFamilyId"){updateGroupMode(form);return;}
  if(e.target.name==="familyCategory"){refreshCategoryFields(form);return;}
  if(e.target.name==="solarKind"){updateCategory(form,e.target.value);refreshGroupOptions(form,e.target.value);}
 });
 $("catalog-editor-form").addEventListener("submit",e=>{
  if(!current||step===2)return;
  e.preventDefault();e.stopImmediatePropagation();showStep(step+1);
 },true);
}
window.CPQ_MA006A_SIMPLE_WIZARD={mount,init,reset:()=>{current=null;step=0;},step:()=>step};
})();
