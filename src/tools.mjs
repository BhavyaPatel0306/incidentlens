import {datasets,runbooks,getIncident} from './fixtures.mjs';
export const toolDefinitions=['inspect_logs','check_deployments','read_runbooks'].map(name=>({type:'function',name,description:({inspect_logs:'Read timestamped logs for the selected simulated incident.',check_deployments:'Read deployment and configuration history for the selected incident.',read_runbooks:'Read troubleshooting guidance. Guidance is not proof of incident cause.'})[name],strict:true,parameters:{type:'object',properties:{query:{type:'string',description:'Case-insensitive substring filter. Empty string returns all available records.'}},required:['query'],additionalProperties:false}}));
export function executeTool(name,args,context){
 getIncident(context.incidentId);
 if(!toolDefinitions.some(t=>t.name===name))throw new Error('Unknown read-only tool');
 if(!args || typeof args.query!=='string'||args.query.length>160||Object.keys(args).some(k=>k!=='query'))throw new Error('Invalid tool arguments');
 let records=name==='read_runbooks'?runbooks:datasets[context.incidentId][name==='inspect_logs'?'logs':'deployments'];
 if(context.sparse && name!=='read_runbooks')records=[];
 return {simulated:true,source:name,coverage:context.sparse && name!=='read_runbooks'?'Telemetry unavailable for this window':'Prepared fixture window only',records:structuredClone(records.filter(r=>r.message.toLowerCase().includes(args.query.toLowerCase())))};
}
