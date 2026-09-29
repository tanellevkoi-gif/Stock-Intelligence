import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {normalizeChart} from './api/market.js';
import {normalizeMacro} from './api/macro.js';

const ids=['chart','macroGrid','macroStatus','backdrop','macroMeaning','stockName','delay','state','keyLevel','risk','trigger','price','change','previous','high','low','volume','ratio','timestamp','source','retrieved','bull','base','bear','trend','recent','levels','watch','proxy','result','status'];
function element(){return {textContent:'',innerHTML:'',hidden:false,className:'',children:[],dataset:{},setAttribute(k,v){this[k]=v},append(...v){this.children.push(...v)},replaceChildren(){this.children=[]}}}
function fixture(ticker){const now=1760000000;return normalizeChart(ticker,{chart:{result:[{meta:{symbol:ticker,regularMarketPrice:12,previousClose:11,regularMarketTime:now,regularMarketDayHigh:13,regularMarketDayLow:10,regularMarketVolume:1500},timestamp:Array.from({length:60},(_,i)=>now-(59-i)*86400),indicators:{quote:[{close:Array.from({length:60},(_,i)=>9+i*.045),high:Array.from({length:60},(_,i)=>10+i*.05),low:Array.from({length:60},(_,i)=>8+i*.04),volume:Array(60).fill(1000)}]}}]}})}
function macroFixture(){const value=normalizeMacro('nasdaq',{chart:{result:[{meta:{regularMarketPrice:105,previousClose:100,regularMarketTime:1760000000}}]}});return {nasdaq:value,sp500:value,vix:value,yield10:value}}
test('frontend uses API schema and updates chart, levels, scenarios and macro on ticker switch',async()=>{
 const elements=Object.fromEntries(ids.map(id=>[id,element()]));const buttons=['IREN','CORZ','NVO'].map(t=>({...element(),dataset:{ticker:t},handlers:{},addEventListener(name,fn){this.handlers[name]=fn},classList:{toggle(){}}}));
 const document={getElementById:id=>elements[id],querySelectorAll:()=>buttons,createElement:()=>element(),createTextNode:text=>({textContent:text})};
 const fetch=async url=>({ok:true,json:async()=>url.includes('/api/macro')?macroFixture():fixture(new URL(url,'http://localhost').searchParams.get('ticker'))});
 const script=await readFile(new URL('./app.js',import.meta.url),'utf8');vm.runInNewContext(script,{document,fetch,Intl,Date,console});
 for(const ticker of ['IREN','CORZ','NVO']){if(ticker!=='IREN')buttons.find(b=>b.dataset.ticker===ticker).handlers.click();await new Promise(r=>setTimeout(r,20));assert.match(elements.stockName.textContent,new RegExp(ticker));assert.match(elements.chart.innerHTML,/<svg/);assert.match(elements.bull.textContent,/\$/);assert.match(elements.base.textContent,/\$/);assert.match(elements.bear.textContent,/\$/);assert.match(elements.trend.textContent,/20 päeva/);assert.equal(elements.macroGrid.children.length,4);assert.notEqual(elements.backdrop.textContent,'Turuandmed puuduvad')}
});
