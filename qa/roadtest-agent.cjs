'use strict';
/* ROADTEST-1 deterministic executor. Scheduled ChatGPT reviews and fixes from
 * these receipts. This script itself is NOT an LLM or a physical-phone tester. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'results/roadtest');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
function gameManifest(){const files={};function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(/\.(js|html|css|java|xml|kts)$/.test(p))files[path.relative(ROOT,p)]=hash(fs.readFileSync(p));}}
 walk(path.join(ROOT,'app'));return {files,digest:hash(JSON.stringify(files))};}
function identity(){try{return {commit:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim(),dirty:!!execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()};}
 catch{return {commit:fs.existsSync(path.join(ROOT,'SOURCE_COMMIT.txt'))?fs.readFileSync(path.join(ROOT,'SOURCE_COMMIT.txt'),'utf8').trim():null,dirty:true,note:'Local snapshot, not a verified clean Git checkout'};}}
function execute(id,args,seconds){return new Promise(resolve=>{const log=path.join(OUT,id+'.log'),fd=fs.openSync(log,'w'),started=Date.now();let timeout=false,settled=false;
 const child=spawn(process.execPath,args,{cwd:ROOT,stdio:['ignore',fd,fd],detached:process.platform!=='win32',env:process.env});
 const timer=setTimeout(()=>{timeout=true;try{if(process.platform!=='win32')process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{}},seconds*1000);
 function done(code,error){if(settled)return;settled=true;clearTimeout(timer);fs.closeSync(fd);resolve({id,status:!error&&!timeout&&code===0?'pass':'fail',exitCode:code,timedOut:timeout,error:error?.message||null,seconds:(Date.now()-started)/1000,log:path.relative(ROOT,log),assertions:[]});}
 child.on('error',e=>done(null,e));child.on('close',code=>done(code));});}
function grade(spec,suites){return spec.requirements.map(req=>{const evidence=req.proof.map(([suite,assertion])=>{const found=suites.find(s=>s.id===suite);return {suite,assertion,verified:found?.status==='pass'&&found.assertions.includes(assertion)};});
 return {id:req.id,title:req.title,status:evidence.length>0&&evidence.every(e=>e.verified)?'automated-pass':evidence.some(e=>suites.find(s=>s.id===e.suite)?.status==='fail')?'fail':'unverified',evidence};});}
function jsonAssertions(p){const data=read(p);if(!Array.isArray(data.checks)||!data.checks.length||data.checks.some(s=>typeof s!=='string')||(data.errors?.length||0)||(data.failures?.length||0))throw Error('Missing or failed assertions in '+p);return data.checks;}
function tapAssertions(text){if(!/^# fail 0\s*$/m.test(text))throw Error('Node suite did not report zero failures');const checks=[...text.matchAll(/^ok \d+ - (.+)$/gm)].filter(m=>!/# (?:SKIP|TODO)/i.test(m[1])).map(m=>m[1]);if(!checks.length)throw Error('Missing Node assertion receipts');return checks;}
async function main(){
 fs.mkdirSync(OUT,{recursive:true});
 // Fresh artifacts only. Tests produce these exact directories in this job.
 for(const dir of ['qa/results/story-depth','qa/results/story-journey','qa/results/story-foundation'])fs.rmSync(path.join(ROOT,dir),{recursive:true,force:true});
 fs.rmSync(path.join(ROOT,'qa/results/browser-qa.json'),{force:true});
 fs.rmSync(path.join(OUT,'personas.json'),{force:true});
 const spec=read('qa/roadtest-spec.json'),start=gameManifest(),source=identity(),suites=[];
 const engineOnly=process.argv.includes('--engine-only');
 const definitions=[
  ['state',['--test','--test-reporter=tap','qa/story-engine.test.cjs','qa/story-bridge.test.cjs','qa/story-depth.test.cjs','qa/roadtest-report.test.cjs'],120,null],
  ['fuel',['qa/fuel-qa.cjs'],90,null],
  ['personas',['qa/roadtest-personas.cjs',start.digest],120,'qa/results/roadtest/personas.json'],
  ['game',['qa/game-qa.cjs'],420,'qa/results/browser-qa.json'],
  ['prototype',['qa/story-browser.cjs'],150,'qa/results/story-foundation/browser-results.json'],
  ['journey',['qa/story-journey.cjs'],240,'qa/results/story-journey/results.json'],
  ['depth',['qa/story-depth-browser.cjs'],240,'qa/results/story-depth/results.json']
 ];
 const pending=['scripts/story-depth.pending','scripts/story-integration.pending'].filter(p=>fs.existsSync(path.join(ROOT,p)));
 for(const [id,args,seconds,result]of definitions){
  if(pending.length||(engineOnly&&['game','prototype','journey','depth'].includes(id))){suites.push({id,status:'not-run',assertions:[],reason:pending.length?'Unmaterialized source: '+pending.join(', '):'Local engine-only check'});continue;}
  console.log('ROADTEST starting '+id);const receipt=await execute(id,args,seconds);
  if(receipt.status==='pass')try{
    receipt.assertions=result?jsonAssertions(result):id==='state'?tapAssertions(fs.readFileSync(path.join(ROOT,receipt.log),'utf8')):['fuel suite completed'];
    if(id==='game'){const runs=read(result).runs;if(!Array.isArray(runs)||!runs.some(r=>r.type==='success'&&r.ending?.kicker==='YOU MADE IT')||!runs.some(r=>r.type==='failure'&&r.ending?.kicker!=='YOU MADE IT'))throw Error('Missing complete normal-UI success/failure runs');}
  }catch(e){receipt.status='fail';receipt.error=e.message;}
  suites.push(receipt);console.log('ROADTEST '+id+': '+receipt.status);
 }
 const requirements=grade(spec,suites),unchanged=start.digest===gameManifest().digest;
 const pass=!engineOnly&&!source.dirty&&spec.requirements.length>0&&!pending.length&&unchanged&&suites.every(s=>s.status==='pass')&&requirements.every(r=>r.status==='automated-pass');
 const failing=requirements.filter(r=>r.status!=='automated-pass');
 const report={agent:'ROADTEST-1',version:1,specVersion:spec.version,specSha256:hash(fs.readFileSync(path.join(ROOT,'qa/roadtest-spec.json'))),source,game:start,runId:process.env.GITHUB_RUN_ID||null,
  runAttempt:process.env.GITHUB_RUN_ATTEMPT||null,blockers:[...pending,...(source.dirty?['Source is not a clean verified Git checkout']:[]),...(!unchanged?['Game source changed during the tests']:[])],scope:engineOnly?'local-engine-subset':'current-iteration-automated-acceptance',unchangedDuringTest:unchanged,
  verdict:pass?'ITERATION_AUTOMATED_PASS_NOT_RELEASE_APPROVAL':engineOnly?'INCOMPLETE_LOCAL_SUBSET':'HOLD',releaseApproved:false,suites,requirements,
  releaseGaps:spec.releaseGaps.map(g=>({...g,status:'pending-unverified'})),humanGates:spec.humanGates.map(g=>({...g,status:'review-required'})),
  improvementQueue:[...failing.map(r=>({priority:'P1',id:r.id,reason:r.status,action:'Inspect exact-source evidence; reproduce; add regression; smallest fix; rerun.'})),
   ...suites.filter(s=>s.status==='fail').map(s=>({priority:'P1',id:'SUITE-'+s.id,reason:s.error||'Suite failed',evidence:s.log})),
   ...spec.nextImprovements.map(i=>({priority:'P2',...i,status:'needs independent review before implementation'}))]};
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
 const md=['# ROADTEST-1 iteration report','',`Verdict: **${report.verdict}**`,`Source: ${source.commit}; game digest: ${start.digest}`,`Spec: ${spec.version} (${report.specSha256})`,'',
  'Automated checks are not human phone play, listening, or full release approval.','',...requirements.map(r=>`- ${r.id}: ${r.status} — ${r.title}`),'',
  '## Broader release requirements still awaiting proof',...report.releaseGaps.map(g=>`- ${g.id}: ${g.title}`),'','## Human gates',...report.humanGates.map(g=>`- ${g.id}: ${g.title}`),'',
  '## Next bounded improvements',...report.improvementQueue.map(g=>`- ${g.priority} ${g.id}: ${g.action||g.reason||g.title}`),'','Native Android evidence is supplied by the separate signed-candidate workflow and must match this source/game digest. It is NOT inferred from this browser report.',''];
 fs.writeFileSync(path.join(OUT,'report.md'),md.join('\n'));
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md.join('\n'));
 console.log(report.verdict);if(!pass&&!engineOnly)process.exitCode=1;
 if(engineOnly&&suites.some(s=>s.status==='fail'))process.exitCode=1;
}
module.exports={grade,tapAssertions};
if(require.main===module)main().catch(e=>{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'blocked.json'),JSON.stringify({agent:'ROADTEST-1',verdict:'BLOCKED',releaseApproved:false,error:e.stack},null,2));console.error(e);process.exitCode=1;});
