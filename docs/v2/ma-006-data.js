/* MA-006 · Quotations, Configuration & BOQ.
   Fictional sample commercial data; technical rules, taxes, prices and approvals are not authoritative. */
window.CPQ_MA006_DATA={
  statuses:["Draft","Awaiting Approval","Approved","Sent","Won","Lost","Expired"],
  productTypes:[
    {id:"config",name:"Configurable product",hint:"Choose approved product options, then validate the combination"},
    {id:"standard",name:"Standard catalog item",hint:"Select an existing SKU and quantity; no option-based configuration required"},
    {id:"service",name:"Service / project item",hint:"Quote a defined service scope or project package with separate supporting notes"}
  ],
  products:[
    {id:"CFG-PNL-01",type:"config",name:"Demo Distribution Panel",unit:"Nos",basePrice:62000,
      options:{
        rating:{label:"Rated current",choices:[["250A",0],["400A",12000],["630A",24000]]},
        ingress:{label:"Enclosure protection",choices:[["IP42",0],["IP54",6000],["IP65",12000]]},
        mounting:{label:"Mounting",choices:[["Wall",0],["Floor",4000]]},
        feeders:{label:"Outgoing feeders",choices:[["4",0],["8",7000],["12",13000]]},
        metering:{label:"Metering accessory",choices:[["No",0],["Yes",3500]]}
      },
      defaults:{rating:"400A",ingress:"IP54",mounting:"Floor",feeders:"8",metering:"Yes"},
      ruleNote:"Illustrative demo rule only: a 630A selection uses Floor mounting. Product engineers must approve actual compatibility, BOM, standards and safety constraints."
    },
    {id:"STD-CBL-01",type:"standard",name:"Demo Industrial Cable (per metre)",unit:"m",basePrice:360},
    {id:"STD-SWG-01",type:"standard",name:"Demo Switchgear Item",unit:"Nos",basePrice:12500},
    {id:"SRV-TEST-01",type:"service",name:"Testing & Commissioning (sample)",unit:"Job",basePrice:6000},
    {id:"SRV-SOLAR-01",type:"service",name:"Solar EPC Scope Package (sample)",unit:"Package",basePrice:140000},
    {id:"SRV-MAINT-01",type:"service",name:"Maintenance Visit Scope (sample)",unit:"Visit",basePrice:19000}
  ],
  quotations:[
    {id:"QT-2026-014",rev:"R1",status:"Draft",title:"Ahmedabad Plant Electrical Upgrade",
      customerId:"CU-001",buyerId:"CC-001",contactId:"CT-001",siteId:"ST-001",projectId:"PR-001",opportunityId:"OP-2026-008",
      companyId:"e1",branchId:"e1a",ownerId:"U002",date:"06 Nov 2026",validUntil:"06 Dec 2026",currency:"INR",
      discount:5,taxRate:18,payment:"To be agreed",delivery:"After technical and commercial confirmation",warranty:"Subject to approved product terms",exclusions:"Civil works and site readiness excluded unless agreed separately",notes:"Technical ratings and supplier evidence to be validated before offer issuance.",
      lines:[
        {id:"L01",productId:"CFG-PNL-01",type:"config",description:"Configured electrical distribution panel",quantity:2,unit:"Nos",unitPrice:94500,options:{rating:"400A",ingress:"IP54",mounting:"Floor",feeders:"8",metering:"Yes"}},
        {id:"L02",productId:"STD-CBL-01",type:"standard",description:"Industrial cable (demo line)",quantity:40,unit:"m",unitPrice:360,options:{}},
        {id:"L03",productId:"SRV-TEST-01",type:"service",description:"Testing & commissioning, illustrative scope",quantity:1,unit:"Job",unitPrice:6000,options:{}}
      ],review:"Not submitted",response:"Not recorded",responseNote:"",lastUpdated:"06 Nov 2026",versionNotes:"R1 updated draft quantities (sample)"
    },
    {id:"QT-2026-011",rev:"R0",status:"Sent",title:"Facility Rooftop Solar Enquiry",
      customerId:"CU-002",buyerId:"CC-003",contactId:"CT-003",siteId:"ST-003",projectId:"PR-003",opportunityId:"OP-2026-011",
      companyId:"e2",branchId:"e2a",ownerId:"U008",date:"02 Nov 2026",validUntil:"02 Dec 2026",currency:"INR",
      discount:0,taxRate:18,payment:"Milestone schedule (illustrative)",delivery:"Site schedule to be jointly agreed",warranty:"As stated in finalized EPC scope",exclusions:"Unverified civil scope excluded",notes:"Sample status: Sent. No actual quotation delivery or approval is recorded by this wireframe.",
      lines:[{id:"L01",productId:"SRV-SOLAR-01",type:"service",description:"Solar EPC package — illustrative commercial line",quantity:1,unit:"Package",unitPrice:140000,options:{}}],
      review:"Historical approval not verified",response:"Awaiting response",responseNote:"",lastUpdated:"05 Nov 2026",versionNotes:"Initial sample revision"
    },
    {id:"QT-2026-009",rev:"R0",status:"Won",title:"Sunrise Workshop Equipment Supply",
      customerId:"CU-003",buyerId:"CC-004",contactId:"CT-004",siteId:"ST-004",projectId:"",opportunityId:"",
      companyId:"e1",branchId:"e1s",ownerId:"U003",date:"30 Oct 2026",validUntil:"29 Nov 2026",currency:"INR",
      discount:0,taxRate:18,payment:"To be verified",delivery:"Customer schedule (sample)",warranty:"As per finalized equipment offer",exclusions:"Installation not included",notes:"Won is sample commercial status, not an order registration.",
      lines:[{id:"L01",productId:"STD-SWG-01",type:"standard",description:"Switchgear products (demo)",quantity:4,unit:"Nos",unitPrice:12500,options:{}}],
      review:"Historical approval not verified",response:"Accepted (sample)",responseNote:"No customer evidence stored in this wireframe",lastUpdated:"05 Nov 2026",versionNotes:"Initial sample revision"
    },
    {id:"QT-2026-017",rev:"R0",status:"Awaiting Approval",title:"Delta Engineering Maintenance Support",
      customerId:"CU-005",buyerId:"CC-006",contactId:"CT-006",siteId:"ST-006",projectId:"PR-005",opportunityId:"OP-2026-016",
      companyId:"e3",branchId:"e3r",ownerId:"U010",date:"06 Nov 2026",validUntil:"06 Dec 2026",currency:"INR",
      discount:5,taxRate:18,payment:"To be agreed",delivery:"Proposed service visit",warranty:"Applicable service commitments to be checked",exclusions:"Materials excluded unless quoted",notes:"Approval policy and responsible approver must be defined in the production system.",
      lines:[{id:"L01",productId:"SRV-MAINT-01",type:"service",description:"Maintenance scope / visit",quantity:2,unit:"Visit",unitPrice:19000,options:{}}],
      review:"Decision pending",response:"Not issued",responseNote:"",lastUpdated:"06 Nov 2026",versionNotes:"Initial sample revision"
    },
    {id:"QT-2026-018",rev:"R0",status:"Draft",title:"Omega Infrastructure Package",
      customerId:"CU-004",buyerId:"CC-005",contactId:"CT-005",siteId:"ST-005",projectId:"PR-004",opportunityId:"",
      companyId:"e2",branchId:"e2v",ownerId:"U006",date:"05 Nov 2026",validUntil:"05 Dec 2026",currency:"INR",
      discount:0,taxRate:18,payment:"To be agreed",delivery:"After supplier confirmation",warranty:"Vendor evidence pending",exclusions:"Scope items to be confirmed",notes:"Source evidence is not verified; do not treat this draft as approved.",
      lines:[{id:"L01",productId:"STD-SWG-01",type:"standard",description:"Electrical equipment package (sample)",quantity:3,unit:"Nos",unitPrice:12500,options:{}}],
      review:"Supplier evidence pending",response:"Not issued",responseNote:"",lastUpdated:"05 Nov 2026",versionNotes:"Initial sample revision"
    },
    {id:"QT-2026-019",rev:"R1",status:"Draft",title:"ABC Engineering Services — Additional Buyer",
      customerId:"CU-001",buyerId:"CC-002",contactId:"CT-002",siteId:"ST-002",projectId:"PR-002",opportunityId:"",
      companyId:"e1",branchId:"e1a",ownerId:"U002",date:"06 Nov 2026",validUntil:"06 Dec 2026",currency:"INR",
      discount:0,taxRate:18,payment:"To be agreed",delivery:"Project schedule pending",warranty:"To be confirmed",exclusions:"Customer scope to be clarified",notes:"Same customer group but different buyer legal company; this quotation has no mandatory opportunity.",
      lines:[{id:"L01",productId:"STD-CBL-01",type:"standard",description:"Industrial cable (demo)",quantity:60,unit:"m",unitPrice:360,options:{}}],
      review:"Not submitted",response:"Not issued",responseNote:"",lastUpdated:"06 Nov 2026",versionNotes:"R1 changed buyer-specific scope note (sample)"
    },
    {id:"QT-2026-020",rev:"R0",status:"Sent",title:"Apex Retail Equipment Offer",
      customerId:"CU-006",buyerId:"CC-007",contactId:"CT-007",siteId:"",projectId:"",opportunityId:"",
      companyId:"e1",branchId:"e1a",ownerId:"U002",date:"04 Nov 2026",validUntil:"04 Dec 2026",currency:"INR",
      discount:0,taxRate:18,payment:"To be agreed",delivery:"Standard delivery schedule pending",warranty:"Approved product terms",exclusions:"Installation excluded",notes:"Direct quotation example: an opportunity is optional.",
      lines:[{id:"L01",productId:"STD-SWG-01",type:"standard",description:"Standard equipment selection",quantity:2,unit:"Nos",unitPrice:12500,options:{}}],
      review:"Historical approval not verified",response:"Awaiting response",responseNote:"",lastUpdated:"05 Nov 2026",versionNotes:"Initial sample revision"
    }
  ],
  revisions:[
    {quoteId:"QT-2026-014",revision:"R0",date:"04 Nov 2026",by:"Salesperson A",note:"Initial draft snapshot (sample)",locked:true},
    {quoteId:"QT-2026-014",revision:"R1",date:"06 Nov 2026",by:"Salesperson A",note:"Updated current draft; prior R0 retained",locked:false},
    {quoteId:"QT-2026-019",revision:"R0",date:"05 Nov 2026",by:"Salesperson A",note:"Initial group-company buyer scope (sample)",locked:true},
    {quoteId:"QT-2026-019",revision:"R1",date:"06 Nov 2026",by:"Salesperson A",note:"Revised scope, original snapshot retained",locked:false}
  ]
};