import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await copyFile('index.html','dist/index.html');
await cp('src','dist/src',{recursive:true});
for(const folder of ['characters','events/outfit-reveals','events/outfit-journal','fonts']) {
  await mkdir(`dist/assets/${folder}`,{recursive:true});
  await cp(`assets/${folder}`,`dist/assets/${folder}`,{recursive:true,filter:source=>!source.endsWith('.json')});
}
console.log('Built dist/ — static hosting, no server dependencies.');
