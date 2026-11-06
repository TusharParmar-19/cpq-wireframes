/* CPQ MA-003 — fictional employee/role data; never real identity or authorization. */
window.CPQ_MA003_PERMISSIONS=[
{id:"customers.view",name:"View customers",group:"Customers & opportunities"},
{id:"customers.create",name:"Create customers",group:"Customers & opportunities"},
{id:"opportunities.view",name:"View opportunities",group:"Customers & opportunities"},
{id:"opportunities.create",name:"Create opportunities",group:"Customers & opportunities"},
{id:"quotes.view",name:"View quotations & revisions",group:"Quotations"},
{id:"quotes.create",name:"Create draft quotation",group:"Quotations"},
{id:"quotes.edit",name:"Edit permitted drafts",group:"Quotations"},
{id:"quotes.pdf",name:"Prepare quotation PDF",group:"Quotations"},
{id:"rfq.view",name:"View vendor RFQs",group:"Vendor RFQs & documents"},
{id:"rfq.create",name:"Prepare vendor RFQ",group:"Vendor RFQs & documents"},
{id:"documents.view",name:"View permitted documents",group:"Vendor RFQs & documents"},
{id:"documents.upload",name:"Attach documents",group:"Vendor RFQs & documents"},
{id:"orders.view",name:"View registered orders",group:"Orders & records"},
{id:"orders.register",name:"Register verified order",group:"Orders & records"},
{id:"records.archive",name:"Archive authorized records",group:"Orders & records"},
{id:"cost.view",name:"View confidential internal/vendor costs",group:"Sensitive & approvals",sensitive:true},
{id:"margin.view",name:"View confidential margins",group:"Sensitive & approvals",sensitive:true},
{id:"discount.approve",name:"Approve discount under policy",group:"Sensitive & approvals",sensitive:true},
{id:"organization.manage",name:"Manage legal entities/branches",group:"Administration"},
{id:"users.manage",name:"Manage employee accounts",group:"Administration"},
{id:"roles.manage",name:"Manage role templates",group:"Administration"},
{id:"reports.view",name:"View authorized reports",group:"Administration"}
];
window.CPQ_MA003_ROLES=[
{id:"master",name:"Master Admin",description:"Business-account administrator. No automatic financial approval or confidential-cost access.",visibility:"all",system:true,perms:["customers.view","customers.create","opportunities.view","opportunities.create","quotes.view","quotes.create","quotes.edit","quotes.pdf","rfq.view","rfq.create","documents.view","documents.upload","orders.view","orders.register","records.archive","organization.manage","users.manage","roles.manage","reports.view"]},
{id:"owner",name:"Owner / Director",description:"Company-wide oversight within assigned legal entities and branches.",visibility:"all",system:true,perms:["customers.view","opportunities.view","quotes.view","documents.view","orders.view","reports.view"]},
{id:"manager",name:"Sales Manager",description:"Team opportunity and quotation work; approvals still need an applicable policy.",visibility:"team",system:true,perms:["customers.view","customers.create","opportunities.view","opportunities.create","quotes.view","quotes.create","quotes.edit","quotes.pdf","documents.view","documents.upload","orders.view","discount.approve","reports.view"]},
{id:"sales",name:"Salesperson",description:"Customer enquiries and owned quotations, scoped to assigned branches.",visibility:"own",system:true,perms:["customers.view","customers.create","opportunities.view","opportunities.create","quotes.view","quotes.create","quotes.edit","quotes.pdf","documents.view","documents.upload"]},
{id:"technical",name:"Pre-Sales / Technical",description:"Assigned BOQ, engineering and vendor RFQ support.",visibility:"assigned",system:true,perms:["opportunities.view","quotes.view","quotes.edit","rfq.view","rfq.create","documents.view","documents.upload"]},
{id:"purchase",name:"Purchase",description:"Vendor quotation sourcing, RFQs and evidence; internal costs require a grant.",visibility:"assigned",system:true,perms:["quotes.view","rfq.view","rfq.create","documents.view","documents.upload","cost.view"]},
{id:"finance",name:"Finance / Accountant",description:"Authorized commercial and tax review within assigned companies.",visibility:"all",system:true,perms:["customers.view","quotes.view","documents.view","orders.view","cost.view","margin.view","reports.view"]},
{id:"read",name:"View-Only",description:"Read-only record visibility limited to assigned locations and records.",visibility:"assigned",system:true,perms:["customers.view","opportunities.view","quotes.view","documents.view","orders.view"]}
];
window.CPQ_MA003_USERS=[
{id:"U001",name:"Master Admin",email:"master-admin@example.com",mobile:"+91 00000 00101",designation:"Business Administrator",department:"Administration",roles:["master"],branches:["*"],status:"Active",created:"01 Nov 2026",updated:"06 Nov 2026"},
{id:"U002",name:"Salesperson A",email:"sales-a@example.com",mobile:"+91 00000 00102",designation:"Sales Executive",department:"Sales",roles:["sales"],branches:["e1a"],status:"Active",created:"02 Nov 2026",updated:"06 Nov 2026"},
{id:"U003",name:"Salesperson B",email:"sales-b@example.com",mobile:"+91 00000 00103",designation:"Sales Executive",department:"Sales",roles:["sales"],branches:["e1s"],status:"Active",created:"02 Nov 2026",updated:"05 Nov 2026"},
{id:"U004",name:"Sales Manager",email:"sales-manager@example.com",mobile:"+91 00000 00104",designation:"Sales Manager",department:"Sales",roles:["manager"],branches:["e1a","e1s"],status:"Active",created:"01 Nov 2026",updated:"06 Nov 2026"},
{id:"U005",name:"Technical User",email:"technical@example.com",mobile:"+91 00000 00105",designation:"Pre-Sales Engineer",department:"Technical",roles:["technical"],branches:["e2a"],status:"Active",created:"01 Nov 2026",updated:"04 Nov 2026"},
{id:"U006",name:"Purchase User",email:"purchase@example.com",mobile:"+91 00000 00106",designation:"Purchase Executive",department:"Procurement",roles:["purchase","technical"],branches:["e2a","e2v"],status:"Active",created:"01 Nov 2026",updated:"06 Nov 2026"},
{id:"U007",name:"Finance User",email:"finance@example.com",mobile:"+91 00000 00107",designation:"Accountant",department:"Finance",roles:["finance"],branches:["e1a","e2a"],status:"Active",created:"02 Nov 2026",updated:"05 Nov 2026"},
{id:"U008",name:"Salesperson C",email:"sales-c@example.com",mobile:"+91 00000 00108",designation:"Sales Executive",department:"Sales",roles:["sales"],branches:["e2a"],status:"Active",created:"02 Nov 2026",updated:"05 Nov 2026"},
{id:"U009",name:"Operations User",email:"operations@example.com",mobile:"+91 00000 00109",designation:"Project Engineer",department:"Operations",roles:["technical"],branches:["e2v"],status:"Active",created:"02 Nov 2026",updated:"04 Nov 2026"},
{id:"U010",name:"Service Manager",email:"service-manager@example.com",mobile:"+91 00000 00110",designation:"Service Manager",department:"Services",roles:["manager"],branches:["e3r"],status:"Active",created:"01 Nov 2026",updated:"04 Nov 2026"},
{id:"U011",name:"Owner / Director",email:"director@example.com",mobile:"+91 00000 00111",designation:"Director",department:"Leadership",roles:["owner"],branches:["*"],status:"Active",created:"01 Nov 2026",updated:"06 Nov 2026"},
{id:"U012",name:"Invited User",email:"invited@example.com",mobile:"+91 00000 00112",designation:"Assistant",department:"Operations",roles:["read"],branches:["e1s"],status:"Invited",created:"06 Nov 2026",updated:"06 Nov 2026"}
];