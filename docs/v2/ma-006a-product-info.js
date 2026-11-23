/* CPQ V2 product-information extension. Browser wireframe only; NEVER stores file bytes. */
(function(){
"use strict";
const E=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const docTypes=["Datasheet","Blueprint / Design Drawing","Installation Manual","User Guide","Warranty Certificate","Guarantee Certificate","Test Report","Certification","Product Photo","Brochure","Other"];
const visibilities=["Internal Only","Approved Customer Sharing"];
const categoryTemplates={
 "Panels & Assemblies":[["ratedCurrent","Rated current","A","number"],["ratedVoltage","Rated voltage","V","text"],["phase","Phase","","select","Single-phase;Three-phase;DC;Other"],["feederCount","Number of feeders / ways","","text"],["busbar","Busbar material and rating","","text"],["fabrication","Design / fabrication","","text"],["protection","Protection devices","","text"],["designStandards","Applicable design standard refs","","text"]],
 "Cables & Conductors":[["cores","Number of cores","","text"],["conductorSize","Conductor cross-section","mm²","text"],["conductorMaterial","Conductor material","","select","Copper;Aluminium;Other"],["insulation","Insulation / jacket","","text"],["voltageGrade","Voltage grade","V","text"],["currentRating","Rated current","A","text"],["armouring","Armouring / shielding","","text"],["applicableStandard","Cable standard references","","text"]],
 "Switchgear":[["ratedCurrent","Rated current","A","number"],["ratedVoltage","Rated voltage","V","text"],["breakingCapacity","Breaking capacity","kA","text"],["poles","Poles","","text"],["tripping","Trip / protection mechanism","","text"],["operatingMechanism","Operating mechanism","","text"],["installation","Mounting / enclosure","","text"],["applicableStandard","Compliance references","","text"]],
 "Other":[["ratedVoltage","Rated voltage","V","text"],["ratedCurrent","Rated current","A","text"],["power","Rated power","kW","text"],["frequency","Frequency","Hz","text"],["phase","Electrical phase","","text"],["efficiency","Efficiency","%","text"],["construction","Construction / design details","","text"],["standards","Applicable standards","","text"]]
};
const fallbackCategory=(f={})=>f.category||((f.solarKind||"")==="cable"?"Cables & Conductors":"Other");
function schema(f={}){
 if(f.type==="service"||(f.solarKind&&f.solarKind!=="general"&&f.solarKind!=="service"))return [];
 return categoryTemplates[fallbackCategory(f)]||categoryTemplates.Other;
}
function categoryFields(f={},v={}){
 const fields=schema(f);
 if(!fields.length)return '<div class="ma6a-editor-section-note">This model uses its equipment-specific template. Use additional technical attributes for anything not covered.</div>';
 const existing=v.categorySpecs||{};
 const inputs=fields.map(([key,label,unit,type,choices])=>{
  const id="cat-category_"+key,val=existing[key]??"",field="category_"+key;
  const text=E(label)+(unit?' <small>('+E(unit)+')</small>':'');
  const options=type==="select"?'<select id="'+id+'" name="'+field+'"><option value="">Not supplied</option>'+String(choices||"").split(";").map(value=>'<option value="'+E(value)+'"'+(val===value?' selected':'')+'>'+E(value)+'</option>').join("")+'</select>':
  '<input id="'+id+'" name="'+field+'" type="'+(type==="number"?"number":"text")+'" '+(type==="number"?'step="any" ':'')+'value="'+E(val)+'" placeholder="Optional">';
  return '<div class="ma6-field"><label for="'+id+'">'+text+'</label>'+options+'</div>';
 }).join("");
 return '<details class="ma6a-editor-details" data-category-specs><summary>Category-specific specifications · '+E(fallbackCategory(f))+'</summary><div class="ma6a-field-hint">Only enter values supported by the manufacturer. More specifications can be added using custom attributes below.</div><div class="ma6-field-grid">'+inputs+'</div></details>';
}
function readCategory(fd,f={},previous={}){
 const result={...(previous||{})};
 for(const [key,label,unit,type] of schema(f)){
  const raw=String(fd.get("category_"+key)||"").trim();
  if(!raw){delete result[key];continue;}
  if(raw.length>250)throw Error(label+" is too long.");
  if(type==="number"&&!Number.isFinite(Number(raw)))throw Error("Enter a valid "+label+".");
  result[key]=type==="number"?Number(raw):raw;
 }
 return result;
}
function categorySummary(f={},v={}){
 const entries=Object.entries(v.categorySpecs||{});
 if(!entries.length)return "";
 const lookup=Object.fromEntries(schema(f).map(([key,label,unit])=>[key,label+(unit?" ("+unit+")":"")]));
 return '<div class="ma6a-pim-kvs">'+entries.map(([key,value])=>'<div><small>'+E(lookup[key]||key)+'</small><strong>'+E(value)+'</strong></div>').join("")+'</div>';
}
function warrantyFields(v={}){
 const w=v.warranty||{};
 const inp=(name,label,value="",type="text",other="")=>'<div class="ma6-field"><label for="cat-'+name+'">'+E(label)+'</label><input id="cat-'+name+'" name="'+name+'" type="'+type+'" '+other+' value="'+E(value)+'" placeholder="Optional"></div>';
 const textarea=(name,label,value="")=>'<div class="ma6-field full"><label for="cat-'+name+'">'+E(label)+'</label><textarea id="cat-'+name+'" name="'+name+'" rows="2">'+E(value)+'</textarea></div>';
 return '<details class="ma6a-editor-details" data-product-warranty><summary>Warranty &amp; guarantee (optional)</summary>'+
 '<div class="ma6-field-grid">'+
 inp("warrantyProvider","Warranty / guarantee provider",w.provider||"")+
 inp("warrantyMonths","Product warranty duration (months)",w.months??"","number",'min="0" step="1"')+
 inp("guaranteeMonths","Guarantee duration (months)",w.guaranteeMonths??"","number",'min="0" step="1"')+
 inp("warrantyTrigger","Warranty starts from",w.trigger||"")+
 textarea("warrantyCoverage","Warranty coverage and exclusions",w.coverage||"")+
 textarea("guaranteeTerms","Guarantee conditions",w.guaranteeTerms||"")+
 textarea("warrantyNotes","Warranty / guarantee internal notes",w.notes||"")+
 '</div><div class="ma6a-editor-section-note">Warranty and guarantee can differ. Attach supporting certificates under the model\'s Documents &amp; Warranty tab after saving.</div></details>';
}
function readWarranty(fd,old={}){
 const out={...old};
 for(const [name,key] of [["warrantyProvider","provider"],["warrantyTrigger","trigger"],["warrantyCoverage","coverage"],["guaranteeTerms","guaranteeTerms"],["warrantyNotes","notes"]]){
  out[key]=String(fd.get(name)||"").trim().slice(0,key==="coverage"||key==="guaranteeTerms"?3000:700);
 }
 for(const [name,key] of [["warrantyMonths","months"],["guaranteeMonths","guaranteeMonths"]]){
  const raw=String(fd.get(name)||"").trim();
  if(!raw){delete out[key];continue;}
  const n=Number(raw);if(!Number.isInteger(n)||n<0||n>1200)throw Error("Enter a valid duration in months (0 to 1200).");
  out[key]=n;
 }
 return out;
}
function warrantySummary(v={}){
 const w=v.warranty||{};
 const lines=[
  ["Warranty provider",w.provider||"Not specified"],
  ["Product warranty",w.months===undefined?"Not specified":w.months+" months"],
  ["Guarantee",w.guaranteeMonths===undefined?"Not specified":w.guaranteeMonths+" months"],
  ["Warranty starts",w.trigger||"Not specified"],
  ["Coverage and exclusions",w.coverage||"Not specified"],
  ["Guarantee terms",w.guaranteeTerms||"Not specified"]
 ];
 return '<div class="ma6a-pim-kvs">'+lines.map(([label,value])=>'<div><small>'+E(label)+'</small><strong>'+E(value)+'</strong></div>').join("")+'</div>'+
 (w.notes?'<div class="ma6a-pim-note"><b>Internal notes:</b> '+E(w.notes)+'</div>':"");
}
const allowExtension=/\.(pdf|png|jpe?g|webp|dwg|dxf|docx?|xlsx?)$/i;
const maxBytes=15*1024*1024;
function addDocuments(variant,form){
 const input=form.querySelector('[name="docFiles"]');
 const files=Array.from(input?.files||[]);
 if(!files.length)throw Error("Choose at least one document to record.");
 if(files.length>8)throw Error("Select no more than eight files at a time.");
 const fd=new FormData(form),type=String(fd.get("docType")||"Other");
 if(!docTypes.includes(type))throw Error("Choose a valid document category.");
 const version=String(fd.get("docVersion")||"1.0").trim().slice(0,30);
 if(!version||!/^[A-Za-z0-9._-]+$/.test(version))throw Error("Document version may contain letters, numbers, dots, underscores and hyphens.");
 const visibility=String(fd.get("docVisibility")||"Internal Only");
 if(!visibilities.includes(visibility))throw Error("Choose a valid document visibility.");
 const description=String(fd.get("docDescription")||"").trim().slice(0,500);
 const replaceId=String(fd.get("docSupersedes")||"");
 if(replaceId&&files.length!==1)throw Error("Select one file at a time when replacing a document version.");
 const before=(variant.documents||[]),replacing=replaceId?before.find(d=>d.id===replaceId&&d.status!=="Archived"&&d.status!=="Superseded"):null;
 if(replaceId&&!replacing)throw Error("Selected previous document is no longer current.");
 if(replacing&&replacing.type!==type)throw Error("The replacement must use the same document category.");
 for(const f of files){
  if(!allowExtension.test(f.name||""))throw Error("Unsupported file type for "+(f.name||"unnamed file")+". Allowed: PDF, images, DWG/DXF and Word/Excel.");
  if(!Number.isFinite(f.size)||f.size<1||f.size>maxBytes)throw Error("File must be between 1 byte and 15 MB: "+f.name);
 }
 const at=new Date().toISOString();
 if(replacing)replacing.status="Superseded";
 const next=files.map((f,i)=>({
  id:"DOC-"+Date.now().toString(36)+"-"+i+"-"+Math.random().toString(36).slice(2,6),
  name:String(f.name).slice(0,180),type,version,visibility,description,
  sizeBytes:f.size,status:"Current",supersedesId:replacing?.id||"",recordedAt:at,actor:"Demo operator",
  demoMetadataOnly:true
 }));
 variant.documents=[...before,...next];
 variant.documentHistory=[...(variant.documentHistory||[]),{at,action:"Recorded "+next.length+" document filename(s) (metadata only)",actor:"Demo operator"}].slice(-80);
 return next.length;
}
function archiveDocument(variant,docId){
 const d=(variant.documents||[]).find(x=>x.id===docId);
 if(!d||d.status==="Archived")throw Error("Document entry is no longer available.");
 d.status="Archived";d.archivedAt=new Date().toISOString();
 variant.documentHistory=[...(variant.documentHistory||[]),{at:d.archivedAt,action:"Archived "+d.name+" ("+d.version+")",actor:"Demo operator"}].slice(-80);
}
function docSelect(current=""){
 return '<option value="">New independent document</option>'+current.filter(d=>d.status==="Current").map(d=>'<option value="'+E(d.id)+'">'+E(d.name+" · v"+d.version+" · "+d.type)+'</option>').join("");
}
function renderDocuments(v,services=[]){
 if(!v)return '<div class="ma6a-empty-note">Select a model from Models &amp; Sizes to manage documents.</div>';
 const docs=[...(v.documents||[])].reverse(),current=docs.filter(x=>x.status==="Current"),older=docs.filter(x=>x.status!=="Current");
 const count=docs.length, history=(v.documentHistory||[]).slice(-12).reverse();
 const linked=Array.isArray(services)?services.filter(s=>(s.productIds||[]).includes(v.id)):[];
 const options=docTypes.map(t=>'<option value="'+E(t)+'">'+E(t)+'</option>').join("");
 const voptions=visibilities.map(x=>'<option value="'+E(x)+'">'+E(x)+'</option>').join("");
 const row=d=>'<div class="ma6a-pim-doc"><div class="ma6a-pim-doc-icon" aria-hidden="true">▤</div><div class="ma6a-pim-doc-main"><strong>'+E(d.name)+'</strong>'+
  '<div class="ma6a-pim-meta">'+E(d.type)+' · v'+E(d.version)+' · '+E(d.status||"Current")+' · '+E(d.visibility||"Internal Only")+
  ' · '+E(d.recordedAt?.slice(0,10)||"Not dated")+'</div>'+
  (d.description?'<div class="ma6a-pim-desc">'+E(d.description)+'</div>':"")+
  (d.supersedesId?'<small>Replaces an earlier version (previous metadata retained).</small>':"")+
  '</div><div class="ma6a-pim-doc-actions">'+(d.status==="Current"?'<button type="button" class="btn" data-product-doc-archive="'+E(d.id)+'">Archive</button>':'<span class="ma6a-pim-muted">'+E(d.status||"")+'</span>')+'</div></div>';
 const revisions=(v.revisionHistory||[]).slice(-12).reverse();
 const related=linked.length?linked.map(s=>'<span class="ma6a-pim-pill">'+E(s.name)+' · '+E(s.code)+'</span>').join(""):'<span class="ma6a-pim-muted">No services linked to this model (optional).</span>';
 return '<div class="ma6a-pim-workspace">'+
 '<div class="ma6a-pim-heading"><div><h3>Documents &amp; Warranty · '+E(v.model)+'</h3><p class="muted">Exact manufacturer/model/SKU: '+E(v.sku)+'</p></div>'+
 '<button class="btn" type="button" data-catalog-action="edit-variant">Edit model and warranty</button></div>'+
 '<div class="ma6a-pim-important"><b>Wireframe demonstration:</b> Choose files below to record their filenames, categories and versions in this browser. <b>File contents are NOT uploaded, stored, previewable or downloadable.</b> Use fictional files only. Real secure uploads, access checks, scanning and download controls will be implemented in Laravel.</div>'+
 '<div class="ma6a-pim-cards"><div><small>Current document records</small><strong>'+current.length+'</strong></div><div><small>Archived / superseded</small><strong>'+older.length+'</strong></div><div><small>Model revisions</small><strong>'+revisions.length+'</strong></div></div>'+
 '<section class="ma6a-pim-section"><h4>Add product document references</h4><p class="muted">Add datasheets, blueprints, manuals, warranties, drawings or certifications. Use document versions when manufacturers issue updates.</p>'+
 '<form id="catalog-document-form" class="ma6a-pim-form">'+
 '<div class="ma6a-pim-upload"><label for="cat-doc-file">Choose document file(s) *</label><input id="cat-doc-file" type="file" name="docFiles" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.dxf,.doc,.docx,.xls,.xlsx"><small>Choose up to 8 files, 15 MB each. Only the metadata will be retained in the wireframe.</small></div>'+
 '<div class="ma6a-pim-form-grid"><div><label for="cat-doc-type">Document type</label><select id="cat-doc-type" name="docType">'+options+'</select></div>'+
 '<div><label for="cat-doc-version">Version</label><input id="cat-doc-version" name="docVersion" value="1.0" maxlength="30" required></div>'+
 '<div><label for="cat-doc-visibility">Visibility (future permissions)</label><select id="cat-doc-visibility" name="docVisibility">'+voptions+'</select></div>'+
 '<div><label for="cat-doc-supersedes">Replace an existing version (optional)</label><select id="cat-doc-supersedes" name="docSupersedes">'+docSelect(docs)+'</select></div></div>'+
 '<div><label for="cat-doc-description">Description / document notes (optional)</label><textarea id="cat-doc-description" name="docDescription" maxlength="500" rows="2" placeholder="Example: manufacturer revision number, drawing purpose or certificate number"></textarea></div>'+
 '<div id="catalog-document-error" class="ma6a-pim-error" role="alert" hidden></div>'+
 '<div class="ma6a-pim-form-actions"><button type="submit" class="btn primary">Record file metadata (demo)</button></div></form></section>'+
 '<section class="ma6a-pim-section"><h4>Current documents ('+current.length+')</h4>'+
 (current.length?current.map(row).join(""):'<div class="ma6a-empty-note">No document records yet. Use the form above to add datasheets, drawings, manuals and certificates.</div>')+
 (older.length?'<details class="ma6a-pim-older"><summary>Previous versions and archived records ('+older.length+')</summary>'+older.map(row).join("")+'</details>':"")+'</section>'+
 '<section class="ma6a-pim-section"><div class="ma6a-pim-section-head"><h4>Warranty &amp; guarantee</h4><button type="button" class="btn" data-catalog-action="edit-variant">Edit warranty</button></div>'+warrantySummary(v)+'</section>'+
 '<section class="ma6a-pim-section"><h4>Optional linked services</h4><div class="ma6a-pim-pills">'+related+'</div><p class="muted">To change these associations, use <a href="service-master.html">Service Management</a>. Linking never adds an item to a BOQ automatically.</p></section>'+
 '<details class="ma6a-pim-section ma6a-pim-history"><summary>Product edit history ('+revisions.length+')</summary>'+
 (revisions.length?revisions.map(r=>'<div><b>'+E(r.at?.slice(0,19).replace("T"," ")||"Unknown date")+'</b> · '+E(r.action||"Model edited")+'<small>'+E((r.fields||[]).join(", "))+'</small>'+
  (r.before?'<details><summary>Previous values</summary><pre>'+E(JSON.stringify(r.before,null,2))+'</pre></details>':"")+'</div>').join(""):'<p class="muted">No model edits recorded in this browser yet.</p>')+'</details>'+
 (history.length?'<details class="ma6a-pim-section ma6a-pim-history"><summary>Document activity ('+history.length+')</summary>'+history.map(h=>'<div>'+E(h.at?.slice(0,19).replace("T"," ")||"")+' · '+E(h.action)+'</div>').join("")+'</details>':"")+
 '</div>';
}
function recordModelChange(orig,prior,input){
 const keys=Object.keys(input).filter(key=>JSON.stringify(prior[key])!==JSON.stringify(input[key]));
 if(!keys.length)return false;
 const before=Object.fromEntries(keys.map(key=>[key,prior[key]??null]));
 orig.revisionHistory=[...(prior.revisionHistory||[]),{at:new Date().toISOString(),action:"Model details updated",actor:"Demo operator",fields:keys,before}].slice(-20);
 return true;
}
window.CPQ_MA006A_PRODUCT_INFO={categoryFields,readCategory,categorySummary,warrantyFields,readWarranty,
 warrantySummary,renderDocuments,addDocuments,archiveDocument,recordModelChange,docTypes};
})();
