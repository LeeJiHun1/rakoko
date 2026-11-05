"""Public VOD metadata and subtitle collection; resumable, no media downloads."""
from pathlib import Path
import sys, json, re, time, argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'transcript_tools'))
from yt_dlp import YoutubeDL
from youtube_transcript_api import YouTubeTranscriptApi

def inventory():
    with YoutubeDL({'quiet': True, 'extract_flat': 'in_playlist', 'skip_download': True,
                    'socket_timeout': 20, 'retries': 1}) as ydl:
        data = ydl.extract_info('https://www.youtube.com/@RAKOKOrakoko/videos', download=False)
    entries = []
    for e in data.get('entries', []):
        title = e.get('title', '')
        m = re.search(r'(2026)[.\-/](\d{1,2})[.\-/](\d{1,2})', title)
        alt = re.search(r'(\d{1,2})/(\d{1,2})/(2026)', title)
        date = f'{m[1]}-{int(m[2]):02d}-{int(m[3]):02d}' if m else (f'{alt[3]}-{int(alt[1]):02d}-{int(alt[2]):02d}' if alt else None)
        entries.append({'id': e['id'], 'title': title, 'broadcast_date_from_title': date,
                        'duration': e.get('duration'), 'url': f'https://www.youtube.com/watch?v={e["id"]}'})
    (ROOT / 'inventory.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'videos': len(entries), 'months': dict(sorted(Counter((e['broadcast_date_from_title'] or 'unknown')[:7] for e in entries).items())),
                      'oldest': entries[-8:]}, ensure_ascii=False), flush=True)

def collect(limit=0, retry_blocked=False):
    entries = json.loads((ROOT / 'inventory.json').read_text(encoding='utf-8'))
    status_path = ROOT / 'collection_status.json'
    status = json.loads(status_path.read_text(encoding='utf-8')) if status_path.exists() else {}
    if retry_blocked:
        status = {k:v for k,v in status.items() if v['status'] not in ('IpBlocked','RequestBlocked')}
    todo = [e for e in entries if not (ROOT / f'{e["id"]}.json').exists() and e['id'] not in status]
    # Interleave months so even an interrupted run covers all available months.
    groups = {}
    for e in reversed(todo): groups.setdefault((e['broadcast_date_from_title'] or 'unknown')[:7], []).append(e)
    todo = []
    while any(groups.values()):
        for month in sorted(groups):
            if groups[month]: todo.append(groups[month].pop(0))
    if limit: todo = todo[:limit]
    def fetch(e):
        vid = e['id']
        try:
            listing = YouTubeTranscriptApi().list(vid)
            tracks = [{'language': t.language_code, 'generated': t.is_generated} for t in listing]
            track = listing.find_transcript(['ko'])
            rows = track.fetch().to_raw_data()
            (ROOT / f'{vid}.json').write_text(json.dumps(rows, ensure_ascii=False), encoding='utf-8')
            return vid, {'status': 'downloaded', 'segments': len(rows), 'tracks': tracks, 'language': track.language_code, 'generated': track.is_generated}
        except Exception as exc:
            return vid, {'status': type(exc).__name__, 'detail': str(exc)[:200]}
    # Stop on the first service restriction. Do not rotate IPs, accounts or proxies.
    for n, e in enumerate(todo, 1):
        vid, result = fetch(e); status[vid] = result
        status_path.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps({'n': n, 'of': len(todo), 'id': vid, **result}, ensure_ascii=False), flush=True)
        if result['status'] in ('IpBlocked', 'RequestBlocked'):
            print('STOP: service restriction; retain cache and retry on a later day.', flush=True)
            break
        time.sleep(3)
    print(json.dumps({'status_totals': dict(Counter(v['status'] for v in status.values())), 'cached_transcripts': len(list(ROOT.glob('???????????.json')))}, ensure_ascii=False))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('action', choices=['inventory', 'collect']); parser.add_argument('--limit', type=int, default=0); parser.add_argument('--retry-blocked', action='store_true')
    args = parser.parse_args()
    inventory() if args.action == 'inventory' else collect(args.limit, args.retry_blocked)
