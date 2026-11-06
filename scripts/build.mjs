import {mkdir,copyFile,cp,rm} from 'node:fs/promises';
// 이전 산출물에 옮기거나 지운 파일이 남지 않도록 매번 비우고 다시 만든다.
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await copyFile('index.html','dist/index.html');
await cp('src','dist/src',{recursive:true});
// 화면에 쓰는 폴더만 복사한다. assets/references(방송 캡처 원본)는 절대 넣지 않는다.
// 표정 초상은 v2 경로(characters/faces)만 쓰므로 v1 사본(characters/rakoko-face-*.png)은 빼고, 메타 JSON·README 도 뺀다.
const FOLDERS = ['characters','events','backgrounds','brand','endings','icons','fonts','scenes','ui','items','modules','games','audio'];
const skip = source => source.endsWith('.json') || source.endsWith('README.md') || /[\\/]characters[\\/]rakoko-face-[a-z]+\.png$/.test(source);
for(const folder of FOLDERS) {
  await mkdir(`dist/assets/${folder}`,{recursive:true});
  await cp(`assets/${folder}`,`dist/assets/${folder}`,{recursive:true,filter:source=>!skip(source)});
}
console.log('Built dist/ — static hosting, no server dependencies.');
