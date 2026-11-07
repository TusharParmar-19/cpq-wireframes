/* MA-004 · Customer workspace. ALL names, contacts and records are invented demonstration data. */
window.CPQ_MA004_DATA={
 customers:[
  {id:"CU-001",name:"ABC Industries",type:"Group",status:"Active",industry:"Manufacturing",owner:"Salesperson A",notes:"One customer account may represent several independently billed customer legal entities.",links:[{companyId:"e1",branchId:"e1a"},{companyId:"e2",branchId:"e2a"}],created:"02 Nov 2026",updated:"06 Nov 2026"},
  {id:"CU-002",name:"Greenfield Facility",type:"Company",status:"Active",industry:"Facilities",owner:"Salesperson C",notes:"Commercial enquiries handled by Solar EPC.",links:[{companyId:"e2",branchId:"e2a"}],created:"02 Nov 2026",updated:"06 Nov 2026"},
  {id:"CU-003",name:"Sunrise Manufacturing",type:"Company",status:"Active",industry:"Manufacturing",owner:"Salesperson B",notes:"Sales Surat account; quotation history is illustrative.",links:[{companyId:"e1",branchId:"e1s"}],created:"02 Nov 2026",updated:"05 Nov 2026"},
  {id:"CU-004",name:"Omega Infrastructure",type:"Group",status:"Prospect",industry:"Infrastructure",owner:"Purchase User",notes:"Project-based opportunity in Vadodara.",links:[{companyId:"e2",branchId:"e2v"}],created:"03 Nov 2026",updated:"06 Nov 2026"},
  {id:"CU-005",name:"Delta Engineering",type:"Company",status:"Active",industry:"Engineering",owner:"Service Manager",notes:"Service quotation requires separate approval policy.",links:[{companyId:"e3",branchId:"e3r"}],created:"02 Nov 2026",updated:"06 Nov 2026"},
  {id:"CU-006",name:"Apex Retail",type:"Company",status:"Active",industry:"Retail",owner:"Salesperson A",notes:"Repeat electrical-equipment buyer.",links:[{companyId:"e1",branchId:"e1a"}],created:"03 Nov 2026",updated:"05 Nov 2026"},
  {id:"CU-007",name:"Northstar Components",type:"Company",status:"Prospect",industry:"Components",owner:"Technical User",notes:"Pre-sales lead, awaiting customer clarification.",links:[{companyId:"e2",branchId:"e2a"}],created:"04 Nov 2026",updated:"05 Nov 2026"},
  {id:"CU-008",name:"Westline Logistics",type:"Company",status:"On Hold",industry:"Logistics",owner:"Service Manager",notes:"On hold pending verified customer requirements.",links:[{companyId:"e3",branchId:"e3r"}],created:"04 Nov 2026",updated:"05 Nov 2026"}
 ],
 companies:[
  {id:"CC-001",customerId:"CU-001",name:"ABC Industries Private Ltd. (sample)",kind:"Head office",primary:true,taxStatus:"Not supplied",city:"Ahmedabad",state:"Gujarat",address:"Demo Industrial Estate, Ahmedabad",billingTerms:"Customer-specific terms pending verification"},
  {id:"CC-002",customerId:"CU-001",name:"ABC Engineering Services (sample)",kind:"Group company",primary:false,taxStatus:"Pending",city:"Surat",state:"Gujarat",address:"Demo Business Park, Surat",billingTerms:"Terms to be agreed for each quotation"},
  {id:"CC-003",customerId:"CU-002",name:"Greenfield Facility Services (sample)",kind:"Head office",primary:true,taxStatus:"Not supplied",city:"Ahmedabad",state:"Gujarat",address:"Example Facility Road, Ahmedabad",billingTerms:"Not configured"},
  {id:"CC-004",customerId:"CU-003",name:"Sunrise Manufacturing Works (sample)",kind:"Head office",primary:true,taxStatus:"Pending",city:"Surat",state:"Gujarat",address:"Sample Industrial Area, Surat",billingTerms:"Not configured"},
  {id:"CC-005",customerId:"CU-004",name:"Omega Infrastructure Projects (sample)",kind:"Head office",primary:true,taxStatus:"Not supplied",city:"Vadodara",state:"Gujarat",address:"Example Construction Park, Vadodara",billingTerms:"Not configured"},
  {id:"CC-006",customerId:"CU-005",name:"Delta Engineering Services (sample)",kind:"Head office",primary:true,taxStatus:"Not supplied",city:"Rajkot",state:"Gujarat",address:"Example Engineering Complex, Rajkot",billingTerms:"Not configured"},
  {id:"CC-007",customerId:"CU-006",name:"Apex Retail Network (sample)",kind:"Head office",primary:true,taxStatus:"Pending",city:"Ahmedabad",state:"Gujarat",address:"Sample Retail Avenue, Ahmedabad",billingTerms:"Not configured"},
  {id:"CC-008",customerId:"CU-007",name:"Northstar Components Works (sample)",kind:"Head office",primary:true,taxStatus:"Not supplied",city:"Ahmedabad",state:"Gujarat",address:"Demo Components Estate, Ahmedabad",billingTerms:"Not configured"},
  {id:"CC-009",customerId:"CU-008",name:"Westline Logistics Services (sample)",kind:"Head office",primary:true,taxStatus:"Not supplied",city:"Rajkot",state:"Gujarat",address:"Sample Freight Hub, Rajkot",billingTerms:"Not configured"}
 ],
 contacts:[
  {id:"CT-001",customerId:"CU-001",companyId:"CC-001",name:"Demo Contact A",role:"Procurement Lead",email:"contact-a@example.com",phone:"+91 00000 01001",primary:true,status:"Active"},
  {id:"CT-002",customerId:"CU-001",companyId:"CC-002",name:"Demo Contact B",role:"Project Coordinator",email:"contact-b@example.com",phone:"+91 00000 01002",primary:false,status:"Active"},
  {id:"CT-003",customerId:"CU-002",companyId:"CC-003",name:"Demo Contact C",role:"Facilities Manager",email:"contact-c@example.com",phone:"+91 00000 01003",primary:true,status:"Active"},
  {id:"CT-004",customerId:"CU-003",companyId:"CC-004",name:"Demo Contact D",role:"Plant Manager",email:"contact-d@example.com",phone:"+91 00000 01004",primary:true,status:"Active"},
  {id:"CT-005",customerId:"CU-004",companyId:"CC-005",name:"Demo Contact E",role:"Projects Engineer",email:"contact-e@example.com",phone:"+91 00000 01005",primary:true,status:"Active"},
  {id:"CT-006",customerId:"CU-005",companyId:"CC-006",name:"Demo Contact F",role:"Operations Manager",email:"contact-f@example.com",phone:"+91 00000 01006",primary:true,status:"Active"},
  {id:"CT-007",customerId:"CU-006",companyId:"CC-007",name:"Demo Contact G",role:"Store Operations",email:"contact-g@example.com",phone:"+91 00000 01007",primary:true,status:"Active"},
  {id:"CT-008",customerId:"CU-007",companyId:"CC-008",name:"Demo Contact H",role:"Engineering Lead",email:"contact-h@example.com",phone:"+91 00000 01008",primary:true,status:"Active"},
  {id:"CT-009",customerId:"CU-008",companyId:"CC-009",name:"Demo Contact I",role:"Site Coordinator",email:"contact-i@example.com",phone:"+91 00000 01009",primary:true,status:"Active"}
 ],
 sites:[
  {id:"ST-001",customerId:"CU-001",companyId:"CC-001",name:"Ahmedabad Main Plant",type:"Project / delivery site",address:"Example Plant Block A",city:"Ahmedabad",state:"Gujarat",status:"Active"},
  {id:"ST-002",customerId:"CU-001",companyId:"CC-002",name:"Surat Workshop",type:"Project / delivery site",address:"Sample Workshop Road",city:"Surat",state:"Gujarat",status:"Active"},
  {id:"ST-003",customerId:"CU-002",companyId:"CC-003",name:"Facility Rooftop",type:"Project / delivery site",address:"Demo Facility Building",city:"Ahmedabad",state:"Gujarat",status:"Active"},
  {id:"ST-004",customerId:"CU-003",companyId:"CC-004",name:"Sunrise Surat Unit",type:"Project / delivery site",address:"Example Manufacturing Block",city:"Surat",state:"Gujarat",status:"Active"},
  {id:"ST-005",customerId:"CU-004",companyId:"CC-005",name:"Omega Project Site",type:"Project / delivery site",address:"Fictional Construction Site",city:"Vadodara",state:"Gujarat",status:"Active"},
  {id:"ST-006",customerId:"CU-005",companyId:"CC-006",name:"Rajkot Service Site",type:"Service site",address:"Sample Service Road",city:"Rajkot",state:"Gujarat",status:"Active"},
  {id:"ST-007",customerId:"CU-006",companyId:"CC-007",name:"Apex Main Store",type:"Delivery address",address:"Sample Retail Avenue",city:"Ahmedabad",state:"Gujarat",status:"Active"}
 ],
 projects:[
  {id:"PR-001",customerId:"CU-001",companyId:"CC-001",siteId:"ST-001",name:"Plant Electrical Upgrade",stage:"In discussion",owner:"Salesperson A"},
  {id:"PR-002",customerId:"CU-001",companyId:"CC-002",siteId:"ST-002",name:"Workshop Expansion",stage:"Planning",owner:"Sales Manager"},
  {id:"PR-003",customerId:"CU-002",companyId:"CC-003",siteId:"ST-003",name:"Solar Facility Assessment",stage:"Quotation",owner:"Salesperson C"},
  {id:"PR-004",customerId:"CU-004",companyId:"CC-005",siteId:"ST-005",name:"Infrastructure Package",stage:"New",owner:"Purchase User"},
  {id:"PR-005",customerId:"CU-005",companyId:"CC-006",siteId:"ST-006",name:"Equipment Maintenance",stage:"Quotation",owner:"Service Manager"}
 ],
 related:[
  {id:"OP-2026-008",customerId:"CU-001",type:"Opportunity",status:"In Discussion",companyId:"e1",branchId:"e1a",customerCompanyId:"CC-001"},
  {id:"QT-2026-014",customerId:"CU-001",type:"Quotation",status:"Draft",companyId:"e1",branchId:"e1a",customerCompanyId:"CC-001"},
  {id:"QT-2026-019",customerId:"CU-001",type:"Quotation",status:"Draft",companyId:"e1",branchId:"e1a",customerCompanyId:"CC-001"},
  {id:"ORD-2026-019",customerId:"CU-001",type:"Order",status:"Registered",companyId:"e1",branchId:"e1a",customerCompanyId:"CC-001"},
  {id:"OP-2026-011",customerId:"CU-002",type:"Opportunity",status:"Quote Preparation",companyId:"e2",branchId:"e2a",customerCompanyId:"CC-003"},
  {id:"QT-2026-011",customerId:"CU-002",type:"Quotation",status:"Sent",companyId:"e2",branchId:"e2a",customerCompanyId:"CC-003"},
  {id:"ORD-2026-020",customerId:"CU-002",type:"Order",status:"Registered",companyId:"e2",branchId:"e2a",customerCompanyId:"CC-003"},
  {id:"OP-2026-017",customerId:"CU-003",type:"Opportunity",status:"Lost",companyId:"e1",branchId:"e1s",customerCompanyId:"CC-004"},
  {id:"QT-2026-009",customerId:"CU-003",type:"Quotation",status:"Won",companyId:"e1",branchId:"e1s",customerCompanyId:"CC-004"},
  {id:"ORD-2026-022",customerId:"CU-003",type:"Order",status:"Registered",companyId:"e1",branchId:"e1s",customerCompanyId:"CC-004"},
  {id:"OP-2026-015",customerId:"CU-004",type:"Opportunity",status:"New",companyId:"e2",branchId:"e2v",customerCompanyId:"CC-005"},
  {id:"QT-2026-018",customerId:"CU-004",type:"Quotation",status:"Draft",companyId:"e2",branchId:"e2v",customerCompanyId:"CC-005"},
  {id:"OP-2026-016",customerId:"CU-005",type:"Opportunity",status:"In Discussion",companyId:"e3",branchId:"e3r",customerCompanyId:"CC-006"},
  {id:"QT-2026-017",customerId:"CU-005",type:"Quotation",status:"Awaiting Approval",companyId:"e3",branchId:"e3r",customerCompanyId:"CC-006"},
  {id:"QT-2026-020",customerId:"CU-006",type:"Quotation",status:"Sent",companyId:"e1",branchId:"e1a",customerCompanyId:"CC-007"}
 ]
};