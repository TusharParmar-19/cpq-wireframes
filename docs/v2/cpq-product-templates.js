/* Product specification registry and identity rules. Browser-only wireframe. */
(()=>{
"use strict";
const W=window,copy=x=>JSON.parse(JSON.stringify(x)),esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const seed=W.CPQ_MA006A_SOLAR_FIELDS;
const defaults={general:["Other","Nos"],cable:["Cables & Conductors","m"],mounting:["Solar Equipment","Set"],service:["Services & EPC","Job"]};
const base=seed.types.map(([id,name])=>{
 const s=seed.templates[id],d=defaults[id]||["Solar Equipment","Nos"];
 return {id,name,category:d[0],unit:d[1],modelRequired:false,version:1,system:true,fields:[
  ...s.essential.map(f=>({key:f[0],label:f[1],unit:f[2],type:f[3],choices:f[4]||"",required:false,advanced:false})),
  ...s.advanced.map(f=>({key:f[0],label:f[1],unit:f[2],type:f[3],choices:f[4]||"",required:false,advanced:true}))
 ]};
});
base.push({id:"cable-kit",name:"Cable Jointing & Termination Kit",category:"Cables & Conductors",unit:"Kit",modelRequired:false,version:1,system:true,fields:[
 {key:"jointType",label:"Joint / termination type",unit:"",type:"select",choices:"Straight Through Joint (STJ);Indoor Termination;Outdoor Termination;Other",required:true},
 {key:"jointTechnology",label:"Technology",unit:"",type:"select",choices:"Heat Shrink;Cold Shrink;Resin Cast;Other",required:true},
 {key:"voltageGradeKv",label:"Voltage grade",unit:"kV",type:"number",choices:"",required:true},
 {key:"cableType",label:"Cable type / insulation",unit:"",type:"text",choices:"",required:true},
 {key:"coreCount",label:"Number of cores",unit:"",type:"number",choices:"",required:true},
 {key:"cableSizeMm2",label:"Cable cross-section",unit:"mm²",type:"number",choices:"",required:true},
 {key:"packageQuantity",label:"Quantity per package",unit:"Nos",type:"number",choices:"",required:false},
 {key:"connectorType",label:"Connector / ferrule type",unit:"",type:"text",choices:"",required:false,advanced:true},
 {key:"certifications",label:"Applicable standards / test evidence",unit:"",type:"text",choices:"",required:false,advanced:true}
]});
let catalog=W.CPQ_MA006A_CATALOG;
function list(db=catalog){
 const m=new Map(base.map(t=>[t.id,copy(t)]));
 for(const t of db?.specTemplates||[]){if(t?.id&&Array.isArray(t.fields))m.set(t.id,copy(t));}
 return [...m.values()];
}
function get(id,db=catalog){return list(db).find(t=>t.id===id)||null;}
function apply(db=catalog){
 catalog=db||catalog;
 const items=list(catalog);
 seed.types=items.map(t=>[t.id,t.name]);
 seed.templates=Object.fromEntries(items.map(t=>{
  const tuple=f=>[f.key,f.label,f.unit||"",f.type,f.choices||"",!!f.required];
  return [t.id,{label:t.name,essential:t.fields.filter(f=>!f.advanced).map(tuple),advanced:t.fields.filter(f=>f.advanced).map(tuple)}];
 }));
 return items;
}
function nextSku(db){
 const used=new Set((db.variants||[]).map(v=>String(v.sku||"").trim().toUpperCase()));
 let n=Math.max(0,...[...used].map(s=>/^PRD-(\d{1,12})$/.test(s)?Number(s.slice(4)):0));
 let sku;do{sku="PRD-"+String(++n).padStart(6,"0");}while(used.has(sku));
 return sku;
}
function identity(db,fd,kind,existing=null){
 const model=String(fd.get("model")||"").trim(),input=String(fd.get("sku")||"").trim(),tpl=get(kind,db);
 if(model.length>120)throw Error("Manufacturer model number cannot exceed 120 characters.");
 if(tpl?.modelRequired&&!model)throw Error("This specification template requires a manufacturer model number.");
 const sku=existing?.sku||input||nextSku(db);
 if(sku.length>80||!sku.trim())throw Error("Product code must contain 1–80 characters.");
 if(existing&&input&&input.toLowerCase()!==String(existing.sku||"").toLowerCase())throw Error("An existing product code cannot be changed in this form.");
 if((db.variants||[]).some(v=>v.id!==existing?.id&&String(v.sku||"").trim().toLowerCase()===sku.toLowerCase()))throw Error("This SKU already exists. Enter a different internal product code.");
 const raw=String(fd.get("manufacturerId")||"").trim();
 const choices={"__generic__":"generic","__inhouse__":"inhouse","__unknown__":"unknown"};
 const manufacturerId=choices[raw]?"":raw;
 if(manufacturerId&&!(db.manufacturers||[]).some(m=>m.id===manufacturerId))throw Error("Choose a manufacturer from the master list.");
 const manufacturerSource=manufacturerId?"known":choices[raw]||(kind==="service"?"service":"unknown");
 const partNo=String(fd.get("manufacturerPartNo")||"").trim();
 if(partNo.length>120)throw Error("Manufacturer part number cannot exceed 120 characters.");
 return {sku,model,manufacturerId,manufacturerSource,manufacturerPartNo:partNo};
}
function describe(kind,values,capacity="",db=catalog){
 const t=get(kind,db);
 return (t?.fields||[]).filter(f=>!f.advanced&&values[f.key]!==undefined&&values[f.key]!==null&&String(values[f.key]).trim()!=="")
 .map(f=>String(values[f.key])+(f.unit?" "+f.unit:"")).slice(0,7).join(" · ").slice(0,250)||capacity||"";
}
function capture(kind,db=catalog){
 const t=get(kind,db);
 return t?{id:t.id,name:t.name,version:t.version,fields:copy(t.fields),modelRequired:!!t.modelRequired}:null;
}
function missing(kind,v,db=catalog){
 const t=get(kind,db);if(!t)return [];
 const issues=t.modelRequired&&!String(v.model||"").trim()?["Manufacturer model number"]:[];
 for(const f of t.fields){
  const raw=v.solar?.[f.key];
  if(f.required&&(raw===undefined||raw===null||String(raw).trim()===""))issues.push(f.label);
 }
 return issues;
}
const opt=(value,label,selected)=>'<option value="'+esc(value)+'"'+(value===selected?' selected':'')+'>'+esc(label)+'</option>';
function fieldRow(f={},locked=false){
 return '<div class="cpq-template-row" data-template-row>'+
 '<input type="hidden" name="tplKey" value="'+esc(f.key||"")+'">'+
 '<label>Field name<input name="tplLabel" maxlength="100" value="'+esc(f.label||"")+'" placeholder="e.g. Rated voltage" required></label>'+
 '<label>Field type<select name="tplType"'+(locked?' disabled':'')+'>'+[["text","Text"],["number","Number"],["select","Dropdown"]].map(([v,l])=>opt(v,l,f.type||"text")).join("")+'</select>'+
 (locked?'<input type="hidden" name="tplType" value="'+esc(f.type)+'">':'')+'</label>'+
 '<label>Unit (optional)<input name="tplUnit" maxlength="40" value="'+esc(f.unit||"")+'" placeholder="kV / mm²"'+(locked?' readonly':'')+'></label>'+
 '<label>Dropdown choices (separate with ;)<input name="tplChoices" maxlength="1000" value="'+esc(f.choices||"")+'" placeholder="Choice A;Choice B"'+(locked?' readonly':'')+'></label>'+
 '<label>Required before review<select name="tplRequired">'+opt("no","Optional",f.required?"yes":"no")+opt("yes","Required",f.required?"yes":"no")+'</select></label>'+
 '<label>Placement<select name="tplAdvanced">'+opt("no","Basic specifications",f.advanced?"yes":"no")+opt("yes","Advanced specifications",f.advanced?"yes":"no")+'</select></label>'+
 (locked?'<small class="cpq-template-locked">Existing field key and data type preserved</small>':'<button type="button" class="btn" data-template-remove>Remove unsaved field</button>')+'</div>';
}
function editor(t={},db=catalog){
 return '<div class="ma6a-editor-section"><h3>Product Specification Template</h3><p>Choose the technical fields shown when an employee adds a product. Required technical values can be incomplete in Draft, but must be filled before demo review enables the product.</p></div>'+
 '<div class="ma6-field-grid"><div class="ma6-field"><label>Template name *</label><input name="tplName" required maxlength="120" value="'+esc(t.name||"")+'"></div>'+
 '<div class="ma6-field"><label>Default category *</label><select name="tplCategory">'+(db.categories||[]).filter(c=>c!=="Services & EPC").map(c=>opt(c,c,t.category||"Other")).join("")+'</select></div>'+
 '<div class="ma6-field"><label>Default unit *</label><input name="tplUnitDefault" required maxlength="30" value="'+esc(t.unit||"Nos")+'"></div>'+
 '<div class="ma6-field"><label>Manufacturer model number</label><select name="tplModelRequired">'+opt("no","Optional",t.modelRequired?"yes":"no")+opt("yes","Required",t.modelRequired?"yes":"no")+'</select></div></div>'+
 '<div class="cpq-template-note">A saved field keeps its key, type, unit and dropdown choices so old product data stays readable. You can edit names, required rules and placement, or add fields. To redesign existing field types, create a new template.</div>'+
 '<div class="ma6a-section-heading"><h3>Technical fields</h3><button class="btn primary" type="button" data-template-add>+ Add Field</button></div>'+
 '<div id="cpq-template-fields">'+(t.fields||[]).map(f=>fieldRow(f,true)).join("")+'</div>'+
 '<p class="muted">Text, number with optional unit, and dropdown fields are supported. No engineering values are invented by the template.</p>';
}
function manager(db=catalog){
 return '<div class="ma6a-editor-section"><h3>Manage Product Specification Templates</h3><p>Use the same template editor here or from + Add New Specification Template in Add Product.</p></div>'+
 '<button type="button" class="btn primary" data-catalog-action="add-template">+ Add New Template</button>'+
 '<div class="cpq-template-list">'+list(db).filter(t=>t.id!=="service").map(t=>'<div class="cpq-template-record"><div><b>'+esc(t.name)+'</b><small>'+esc(t.category)+' · '+t.fields.length+' fields · v'+t.version+' · Model '+(t.modelRequired?"required":"optional")+'</small></div><button class="btn" type="button" data-catalog-action="edit-template" data-template-id="'+esc(t.id)+'">Edit</button></div>').join("")+'</div>'+
 '<p class="muted">Legacy Solar EPC / Service remains readable for old records. Create new services in Service Management.</p>';
}
function readTemplate(fd,db=catalog,old=null){
 const name=String(fd.get("tplName")||"").trim(),category=String(fd.get("tplCategory")||"").trim(),unit=String(fd.get("tplUnitDefault")||"").trim();
 if(!name||name.length>120||!unit||unit.length>30||!db.categories.includes(category)||category==="Services & EPC")throw Error("Enter a template name, valid product category and unit.");
 if(list(db).some(t=>t.id!==old?.id&&t.name.toLowerCase()===name.toLowerCase()))throw Error("A specification template with this name already exists.");
 const keys=fd.getAll("tplKey"),labels=fd.getAll("tplLabel"),types=fd.getAll("tplType"),units=fd.getAll("tplUnit"),choices=fd.getAll("tplChoices"),reqs=fd.getAll("tplRequired"),adv=fd.getAll("tplAdvanced");
 if(keys.length>80||[labels,types,units,choices,reqs,adv].some(x=>x.length!==keys.length))throw Error("Check the field rows (maximum 80 fields).");
 const existing=new Map((old?.fields||[]).map(f=>[f.key,f])),seenKeys=new Set(),seenLabels=new Set();
 let counter=Math.max(0,...[...existing.keys()].map(k=>/^field_\d+$/.test(k)?Number(k.slice(6)):0));
 const fields=keys.map((key,i)=>{
  const label=String(labels[i]||"").trim(),type=String(types[i]||""),u=String(units[i]||"").trim(),raw=String(choices[i]||"");
  if(!label||label.length>100||seenLabels.has(label.toLowerCase()))throw Error("Each technical field needs a distinct name.");
  seenLabels.add(label.toLowerCase());
  if(!["text","number","select"].includes(type)||u.length>40||raw.length>1000)throw Error("Invalid field type, unit or options for "+label);
  const opts=raw.split(";").map(x=>x.trim()).filter(Boolean);
  if(type==="select"&&(!opts.length||new Set(opts.map(x=>x.toLowerCase())).size!==opts.length))throw Error("Enter distinct dropdown choices for "+label);
  const choiceText=type==="select"?opts.join(";"):"";
  if(key){
   const f=existing.get(key);if(!f||seenKeys.has(key)||f.type!==type||(f.unit||"")!==u||(f.choices||"")!==choiceText)throw Error("Existing field types, units and choices are preserved. Create a new template to change their structure.");
  }else{do{key="field_"+String(++counter).padStart(3,"0");}while(existing.has(key)||seenKeys.has(key));}
  seenKeys.add(key);
  return {key,label,type,unit:u,choices:choiceText,required:reqs[i]==="yes",advanced:adv[i]==="yes"};
 });
 if([...existing.keys()].some(k=>!seenKeys.has(k)))throw Error("Existing fields cannot be removed; create a new template for a different schema.");
 if(!fields.length&&!old?.system)throw Error("Add at least one technical field.");
 const ids=list(db).map(t=>/^tpl-\d+$/.test(t.id)?Number(t.id.slice(4)):0);
 return {id:old?.id||"tpl-"+String(Math.max(0,...ids)+1).padStart(3,"0"),name,category,unit,modelRequired:fd.get("tplModelRequired")==="yes",system:!!old?.system,version:(old?.version||0)+1,fields};
}
function save(db,t){
 db.specTemplates=db.specTemplates||[];
 const i=db.specTemplates.findIndex(x=>x.id===t.id);
 if(i<0)db.specTemplates.push(t);else db.specTemplates[i]=t;
 apply(db);
}
W.CPQ_PRODUCT_TEMPLATES={list,get,apply,nextSku,identity,describe,capture,missing,fieldRow,editor,manager,readTemplate,save};
apply(catalog);
})();
