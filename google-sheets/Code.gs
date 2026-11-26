// Google Sheets backend for DKK. Paste into the spreadsheet's bound Apps Script.
// Run setup() once as the owner before deploying. Keep the spreadsheet private.
const API_REVISION = "dkk-sheets-v2";
const FIRST_CODE = 22; // Recheck old main_v1 sequence at cutover.
const APP_VERSION = "dkk-v1.0-main";
const CONDITION_VERSION = "fixed-peer-4-balanced-v1";
const RESPONSE_HEADERS = ["id","session_id","participant_code","grade","site_code","device_class","scenario_id","order_no","defender_count","peer_total","allocation_group","option_order_group","decision","decision_kind","rt_ms","study_phase","app_version","condition_version","client_timestamp","server_timestamp"];
const META_HEADERS = ["session_id","participant_code","grade","site_code","device_class","total_duration_ms","allocation_group","option_order_group","awareness_guess","app_version","completed_at"];
const ALLOC_HEADERS = ["session_id","participant_code","grade","site_code","device_class","allocated_at"];
const DECISIONS = {support_aggressor:"destek",silent:"pasif",private_support:"aktif",public_defend:"aktif",report:"aktif"};
function setup(){
 const ss=SpreadsheetApp.getActiveSpreadsheet();
 if(!ss)throw new Error("Open Apps Script from the DKK spreadsheet.");
 verifyHeaders(ss.getSheetByName("Kararlar"),RESPONSE_HEADERS);
 verifyHeaders(ss.getSheetByName("Oturumlar"),META_HEADERS);
 let alloc=ss.getSheetByName("Tahsisler");
 if(!alloc){alloc=ss.insertSheet("Tahsisler");alloc.appendRow(ALLOC_HEADERS);alloc.setFrozenRows(1);alloc.hideSheet()}
 verifyHeaders(alloc,ALLOC_HEADERS);
 const p=PropertiesService.getScriptProperties();
 p.setProperty("DKK_SPREADSHEET_ID",ss.getId());
 if(!p.getProperty("DKK_SECRET"))p.setProperty("DKK_SECRET",Utilities.getUuid()+Utilities.getUuid());
 if(!p.getProperty("DKK_NEXT_CODE"))p.setProperty("DKK_NEXT_CODE",String(FIRST_CODE));
 if(!p.getProperty("DKK_TEST_NEXT_CODE"))p.setProperty("DKK_TEST_NEXT_CODE","14");
 if(!p.getProperty("DKK_RESEARCH_KEY"))p.setProperty("DKK_RESEARCH_KEY",Utilities.getUuid().replace(/-/g,"")+Utilities.getUuid().replace(/-/g,""));
 ensureSheet(ss,"TestKararlar",RESPONSE_HEADERS);
 ensureSheet(ss,"TestOturumlar",META_HEADERS);
 ensureSheet(ss,"TestTahsisler",ALLOC_HEADERS);
 SpreadsheetApp.flush();
}
function ensureSheet(ss,name,headers){
 let sheet=ss.getSheetByName(name);
 if(!sheet){sheet=ss.insertSheet(name);sheet.appendRow(headers);sheet.setFrozenRows(1)}
 verifyHeaders(sheet,headers);return sheet;
}
// Run in the owner-only Apps Script editor; never share the key or commit it.
function showResearcherKey(){
 const key=PropertiesService.getScriptProperties().getProperty("DKK_RESEARCH_KEY");
 if(!key)throw Error("Run setup first.");
 console.log("Araştırmacı erişim anahtarı: "+key);
}
function authorized(req,p){
 const expected=p.getProperty("DKK_RESEARCH_KEY")||"",actual=typeof req.key==="string"?req.key:"";
 if(!expected||actual.length!==expected.length)return false;
 let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^actual.charCodeAt(i);
 return diff===0;
}
function readPage(req,p,ss){
 if(!authorized(req,p))return {ok:false,error:"unauthorized"};
 const isMeta=req.table==="sessions";
 if(!isMeta&&req.table!=="decisions")throw Error("invalid_table");
 const headers=isMeta?META_HEADERS:RESPONSE_HEADERS,sheet=ss.getSheetByName(isMeta?"Oturumlar":"Kararlar");
 const offset=req.offset;
 if(!integer(offset,0,1000000))throw Error("invalid_offset");
 const count=Math.min(500,Math.max(0,sheet.getLastRow()-1-offset));
 const values=count?sheet.getRange(offset+2,1,count,headers.length).getValues():[];
 const rows=values.map(row=>Object.fromEntries(headers.map((k,i)=>[k,row[i] instanceof Date?row[i].toISOString():row[i]])));
 return {ok:true,rows,next:count===500?offset+count:null};
}
function verifyHeaders(sheet,headers){
 if(!sheet||sheet.getRange(1,1,1,headers.length).getValues()[0].join("|")!==headers.join("|"))throw Error("Invalid sheet headers");
}
function json(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON)}
function doGet(){return json({ok:true,service:"DKK",version:APP_VERSION,revision:API_REVISION})}
function doPost(e){
 let lock;
 try{
  if(!e||!e.postData||e.postData.contents.length>10000)throw Error("invalid_request");
  const req=JSON.parse(e.postData.contents),p=PropertiesService.getScriptProperties();
  if(!p.getProperty("DKK_SPREADSHEET_ID")||!p.getProperty("DKK_SECRET"))throw Error("not_configured");
  if(req.action==="health")return json({ok:true,service:"DKK",version:APP_VERSION,revision:API_REVISION});
  lock=LockService.getScriptLock();lock.waitLock(15000);
  const ss=SpreadsheetApp.openById(p.getProperty("DKK_SPREADSHEET_ID"));
  if(req.action==="admin_read")return json(readPage(req,p,ss));
  const test=typeof req.action==="string"&&req.action.startsWith("test_");
  const action=test?req.action.slice(5):req.action;
  const allocations=ss.getSheetByName(test?"TestTahsisler":"Tahsisler"),responses=ss.getSheetByName(test?"TestKararlar":"Kararlar"),meta=ss.getSheetByName(test?"TestOturumlar":"Oturumlar");
  if(action==="allocate"){
   if(test&&(!authorized(req,p)||req.site_code!=="DKK-TEST"))return json({ok:false,error:"unauthorized"});
   if(!test&&req.site_code==="DKK-TEST")return json({ok:false,error:"invalid_site"});
   return json(allocate(req,allocations,p,test));
  }
  if(action!=="response"&&action!=="meta")throw Error("invalid_action");
  const row=req.row||{};
  validateIdentity(row);
  const found=findExact(allocations,1,row.session_id);
  if(!found||req.token!==sessionToken(row.session_id,p,test))throw Error("invalid_session");
  const identity=allocations.getRange(found,1,1,5).getValues()[0];
  if([row.session_id,row.participant_code,row.grade,row.site_code,row.device_class].some((x,i)=>String(x)!==String(identity[i])))throw Error("identity_mismatch");
  const n=Number(row.participant_code.slice(1));
  const offset=((n-14)%5+5)%5,optionGroup=((Math.floor((n-14)/5)%5)+5)%5;
  if(row.allocation_group!==offset||row.option_order_group!==optionGroup||row.app_version!==APP_VERSION)throw Error("condition_mismatch");
  if(action==="response"){
   if(!/^S(0[1-9]|[12][0-9]|30)$/.test(row.scenario_id)||!integer(row.order_no,1,30)||row.peer_total!==4||row.study_phase!=="main"||row.condition_version!==CONDITION_VERSION||!integer(row.rt_ms,0,86400000)||!Object.prototype.hasOwnProperty.call(DECISIONS,row.decision)||DECISIONS[row.decision]!==row.decision_kind||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(row.client_timestamp))throw Error("invalid_response");
   const idx=Number(row.scenario_id.slice(1))-1;
   if(row.defender_count!==(idx+offset)%5||buildOrder(n,row.grade,offset)[row.order_no-1]!==idx)throw Error("order_mismatch");
   const id=row.session_id+":"+row.scenario_id;
   const old=findExact(responses,1,id);
   if(old){
    const existing=responses.getRange(old,1,1,RESPONSE_HEADERS.length).getValues()[0];
    if(RESPONSE_HEADERS.slice(1,-2).some((k,i)=>String(row[k])!==String(existing[i+1])))throw Error("duplicate_conflict");
    return json({ok:true,duplicate:true});
   }
   responses.appendRow(RESPONSE_HEADERS.map(k=>k==="id"?id:k==="server_timestamp"?new Date().toISOString():row[k]));
  }else{
   if(!integer(row.total_duration_ms,0,86400000)||!["peer_reactions","topic","message_length","reaction_time","unsure"].includes(row.awareness_guess))throw Error("invalid_meta");
   const old=findExact(meta,1,row.session_id);
   if(old){
    const existing=meta.getRange(old,1,1,META_HEADERS.length).getValues()[0];
    if(META_HEADERS.slice(0,-1).some((k,i)=>String(row[k])!==String(existing[i])))throw Error("duplicate_conflict");
    return json({ok:true,duplicate:true});
   }
   // Meta must never mark a partial session as completed.
   const sessionRows=responses.getLastRow()>1?responses.getRange(2,2,responses.getLastRow()-1,1).createTextFinder(row.session_id).matchEntireCell(true).findAll():[];
   if(sessionRows.length!==30)return json({ok:false,error:"responses_pending",retryable:true});
   meta.appendRow(META_HEADERS.map(k=>k==="completed_at"?new Date().toISOString():row[k]));
  }
  SpreadsheetApp.flush();
  return json({ok:true});
 }catch(err){
  console.warn("DKK rejected request: "+String(err.message).slice(0,120));
  return json({ok:false,error:"write_not_confirmed",retryable:true});
 }finally{if(lock&&lock.hasLock())lock.releaseLock()}
}
function integer(x,min,max){return Number.isInteger(x)&&x>=min&&x<=max}
function validateIdentity(row){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.session_id)||!integer(row.grade,9,12)||!/^[A-Z0-9_-]{1,24}$/.test(row.site_code)||!["desktop","mobile","tablet"].includes(row.device_class))throw Error("invalid_identity");
}
function findExact(sheet,col,value){
 const last=sheet.getLastRow();
 if(last<2)return 0;
 const found=sheet.getRange(2,col,last-1,1).createTextFinder(String(value)).matchEntireCell(true).matchCase(true).findNext();
 return found?found.getRow():0;
}
function sessionToken(id,p,test){
 return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(test?"test:"+id:id,p.getProperty("DKK_SECRET")));
}
function allocate(req,alloc,p,test){
 validateIdentity(req);
 const old=findExact(alloc,1,req.session_id);
 if(old){
  const values=alloc.getRange(old,1,1,5).getValues()[0];
  if(String(values[2])!==String(req.grade)||values[3]!==req.site_code||values[4]!==req.device_class)throw Error("identity_mismatch");
  return {ok:true,code:String(values[1]),token:sessionToken(req.session_id,p,test)};
 }
 // Increment first; a failed write may leave a gap, but cannot reuse an assigned code.
 const seq=test?"DKK_TEST_NEXT_CODE":"DKK_NEXT_CODE",n=Number(p.getProperty(seq));
 if(!integer(n,test?14:FIRST_CODE,999999999))throw Error("invalid_sequence");
 p.setProperty(seq,String(n+1));
 const code="K"+String(n).padStart(3,"0");
 alloc.appendRow([req.session_id,code,req.grade,req.site_code,req.device_class,new Date().toISOString()]);
 SpreadsheetApp.flush();
 return {ok:true,code,token:sessionToken(req.session_id,p,test)};
}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(arr,rand){arr=arr.slice();for(let i=arr.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function buildOrder(code,grade,offset){
 const rand=rng(code*1009+grade*37),buckets=[[],[],[],[],[]];
 for(let i=0;i<30;i++)buckets[(i+offset)%5].push(i);
 for(let c=0;c<5;c++)buckets[c]=shuffle(buckets[c],rand);
 const out=[];let last=null;
 for(let round=0;round<6;round++){
  let cs=shuffle([0,1,2,3,4],rand);
  if(last!==null&&cs[0]===last){const k=cs.findIndex((x,i)=>i>0&&x!==last);[cs[0],cs[k]]=[cs[k],cs[0]]}
  cs.forEach(c=>out.push(buckets[c][round]));last=cs[4];
 }
 return out;
}

// Owner-only end-to-end smoke test. Writes exclusively to Test* tabs.
function testSheets(){
 const p=PropertiesService.getScriptProperties(),key=p.getProperty("DKK_RESEARCH_KEY");
 if(!key)throw Error("Run setup first.");
 const ss=SpreadsheetApp.openById(p.getProperty("DKK_SPREADSHEET_ID"));
 const mainR=ss.getSheetByName("Kararlar").getLastRow(),mainM=ss.getSheetByName("Oturumlar").getLastRow(),mainSeq=p.getProperty("DKK_NEXT_CODE");
 const call=req=>JSON.parse(doPost({postData:{contents:JSON.stringify(req)}}).getContent());
 const identity={session_id:Utilities.getUuid(),grade:10,site_code:"DKK-TEST",device_class:"desktop"};
 const a=call({action:"test_allocate",...identity,key});
 if(!a.ok)throw Error("Test allocation failed");
 const repeat=call({action:"test_allocate",...identity,key});
 if(repeat.code!==a.code)throw Error("Duplicate allocation");
 const n=Number(a.code.slice(1)),offset=(n-14)%5,optionGroup=Math.floor((n-14)/5)%5;
 const base={...identity,participant_code:a.code,allocation_group:offset,option_order_group:optionGroup,app_version:APP_VERSION};
 const meta={...base,total_duration_ms:300000,awareness_guess:"unsure"};
 if(call({action:"test_meta",row:meta,token:a.token}).ok)throw Error("Premature completion");
 const order=buildOrder(n,identity.grade,offset);let row;
 for(let i=0;i<30;i++){
  const idx=order[i];
  row={...base,scenario_id:"S"+String(idx+1).padStart(2,"0"),order_no:i+1,defender_count:(idx+offset)%5,peer_total:4,decision:"silent",decision_kind:"pasif",rt_ms:5000,study_phase:"main",condition_version:CONDITION_VERSION,client_timestamp:new Date().toISOString()};
  if(!call({action:"test_response",row,token:a.token}).ok)throw Error("Failed at scenario "+(i+1));
 }
 if(!call({action:"test_response",row,token:a.token}).duplicate)throw Error("Duplicate check failed");
 if(call({action:"response",row,token:a.token}).ok)throw Error("Test token accepted by production");
 if(!call({action:"test_meta",row:meta,token:a.token}).ok)throw Error("Completion failed");
 if(!call({action:"test_meta",row:meta,token:a.token}).duplicate)throw Error("Duplicate meta");
 if(call({action:"admin_read",table:"decisions",offset:0,key:"invalid"}).ok)throw Error("Unauthorized read");
 const read=call({action:"admin_read",table:"decisions",offset:0,key});
 if(!read.ok||read.rows.some(r=>r.session_id===identity.session_id))throw Error("Admin data contamination");
 if(mainR!==ss.getSheetByName("Kararlar").getLastRow()||mainM!==ss.getSheetByName("Oturumlar").getLastRow()||mainSeq!==p.getProperty("DKK_NEXT_CODE"))throw Error("Production changed during test; review concurrent activity");
 console.log("BAŞARILI: 30 test kararı, 1 test oturumu, mükerrer kayıt kontrolü, yetkisiz erişim reddi; gerçek tablolar ve katılımcı sayacı değişmedi.");
}
