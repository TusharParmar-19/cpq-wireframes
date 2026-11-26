(()=>{
"use strict";
const R=window.CPQ_PRODUCT_RULES,$=id=>document.getElementById(id),esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),form=$("rule-form"),e=form.elements;
const option=(k,v)=>'<option value="'+esc(k)+'">'+esc(v)+'</option>';
const cond=r=>r.modelALabel+(r.type==="requires"?" requires ":" excludes ")+r.modelBLabel;
const action=r=>r.severity==="block"?"Block before review":"Warning";
function render(){
 const b=R.load(),search=$("rule-search").value.toLowerCase(),status=$("rule-filter").value;
 $("rule-count").textContent=b.rules.length;$("rule-active").textContent=b.rules.filter(x=>x.status==="Active").length;$("rule-inactive").textContent=b.rules.filter(x=>x.status!=="Active").length;
 const list=b.rules.filter(x=>(!status||x.status===status)&&[x.id,x.name,x.modelALabel,x.modelBLabel].join(" ").toLowerCase().includes(search));
 $("rule-rows").innerHTML=list.length?list.map(r=>'<tr><td><strong>'+esc(r.name)+'</strong><small>'+esc(r.id)+' · v'+r.version+'</small></td><td>'+esc(cond(r))+'<small>'+esc(r.message)+'</small></td><td>'+action(r)+'</td><td class="rule-status">'+esc(r.status)+'</td><td><button class="btn" data-rule="'+esc(r.id)+'">Edit</button></td></tr>').join(""):'<tr><td colspan="5">No matching rules. Create a rule or adjust the filters.</td></tr>';
 $("rule-history").innerHTML=b.history.length?b.history.map(r=>'<tr><td>'+esc(r.name)+'<small>'+esc(r.id)+' · v'+r.version+'</small></td><td>'+esc(cond(r))+'</td><td>'+action(r)+' · '+esc(r.status)+'</td><td>'+esc(r.message)+'</td><td>'+esc(r.updatedAt)+'</td></tr>').join(""):'<tr><td colspan="5">No previous versions yet.</td></tr>';
}
function preview(){const ms=R.models(),a=ms.find(m=>m.id===e.modelA.value),b=ms.find(m=>m.id===e.modelB.value);$("rule-preview").textContent=a&&b?"When "+a.label+" is selected, "+(e.type.value==="requires"?"also select ":"do not select ")+b.label+". "+(e.severity.value==="block"?"A failed check prevents handoff / review, but drafts may still be saved.":"A failed check displays guidance only."):"Select two different models to preview the rule.";}
function open(id){const old=id?R.load().rules.find(x=>x.id===id):null;if(id&&!old)return;form.reset();const ms=R.models();for(const k of ["modelA","modelB"])e[k].innerHTML=option("","Choose model")+ms.map(m=>option(m.id,m.label+(m.status!=="Active"?" ("+m.status+")":""))).join("");e.id.value=old?.id||"";e.version.value=old?.version||"";if(old)for(const k of ["name","type","modelA","modelB","severity","status","message"])e[k].value=old[k];$("editor-title").textContent=old?"Edit "+old.id+" · v"+old.version:"New rule";$("rule-error").hidden=true;$("rule-editor").hidden=false;preview();$("rule-editor").scrollIntoView({block:"start"});}
const close=()=>$("rule-editor").hidden=true;
$("new-rule").addEventListener("click",()=>open(""));$("close-rule").addEventListener("click",close);$("cancel-rule").addEventListener("click",close);
$("rule-rows").addEventListener("click",ev=>{const b=ev.target.closest("[data-rule]");if(b)open(b.dataset.rule);});
$("rule-search").addEventListener("input",render);$("rule-filter").addEventListener("change",render);form.addEventListener("change",preview);
form.addEventListener("submit",ev=>{ev.preventDefault();try{R.save(Object.fromEntries(new FormData(form)),new Date().toLocaleString("en-GB"));close();render();$("test-result").textContent="Rule saved. Run a new selection check to test active rules.";}catch(err){$("rule-error").textContent=err.message;$("rule-error").hidden=false;}});
$("test-models").innerHTML=R.models().filter(m=>m.status==="Active").map(m=>option(m.id,m.label)).join("");
$("test-form").addEventListener("submit",ev=>{ev.preventDefault();const ids=Array.from($("test-models").selectedOptions).map(x=>x.value),f=R.evaluate(ids.map(productId=>({productId,quantity:1})));$("test-result").innerHTML=f.length?f.map(x=>'<div class="rule-finding"><b>'+esc(x.severity==="block"?"Blocked before review":"Warning")+'</b><div>'+esc(x.message)+'</div></div>').join(""):"No active model-pair rule violated. This does not certify technical compatibility.";});
render();
})();
