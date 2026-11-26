// node docs/v2/order-registration-regression.test.cjs
// Load the actual review/order scripts in the Orders HTML sequence, using isolated browser storage.
const fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,p),"utf8"),checks=[];
const check=(v,msg)=>{if(!v)throw Error("FAIL "+msg);checks.push(msg);};
const throws=(fn,re,msg)=>{let error;try{fn()}catch(e){error=e;}check(!!error&&re.test(error.message),msg);};
const clone=x=>JSON.parse(JSON.stringify(x));
let modules={};const W={CPQ_SHARED:{read:()=>({modules}),save:(k,v)=>{modules[k]=clone(v);return true;}}};
const scripts=[...read("ma-007-orders.html").matchAll(/<script src="([^"]+)"/g)].map(x=>x[1].split("?")[0]);
check(scripts.includes("cpq-approval-policy.js")&&scripts.indexOf("cpq-approval-policy.js")<scripts.indexOf("cpq-orders.js"),"Orders page loads review verifier first");
for(const p of scripts.filter(x=>x==="cpq-approval-policy.js"||x==="cpq-orders.js"))new Function("window",read(p))(W);
const P=W.CPQ_POLICY,O=W.CPQ_ORDERS,date=O.today(),q={id:"QT-2026-025",rev:"R1",status:"Draft",title:"Commercial Reconciliation Test",customerId:"CU-006",buyerId:"B",companyId:"e1",branchId:"e1a",ownerId:"u1",lines:[{id:"L1",description:"Inverter",quantity:1,unitPrice:267000}],payment:"50% advance; 50% before dispatch",delivery:"Within 10 working days of order confirmation"};
const t={subtotal:287000,discount:20000,taxable:267000,tax:35336.53,total:302337,totalCost:223000,profit:44000,margin:16.48,missing:0,gst:{ready:true},commercial:{ready:true,mode:"contribution",contribution:25000,customerPayable:277337}};
const labels={customer:"Apex Retail",buyer:"Apex Retail Network",seller:"Example Electrical Trading Co.",branch:"Ahmedabad Main",owner:"Finance User"};
P.phase1Start(q,"now");P.phase1Decide(q,"approved","Demo approved","now");
q.demoDispatch={state:"Sent in demo",revision:q.rev,reference:"TEST-DISPATCH-001",date,response:{decision:"Accepted",reference:"TEST-ACCEPT-001",date,source:"Email"}};
modules.quotations={quotations:[q]};
const o=O.createFromQuote(q.id,q.rev,()=>t,labels,"now");
O.addDocument(o.id,{kind:"Customer PO",reference:"PO-DEMO-001",date,note:"Received"},"now");
check(O.find(o.id).documents.length===1,"existing draft and PO saved");
delete W.CPQ_POLICY;
throws(()=>O.update(o.id,"Registered",{reference:"PO-DEMO-001",date},"now",date),/verification is unavailable/,"missing verifier fails closed with actionable message");
check(O.find(o.id).status==="Draft","failed registration does not mutate order");
W.CPQ_POLICY=P;
const orig=clone(q.demoDispatch.response);
q.demoDispatch.response.reference="CHANGED";
throws(()=>O.update(o.id,"Registered",{reference:"PO-DEMO-001",date},"now",date),/evidence changed/,"changed acceptance still blocked");
q.demoDispatch.response=orig;
throws(()=>O.update(o.id,"Registered",{reference:"",date},"now",date),/reference and a valid/,"blank PO still blocked");
check(P.phase1Reviewed(q)&&O.accepted(q),"real review verifier accepts saved revision");
// Exercise the Orders UI submission handler using a minimal DOM adapter.
const nodes={};
function node(id){return nodes[id]||(nodes[id]={value:"",innerHTML:"",textContent:"",hidden:false,events:{},elements:{reference:{},date:{},note:{}},addEventListener(type,fn){this.events[type]=fn;}});}
node("next-status").value="Registered";
W.location={search:"?order="+o.id};W.confirm=()=>true;
const document={getElementById:node};
class Params{get(k){return k==="order"?o.id:null;}}
class Form{constructor(f){return Object.entries(f.values);}}
new Function("window","document","URLSearchParams","FormData","setTimeout","clearTimeout",read("ma-007-app.js"))(W,document,Params,Form,()=>0,()=>{});
check(node("order-detail").innerHTML.includes('name="reference" maxlength="120" value="PO-DEMO-001"'),"saved Customer PO auto-populated into actual registration field");
const error={hidden:true,textContent:""},form={id:"order-status-form",values:{status:"Registered",reference:"",date,note:"Customer confirmed."},querySelector:()=>error};
const submit=()=>node("order-detail").events.submit({preventDefault(){},target:form});
submit();
check(!error.hidden&&/reference/.test(error.textContent)&&O.find(o.id).status==="Draft","registration error stays visible in form");
form.values.reference="PO-DEMO-001";submit();
let saved=O.find(o.id);
check(saved.status==="Registered"&&saved.reference==="PO-DEMO-001"&&saved.orderDate===date,"actual UI submit registers existing order");
check(saved.id===o.id&&saved.documents.length===1&&saved.snapshot.calculation.total===302337&&saved.snapshot.calculation.commercial.customerPayable===277337,"existing ID, document and commercial snapshot preserved");
check(saved.events.some(e=>e.action==="Draft → Registered")&&node("order-detail").innerHTML.includes("Registered (demo)"),"history and UI show registered state");
check(O.update(o.id,"In Progress",{note:"Order processing started."},"now").status==="In Progress","subsequent progress works");
console.log(checks.length+" order registration regression checks passed",checks);
