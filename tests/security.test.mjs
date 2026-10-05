import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8');
function server(status='ACTIVE'){
 const rows=[[],['TEST-ID','8318','','','Test','TEST-STUDENT','','','PIN-HASH',status,'TEST-EVENT','','']],writes=[],deleted=[];
 const c=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:k=>k==='CAL_8318'?'ROOM-CALENDAR':null})},CalendarApp:{getCalendarById:id=>({getEventById:event=>({deleteEvent:()=>deleted.push([id,event])})}),getDefaultCalendar:()=>{throw Error('Wrong calendar')} }});
 vm.runInContext(source,c);c.rows=rows;c.writes=writes;
 vm.runInContext("hash_=()=> 'PIN-HASH';ss_=()=>({getDataRange:()=>({getValues:()=>rows}),getRange:(r,col)=>({setValue:value=>writes.push([r,col,value])})});",c);
 return {c,writes,deleted};
}
test('public reservation response contains only the four permitted fields',()=>{
 const {c}=server();vm.runInContext("rows_=()=>[{id:'private',room:'8318',start:new Date(2026,9,6,9),end:new Date(2026,9,6,10),name:'private',studentId:'private',memo:'private',hash:'private',status:'ACTIVE',eventId:'private',purpose:'프로젝트'}]",c);
 assert.deepEqual(Object.keys(c.getReservations_('2026-10-06')[0]),['room','start','end','purpose']);
});
test('cancellation deletes from the configured room calendar and preserves Sheet row',()=>{
 const {c,writes,deleted}=server();assert.equal(c.cancelReservation_({reservationId:'TEST-ID',studentId:'TEST-STUDENT',pin:'1234'}).cancelled,true);
 assert.deepEqual(deleted,[['ROOM-CALENDAR','TEST-EVENT']]);assert.equal(writes[0][2],'CANCELLED');assert.equal(writes.length,2);
});
test('retrying cancelled reservation reconciles calendar without rewriting Sheet',()=>{
 const {c,writes,deleted}=server('CANCELLED');assert.equal(c.cancelReservation_({reservationId:'TEST-ID',studentId:'TEST-STUDENT',pin:'1234'}).cancelled,true);
 assert.equal(deleted.length,1);assert.equal(writes.length,0);
});
test('another student cannot cancel or remove calendar event',()=>{
 const {c,writes,deleted}=server();assert.throws(()=>c.cancelReservation_({reservationId:'TEST-ID',studentId:'OTHER',pin:'1234'}));assert.equal(deleted.length,0);assert.equal(writes.length,0);
});
