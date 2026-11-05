const DB_NAME='rakoko-journal-v1';
let dbPromise;
function db(){
  if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('journal');
    request.onsuccess=()=>{const database=request.result;database.onversionchange=()=>{database.close();dbPromise=null;};resolve(database);};
    request.onerror=()=>{dbPromise=null;reject(Error('저장소를 열지 못했어요. 브라우저의 저장 허용 상태를 확인해주세요.'));};
  });return dbPromise;
}
export async function load(){
  const database=await db();return new Promise((resolve,reject)=>{
    const request=database.transaction('journal','readonly').objectStore('journal').get('current');
    request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);
  });
}
export async function save(next,previous,{replace=false}={}){
  const database=await db();return new Promise((resolve,reject)=>{
    const transaction=database.transaction('journal','readwrite'),store=transaction.objectStore('journal');
    let problem;
    const request=store.get('current');
    request.onsuccess=()=>{
      const actual=request.result;
      if(!replace&&actual&&(!previous||actual.runId!==previous.runId||actual.revision!==previous.revision)){
        problem=Error('다른 탭에서 더 새로운 일지가 저장됐어요. 최신 일지를 불러와 주세요.');transaction.abort();return;
      }
      if(actual)store.put(actual,'previous');store.put(next,'current');
    };
    transaction.oncomplete=()=>resolve(next);
    transaction.onabort=()=>reject(problem||Error('저장이 완료되지 않았어요. 현재 기록은 유지됩니다. 다시 시도하거나 일지를 내보내 주세요.'));
    transaction.onerror=()=>{};
  });
}
export async function recover(){
  const database=await db();return new Promise((resolve,reject)=>{
    const request=database.transaction('journal','readonly').objectStore('journal').get('previous');
    request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);
  });
}
