/* Browser-only model selection rules. No engineering or production authorization. */
(()=>{
"use strict";
const W=window,copy=x=>JSON.parse(JSON.stringify(x)),str=(x,n=240)=>String(x??"").trim().slice(0,n);
const load=()=>{const b=W.CPQ_SHARED?.read()?.modules?.productRules;return b?.version===1&&Array.isArray(b.rules)&&Array.isArray(b.history)?copy(b):{version:1,rules:[],history:[]};};
const models=()=>{const c=W.CPQ_MA006A_CATALOG||{};return (c.variants||[]).filter(v=>v.id&&(c.families||[]).some(f=>f.id===v.familyId&&f.type!=="service"&&f.solarKind!=="service")).map(v=>({id:v.id,label:[c.families.find(f=>f.id===v.familyId)?.name,v.model||v.variant||v.capacity,v.sku].filter(Boolean).join(" · "),status:v.status}));};
function save(input,at){
 const b=load(),id=str(input.id,50),old=id?b.rules.find(x=>x.id===id):null;
 if(id&&!old)throw Error("Rule no longer exists.");
 if(old&&Number(input.version)!==old.version)throw Error("Rule changed elsewhere. Reopen it before saving.");
 const name=str(input.name,100),type=input.type,modelA=input.modelA,modelB=input.modelB,severity=input.severity,status=input.status,message=str(input.message,350),list=models();
 if(!name||!message||!["requires","excludes"].includes(type)||!["warning","block"].includes(severity)||!["Draft","Active","Inactive"].includes(status))throw Error("Enter rule name, type, action, status and employee guidance.");
 if(modelA===modelB||![modelA,modelB].every(k=>list.some(m=>m.id===k)))throw Error("Select two different existing product models.");
 if(status==="Active"&&![modelA,modelB].every(k=>list.some(m=>m.id===k&&m.status==="Active")))throw Error("Both models must be active before enabling a rule.");
 const key=x=>[x.type,...(x.type==="excludes"?[x.modelA,x.modelB].sort():[x.modelA,x.modelB])].join("|");
 if(status==="Active"&&b.rules.some(x=>x.id!==id&&x.status==="Active"&&key(x)===key(input)))throw Error("An equivalent active rule already exists.");
 const rule={id:old?.id||"RULE-"+String(Math.max(0,...b.rules.map(x=>Number(x.id.split("-").at(-1))||0))+1).padStart(3,"0"),version:(old?.version||0)+1,name,type,modelA,modelB,modelALabel:list.find(m=>m.id===modelA).label,modelBLabel:list.find(m=>m.id===modelB).label,severity,status,message,updatedAt:at};
 if(old){b.history.unshift(copy(old));b.rules[b.rules.findIndex(x=>x.id===id)]=rule;}else b.rules.unshift(rule);
 if(!W.CPQ_SHARED?.save("productRules",b))throw Error("Unable to save rule in this browser.");
 return copy(rule);
}
const active=()=>load().rules.filter(r=>r.status==="Active");
function evaluate(lines,rules=active()){
 const ids=new Set((lines||[]).filter(l=>!l.customItem&&!l.serviceId&&Number(l.quantity)>0).map(l=>l.sourceVariantId||l.variantId||l.modelSnapshot?.id||l.productId).filter(Boolean));
 return (rules||[]).filter(r=>r.status==="Active"&&ids.has(r.modelA)&&(r.type==="requires"?!ids.has(r.modelB):r.type==="excludes"&&ids.has(r.modelB))).map(r=>({id:r.id,version:r.version,severity:r.severity,name:r.name,message:r.name+" ("+r.id+" / v"+r.version+"): "+r.message}));
}
function capture(q){
 if(q.directOrderDraft)return {rules:[],capturedAt:new Date().toISOString()};
 return {rules:copy(active()),capturedAt:new Date().toISOString()};
}
function quotation(q){
 if(q?.directOrderDraft)return [];
 if(Array.isArray(q?.productRuleSnapshot?.rules))return evaluate(q.lines,q.productRuleSnapshot.rules);
 if(q?.status!=="Draft"||q?.demoApproval||q?.demoDispatch)return [];
 return evaluate(q.lines);
}
// Phase 3 deferred. Retain the isolated engine and saved definitions.
const workflowEnabled=false;
const workflowEvaluate=lines=>workflowEnabled?evaluate(lines):[];
const workflowQuotation=q=>workflowEnabled?quotation(q):[];
const workflowCapture=q=>workflowEnabled?capture(q):{rules:[],capturedAt:new Date().toISOString()};
W.CPQ_PRODUCT_RULES={load,models,save,active,evaluate,capture,quotation,workflowEnabled,workflowEvaluate,workflowQuotation,workflowCapture};
})();
