import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const js=html.match(/<script>\n([\s\S]*?)\n<\/script>/)[1].replace(/\ninit\(\);\s*$/,'');
const ctx=vm.createContext({});
vm.runInContext(js,ctx);
const api=vm.runInContext('({APP_DATA,buildMaps,parseToken,parseCodesLine,findProduct,resolveShield,deviceWidthMm,svgShield,makeDxf,makeDxfSimple})',ctx);
api.buildMaps();
const cfg={enclosureType:'ЩРНМ 2.0 IP55',reserve:10,newRailPerToken:false,showAllRails:true};
let checks=0;
function check(condition,message){checks++;assert.ok(condition,message);}
function resolve(codes,series,extra={}) {
 const groups=codes.split(/\n/).map(api.parseCodesLine);
 return api.resolveShield({shieldName:'Тест',codesPart:codes,tokens:groups.flat(),lineGroups:groups},{...cfg,series,...extra});
}
const report=[];
for(const [series,products] of Object.entries(api.APP_DATA.products_by_series)){
 for(const p of products){
  for(const qty of [1,6]){
   const code=qty===1?p.alias:(/^\d/.test(p.alias)?qty+'ав'+p.alias:qty+p.alias);
   const r=resolve(code,series);
   check(!r.unknown.length,series+' '+code+' unknown');
   check(r.devices.length===qty,code+' count');
   check(r.devices.every(d=>d.product.article===p.article),code+' wrong article');
   check(r.exportRows[0].qty===qty,code+' BOM count');
   check(r.rows.flat().length===qty,code+' lost device');
   for(const row of r.rows) check(row.reduce((n,d)=>n+api.deviceWidthMm(d),0)<=r.modsPerRail*18+1e-7 || r.warnings.length>0,code+' rail overflow');
   check(!/NaN|undefined/.test(api.svgShield(r)),code+' invalid SVG');
   check(!/NaN|undefined/.test(api.makeDxf([r])),code+' invalid DXF');
  }
 }
 report.push({series,products:products.length});
}
for(const [code,alias,qty] of [['10ав310','310',10],['6д16','д16',6],['2вн316','вн316',2],['3b116','b116',3],['3d116','d116',3],['b116','b116',1],['310','310',1],['316 x6','316',6],['3 x 316','316',3]]){
 const tokens=api.parseCodesLine(code);
 check(tokens.length===1&&tokens[0].alias===alias&&tokens[0].qty===qty,code+' parsing');
}
for(const bad of ['0ав310','1001ав310','0д16']) assert.throws(()=>api.parseToken(bad));
for(const type of Object.keys(api.APP_DATA.enclosures_by_type)){
 for(const separate of [false,true]){
  for(const codes of ['10ав310','6д16','310\n310\n310','1000ав310']){
   const r=resolve(codes,'ВА-105 10кА',{enclosureType:type,newRailPerToken:separate});
   check(!/NaN|undefined/.test(api.svgShield(r)),type+' SVG');
   check(!/NaN|undefined/.test(api.makeDxfSimple([r])),type+' DXF');
   check(r.rows.length<=r.railCount||r.warnings.length>0,type+' missing overflow warning');
  }
 }
}
const d=resolve('d116, д16','ВА-105 10кА');
check(d.devices[0].product.characteristic==='D','D characteristic confused with differential');
check(d.devices[1].product.category==='rcbo','Cyrillic differential category');
const grouped=resolve('2ав310\n2ав310','ВА-105 10кА');
check(grouped.rows.length===2&&grouped.rows.every(r=>r.length===2),'Explicit rows');
const mixed=resolve('д16, д40, д316, д340','ВА-105 10кА');
check(mixed.devices.every(d=>Math.abs(d.modules*18-api.deviceWidthMm(d))<1e-7),'Drawing/calculation width differs');
const demo=resolve('10ав310\n6д16\n3b116','ВА-105 10кА');
fs.writeFileSync(new URL('./demo.svg',import.meta.url),api.svgShield(demo));
fs.writeFileSync(new URL('./test-results.json',import.meta.url),JSON.stringify({checks,report,demo:{rows:demo.rows.map(r=>r.map(d=>d.label)),enclosure:demo.enclosure.article}},null,2));
console.log(JSON.stringify({checks,report,demo:demo.rows.map(r=>r.map(d=>d.label))},null,2));


