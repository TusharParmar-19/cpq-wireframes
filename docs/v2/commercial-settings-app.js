(()=>{
"use strict";
const M=window.CPQ_COMMERCIAL_SETTINGS,$=id=>document.getElementById(id),form=$("settings-form"),e=form.elements,rows=$("template-rows");
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fields=["validityDays","rounding","payment","delivery","warranty","exclusions"];
let version=0,baseline="";
function row(p={name:"",terms:""}){
 const div=document.createElement("div");div.className="template-row";
 div.innerHTML='<label>Template name<input data-template-name required maxlength="100" value="'+esc(p.name)+'"></label><label>Payment terms<textarea data-template-terms required maxlength="1000" rows="2">'+esc(p.terms)+'</textarea></label><button class="btn" type="button" data-remove-template>Remove</button>';
 rows.appendChild(div);
}
function values(){return {...Object.fromEntries(fields.map(k=>[k,e[k].value])),version,paymentTemplates:Array.from(rows.querySelectorAll(".template-row")).map(n=>({name:n.querySelector("[data-template-name]").value,terms:n.querySelector("[data-template-terms]").value}))};}
function message(t,error=false){const p=$("settings-message");p.textContent=t;p.classList.toggle("error",error);}
function render(){
 const b=M.load(),s=b.current;version=s.version;
 fields.forEach(k=>e[k].value=s[k]);rows.replaceChildren();s.paymentTemplates.forEach(row);
 $("settings-version").textContent=version?"Version "+version+" · saved "+s.savedAt:"Built-in sample defaults (not saved)";
 $("settings-history").innerHTML=b.history.length?b.history.map(h=>'<details class="history-item"><summary>Version '+h.version+' · '+esc(h.savedAt)+'</summary><div class="history-terms">'+[["Validity days",h.validityDays],["Rounding",h.rounding==="rupee"?"Nearest rupee":"No rounding"],["Payment",h.payment],["Delivery",h.delivery],["Warranty",h.warranty],["Exclusions",h.exclusions]].map(([k,v])=>'<p><small>'+k+'</small>'+esc(v??"")+'</p>').join("")+'<div class="history-templates"><small>Payment templates ('+h.paymentTemplates.length+')</small>'+h.paymentTemplates.map(p=>'<p><b>'+esc(p.name)+'</b>: '+esc(p.terms)+'</p>').join("")+'</div></div></details>').join(""):'<p class="muted">No previous saved versions yet.</p>';
 baseline=JSON.stringify(values());
}
$("add-template").addEventListener("click",()=>{if(rows.children.length>=20){message("Maximum 20 templates.",true);return;}row();rows.lastElementChild.querySelector("input").focus();});
rows.addEventListener("click",ev=>{const b=ev.target.closest("[data-remove-template]");if(b)b.closest(".template-row").remove();});
$("discard-settings").addEventListener("click",()=>{if(JSON.stringify(values())!==baseline&&!window.confirm("Discard unsaved settings changes?"))return;render();message("Saved settings restored.");});
form.addEventListener("submit",ev=>{ev.preventDefault();try{const s=M.save(values(),new Date().toLocaleString("en-GB"));render();message("Version "+s.version+" saved. Only new drafts receive these defaults.");}catch(err){message(err.message,true);}});
window.addEventListener("beforeunload",ev=>{if(JSON.stringify(values())!==baseline){ev.preventDefault();ev.returnValue="";}});
render();
})();
