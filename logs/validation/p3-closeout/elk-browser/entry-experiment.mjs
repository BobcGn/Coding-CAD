import {readFileSync,writeFileSync} from "node:fs";
import vm from "node:vm";
import {pathToFileURL} from "node:url";
const file=process.cwd()+"/packages/architecture-layout/node_modules/elkjs/lib/elk.bundled.js";
const installed=readFileSync(file,"utf8");
const before="if(typeof document===kwe&&typeof self!==kwe){var i=new h(self);self.onmessage=i.saveDispatch}else if(typeof module!==kwe&&module.exports){Object.defineProperty(exports,'__esModule',{value:true});module.exports={'default':j,Worker:j}}";
const after="if(typeof module!==kwe&&module.exports){Object.defineProperty(exports,'__esModule',{value:true});module.exports={'default':j,Worker:j}}else if(typeof document===kwe&&typeof self!==kwe){var i=new h(self);self.onmessage=i.saveDispatch}";
const original=installed.includes(before)?installed:installed.replace(after,before);
if(!original.includes(before))throw Error("Expected environment guard not found");
const graph=()=>({id:"root",layoutOptions:{"elk.algorithm":"layered"},children:[{id:"a",width:100,height:60},{id:"b",width:100,height:60}],edges:[{id:"ab",sources:["a"],targets:["b"]}]});
const observations=[];
const imported=await import(pathToFileURL(file).href);
const Constructor=typeof imported.default==="function"?imported.default:imported.default.default;
const direct=await new Constructor().layout(graph());
observations.push({environment:"Node original",result:"success",nodes:direct.children.length,routedEdges:direct.edges.filter(e=>e.sections?.length).length});
for(const [label,source] of [["Worker-like original",original],["Worker-like CJS-first in-memory hypothesis",original.replace(before,after)]]){
 const listener=()=>{};const module={exports:{}};const sandbox=vm.createContext({module,exports:module.exports,console,setTimeout,clearTimeout,postMessage(){},onmessage:listener});
 vm.runInContext("self=globalThis",sandbox);
 vm.runInContext(source,sandbox,{filename:label});
 try{const result=await new module.exports().layout(vm.runInContext("("+JSON.stringify(graph())+")",sandbox));observations.push({environment:label,result:"success",nodes:result.children.length,routedEdges:result.edges.filter(e=>e.sections?.length).length,messageHandlerOverwritten:sandbox.onmessage!==listener});}
 catch(error){observations.push({environment:label,result:"error",error:error.message,messageHandlerOverwritten:sandbox.onmessage!==listener});}
}
const json=JSON.stringify(observations,null,2);
writeFileSync("logs/validation/p3-closeout/elk-browser/entry-experiment.json",json+"\n");
console.log(json);
