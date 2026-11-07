/* MA-006A — fictional configuration records.
   Product choices/rules are read from the MA-006 sample catalog; no real BOM or authorization. */
window.CPQ_MA006A_DATA={
  configurations:[
    {id:"CF-2026-001",name:"Ahmedabad Plant Distribution Package",kind:"Customer configuration",
     customerId:"CU-001",buyerId:"CC-001",opportunityId:"OP-2026-008",companyId:"e1",branchId:"e1a",ownerId:"U002",
     quoteId:"QT-2026-014",notes:"Define distribution-panel technical scope, cables and commissioning. Confirm ratings with the customer.",
     updated:"06 Nov 2026",revision:"C1",items:[
      {id:"I01",productId:"CFG-PNL-01",quantity:2,options:{rating:"400A",ingress:"IP54",mounting:"Floor",feeders:"8",metering:"Yes"},note:"Customer panel specification subject to engineering verification"},
      {id:"I02",productId:"STD-CBL-01",quantity:40,options:{},note:"Industrial cable, length to be confirmed"},
      {id:"I03",productId:"SRV-TEST-01",quantity:1,options:{},note:"Commissioning/service scope pending finalization"}]},
    {id:"CF-2026-002",name:"Sunrise Workshop Switchgear",kind:"Customer configuration",
     customerId:"CU-003",buyerId:"CC-004",opportunityId:"",companyId:"e1",branchId:"e1s",ownerId:"U003",
     quoteId:"QT-2026-009",notes:"Standard-product configuration without attribute-level selection.",
     updated:"05 Nov 2026",revision:"C0",items:[
      {id:"I01",productId:"STD-SWG-01",quantity:4,options:{},note:"Standard equipment item"}]},
    {id:"CF-2026-003",name:"Facility Solar EPC Scope",kind:"Customer configuration",
     customerId:"CU-002",buyerId:"CC-003",opportunityId:"OP-2026-011",companyId:"e2",branchId:"e2a",ownerId:"U008",
     quoteId:"QT-2026-011",notes:"Project-level scope package; engineering design, generation estimate and site survey remain separate technical deliverables.",
     updated:"05 Nov 2026",revision:"C0",items:[
      {id:"I01",productId:"SRV-SOLAR-01",quantity:1,options:{},note:"Sample EPC project/service scope"}]},
    {id:"CF-2026-004",name:"High-current Panel — Revision Needed",kind:"Customer configuration",
     customerId:"CU-001",buyerId:"CC-001",opportunityId:"OP-2026-008",companyId:"e1",branchId:"e1a",ownerId:"U002",
     quoteId:"",notes:"Intentionally incompatible example used to show a sample rule warning. Not suitable for handoff.",
     updated:"07 Nov 2026",revision:"C0",items:[
      {id:"I01",productId:"CFG-PNL-01",quantity:1,options:{rating:"630A",ingress:"IP54",mounting:"Wall",feeders:"8",metering:"Yes"},note:"Mounting must be corrected for the example 630A rule"}]},
    {id:"CF-2026-005",name:"Maintenance Support Scope",kind:"Customer configuration",
     customerId:"CU-005",buyerId:"CC-006",opportunityId:"OP-2026-016",companyId:"e3",branchId:"e3r",ownerId:"U010",
     quoteId:"QT-2026-017",notes:"Service scope and visits; no option-based equipment configuration needed.",
     updated:"06 Nov 2026",revision:"C0",items:[
      {id:"I01",productId:"SRV-MAINT-01",quantity:2,options:{},note:"Planned maintenance visits"}]},
    {id:"CF-2026-006",name:"Reusable Standard Cable Template",kind:"Reusable template",
     customerId:"",buyerId:"",opportunityId:"",companyId:"",branchId:"",ownerId:"",
     quoteId:"",notes:"Customer-neutral template. Buyer and authorized selling company are selected later in MA-006.",
     updated:"07 Nov 2026",revision:"C0",items:[
      {id:"I01",productId:"STD-CBL-01",quantity:100,options:{},note:"Example quantity; adapt to project needs"}]}
  ]
};