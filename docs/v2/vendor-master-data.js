/* Fictional V2 supplier master. No rates, private data, or authorization. */
(()=>{
"use strict";
const W=window,copy=x=>JSON.parse(JSON.stringify(x)),str=x=>String(x??"").trim(),norm=x=>str(x).replace(/\s+/g," ").toLowerCase();
const seed=(id,name,companyIds,productIds,serviceIds,categories,preferred,city)=>({id,name,companyIds,productIds,serviceIds,categories,preferred,status:"Active",gstin:"",pan:"",address:"",city,state:"Gujarat",pin:"",country:"India",website:"",notes:"Fictional vendor example.",contacts:[{id:id+"-C1",name:"Sample contact",role:"Sales",email:id.toLowerCase()+"@example.com",phone:""}],contactSeq:1,documents:[],documentSeq:0,history:[],updatedAt:"2026-11-24T00:00:00.000Z"});
W.CPQ_VENDOR_MASTER={version:1,vendors:[
seed("VEN-000001","Example Electrical Supplies",["e1","e2"],["VAR-001","VAR-004"],[],["Panels & Assemblies","Switchgear"],true,"Ahmedabad"),
seed("VEN-000002","Example Solar Distribution",["e2"],["VAR-009"],[],["Solar Equipment"],false,"Vadodara"),
seed("VEN-000003","Example Field Services",["e1","e3"],[],["SVC-005","SVC-007"],[],true,"Rajkot")
]};
const data=()=>W.CPQ_VENDOR_MASTER;
const entities=()=>W.CPQ_MA002_DATA||[];
const catalog=()=>W.CPQ_MA006A_CATALOG||{};
const products=()=> (catalog().variants||[]).filter(v=>!(catalog().families||[]).some(f=>f.id===v.familyId&&(f.type==="service"||f.solarKind==="service")));
const services=()=>W.CPQ_SERVICE_MASTER?.services||[];
const companyName=id=>entities().find(x=>x.id===id)?.name||id;
const productName=id=>{const v=products().find(x=>x.id===id);return v?[(catalog().families||[]).find(f=>f.id===v.familyId)?.name,v.model||v.variant||v.capacity,v.sku].filter(Boolean).join(" · "):id+" (historical reference)";};
const serviceName=id=>services().find(x=>x.id===id)?.name||id+" (historical reference)";
const ids=x=>[...new Set((Array.isArray(x)?x:[]).map(str).filter(Boolean))];
function nextId(vendors){return "VEN-"+String(Math.max(0,...vendors.map(v=>Number(String(v.id).replace(/^VEN-/,""))||0))+1).padStart(6,"0");}
function checkRefs(values,old,allowed,label){for(const id of values)if(!allowed.includes(id)&&!old.includes(id))throw Error("Select an available "+label+".");}
function build(input,old=null,db=data(),now=new Date().toISOString()){
 const name=str(input.name),gstin=str(input.gstin).toUpperCase(),pan=str(input.pan).toUpperCase();
 if(!name||name.length>150)throw Error("Enter a vendor name (up to 150 characters).");
 if(gstin&&!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/.test(gstin))throw Error("GSTIN must have a valid 15-character format, or be left blank.");
 if(pan&&!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan))throw Error("PAN must have a valid 10-character format, or be left blank.");
 if(db.vendors.some(v=>v.id!==old?.id&&((gstin&&gstin===str(v.gstin).toUpperCase())||(norm(v.name)===norm(name)&&(!gstin||!v.gstin||gstin===v.gstin)))))throw Error("This vendor name or GSTIN already exists. Open the existing record instead.");
 const companyIds=ids(input.companyIds),productIds=ids(input.productIds),serviceIds=ids(input.serviceIds),categories=ids(input.categories);
 if(!companyIds.length)throw Error("Select at least one of our companies.");
 checkRefs(companyIds,old?.companyIds||[],entities().filter(x=>x.status!=="Inactive").map(x=>x.id),"company");
 checkRefs(productIds,old?.productIds||[],products().filter(x=>x.status==="Active").map(x=>x.id),"active product model");
 checkRefs(serviceIds,old?.serviceIds||[],services().filter(x=>x.status==="Active").map(x=>x.id),"active service");
 checkRefs(categories,old?.categories||[],catalog().categories||[],"product category");
 if(!["Active","Inactive"].includes(input.status))throw Error("Choose a valid vendor status.");
 const id=old?.id||nextId(db.vendors),contacts=[];let contactSeq=Number(old?.contactSeq)||0;
 for(const c of input.contacts||[]){
  const name=str(c.name),email=str(c.email),phone=str(c.phone),role=str(c.role);
  if(!name&&!email&&!phone&&!role)continue;
  if(!name)throw Error("Enter a name for each contact you add.");
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error("Check the email address for "+name+".");
  const prior=old?.contacts?.find(x=>x.id===c.id);
  if(prior&&contacts.some(x=>x.id===prior.id))throw Error("Duplicate contact reference.");
  contacts.push({id:prior?.id||id+"-C"+(++contactSeq),name,email,phone,role});
 }
 const documents=copy(old?.documents||[]);let documentSeq=Number(old?.documentSeq)||0;
 for(const d of input.files||[]){
  const name=str(d.name),type=str(d.type),size=Number(d.size);
  if(!name||name.length>255||!Number.isFinite(size)||size<0)throw Error("Invalid document metadata.");
  documents.push({id:id+"-D"+(++documentSeq),name,type:type||"Other",size,addedAt:now,metadataOnly:true});
 }
 const record={id,name,gstin,pan,companyIds,productIds,serviceIds,categories,preferred:!!input.preferred,status:input.status,contacts,contactSeq,documents,documentSeq};
 for(const k of ["address","city","state","pin","country","website","notes"])record[k]=str(input[k]);
 record.updatedAt=now;
 const changed=old?Object.keys(record).filter(k=>!["updatedAt","contactSeq","documentSeq"].includes(k)&&JSON.stringify(record[k])!==JSON.stringify(old[k])):[];
 record.history=[...(old?.history||[]),{at:now,actor:"Master Admin (demo)",action:old?"Updated vendor":"Created vendor",changed}];
 return record;
}
const forProduct=(id,companyId="")=>data().vendors.filter(v=>v.productIds.includes(id)&&(!companyId||v.companyIds.includes(companyId)));
const forService=(id,companyId="")=>data().vendors.filter(v=>v.serviceIds.includes(id)&&(!companyId||v.companyIds.includes(companyId)));
const selectable=(companyId="")=>data().vendors.filter(v=>v.status==="Active"&&(!companyId||v.companyIds.includes(companyId)));
function matches(v,q){const text=[v.id,v.name,v.gstin,v.city,...v.companyIds.map(companyName),...v.categories,...v.productIds.map(productName),...v.serviceIds.map(serviceName),...v.contacts.flatMap(c=>[c.name,c.email,c.phone,c.role])].join(" ");return norm(text).includes(norm(q));}
W.CPQ_VENDOR_MODEL={data,entities,catalog,products,services,companyName,productName,serviceName,nextId,build,forProduct,forService,selectable,matches};
})();