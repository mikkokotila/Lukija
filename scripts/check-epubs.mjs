// Install EPUBCheck 5.4.0 separately; Java 11+ is required.
import {readdir} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {spawnSync} from 'node:child_process';
const jar=process.env.EPUBCHECK_JAR || '.epubcheck/epubcheck-5.4.0/epubcheck.jar';
async function collect(path) {
  const files=[];
  for(const item of await readdir(path,{withFileTypes:true})) {
    const full=join(path,item.name);
    if(item.isDirectory()) files.push(...await collect(full));
    else if(item.name.endsWith('.epub')) files.push(full);
  }
  return files;
}
const files=await collect('test-results');
if(!files.length) throw new Error('No exported EPUBs found. Run npm test first.');
let failed=0;
for(const file of files) {
  const result=spawnSync('java',['-jar',resolve(jar),'--failonwarnings',file],{encoding:'utf8'});
  if(result.error) throw result.error;
  if(result.status!==0) {failed++; console.error(file,'\n',result.stdout,result.stderr);}
  else console.log('EPUBCheck passed:',file);
}
console.log(`${files.length-failed}/${files.length} EPUBs passed EPUBCheck.`);
if(failed) process.exit(1);
