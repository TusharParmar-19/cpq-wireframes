/* Fictional, non-sensitive sample records. No production data or permission service. */
window.CPQ_MA001_DEMO={
entities:[
{id:"e1",name:"Example Electrical Trading Co.",branches:[["e1a","Ahmedabad Main"],["e1s","Surat"]]},
{id:"e2",name:"Example Solar EPC Co.",branches:[["e2a","Ahmedabad Main"],["e2v","Vadodara"]]},
{id:"e3",name:"Example Technical Services Co.",branches:[["e3r","Rajkot"]]}
],
employees:[
["EMP-001","Admin User","e1","e1a","Active"],["EMP-002","Salesperson A","e1","e1a","Active"],["EMP-003","Salesperson B","e1","e1s","Active"],["EMP-004","Sales Manager","e1","e1a","Active"],["EMP-005","Technical User","e2","e2a","Active"],["EMP-006","Purchase User","e2","e2v","Active"],["EMP-007","Finance User","e1","e1a","Active"],["EMP-008","Salesperson C","e2","e2a","Active"],["EMP-009","Operations User","e2","e2v","Active"],["EMP-010","Admin User B","e3","e3r","Active"],["EMP-011","Service Manager","e3","e3r","Active"],["EMP-012","Accounts Assistant","e1","e1s","Invited"]
],
customers:[
["CU-001","ABC Industries","e1","e1a"],["CU-002","Greenfield Facility","e2","e2a"],["CU-003","Sunrise Manufacturing","e1","e1s"],["CU-004","Omega Infrastructure","e2","e2v"],["CU-005","Delta Engineering","e3","e3r"],["CU-006","Apex Retail","e1","e1a"],["CU-007","Northstar Components","e2","e2a"],["CU-008","Westline Logistics","e3","e3r"],["CU-009","Example Individual Customer","e1","e1a"]
],
opportunities:[
["OP-2026-008","ABC Industries","e1","e1a","In Discussion"],["OP-2026-011","Greenfield Facility","e2","e2a","Quote Preparation"],["OP-2026-015","Omega Infrastructure","e2","e2v","New"],["OP-2026-016","Delta Engineering","e3","e3r","In Discussion"],["OP-2026-017","Sunrise Manufacturing","e1","e1s","Lost"]
],
quotations:[
["QT-2026-014","ABC Industries","e1","e1a","Draft","R1"],["QT-2026-011","Greenfield Facility","e2","e2a","Sent","R0"],["QT-2026-009","Sunrise Manufacturing","e1","e1s","Won","R0"],["QT-2026-017","Delta Engineering","e3","e3r","Awaiting Approval","R0"],["QT-2026-018","Omega Infrastructure","e2","e2v","Draft","R0"],["QT-2026-019","ABC Industries","e1","e1a","Draft","R1"],["QT-2026-020","Apex Retail","e1","e1a","Sent","R0"]
],
orders:[
["ORD-2026-019","ABC Industries","e1","e1a","Registered","Direct Order"],["ORD-2026-020","Greenfield Facility","e2","e2a","Registered","Accepted Quotation"],["ORD-2026-022","Sunrise Manufacturing","e1","e1s","Registered","Direct Order"]
],
tasks:[
["T1","Approval","QT-2026-017","e3","e3r","Authorized approver","High","Decision pending"],["T2","Access","EMP-012","e1","e1s","Admin User","Medium","Invite needs review"],["T3","Setup","ORG-003","e3","e3r","Admin User B","Medium","Branding incomplete"],["T4","Evidence","QT-2026-018","e2","e2v","Purchase User","High","Source evidence unverified"],["T5","Response","QT-2026-011","e2","e2a","Salesperson C","Medium","Customer reply not recorded"]
],
activities:[
["A1","Draft quotation revised","QT-2026-014 / R1","e1","e1a","Salesperson A","06 Nov 2026 · 11:15"],["A2","Employee invitation recorded","EMP-012","e1","e1s","Admin User","06 Nov 2026 · 10:20"],["A3","Direct Order registered","ORD-2026-019","e1","e1a","Salesperson A","05 Nov 2026 · 16:40"],["A4","Vendor evidence review requested","QT-2026-018","e2","e2v","Purchase User","05 Nov 2026 · 15:12"],["A5","Sent quotation status recorded","QT-2026-011","e2","e2a","Salesperson C","02 Nov 2026 · 15:05"]
]
};