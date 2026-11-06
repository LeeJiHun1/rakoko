# 방송일지 오리지널 합성 음원

외부 음원·샘플·목소리를 사용하지 않고, 프로젝트용으로 직접 쓴 음표와 수학적 발진기·시드 잡음으로 제작했다. 생성 소스: `scripts/synthesize-requested-audio.py`. Ogg Vorbis · 44,100Hz · 스테레오. BGM 준비·방송 각각 96초.

개발용 재생성 의존성은 `work/asset-production-v2/audio-requirements.txt`. 런타임 npm 의존성은 없다. 효과음 설정을 켠 경우에만 재생하도록 UI에서 연결하며, BGM은 반복 재생한다. 음량은 별도 조절할 수 있게 하고 음원 파일이 로드되었다는 이유로 자동 재생하지 않는다.
