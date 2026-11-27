/* V2 demo: choose a company/branch only when the allowed choice is unambiguous.
   Null links = internal organization choices; [] = customer with no linked scope.
   This is convenience, not an access grant. Production must filter by employee authorization. */
(()=>{
"use strict";
const available=x=>!!x&&!["Inactive","Archived"].includes(x.status);
function branches(org,companyId,links=null){
 const company=(org||[]).find(x=>x.id===companyId);
 if(!available(company))return [];
 const A=window.CPQ_DEMO_ACCESS,file=window.location?.pathname?.split("/").pop();
 return (company.branches||[]).filter(b=>available(b)&&(!A||A.isMaster()||A.canRecord(file,{companyId,branchId:b.id}))&&(links===null||links.some(l=>l.companyId===companyId&&l.branchId===b.id)));
}
function companies(org,links=null){
 return (org||[]).filter(c=>available(c)&&branches(org,c.id,links).length>0);
}
const sole=rows=>rows.length===1?rows[0].id:"";
function choose(org,links=null,companyId=""){
 const choices=companies(org,links);
 const company=companyId?(choices.some(x=>x.id===companyId)?companyId:""):sole(choices);
 return {companyId:company,branchId:company?sole(branches(org,company,links)):""};
}
window.CPQ_SCOPE_DEFAULTS={available,companies,branches,sole,choose};
})();