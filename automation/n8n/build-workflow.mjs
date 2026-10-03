import fs from 'node:fs/promises';
const engine = (await fs.readFile(new URL('./publisher-machine.mjs', import.meta.url), 'utf8')).replace('export function transition', 'function transition');
const nodes = [
  { id: 'input', name: 'Article Payload v1', type: 'n8n-nodes-base.executeWorkflowTrigger', typeVersion: 1.1, position: [0, 0], parameters: { inputSource: 'passthrough' } },
  { id: 'prepare', name: 'Prepare REST request', type: 'n8n-nodes-base.code', typeVersion: 2, position: [260, 0], parameters: { mode: 'runOnceForAllItems', jsCode: engine + '\nconst items = $input.all();\nif (items.length !== 1) return [{json: {done:true,result:{success:false,story_key:null,code:"VALIDATION_ERROR",message:"Call publisher once per article",retryable:false}}}];\nreturn [{json:transition(items[0].json)}];' } },
  { id: 'done', name: 'Finished?', type: 'n8n-nodes-base.if', typeVersion: 2.2, position: [520, 0], parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: 'done-condition', leftValue: '={{ $json.done }}', rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} } },
  { id: 'http', name: 'EmDash REST', type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [780, 160], credentials: { httpBearerAuth: { id: 'FqfbTb59cQLSZRp9', name: 'PT — EmDash Publisher v1' } }, onError: 'continueRegularOutput', retryOnFail: false, parameters: { method: '={{ $json.request.method }}', url: '={{ $json.request.url }}', authentication: 'genericCredentialType', genericAuthType: 'httpBearerAuth', sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify($json.request.body ?? {}) }}', options: { timeout: 30000, redirect: { redirect: { followRedirects: false } }, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  { id: 'response', name: 'Carry request state', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1040, 160], parameters: { mode: 'runOnceForAllItems', jsCode: 'const previous = $("Prepare REST request").item.json;\nconst response = $input.first().json;\nreturn [{json:{state:previous.state,response:{statusCode:response.statusCode,body:response.body}}}];' } },
  { id: 'return', name: 'Publisher result', type: 'n8n-nodes-base.code', typeVersion: 2, position: [780, -160], parameters: { mode: 'runOnceForAllItems', jsCode: 'return [{json:$input.first().json.result}];' } },
];
const edge = node => ({ node, type: 'main', index: 0 });
const workflow = { name: 'PT — EmDash Article Publisher v1', nodes, connections: {
  'Article Payload v1': { main: [[edge('Prepare REST request')]] },
  'Prepare REST request': { main: [[edge('Finished?')]] },
  'Finished?': { main: [[edge('Publisher result')], [edge('EmDash REST')]] },
  'EmDash REST': { main: [[edge('Carry request state')]] },
  'Carry request state': { main: [[edge('Prepare REST request')]] },
}, settings: { executionOrder: 'v1', timezone: 'Europe/Sofia', saveDataErrorExecution: 'all', saveDataSuccessExecution: 'none', saveExecutionProgress: false, saveManualExecutions: true, executionTimeout: 180 } };
await fs.writeFile(new URL('./pt-emdash-article-publisher-v1.json', import.meta.url), JSON.stringify(workflow, null, 2) + '\n');
console.log('Built credential-reference-only export:', nodes.length, 'nodes');
