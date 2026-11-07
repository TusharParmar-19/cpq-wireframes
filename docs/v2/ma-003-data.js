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

/* An employee may have different role grants in each legal entity.
   Company A's manager rights MUST NOT flow into Company B.
   Every assignment explicitly names its branches and roles. */
window.CPQ_MA003_SCOPE_ASSIGNMENTS={
 U001:[{companyId:"e1",branches:["e1a","e1s"],roles:["master"]},{companyId:"e2",branches:["e2a","e2v"],roles:["master"]},{companyId:"e3",branches:["e3r"],roles:["master"]}],
 U002:[{companyId:"e1",branches:["e1a"],roles:["sales"]}],
 U003:[{companyId:"e1",branches:["e1s"],roles:["sales"]}],
 U004:[{companyId:"e1",branches:["e1a","e1s"],roles:["manager"]},{companyId:"e2",branches:["e2a"],roles:["sales"]}],
 U005:[{companyId:"e2",branches:["e2a"],roles:["technical"]}],
 U006:[{companyId:"e2",branches:["e2a","e2v"],roles:["purchase","technical"]}],
 U007:[{companyId:"e1",branches:["e1a"],roles:["finance"]},{companyId:"e2",branches:["e2a"],roles:["finance"]}],
 U008:[{companyId:"e2",branches:["e2a"],roles:["sales"]}],
 U009:[{companyId:"e2",branches:["e2v"],roles:["technical"]}],
 U010:[{companyId:"e3",branches:["e3r"],roles:["manager"]}],
 U011:[{companyId:"e1",branches:["e1a","e1s"],roles:["owner"]},{companyId:"e2",branches:["e2a","e2v"],roles:["owner"]},{companyId:"e3",branches:["e3r"],roles:["owner"]}],
 U012:[{companyId:"e1",branches:["e1s"],roles:["read"]}]
};
window.CPQ_MA003_USERS.forEach(u=>{
 const assignments=window.CPQ_MA003_SCOPE_ASSIGNMENTS[u.id]||[];
 u.assignments=assignments.map(a=>({companyId:a.companyId,branches:[...a.branches],roles:[...a.roles]}));
 // Legacy union fields are for directory summary and filters ONLY.
 // Authorization examples must ALWAYS use assignments in their selected company.
 u.roles=[...new Set(assignments.flatMap(a=>a.roles))];
 u.branches=[...new Set(assignments.flatMap(a=>a.branches))];
});


/* MA-003 role configuration — prototype inventory, NOT an approved business policy.
   Page visibility and action grants are independent. Planned routes are not live links.
   Every role's assignments are still evaluated separately per legal entity/branch. */
