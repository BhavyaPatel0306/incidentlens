import {investigate} from '../src/agent.mjs';
import {writeFile} from 'node:fs/promises';
const mode=process.argv.includes('--live')?'live':'demo';
if(mode==='live'&&!process.env.OPENAI_API_KEY){console.error('Live evaluation not run: OPENAI_API_KEY is missing.');process.exit(1);}
// Ground truth belongs only in the evaluation harness, not in the live model input.
const cases=[{incidentId:'INC-101',expected:/migration|schema|column/i,required:['L102','D101']},{incidentId:'INC-102',expected:/leak|release|transaction/i,required:['L201','L203']},{incidentId:'INC-103',expected:/payment|upstream|dependency/i,required:['L302','L303']},{incidentId:'INC-101',sparse:true,required:[]}];
const results=[];
for(const c of cases){const start=performance.now();try{const r=await investigate({...c,mode});const grounded=r.report.evidenceIds.every(id=>r.evidence.some(e=>e.id===id));const status=r.report.status===(c.sparse?'insufficient_evidence':'likely_cause');const cause=c.sparse?r.report.confidence==='low':c.expected.test(r.report.title+' '+r.report.summary);const evidence=c.required.every(id=>r.report.evidenceIds.includes(id));results.push({case:c.incidentId+(c.sparse?'-missing-telemetry':''),pass:grounded&&status&&cause&&evidence,grounded,status,cause,evidence,toolCalls:r.activity.length,durationMs:Math.round(performance.now()-start),report:r.report});}catch(e){results.push({case:c.incidentId,pass:false,error:e.message});}}
const output={mode,measuredAt:new Date().toISOString(),liveAIValidated:mode==='live',note:mode==='demo'?'Deterministic fixture regression only; not a measurement of LLM quality.':'Small heuristic evaluation; requires human review of causal claims.',passed:results.filter(r=>r.pass).length,total:results.length,results};
await writeFile(new URL(`../eval/${mode}-results.json`,import.meta.url),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));if(output.passed!==output.total)process.exitCode=1;
