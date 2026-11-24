/* V2 Vendor Master: same shared storage and Quick Create pattern as the other masters. */
(()=>{
"use strict";
const W=window,D=document,M=W.CPQ_VENDOR_MODEL,$=id=>D.getElementById(id),copy=x=>JSON.parse(JSON.stringify(x));
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const db=()=>M.data(),vendor=id=>db().vendors.find(v=>v.id===id);
const state={selected:"",editor:null,focus:null,picked:{categories:[],productIds:[],serviceIds:[],companyIds:[]}};
const field=(n,label,value="",type="text",extra="")=>'<label>'+esc(label)+'<input name="'+esc(n)+'" type="'+type+'" value="'+esc(value)+'" '+extra+'></label>';
const area=(n,label,value="")=>'<label>'+esc(label)+'<textarea name="'+esc(n)+'" rows="3">'+esc(value)+'</textarea></label>';
const option=(id,label,selected)=>'<option value="'+esc(id)+'"'+(id===selected?' selected':'')+'>'+esc(label)+'</option>';
const badge=s=>'<span class="vm-badge '+(s==="Active"?"active":"inactive")+'">'+esc(s)+'</span>';
const kv=(k,v)=>'<div><small>'+esc(k)+'</small><b>'+esc(v||"Not provided")+'</b></div>';
const contactText=v=>v.contacts?.[0]||{};
const short=(xs,n=2)=>xs.length?xs.slice(0,n).join(", ")+(xs.length>n?" +"+(xs.length-n)+" more":""):"—";
const supplies=v=>short([...v.categories,...(v.productIds.length?[v.productIds.length+" product models"]:[]),...(v.serviceIds.length?[v.serviceIds.length+" services"]:[])]);
function filters(){
 const el=$("vm-company-filter"),selected=el.value||"all";
 el.innerHTML=option("all","All companies",selected)+M.entities().map(e=>option(e.id,e.name,selected)).join("");
}
function render(){
 const vs=db().vendors;
 $("vm-summary").innerHTML=[["Total vendors",vs.length],["Active",vs.filter(v=>v.status==="Active").length],["Preferred",vs.filter(v=>v.preferred&&v.status==="Active").length],["Inactive",vs.filter(v=>v.status==="Inactive").length]].map(([l,n])=>'<div class="card vm-stat"><span>'+l+'</span><strong>'+n+'</strong></div>').join("");
 const rows=vs.filter(v=>M.matches(v,$("vm-search").value)&&($("vm-company-filter").value==="all"||v.companyIds.includes($("vm-company-filter").value))&&($("vm-status-filter").value==="all"||v.status===$("vm-status-filter").value)&&($("vm-preferred-filter").value==="all"||v.preferred));
 $("vm-count").textContent=rows.length+" shown";
 $("vm-rows").innerHTML=rows.length?rows.map(v=>'<tr class="'+(v.id===state.selected?"selected":"")+'" data-vendor="'+esc(v.id)+'"><td><button type="button" class="vm-name" data-view="'+esc(v.id)+'">'+esc(v.name)+'</button><small>'+esc(v.id)+(v.preferred?" · Preferred":"")+'</small></td><td>'+esc(contactText(v).name||"—")+'<small>'+esc(contactText(v).email||contactText(v).phone||"")+'</small></td><td>'+esc(supplies(v))+'</td><td>'+esc(short(v.companyIds.map(M.companyName)))+'</td><td>'+badge(v.status)+'</td><td><button class="btn" type="button" data-edit="'+esc(v.id)+'">Edit</button></td></tr>').join(""):'<tr><td colspan="6" class="vm-empty">No vendors match your filters. Clear filters or add a new supplier.</td></tr>';
 const v=vendor(state.selected);$("vm-detail").hidden=!v;$("vm-workspace").classList.toggle("is-split",!!v);
 if(v)renderDetail(v);
}
function renderDetail(v){
 const docs=v.documents||[],history=v.history||[];
 const li=arr=>arr.length?'<ul>'+arr.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>':'<p class="muted">None recorded.</p>';
 $("vm-detail-body").innerHTML='<div class="vm-heading"><div><h2>'+esc(v.name)+'</h2><p class="muted">'+esc(v.id)+(v.preferred?" · Preferred vendor":"")+'</p>'+badge(v.status)+'</div><button class="btn primary" data-edit="'+esc(v.id)+'" type="button">Edit Vendor</button></div>'+
 '<div class="vm-detail-box"><h3>Contact information ('+v.contacts.length+')</h3>'+(v.contacts.length?v.contacts.map(c=>'<div class="vm-contact-detail"><b>'+esc(c.name)+'</b><small>'+esc([c.role,c.email,c.phone].filter(Boolean).join(" · ")||"No other details")+'</small></div>').join(""):'<p class="muted">No contacts yet.</p>')+'</div>'+
 '<div class="vm-detail-box"><h3>Available to our companies</h3>'+li(v.companyIds.map(M.companyName))+'</div>'+
 '<details class="vm-detail-box" open><summary>Products &amp; services supplied</summary><h4>Product categories</h4>'+li(v.categories)+'<h4>Exact product models / SKUs</h4>'+li(v.productIds.map(M.productName))+'<h4>Products using this vendor as preferred supplier</h4>'+li(M.preferredProducts(v.id).map(p=>M.productName(p.id)))+'<h4>Services / sub-services</h4>'+li(v.serviceIds.map(M.serviceName))+'<p class="muted">These are sourcing associations only; they do not set prices or approve supplier offers.</p></details>'+
 '<details class="vm-detail-box"><summary>Tax, address &amp; other information</summary><div class="vm-kv">'+kv("GSTIN",v.gstin)+kv("PAN",v.pan)+kv("Address",[v.address,v.city,v.state,v.pin,v.country].filter(Boolean).join(", "))+kv("Website",v.website)+kv("Notes",v.notes)+'</div></details>'+
 '<details class="vm-detail-box"><summary>Document references ('+docs.length+')</summary>'+li(docs.map(d=>d.type+" · "+d.name+" (metadata only)"))+'<p class="muted">No file content is uploaded or downloadable in this demo.</p></details>'+
 '<details class="vm-detail-box"><summary>Vendor quotations &amp; rates</summary><p class="muted">Supplier quotation capture and rate verification will be connected in the next Phase 1 workspace. No verified rates are recorded here.</p></details>'+
 '<details class="vm-detail-box"><summary>Change history ('+history.length+')</summary>'+li(history.slice().reverse().map(h=>h.at+" · "+h.action+" · "+h.actor+(h.changed?.length?" · "+h.changed.join(", "):"")))+'</details>';
}
function toast(s){const t=$("vm-toast");t.textContent=s;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,5000);}
function error(s){const e=$("vm-error");e.textContent=s;e.hidden=false;e.scrollIntoView({block:"nearest"});}
function rowContact(c={}){
 return '<div class="vm-contact-row"><input type="hidden" name="contactId" value="'+esc(c.id||"")+'">'+field("contactName","Contact name",c.name||"")+field("contactRole","Designation / role",c.role||"")+field("contactEmail","Email",c.email||"","email")+field("contactPhone","Phone",c.phone||"","tel")+'<button type="button" class="btn vm-remove-contact">Remove</button></div>';
}
function picker(key,label){
 return '<div class="vm-picker"><label>'+esc(label)+'<select id="vm-pick-'+key+'"></select></label><div class="vm-picker-actions"><button class="btn" type="button" data-pick="'+key+'">Add selected</button><button class="btn" type="button" data-new="'+key+'">+ Add New '+({categories:"Category",productIds:"Product",serviceIds:"Service"}[key])+'</button></div><div id="vm-picked-'+key+'" class="vm-chips"></div></div>';
}
function readCompanies(){state.picked.companyIds=Array.from(D.querySelectorAll('#vm-companies input:checked')).map(x=>x.value);}
function companyChoices(){
 const e=$("vm-companies"),chosen=state.picked.companyIds;const rows=M.entities().filter(c=>c.status!=="Inactive"||chosen.includes(c.id));
 e.innerHTML=rows.map(c=>'<label class="vm-check"><input type="checkbox" value="'+esc(c.id)+'"'+(chosen.includes(c.id)?' checked':'')+'>'+esc(c.name)+(c.status==="Inactive"?" (inactive)":"")+'</label>').join("")+chosen.filter(id=>!rows.some(c=>c.id===id)).map(id=>'<label class="vm-check"><input type="checkbox" value="'+esc(id)+'" checked>'+esc(id)+' (historical reference)</label>').join("");
}
const labels={categories:x=>x,productIds:M.productName,serviceIds:M.serviceName};
function refreshPicks(){
 const lists={categories:(M.catalog().categories||[]).map(x=>({id:x,name:x})),productIds:M.products().filter(x=>x.status==="Active").map(x=>({id:x.id,name:M.productName(x.id)})),serviceIds:M.services().filter(x=>x.status==="Active").map(x=>({id:x.id,name:M.serviceName(x.id)}))};
 for(const key of Object.keys(lists)){
  const sel=$("vm-pick-"+key);if(!sel)continue;
  const prior=sel.value;sel.innerHTML=option("","Choose an existing record",prior)+lists[key].filter(x=>!state.picked[key].includes(x.id)).map(x=>option(x.id,x.name,prior)).join("");
  $("vm-picked-"+key).innerHTML=state.picked[key].map(id=>'<span class="vm-link-chip">'+esc(labels[key](id))+' <button type="button" data-unpick="'+key+'" data-id="'+esc(id)+'" aria-label="Remove '+esc(labels[key](id))+'">×</button></span>').join("")||'<span class="muted">None selected (optional)</span>';
 }
}
function openEditor(id="",ctx={}){
 const old=id?vendor(id):null;if(id&&!old)return null;state.editor=old?copy(old):{};state.focus=D.activeElement;
 const v=old||{status:"Active",country:"India",companyIds:ctx.companyId?[ctx.companyId]:M.entities().filter(e=>e.status!=="Inactive").length===1?[M.entities().find(e=>e.status!=="Inactive").id]:[],contacts:[]};
 for(const key of ["companyIds","categories","productIds","serviceIds"])state.picked[key]=[...(v[key]||[])];
 $("vm-dialog-title").textContent=old?"Edit Vendor":"Add Vendor";
 $("vm-fields").innerHTML='<div class="vm-form-grid">'+field("name","Vendor / supplier name *",v.name||"","text",'maxlength="150" required')+'<label>Status<select name="status">'+option("Active","Active",v.status)+option("Inactive","Inactive",v.status)+'</select></label></div>'+
 '<div class="vm-company-section"><h3>Available to our companies *</h3><p class="muted">Choose the legal entities allowed to source from this supplier. Select more than one if shared.</p><div id="vm-companies"></div><button class="btn" type="button" data-new="companyIds">+ Add New Company</button></div>'+
 '<label class="vm-check vm-preferred"><input type="checkbox" name="preferred"'+(v.preferred?' checked':'')+'> Mark as preferred supplier (not a verified rate)</label>'+
 '<details class="vm-form-section" '+(!old||v.contacts.length?'open':'')+'><summary>Contact people (optional)</summary><p class="muted">The first contact is displayed in the register. Add more contacts when needed.</p><div id="vm-contacts">'+(v.contacts.length?v.contacts.map(rowContact).join(""):rowContact())+'</div><button type="button" class="btn" id="vm-add-contact">+ Add Contact</button></details>'+
 '<details class="vm-form-section"><summary>Products, categories &amp; services supplied (optional)</summary><p class="muted">Link existing master records. No duplicate products or automatic pricing.</p>'+picker("categories","Product categories")+picker("productIds","Exact product / SKU")+picker("serviceIds","Service / sub-service")+'</details>'+
 '<details class="vm-form-section"><summary>GST, address &amp; other details (optional)</summary><div class="vm-form-grid">'+field("gstin","GSTIN",v.gstin||"","text",'maxlength="15"')+field("pan","PAN",v.pan||"","text",'maxlength="10"')+field("city","City",v.city||"")+field("state","State",v.state||"")+field("pin","Postal code",v.pin||"")+field("country","Country",v.country||"India")+field("website","Website",v.website||"")+area("address","Address",v.address||"")+area("notes","Internal notes",v.notes||"")+'</div></details>'+
 '<details class="vm-form-section"><summary>Document references (optional)</summary><p class="muted">Only fictional filename and type metadata will be recorded. No actual upload or download.</p><div class="vm-form-grid"><label>Document type<select name="docType"><option>GST certificate</option><option>Company registration</option><option>Catalog / price list</option><option>Authorization / certification</option><option>Other</option></select></label><label>Choose sample files<input name="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx,.txt"></label></div>'+(v.documents?.length?'<p class="muted">Existing references: '+esc(v.documents.map(d=>d.name).join(", "))+'</p>':'')+'</details>';
 companyChoices();refreshPicks();$("vm-error").hidden=true;$("vm-overlay").classList.add("open");$("vm-overlay").setAttribute("aria-hidden","false");D.body.classList.add("vm-dialog-open");$("vm-form").querySelector('[name="name"]').focus();return $("vm-overlay");
}
function closeEditor(){if(!state.editor)return;$("vm-overlay").classList.remove("open");$("vm-overlay").setAttribute("aria-hidden","true");D.body.classList.remove("vm-dialog-open");state.editor=null;state.focus?.focus();}
function save(event){
 event.preventDefault();if(!state.editor)return;
 const form=$("vm-form"),fd=new FormData(form),old=state.editor.id?state.editor:null;
 try{
  readCompanies();const input={...state.picked};for(const k of ["name","status","gstin","pan","address","city","state","pin","country","website","notes"])input[k]=fd.get(k);
  input.preferred=fd.has("preferred");input.contacts=Array.from(form.querySelectorAll(".vm-contact-row")).map(row=>({id:row.querySelector('[name="contactId"]').value,name:row.querySelector('[name="contactName"]').value,role:row.querySelector('[name="contactRole"]').value,email:row.querySelector('[name="contactEmail"]').value,phone:row.querySelector('[name="contactPhone"]').value}));
  input.files=Array.from(form.querySelector('[name="files"]').files||[]).map(f=>({name:f.name,size:f.size,type:fd.get("docType")}));
  const latest=copy(W.CPQ_SHARED.read().modules.vendors||db());if(!Array.isArray(latest.vendors))throw Error("Vendor records could not be read. Refresh before saving.");
  if(old&&JSON.stringify(latest.vendors.find(v=>v.id===old.id))!==JSON.stringify(old))throw Error("This vendor changed in another tab. Cancel and refresh before editing it again.");
  const record=M.build(input,old,latest);
  if(old)latest.vendors=latest.vendors.map(v=>v.id===old.id?record:v);else latest.vendors.unshift(record);
  if(!W.CPQ_SHARED.save("vendors",latest))throw Error("Browser storage could not save this vendor. Your form is still open.");
  W.CPQ_VENDOR_MASTER=latest;state.selected=record.id;closeEditor();filters();render();toast(old?"Vendor updated.":"Vendor added to the shared demo master.");if(!old)W.CPQ_QUICK_CREATE?.saved("vendor",record.id);
 }catch(e){error(e.message);}
}
function clearFilters(){ $("vm-search").value="";$("vm-company-filter").value="all";$("vm-status-filter").value="all";$("vm-preferred-filter").value="all";render();}
$("vm-add").addEventListener("click",()=>openEditor());$("vm-close").addEventListener("click",closeEditor);$("vm-cancel").addEventListener("click",closeEditor);$("vm-form").addEventListener("submit",save);
$("vm-expand").addEventListener("click",()=>{state.selected="";render();});$("vm-reset").addEventListener("click",clearFilters);
for(const id of ["vm-search","vm-company-filter","vm-status-filter","vm-preferred-filter"])$(id).addEventListener(id==="vm-search"?"input":"change",render);
$("vm-overlay").addEventListener("click",e=>{if(e.target===$("vm-overlay"))closeEditor();});
D.addEventListener("keydown",e=>{if(e.key==="Escape"&&state.editor&&!$("cpq-qc-dialog")?.open)closeEditor();});
D.addEventListener("click",e=>{
 const t=e.target.closest("button");if(!t)return;
 if(t.dataset.view){state.selected=t.dataset.view;render();}
 else if(t.dataset.edit)openEditor(t.dataset.edit);
 else if(t.id==="vm-add-contact")$("vm-contacts").insertAdjacentHTML("beforeend",rowContact());
 else if(t.classList.contains("vm-remove-contact"))t.closest(".vm-contact-row").remove();
 else if(t.dataset.pick){const key=t.dataset.pick,value=$("vm-pick-"+key).value;if(value&&!state.picked[key].includes(value)){state.picked[key].push(value);refreshPicks();}}
 else if(t.dataset.unpick){const key=t.dataset.unpick;state.picked[key]=state.picked[key].filter(x=>x!==t.dataset.id);refreshPicks();}
 else if(t.dataset.new){
  const key=t.dataset.new,type={companyIds:"company",categories:"category",productIds:"product",serviceIds:"service"}[key];
  readCompanies();W.CPQ_QUICK_CREATE?.open(type,{},r=>{const id=typeof r==="string"?r:r.id;if(id&&!state.picked[key].includes(id))state.picked[key].push(id);companyChoices();refreshPicks();},t,["productIds","serviceIds"].includes(key));
 }
 else if(t.dataset.planned)W.alert(t.dataset.planned+" is a planned wireframe module.");
});
filters();render();const requested=new URLSearchParams(W.location.search).get("vendor");if(vendor(requested)){state.selected=requested;render();}
W.CPQ_QC_FORMS={vendor:ctx=>openEditor("",ctx)};
})();