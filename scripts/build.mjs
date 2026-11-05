import {mkdir,copyFile,cp,rm} from 'node:fs/promises';
// 이전 산출물에 옮기거나 지운 파일이 남지 않도록 매번 비우고 다시 만든다.
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await copyFile('index.html','dist/index.html');
await cp('src','dist/src',{recursive:true});
for(const folder of ['characters','events/outfit-reveals','events/outfit-journal','fonts']) {
  await mkdir(`dist/assets/${folder}`,{recursive:true});
  await cp(`assets/${folder}`,`dist/assets/${folder}`,{recursive:true,filter:source=>!source.endsWith('.json')});
}
console.log('Built dist/ — static hosting, no server dependencies.');
