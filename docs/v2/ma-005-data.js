/* MA-005 · Opportunities & Enquiries. All details are fictional wireframe examples.
   Customer/buyer/site references resolve against MA-004; company/branch references against MA-002. */
window.CPQ_MA005_DATA={
 stages:[
  {id:"New",label:"New",help:"Enquiry logged; initial assessment pending"},
  {id:"In Discussion",label:"In Discussion",help:"Customer requirement being clarified"},
  {id:"Qualified",label:"Qualified",help:"Fit and next action confirmed"},
  {id:"Quote Preparation",label:"Quote Preparation",help:"Hand-off to quotation/BOQ work"},
  {id:"Quoted",label:"Quoted",help:"Quotation shared; response being tracked"},
  {id:"Won",label:"Won",help:"Customer outcome noted; order still requires separate evidence"},
  {id:"Lost",label:"Lost",help:"Not proceeding; reason must be recorded"},
  {id:"On Hold",label:"On Hold",help:"Paused; follow-up reason and date recorded"}
 ],
 sources:["Existing Customer","Direct Enquiry","Website","Email","Phone","Referral","Tender / RFP","Other"],
 priorities:["High","Medium","Low"],
 kinds:["Products / Equipment","Project / EPC","Service / Maintenance","Mixed Requirement"],
 opportunities:[
  {id:"OP-2026-008",title:"Ahmedabad Plant Electrical Upgrade",customerId:"CU-001",buyerId:"CC-001",contactId:"CT-001",siteId:"ST-001",projectId:"PR-001",companyId:"e1",branchId:"e1a",ownerId:"U002",stage:"In Discussion",priority:"High",source:"Existing Customer",kind:"Products / Equipment",summary:"Customer enquired about electrical panel and supply requirements for the plant upgrade. Item ratings, quantities and site conditions still need confirmation.",requirements:["Power distribution panel scope","Technical ratings to be confirmed","Delivery and commissioning preferences"],received:"04 Nov 2026",needBy:"",expectedClose:"",nextFollowUp:"10 Nov 2026",nextAction:"Clarify load schedule and preferred delivery window",remarks:"No technical or commercial offer has been issued from this enquiry.",lostReason:"",linkedQuotes:["QT-2026-014"],lastUpdated:"06 Nov 2026"},
  {id:"OP-2026-011",title:"Facility Rooftop Solar Enquiry",customerId:"CU-002",buyerId:"CC-003",contactId:"CT-003",siteId:"ST-003",projectId:"PR-003",companyId:"e2",branchId:"e2a",ownerId:"U008",stage:"Quote Preparation",priority:"High",source:"Email",kind:"Project / EPC",summary:"Greenfield requested a solar facility assessment and commercial offer. Proposed scope, performance assumptions and site documents are subject to verification.",requirements:["Site assessment","Indicative rooftop arrangement","Commercial scope for EPC delivery"],received:"01 Nov 2026",needBy:"15 Nov 2026",expectedClose:"",nextFollowUp:"09 Nov 2026",nextAction:"Check whether the previously sent sample quotation needs a response update",remarks:"Existing sample customer quote QT-2026-011 is Sent; opportunity and quote status are not automatically synchronized in this prototype.",lostReason:"",linkedQuotes:["QT-2026-011"],lastUpdated:"06 Nov 2026"},
  {id:"OP-2026-015",title:"Omega Infrastructure Package Enquiry",customerId:"CU-004",buyerId:"CC-005",contactId:"CT-005",siteId:"ST-005",projectId:"PR-004",companyId:"e2",branchId:"e2v",ownerId:"U006",stage:"New",priority:"Medium",source:"Tender / RFP",kind:"Mixed Requirement",summary:"Initial requirement for a project equipment package. Scope documents and buyer requirements are to be clarified before qualification.",requirements:["Review scope documents","Confirm materials and quantities","Record technical constraints"],received:"05 Nov 2026",needBy:"",expectedClose:"",nextFollowUp:"11 Nov 2026",nextAction:"Request the complete technical schedule",remarks:"The record owner is a sample operational coordinator; production creation/edit permissions are separate from record ownership.",lostReason:"",linkedQuotes:[],lastUpdated:"06 Nov 2026"},
  {id:"OP-2026-016",title:"Rajkot Equipment Maintenance Requirement",customerId:"CU-005",buyerId:"CC-006",contactId:"CT-006",siteId:"ST-006",projectId:"PR-005",companyId:"e3",branchId:"e3r",ownerId:"U010",stage:"In Discussion",priority:"Medium",source:"Phone",kind:"Service / Maintenance",summary:"Customer requested information about planned maintenance support. Scope exclusions and service visit dates are being discussed.",requirements:["Confirm service scope and equipment list","Agree proposed service date","Check site access requirements"],received:"03 Nov 2026",needBy:"",expectedClose:"",nextFollowUp:"12 Nov 2026",nextAction:"Discuss service access and maintenance list",remarks:"Related sample quote awaiting approval. An opportunity stage does not authorize quote issuance.",lostReason:"",linkedQuotes:["QT-2026-017"],lastUpdated:"06 Nov 2026"},
  {id:"OP-2026-017",title:"Sunrise Workshop Expansion Enquiry",customerId:"CU-003",buyerId:"CC-004",contactId:"CT-004",siteId:"ST-004",projectId:"",companyId:"e1",branchId:"e1s",ownerId:"U003",stage:"Lost",priority:"Low",source:"Referral",kind:"Products / Equipment",summary:"A historical enquiry concerning workshop expansion material supply. Customer did not continue this specific enquiry.",requirements:["Workshop expansion items","Delivery terms"],received:"27 Oct 2026",needBy:"",expectedClose:"",nextFollowUp:"",nextAction:"No follow-up; opportunity closed as lost",remarks:"A separately listed Won quotation for this customer is not assumed to belong to this opportunity.",lostReason:"Requirement not proceeding in this example; specific loss cause unverified",linkedQuotes:[],lastUpdated:"05 Nov 2026"}
 ],
 followups:[
  {id:"FU-001",opportunityId:"OP-2026-008",date:"06 Nov 2026",type:"Discussion",summary:"Discussed initial panel scope; technical ratings pending.",owner:"Salesperson A",nextDate:"10 Nov 2026"},
  {id:"FU-002",opportunityId:"OP-2026-011",date:"06 Nov 2026",type:"Quotation follow-up",summary:"Customer response to sample sent quotation not recorded yet.",owner:"Salesperson C",nextDate:"09 Nov 2026"},
  {id:"FU-003",opportunityId:"OP-2026-015",date:"06 Nov 2026",type:"Action planned",summary:"Ask for complete technical schedule.",owner:"Purchase User",nextDate:"11 Nov 2026"},
  {id:"FU-004",opportunityId:"OP-2026-016",date:"05 Nov 2026",type:"Call",summary:"Maintenance list and access requirements discussed.",owner:"Service Manager",nextDate:"12 Nov 2026"},
  {id:"FU-005",opportunityId:"OP-2026-017",date:"05 Nov 2026",type:"Closed",summary:"Marked Lost; no further action planned.",owner:"Salesperson B",nextDate:""}
 ],
 documents:[
  {id:"DOC-005-01",opportunityId:"OP-2026-008",title:"Scope notes (sample)",type:"Customer requirements",state:"Reference only"},
  {id:"DOC-005-02",opportunityId:"OP-2026-011",title:"Rooftop assessment checklist (sample)",type:"Site evidence",state:"Verification pending"},
  {id:"DOC-005-03",opportunityId:"OP-2026-015",title:"Tender scope schedule (sample)",type:"RFP attachment",state:"Missing source verification"},
  {id:"DOC-005-04",opportunityId:"OP-2026-016",title:"Service equipment list (sample)",type:"Customer requirements",state:"Reference only"}
 ]
};