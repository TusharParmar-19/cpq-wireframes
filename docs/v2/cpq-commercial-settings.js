/* Optional browser-local commercial defaults, not statutory or approval rules. */
(()=>{
"use strict";
const W=window,copy=x=>JSON.parse(JSON.stringify(x)),str=x=>String(x??"").trim();
const defaults=()=>({version:0,savedAt:"",validityDays:0,payment:"To be agreed",delivery:"To be confirmed",warranty:"Subject to approved product terms",exclusions:"",rounding:"none",paymentTemplates:[
 {name:"50% advance / 50% before dispatch",terms:"50% advance; 50% before dispatch"},
 {name:"30% advance / 70% after completion",terms:"30% advance; 70% after completion"},
 {name:"Net 30 days",terms:"Net 30 days from invoice"}
]});
function load(){const s=W.CPQ_SHARED?.read()?.modules?.commercialSettings;return s?.schema===1&&s.current&&Array.isArray(s.history)?copy(s):{schema:1,current:defaults(),history:[]};}
function validate(input){
 const raw=str(input.validityDays),days=raw===""?0:Number(raw);
 if(!Number.isInteger(days)||days<0||days>365)throw Error("Validity must be a whole number from 0 to 365 days (0 leaves the date blank).");
 if(!["none","rupee"].includes(input.rounding))throw Error("Choose a supported rounding method.");
 const out={validityDays:days,rounding:input.rounding};
 for(const k of ["payment","delivery","warranty","exclusions"]){const v=str(input[k]);if(v.length>1000)throw Error("Each default term must be at most 1000 characters.");out[k]=v;}
 if(!Array.isArray(input.paymentTemplates)||input.paymentTemplates.length>20)throw Error("Use at most 20 payment templates.");
 const seen=new Set();out.paymentTemplates=input.paymentTemplates.map(p=>{const name=str(p.name),terms=str(p.terms);if(!name||name.length>100||!terms||terms.length>1000)throw Error("Every template needs a name (up to 100 characters) and terms (up to 1000 characters).");const key=name.toLowerCase();if(seen.has(key))throw Error("Payment template names must be unique.");seen.add(key);return {name,terms};});
 return out;
}
function save(input,at){
 const b=load();if(Number(input.version)!==b.current.version)throw Error("Settings changed elsewhere. Refresh this page before saving.");
 const data=validate(input),previous=b.current;
 if(previous.version>0)b.history.unshift(copy(previous));
 b.current={...data,version:previous.version+1,savedAt:at};
 if(!W.CPQ_SHARED?.save("commercialSettings",b))throw Error("Unable to save settings in this browser.");
 return copy(b.current);
}
function futureDate(now,days){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+days,12);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
function applyToNew(q,now=new Date(),direct=false){
 const s=load().current;for(const k of ["payment","delivery","warranty","exclusions"])q[k]=s[k];
 q.validUntil=!direct&&s.validityDays>0?futureDate(now,s.validityDays):"";
 q.commercial.rounding=s.rounding;q.commercialSettingsVersion=s.version;return q;
}
function paymentOptions(){return copy(load().current.paymentTemplates);}
W.CPQ_COMMERCIAL_SETTINGS={load,defaults,validate,save,applyToNew,paymentOptions};
})();