window.CPQ_MA003_PAGE_CATALOG=[
 {id:"dashboard",name:"Master Admin Dashboard",section:"Workspace",code:"MA-001",stage:"Available",actions:[]},
 {id:"organization",name:"Companies & Branches",section:"Organization & People",code:"MA-002",stage:"Available",actions:["organization.manage"]},
 {id:"users",name:"Users, Roles & Permissions",section:"Organization & People",code:"MA-003",stage:"Available",actions:["users.manage","roles.manage","users.invite"]},
 {id:"customers",name:"Customers, Companies & Contacts",section:"Business Records",code:"MA-004",stage:"Planned",actions:["customers.view","customers.create","customers.edit","customers.archive"]},
 {id:"opportunities",name:"Opportunities & Enquiries",section:"Business Records",code:"Planned",stage:"Planned",actions:["opportunities.view","opportunities.create","opportunities.edit","opportunities.close"]},
 {id:"quote-register",name:"Quotation Register",section:"Quotations",code:"Planned",stage:"Planned",actions:["quotes.view","quotes.duplicate"]},
 {id:"quote-builder",name:"Quotation Builder & BOQ",section:"Quotations",code:"Planned",stage:"Planned",actions:["quotes.view","quotes.create","quotes.edit","selling.view"]},
 {id:"quote-revisions",name:"Quotation Versions & History",section:"Quotations",code:"Planned",stage:"Planned",actions:["quotes.view"]},
 {id:"quote-pdf",name:"Quotation PDF & Issue",section:"Quotations",code:"Planned",stage:"Planned",actions:["quotes.view","quotes.pdf","quotes.issue","documents.download"]},
 {id:"quote-dispatch",name:"Quotation Dispatch & Response",section:"Quotations",code:"Planned",stage:"Planned",actions:["quotes.view","quotes.dispatch","quotes.response"]},
 {id:"vendor-rfqs",name:"Vendor RFQs & Supplier Offers",section:"Procurement & Files",code:"Planned",stage:"Planned",actions:["rfq.view","rfq.create","rfq.send","rfq.compare","cost.view"]},
 {id:"documents",name:"Documents & Evidence",section:"Procurement & Files",code:"Planned",stage:"Planned",actions:["documents.view","documents.upload","documents.download","documents.delete"]},
 {id:"orders",name:"Orders & Registration",section:"Orders & Controls",code:"Planned",stage:"Planned",actions:["orders.view","orders.edit","orders.register","records.archive"]},
 {id:"approvals",name:"Approval Queue & Policy",section:"Orders & Controls",code:"Planned",stage:"Planned",actions:["approvals.view","approvals.decide","discount.approve"]},
 {id:"commercial",name:"Commercial Settings & Tax",section:"Orders & Controls",code:"Planned",stage:"Planned",actions:["commercial.view","commercial.manage","bank.view"]},
 {id:"reports",name:"Reports & Export",section:"Reporting & Audit",code:"Planned",stage:"Planned",actions:["reports.view","reports.export"]},
 {id:"audit",name:"Activity & Audit History",section:"Reporting & Audit",code:"Planned",stage:"Planned",actions:["audit.view"]}
];
window.CPQ_MA003_PERMISSIONS.push(
 {id:"customers.edit",name:"Edit authorized customer details",group:"Customers & opportunities"},
 {id:"customers.archive",name:"Archive customer with safeguards",group:"Customers & opportunities",sensitive:true},
 {id:"opportunities.edit",name:"Edit permitted opportunities",group:"Customers & opportunities"},
 {id:"opportunities.close",name:"Record opportunity outcome",group:"Customers & opportunities"},
 {id:"quotes.duplicate",name:"Duplicate an authorized draft",group:"Quotations"},
 {id:"quotes.issue",name:"Issue an approved quotation revision",group:"Quotations",sensitive:true},
 {id:"quotes.dispatch",name:"Record quotation dispatch",group:"Quotations"},
 {id:"quotes.response",name:"Record customer response",group:"Quotations"},
 {id:"rfq.send",name:"Send authorized vendor RFQ",group:"Vendor RFQs & documents"},
 {id:"rfq.compare",name:"Compare supplier offers",group:"Vendor RFQs & documents"},
 {id:"documents.download",name:"Download permitted attachments",group:"Vendor RFQs & documents"},
 {id:"documents.delete",name:"Remove an authorized draft attachment",group:"Vendor RFQs & documents",sensitive:true},
 {id:"orders.edit",name:"Edit permitted draft order",group:"Orders & records"},
 {id:"approvals.view",name:"View assigned approval queue",group:"Sensitive & approvals"},
 {id:"approvals.decide",name:"Approve/reject under explicit policy",group:"Sensitive & approvals",sensitive:true},
 {id:"selling.view",name:"View customer-facing selling prices",group:"Sensitive & approvals"},
 {id:"bank.view",name:"View verified unmasked bank details",group:"Sensitive & approvals",sensitive:true},
 {id:"commercial.view",name:"View standard commercial settings",group:"Administration"},
 {id:"commercial.manage",name:"Edit permitted non-sensitive settings",group:"Administration"},
 {id:"reports.export",name:"Export authorized reports",group:"Administration",sensitive:true},
 {id:"audit.view",name:"View authorized audit activity",group:"Administration"},
 {id:"users.invite",name:"Prepare secure employee invitation",group:"Administration"}
);
window.CPQ_MA003_ROLE_PAGE_DEFAULTS={
 master:["dashboard","organization","users","customers","opportunities","quote-register","quote-builder","quote-revisions","quote-pdf","quote-dispatch","vendor-rfqs","documents","orders","approvals","commercial","reports","audit"],
 owner:["dashboard","customers","opportunities","quote-register","quote-revisions","quote-pdf","quote-dispatch","documents","orders","approvals","reports","audit"],
 manager:["dashboard","customers","opportunities","quote-register","quote-builder","quote-revisions","quote-pdf","quote-dispatch","documents","orders","approvals","reports"],
 sales:["dashboard","customers","opportunities","quote-register","quote-builder","quote-revisions","quote-pdf","quote-dispatch","documents"],
 technical:["dashboard","opportunities","quote-register","quote-builder","vendor-rfqs","documents"],
 purchase:["dashboard","quote-register","vendor-rfqs","documents"],
 finance:["dashboard","quote-register","quote-revisions","quote-pdf","orders","approvals","commercial","reports"],
 read:["dashboard","customers","opportunities","quote-register","quote-revisions","documents","orders"]
};
window.CPQ_MA003_ROLE_EXTRA_GRANTS={
 master:["customers.edit","customers.archive","opportunities.edit","opportunities.close","quotes.duplicate","quotes.issue","quotes.dispatch","quotes.response","rfq.send","rfq.compare","documents.download","orders.edit","approvals.view","selling.view","commercial.view","commercial.manage","reports.export","audit.view","users.invite"],
 owner:["approvals.view","selling.view","commercial.view","audit.view","documents.download"],
 manager:["customers.edit","opportunities.edit","opportunities.close","quotes.duplicate","quotes.dispatch","quotes.response","orders.edit","approvals.view","selling.view","documents.download"],
 sales:["customers.edit","opportunities.edit","opportunities.close","quotes.duplicate","quotes.dispatch","quotes.response","selling.view","documents.download"],
 technical:["opportunities.edit","rfq.compare","documents.download"],
 purchase:["rfq.send","rfq.compare","documents.download"],
 finance:["approvals.view","selling.view","commercial.view","reports.export","documents.download"],
 read:[]
};
window.CPQ_MA003_ROLES.forEach(r=>{
 r.pages=[...(window.CPQ_MA003_ROLE_PAGE_DEFAULTS[r.id]||[])];
 r.perms=[...new Set([...r.perms,...(window.CPQ_MA003_ROLE_EXTRA_GRANTS[r.id]||[])])];
});
