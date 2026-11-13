// Run the source's QA script without editing it or the game. Correct only its
// obsolete referral-door test coordinates (art moved the lock to 130,388).
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const output=process.env.EVIDENCE_DIR||'/workspace/pw-migration';
fs.mkdirSync(output,{recursive:true});
const launch=chromium.launch.bind(chromium);
chromium.launch=(opts={})=>launch({...opts,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
let code=fs.readFileSync(path.join(__dirname,'../qa/playthrough.test.js'),'utf8');
code=code.replaceAll('/workspace/pw',output).replace('http://localhost:8787/',process.env.TARGET_URL||'http://127.0.0.1:8789/h5game/');
const old='await rot(195,340,40,2.3);await rot(195,470,40,2.3);';
assert.ok(code.includes(old),'source QA layout changed; review harness');
code=code.replace(old,'await rot(130,328,40,2.3);await rot(130,458,40,2.3);');
code=code.replace('(async()=>{','return (async()=>{');
const logs=[],states={};
const logger={log:(...args)=>{logs.push(args.join(' '));console.log(...args);if(args[0]!=='ERRORS'&&args[1]){try{states[args[0]]=JSON.parse(args[1]);}catch{}}}};
(async()=>{
 await new Function('require','console',code)(require,logger);
 fs.writeFileSync(path.join(output,'playthrough.log'),logs.join('\n')+'\n');
 for(const key of ['r2','r3','r4','o5','lock_wang','o6','ref'])assert.equal(states[key].screen,'result',`${key} reaches settlement`);
 assert.equal(states.final.screen,'end','third day completed');
 const final=logs.find(l=>l.startsWith('final '));assert.ok(final.includes('"day":3'));
 console.log('PASS: original three-day flow completed; only test coordinates adapted, game unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1;});
