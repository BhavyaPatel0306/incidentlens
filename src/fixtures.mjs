// Entire dataset is synthetic. No production telemetry or customer data.
export const incidents = [
  {id:'INC-101',title:'Checkout errors after release',time:'2026-09-24T14:05:00Z',severity:'SEV 2',summary:'Order creation returns HTTP 500 immediately after the 2.8.0 release.',errorRate:'34%',latency:'1.8 s',window:'14:00–14:15 UTC'},
  {id:'INC-102',title:'Database connections exhausted',time:'2026-09-24T15:20:00Z',severity:'SEV 2',summary:'Requests queue and time out as database connections reach their limit.',errorRate:'22%',latency:'8.2 s',window:'15:15–15:30 UTC'},
  {id:'INC-103',title:'Payment provider timeouts',time:'2026-09-24T16:40:00Z',severity:'SEV 2',summary:'Payment authorization slows down while the rest of checkout stays healthy.',errorRate:'18%',latency:'5.0 s',window:'16:35–16:50 UTC'}
];
const row=(id,time,message)=>({id,time,message});
export const datasets={
 'INC-101':{
 logs:[row('L101','14:04:00','INFO checkout-api v2.7.3: order create success; error_rate=0.2%'),row('L102','14:05:12','ERROR checkout-api v2.8.0: column orders.discount_code does not exist; SQLSTATE 42703; HTTP 500'),row('L103','14:07:00','ERROR schema check: migration 048_add_discount_code pending; application expects discount_code')],
 deployments:[row('D101','14:05:00','checkout-api v2.8.0 deployed; added orders.discount_code query; migration job skipped'),row('D102','12:00:00','checkout-api v2.7.3 deployed; healthy baseline')],
 },
 'INC-102':{
 logs:[row('L201','15:19:00','WARN db pool active=100 max=100 waiting=83'),row('L202','15:20:00','ERROR acquire connection timeout after 8000ms; HTTP 503'),row('L203','15:21:00','WARN /orders/export opened transactions remain idle; release missing on exception path; transaction_age=420s')],
 deployments:[row('D201','15:15:00','checkout-api v2.8.1 deployed; new /orders/export transaction handler'),row('D202','15:10:00','database connection limit unchanged: 100')],
 },
 'INC-103':{
 logs:[row('L301','16:39:00','INFO inventory and database probes healthy; p95=42ms'),row('L302','16:40:00','ERROR payments.example.test authorize: upstream timeout after 5000ms; HTTP 504'),row('L303','16:42:00','WARN payment provider health probe timeout from two simulated regions; local connection pool healthy')],
 deployments:[row('D301','15:30:00','checkout-api v2.8.2 deployed; healthy until 16:40; no payment configuration changes'),row('D302','16:40:00','No service deployments in the incident window')],
 }
};
export const runbooks=[
 row('R101','runbook','Schema mismatch: compare deployed query with database schema and migration status. Have an operator review migration safety or a compatible rollback. Never apply changes from this tool.'),
 row('R102','runbook','Pool exhaustion: inspect active and idle transactions, connection acquisition latency and release paths. Review the leaking handler before an operator-approved fix; increasing pool size alone can hide a leak.'),
 row('R103','runbook','Upstream timeout: compare dependency probes with local health. Check provider status and network reachability; an operator can review bounded retries and circuit breaker policy. A timeout alone does not prove a provider outage.')
];
export function getIncident(id){const i=incidents.find(i=>i.id===id);if(!i)throw new Error('Unknown incident');return i;}
