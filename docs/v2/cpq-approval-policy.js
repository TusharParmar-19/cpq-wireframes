/* Browser demo only: scoped policy evaluation and historical snapshots. */
(()=>{
"use strict";
const W=window,copy=x=>JSON.parse(JSON.stringify(x)),esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=x=>x==null?"Not available":"₹"+Number(x).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const defaultPolicy=()=>({id:"GLOBAL",version:0,name:"Default demo approval policy",companyId:"",branchId:"",maxDiscount:5,minMargin:20,maxTotal:500000,manualRate:true,taxOverride:true,contribution:true,technicalRole:"technical",commercialRole:"finance",escalationRole:"owner",updatedAt:"Seeded defaults"});
const load=()=>{const d=W.CPQ_SHARED?.read()?.modules?.approvalPolicies;return d?.version===1&&Array.isArray(d.policies)?copy(d):{version:1,policies:[]};};
const masters=()=>{const m=W.CPQ_SHARED?.read()?.modules||{};return {users:m.users||W.CPQ_MA003_USERS||[],roles:m.roles||W.CPQ_MA003_ROLES||[],entities:m.entities||W.CPQ_MA002_DATA||[]};};
const scopeId=(company,branch)=>company?company+"|"+(branch||"*"):"GLOBAL";
function applicable(q,book=load()){
 const latest=id=>book.policies.filter(x=>x.id===id).sort((a,b)=>b.version-a.version)[0];
 return copy(latest(scopeId(q.companyId,q.branchId))||latest(scopeId(q.companyId,""))||latest("GLOBAL")||defaultPolicy());
}
function validate(p,m=masters()){
 const issues=[];
 if(!String(p.name||"").trim())issues.push("Enter policy name.");
 if(p.companyId&&!m.entities.some(e=>e.id===p.companyId))issues.push("Invalid company.");
 if(p.branchId&&!m.entities.find(e=>e.id===p.companyId)?.branches?.some(b=>b.id===p.branchId))issues.push("Branch must belong to selected company.");
 for(const [k,max] of [["maxDiscount",100],["minMargin",100],["maxTotal",1e12]])if(p[k]===""||p[k]==null||!Number.isFinite(Number(p[k]))||Number(p[k])<0||Number(p[k])>max)issues.push("Invalid "+k+" threshold.");
 for(const k of ["technicalRole","commercialRole","escalationRole"])if(!m.roles.some(r=>r.id===p[k]))issues.push("Select an existing role for "+k+".");
 return issues;
}
function savePolicy(raw,book=load(),m=masters()){
 const errors=validate(raw,m);if(errors.length)throw Error(errors.join(" "));
 const p={...copy(raw),id:scopeId(raw.companyId,raw.branchId),version:Math.max(0,...book.policies.map(x=>Number(x.version)||0))+1,updatedAt:new Date().toISOString()};
 for(const k of ["maxDiscount","minMargin","maxTotal"])p[k]=Number(p[k]);
 if(!W.CPQ_SHARED?.save("approvalPolicies",{version:1,policies:[...book.policies,p]}))throw Error("Policy could not be saved in browser storage.");
 return p;
}
function eligible(q,roleId,m=masters()){
 const role=m.roles.find(r=>r.id===roleId);
 if(!role||!role.pages?.includes("approvals")||!["approvals.view","approvals.decide"].every(p=>role.perms?.includes(p)))return [];
 return m.users.filter(u=>u.status==="Active"&&u.id!==q.ownerId&&(u.assignments||[]).some(a=>a.companyId===q.companyId&&a.branches?.includes(q.branchId)&&a.roles?.includes(roleId))).map(u=>({id:u.id,name:u.name}));
}
function metrics(q,t,p){
 const discount=t.subtotal>0?t.discount/t.subtotal*100:0,triggers=[];
 if(discount>p.maxDiscount+1e-9)triggers.push("Discount "+discount.toFixed(2)+"% exceeds "+p.maxDiscount+"%.");
 if(t.margin!=null&&t.margin<p.minMargin-1e-9)triggers.push("Margin "+t.margin.toFixed(2)+"% below "+p.minMargin+"%.");
 if(t.total>p.maxTotal)triggers.push("Invoice "+money(t.total)+" exceeds "+money(p.maxTotal)+".");
 if(p.manualRate&&q.lines?.some(l=>!l.includedInParent&&W.CPQ_PRICING?.requiresReason(l)))triggers.push("Manual or changed offered rate.");
 if(p.taxOverride&&(q.lines?.some(l=>!l.includedInParent&&l.taxSnapshot?.source==="Quote-specific assumption")||q.pricing?.costs?.some(c=>c.separate&&c.taxSnapshot?.source==="Quote-specific assumption")))triggers.push("Quote-specific GST assumption.");
 if(p.contribution&&t.commercial?.mode==="contribution")triggers.push("Third-party contribution.");
 return {discount,margin:t.margin,total:t.total,triggers};
}
function match(stages,used=new Set()){
 return !stages.length||stages[0].candidates.some(u=>!used.has(u.id)&&match(stages.slice(1),new Set([...used,u.id])));
}
function plan(q,t,p=applicable(q),m=masters()){
 const met=metrics(q,t,p);
 const stages=[["technical","Technical review",p.technicalRole],["commercial","Commercial review",p.commercialRole],...(met.triggers.length?[["escalation","Exception approval",p.escalationRole]]:[])].map(([key,label,roleId])=>({key,label,roleId,roleName:m.roles.find(r=>r.id===roleId)?.name||roleId,candidates:eligible(q,roleId,m)}));
 const issues=validate(p,m);
 if(!p.version)issues.push("Save an explicit demo approval policy before submission.");
 if(t.missing||t.margin==null)issues.push("Complete all costs and margin before policy evaluation.");
 if(!q.companyId||!q.branchId||!q.ownerId)issues.push("Complete company, branch and quote owner.");
 for(const s of stages)if(!s.candidates.length)issues.push(s.label+": no eligible scoped reviewer for "+s.roleName+". Grant Approvals page, View and Decide in MA-003 and assign an active employee other than the quote owner.");
 if(!match(stages))issues.push("Required stages need distinct eligible employees.");
 return {policy:copy(p),metrics:met,stages,issues:[...new Set(issues)]};
}
function fingerprint(q){
 const data=copy(q);for(const k of ["demoApproval","demoDispatch","review","response","responseNote","lastUpdated","revisionIdentity"])delete data[k];
 return JSON.stringify(data);
}
function locked(q){return q.status!=="Draft"||q.demoDispatch?.state==="Sent in demo"||["In review","Demo reviewed","Changes requested","Rejected"].includes(q.demoApproval?.state);}
function canRevise(q){return !!q&&q.status==="Draft"&&q.demoDispatch?.response?.decision!=="Accepted";}
function start(q,route,at){
 if(locked(q)||route.issues.length)throw Error(route.issues[0]||"Create a new revision first.");
 q.demoApproval={state:"In review",route:copy(route),fingerprint:fingerprint(q),technical:"Pending",commercial:"Pending",...(route.stages.some(s=>s.key==="escalation")?{escalation:"Pending"}:{}),decisions:{},events:[...(q.demoApproval?.events||[]),{action:"Submitted for demo review",actor:"Quote owner (sample)",at,revision:q.rev,comment:"Policy "+route.policy.name+" v"+route.policy.version+" captured. No actual reviewer contacted."}]};
 return q.demoApproval;
}
function optionsFor(q,key,m=masters()){
 const d=q.demoApproval;if(d?.state!=="In review"||!d.route||d.fingerprint!==fingerprint(q))return [];
 const pending=d.route.stages.filter(s=>d[s.key]==="Pending");if(pending[0]?.key!==key)return [];
 const used=new Set(Object.values(d.decisions||{}).map(x=>x.reviewerId));
 const live=pending.map(s=>({...s,candidates:s.candidates.filter(u=>eligible(q,s.roleId,m).some(a=>a.id===u.id)&&!used.has(u.id))}));
 return live[0].candidates.filter(u=>match(live.slice(1),new Set([...used,u.id])));
}
function decide(q,key,decision,reviewerId,comment,at,m=masters()){
 const d=q.demoApproval,u=optionsFor(q,key,m).find(x=>x.id===reviewerId);
 if(!u||!["approved","changes","rejected"].includes(decision))throw Error("Select an eligible reviewer for the next stage.");
 if(decision!=="approved"&&!String(comment||"").trim())throw Error("Enter a reason for rejection or requested changes.");
 const stage=d.route.stages.find(s=>s.key===key),label=decision==="approved"?"Demo approved":decision==="changes"?"Changes requested":"Rejected";
 d[key]=label;d.decisions[key]={reviewerId:u.id,reviewerName:u.name,roleId:stage.roleId,decision:label,comment,at};
 d.events.push({action:stage.label+" · "+label,actor:u.name+" ("+stage.roleName+" · simulated)",at,revision:q.rev,comment});
 if(decision==="changes")d.state="Changes requested";else if(decision==="rejected")d.state="Rejected";else if(d.route.stages.every(s=>d[s.key]==="Demo approved"))d.state="Demo reviewed";
 return d.state;
}
function reviewed(q){
 const d=q.demoApproval;return !!d?.route&&d.state==="Demo reviewed"&&d.fingerprint===fingerprint(q)&&d.route.stages.every(s=>d[s.key]==="Demo approved"&&d.decisions?.[s.key]);
}
function identity(q,m={}){return {customer:m.customer||q.customerId,buyer:m.buyer||q.buyerId,seller:m.seller||q.companyId,branch:m.branch||q.branchId};}
function amountSnapshot(t){return {subtotal:t.subtotal,discount:t.discount,net:t.taxable,tax:t.tax,total:t.total,customerPayable:t.commercial?.customerPayable??t.total,cost:t.totalCost,profit:t.profit,margin:t.margin};}
function revise(q,all,reason,t,labels,at,actor){
 if(!canRevise(q))throw Error("Accepted or historical records cannot be revised here.");
 reason=String(reason||"").trim();if(!reason)throw Error("Enter a revision reason.");
 const revs=(all||[]).filter(x=>x.quoteId===q.id);
 if(revs.some(x=>x.rev===q.rev))throw Error("Revision already archived.");
 const number=Math.max(Number(String(q.rev).replace(/^R/,""))||0,...revs.map(x=>Number(String(x.rev).replace(/^R/,""))||0))+1;
 const historical=copy(q);historical.revisionIdentity=copy(q.revisionIdentity||identity(q,labels));
 const snapshot={quoteId:q.id,rev:q.rev,archivedAt:at,archivedBy:actor,reason,quote:historical,amounts:amountSnapshot(t)};
 const next=copy(q);next.rev="R"+number;next.status="Draft";next.versionNotes=reason;next.review="Not submitted";next.response="Not issued";next.responseNote="";next.lastUpdated=at+" (demo)";
 delete next.demoApproval;delete next.demoDispatch;delete next.revisionIdentity;delete next.productRuleSnapshot;
 return {next,snapshot};
}
function compare(old,current,t){
 const x=old.amounts,y=amountSnapshot(t),keys=[["subtotal","Offer subtotal"],["discount","Total discounts"],["net","Net before GST"],["tax","GST"],["total","Invoice total"],["customerPayable","Customer payable"],["cost","Internal cost"],["profit","Estimated profit"],["margin","Estimated margin (%)"]];
 const rows=keys.map(([k,label])=>({label,before:x[k],after:y[k],delta:x[k]==null||y[k]==null?null:Math.round((y[k]-x[k])*100)/100,percent:k==="margin"}));
 const before=new Map((old.quote.lines||[]).map(l=>[l.id,l])),after=new Map((current.lines||[]).map(l=>[l.id,l]));
 const lines=[...new Set([...before.keys(),...after.keys()])].map(id=>{const a=before.get(id),b=after.get(id);return {name:b?.description||a?.description||id,change:!a?"Added":!b?"Removed":JSON.stringify(a)===JSON.stringify(b)?"Unchanged":"Changed",before:a?String(a.quantity)+" × "+money(a.unitPrice):"—",after:b?String(b.quantity)+" × "+money(b.unitPrice):"—"};});
 return {rows,lines,terms:["payment","delivery","validUntil","warranty","exclusions"].filter(k=>old.quote[k]!==current[k])};
}
// Phase 1: single Master Admin demo review. Advanced policy engine is retained for Phase 3 only.
function phase1Start(q,at){
 if(locked(q))throw Error("Create a new revision before starting a new review.");
 q.demoApproval={mode:"phase1-master",state:"In review",fingerprint:fingerprint(q),master:"Pending",events:[...(q.demoApproval?.events||[]),{action:"Submitted for Master Admin demo review",actor:"Draft editor (demo)",at,revision:q.rev,comment:"Single-stage Phase 1 review; no approval policy required."}]};
 return q.demoApproval;
}
function phase1Pending(q){
 const d=q?.demoApproval;
 return !!d&&q.status==="Draft"&&d.mode==="phase1-master"&&d.state==="In review"&&d.master==="Pending"&&d.fingerprint===fingerprint(q)&&q.demoDispatch?.state!=="Sent in demo";
}
function phase1Decide(q,decision,comment,at){
 if(!phase1Pending(q)||!["approved","changes","rejected"].includes(decision))throw Error("No active Master Admin demo review for this revision.");
 if(decision!=="approved"&&!String(comment||"").trim())throw Error("Enter a reason for rejection or requested changes.");
 const d=q.demoApproval,label=decision==="approved"?"Demo approved":decision==="changes"?"Changes requested":"Rejected";
 d.master=label;d.state=decision==="approved"?"Demo reviewed":label;d.decision={decision:label,actor:"Master Admin (simulated)",comment,at};
 d.events.push({action:"Master Admin review · "+label,actor:d.decision.actor,at,revision:q.rev,comment});
 return d.state;
}
function phase1Reviewed(q){
 const d=q?.demoApproval;
 // Preserve historical completed policy reviews, but do not run policy routing in Phase 1.
 return !!d&&(d.mode==="phase1-master"?d.state==="Demo reviewed"&&d.master==="Demo approved"&&d.decision?.decision==="Demo approved"&&d.fingerprint===fingerprint(q):reviewed(q));
}
W.CPQ_POLICY={phase1Start,phase1Pending,phase1Decide,phase1Reviewed,defaultPolicy,load,masters,scopeId,applicable,validate,savePolicy,eligible,plan,locked,canRevise,fingerprint,start,optionsFor,decide,reviewed,identity,revise,compare,money,esc};
})();
