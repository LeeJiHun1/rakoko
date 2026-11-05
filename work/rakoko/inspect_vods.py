from pathlib import Path
import json, argparse, re
ROOT=Path(__file__).resolve().parent
def ts(sec):
    sec=int(sec); return f'{sec//3600:02d}:{sec//60%60:02d}:{sec%60:02d}'
p=argparse.ArgumentParser();p.add_argument('--id');p.add_argument('--date');p.add_argument('--terms',default='');p.add_argument('--limit',type=int,default=4);p.add_argument('--start',type=float,default=0);p.add_argument('--end',type=float,default=1e9);p.add_argument('--around',type=int,default=4)
a=p.parse_args()
entries=json.loads((ROOT/'inventory.json').read_text(encoding='utf-8'))
for e in entries:
    if a.id and e['id']!=a.id:continue
    if a.date and not (e['broadcast_date_from_title'] or '').startswith(a.date):continue
    path=ROOT/(e['id']+'.json')
    if not path.exists():continue
    rows=json.loads(path.read_text(encoding='utf-8')); hits=[];last=-100
    for i,r in enumerate(rows):
        if not a.start<=r['start']<=a.end:continue
        if a.terms and not any(k in r['text'] for k in a.terms.split('|')):continue
        if i-last<=a.around*2:continue
        hits.append({'time':ts(r['start']),'seconds':int(r['start']),'context':' / '.join(x['text'] for x in rows[max(0,i-a.around):i+a.around+1])})
        last=i
        if len(hits)>=a.limit:break
    if hits:print(json.dumps({'id':e['id'],'date':e['broadcast_date_from_title'],'title':e['title'],'hits':hits},ensure_ascii=False))
