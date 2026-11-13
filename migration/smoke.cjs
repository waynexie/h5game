// Test-only browser harness. Imported game files are never modified.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {chromium}=require('playwright');
const target=process.env.TARGET_URL||'http://127.0.0.1:8789/h5game/';
const source=process.env.SOURCE_URL||'http://127.0.0.1:8789/source/';
const output=process.env.EVIDENCE_DIR||path.join(__dirname,'evidence');
fs.mkdirSync(output,{recursive:true});
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const result={target,source,checks:[]};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const viewport of [{width:390,height:780},{width:1440,height:1000}]){
   const images=[];
   for(const [label,url] of [['source',source],['target',target]]){
    const ctx=await browser.newContext({viewport,deviceScaleFactor:1});
    const page=await ctx.newPage(),errors=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))missing.push([r.status(),r.url()]);});
    await page.addInitScript(()=>{
     window.requestAnimationFrame=()=>0;
     let seed=123456;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    });
    await page.goto(url);await page.waitForFunction(()=>typeof ART!=='undefined'&&ART.ok&&__G.ORDERS.length===4&&Object.values(PIMG).every(Boolean),null,{polling:100,timeout:20000});
    const hashes={};
    for(const stage of ['title','repair','settings']){
     await page.evaluate(stage=>{S.t=2;if(stage==='repair'){startOrder(0);S.screen='play';O.observed=true;O.phase='work';}if(stage==='settings')S.settings=true;draw();},stage);
     await page.waitForLoadState('networkidle');
     await page.waitForFunction(()=>Object.values(PIMG).every(Boolean),null,{polling:100,timeout:20000});
     await page.evaluate(()=>draw());
     hashes[stage]=digest(await page.locator('#c').screenshot());
     if(label==='target')await page.screenshot({path:path.join(output,`${viewport.width}-${stage}.png`)});
    }
    const dimensions=await page.locator('#c').boundingBox();assert.ok(dimensions.width<=viewport.width&&dimensions.height<=viewport.height);
    assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);images.push(hashes);await ctx.close();
   }
   assert.deepEqual(images[1],images[0],`pixel parity at ${viewport.width}`);
   result.checks.push({viewport,pixelParity:images[1],runtimeErrors:0,missingResources:0});
  }
  // Real mobile touch events through normal title/transition/brief/observe flow.
  for(const viewport of [{width:320,height:640},{width:390,height:844},{width:430,height:932}]){
   const ctx=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(target);await page.waitForFunction(()=>typeof ART!=='undefined'&&ART.ok&&__G.ORDERS.length===4);
   const tap=async(x,y)=>{const b=await page.locator('#c').boundingBox();await page.touchscreen.tap(b.x+x*b.width/390,b.y+y*b.height/780);};
   await tap(195,590);await page.waitForTimeout(2000);
   for(let i=0;i<5;i++){const screen=await page.evaluate(()=>__G.S.screen);if(screen==='play')break;await tap(195,512);await page.waitForTimeout(600);await tap(195,600);await page.waitForTimeout(400);}
   assert.equal(await page.evaluate(()=>__G.S.screen),'play');await tap(195,240);await page.waitForFunction(()=>__G.O.observed);
   assert.equal(await page.evaluate(()=>__G.O.phase),'work');
   const b=await page.locator('#c').boundingBox();assert.ok(b.x>=-1&&b.y>=-1&&b.x+b.width<=viewport.width+1&&b.y+b.height<=viewport.height+1);
   assert.deepEqual(errors,[]);await page.screenshot({path:path.join(output,`${viewport.width}-touch.png`)});
   result.checks.push({viewport,touch:'title → transitions → first order → observe → work',runtimeErrors:0});await ctx.close();
  }
  fs.writeFileSync(path.join(output,'smoke-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
