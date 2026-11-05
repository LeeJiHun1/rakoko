from pathlib import Path
from collections import defaultdict,Counter
import json
R=Path(__file__).resolve().parent
es=json.loads((R/'inventory.json').read_text(encoding='utf-8'))
status=json.loads((R/'collection_status.json').read_text(encoding='utf-8'))
months=defaultdict(lambda:{'listed':0,'subtitles':0,'vod_hours':0,'cached_vod_hours':0,'segments':0})
for e in es:
 m=(e['broadcast_date_from_title'] or 'unknown')[:7];s=months[m];s['listed']+=1;s['vod_hours']+=(e.get('duration') or 0)/3600
 p=R/(e['id']+'.json')
 if p.exists():
  rows=json.loads(p.read_text(encoding='utf-8'));s['subtitles']+=1;s['cached_vod_hours']+=(e.get('duration') or 0)/3600;s['segments']+=len(rows)
for m in months.values():
 for k in ['vod_hours','cached_vod_hours']:m[k]=round(m[k],2)
out={'as_of':'2026-11-03 Asia/Seoul','listed':len(es),'cached':sum(m['subtitles'] for m in months.values()),'monthly':dict(sorted(months.items())),'collection_status':dict(Counter(v['status'] for v in status.values())),'audio_reviewed_segments':0,'full_vods_reviewed':0,'note':'Cached VOD hours are durations of videos with fetched subtitle tracks, NOT hours listened to or fully read.'}
(R/'coverage.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(out,ensure_ascii=False,indent=2))
