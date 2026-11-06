/* MA-002: all information is fictional and remains in memory. */
(()=>{
"use strict";
const records=window.CPQ_MA002_DATA.map(x=>({...x,branches:x.branches.map(b=>({...b}))}));
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={selected:"e1",tab:"overview",search:"",status:"all"};
const current=()=>records.find(x=>x.id===state.selected)||records[0];
const value=v=>v&&String(v).trim()?esc(v):'<span class="weak">Not configured</span>';
const field=(label,val,wide=false)=>'<div class="org-field'+(wide?' wide':'')+'"><label>'+esc(label)+'</label><strong>'+value(val)+'</strong></div>';
const notice=s=>'<div class="org-callout">'+s+'</div>';
const section=(title,subtitle,edit,label)=>'<div class="org-section-title"><div><h3>'+title+'</h3>'+(subtitle?'<p>'+subtitle+'</p>':'')+'</div>'+(edit?'<button type="button" class="btn" data-edit="'+edit+'">'+label+'</button>':'')+'</div>';
const badge=status=>'<span class="chip">'+esc(status)+'</span>';
function identityPreview(e){
return '<div class="org-preview"><span class="smallcaps">Customer quotation · identity preview only</span><hr><h3>'+esc(e.legalName)+'</h3><p>'+esc([e.address,e.city,e.state,e.pin].filter(Boolean).join(', '))+'</p><p>GSTIN: '+esc(e.gstin||"Not configured")+'<br>Email: '+esc(e.email||"Not configured")+'</p><hr><div class="org-fields">'+field("Issuer","This legal entity, not the customer company")+field("Quotation prefix",e.prefix)+field("Authorized signatory",e.signatory)+field("Default terms",e.terms)+field("Payment bank (fictional)",e.bankName)+field("Bank account (masked)",e.bankAccount)+'</div><div class="org-callout">Illustration only. Actual customer PDFs must use verified entity information, approved templates and a preserved issue-time snapshot. No PDF is produced here.</div></div>';
}
function overview(e){
return section("Company overview","This entity controls its quotation identity.","legal","Edit company details")+
'<div class="org-fields">'+field("Legal name",e.legalName)+field("Entity type",e.type)+field("Registered location",[e.city,e.state].filter(Boolean).join(", "))+field("GST identity",e.gstin)+field("Quotation prefix",e.prefix)+field("Authorized signatory",e.signatory)+'</div>'+
'<div class="org-split" style="margin-top:18px"><div class="org-mini"><h4>Operating branches</h4><p>'+e.branches.length+' branch(es) under this legal entity. Users can later receive access to one or more authorized branches.</p><button type="button" class="btn" style="margin-top:12px" data-go="branches">Manage branches</button></div><div class="org-mini"><h4>Quotation identity</h4><p>Logo, address, GST details, authorized signatory, bank instructions and default terms are sourced from the selected entity.</p><button type="button" class="btn" style="margin-top:12px" data-go="branding">Review quote setup</button></div></div>'+
notice('<strong>Important:</strong> The same company may have multiple branches. Each branch does not automatically become a separate registered legal entity.');
}
function legal(e){
return section("Legal identity & contact","One set of legal details for this entity.","legal","Edit details")+
'<div class="org-fields">'+field("Display / trading name",e.name)+field("Registered legal name",e.legalName)+field("Organization type",e.type)+field("Status",e.status)+field("Registered address",e.address,true)+field("City",e.city)+field("State",e.state)+field("PIN code",e.pin)+field("GSTIN",e.gstin)+field("PAN",e.pan)+field("CIN / registration / license",e.registration)+field("MSME / Udyam",e.msme)+field("Business phone",e.phone)+field("Business email",e.email)+field("Website",e.website)+'</div>'+
notice('<strong>Source of truth:</strong> Master Admin maintains this entity record. Tax and registration values must be verified before issuing real commercial documents; the placeholders here are not valid registrations.');
}
function branding(e){
return section("Branding & quotation setup","Company-specific identity and numbering.","branding","Edit branding & quote settings")+
'<div class="org-branding-card"><span class="org-logo">'+esc(e.name.split(" ").slice(1,3).map(x=>x[0]).join("").slice(0,2))+'</span><div><b>'+esc(e.name)+'</b><small>Sample logo: '+esc(e.logo)+'</small><small>Letterhead: '+esc(e.letterhead)+'</small></div></div>'+
'<div class="org-fields">'+field("Quotation prefix",e.prefix)+field("Authorized signatory",e.signatory)+field("Signature / stamp image",e.signature)+field("Template status","Pending management-approved template")+field("Current revision / issued record policy","Existing issues must remain immutable",true)+'</div>'+
identityPreview(e)+notice('<strong>Numbering:</strong> Each legal entity needs its own quotation numbering series. A prefix change must never renumber quotations already issued.');
}
function bank(e){
return section("Bank details & commercial terms","Sensitive payment information is separately permission-scoped.","bank","Review sample settings")+
'<div class="org-fields">'+field("Bank name",e.bankName)+field("Account holder",e.accountHolder)+field("Account number (masked)",e.bankAccount)+field("IFSC / routing reference",e.ifsc)+field("Default terms & conditions",e.terms,true)+'</div>'+
notice('<strong>Financial access control:</strong> Company setup permission must not automatically expose full bank account details or confidential commercial information. A production workflow needs separate grants, verification and an audit history. All values here are fictional and never persisted.');
}
function branches(e){
const out=e.branches.map((b,i)=>'<tr><td><b>'+esc(b.name)+'</b><small>'+esc(b.id)+'</small></td><td>'+esc([b.city,b.state].filter(Boolean).join(", "))+'</td><td>'+esc(b.manager||"Unassigned")+'</td><td>'+badge(b.status)+'</td><td><button type="button" class="btn" data-edit-branch="'+esc(b.id)+'">Edit</button></td></tr>').join("");
return section("Operating branches","All branches below belong only to "+esc(e.name)+".","branch"," + Add Branch")+
'<div class="org-branch-wrap"><table class="org-branch-table"><thead><tr><th>Branch</th><th>Location</th><th>Manager</th><th>Status</th><th>Action</th></tr></thead><tbody>'+(out||'<tr><td colspan="5">No branches added yet.</td></tr>')+'</tbody></table></div>'+
notice('<strong>Branch rules:</strong> Each branch belongs to one legal entity. Employee access will be configured in MA-003, and access to another branch is never granted merely by selecting it. Branch contact data may appear on documents only where authorized.');
}
const tabs={overview,legal,branding,bank,branches};
function render(){
 const e=current();if(!e)return;
 const n=records.length,b=records.reduce((s,x)=>s+x.branches.length,0),a=records.filter(x=>x.status==="Active").length;
 $("org-summary").innerHTML=[
  ["Legal entities",n,"Separate issuing-company identities"],
  ["Operating branches",b,"Locations under these entities"],
  ["Active entities",a,"Eligible for new work subject to checks"]
 ].map(x=>'<div class="card org-summary-box"><small>'+x[0]+'</small><strong>'+String(x[1]).padStart(2,"0")+'</strong><p>'+x[2]+'</p></div>').join("");
 const q=state.search.toLowerCase();
 const filtered=records.filter(x=>(state.status==="all"||x.status===state.status)&&(!q||x.name.toLowerCase().includes(q)||x.legalName.toLowerCase().includes(q)));
 $("entity-count").textContent=filtered.length+" "+(filtered.length===1?"entity":"entities");
 $("entity-list").innerHTML=filtered.length?filtered.map(x=>'<button class="org-item'+(x.id===state.selected?' selected':'')+'" data-entity="'+esc(x.id)+'" type="button" aria-pressed="'+(x.id===state.selected)+'"><span class="org-item-head"><span class="org-item-name">'+esc(x.name)+'</span>'+badge(x.status)+'</span><span class="org-item-sub">'+esc(x.legalName)+'</span><span class="org-item-foot"><span>'+x.branches.length+' branch(es)</span><span>Prefix '+esc(x.prefix||"Not set")+'</span></span></button>').join(""):'<div class="empty">No matching company. Clear search or change status.</div>';
 $("selected-header").innerHTML='<div><div style="margin-bottom:7px">'+badge(e.status)+' <span class="chip">Entity '+esc(e.id.toUpperCase())+'</span></div><h2>'+esc(e.name)+'</h2><p>'+esc(e.legalName)+'</p><small>'+esc([e.city,e.state].filter(Boolean).join(', '))+' · '+e.branches.length+' branch(es) · Prefix '+esc(e.prefix||"Not set")+'</small></div><div class="actions"><button class="btn" data-edit="legal">Edit Company</button><button class="btn" data-go="branding">Quotation Identity</button></div>';
 document.querySelectorAll('[data-tab]').forEach(t=>{const on=t.dataset.tab===state.tab;t.classList.toggle("active",on);t.setAttribute("aria-selected",String(on));t.tabIndex=on?0:-1});
 $("tab-content").innerHTML=tabs[state.tab](e);
}
window.CPQ_MA002={records,$,esc,state,current,render,badge,value};
render();
})();