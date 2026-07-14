# 코레일 작업현장 AI 기상정보 대응시스템

옥외 철도작업 현장의 **폭염·호우·폭설·한파 기상정보**와 **단계별 조치사항·응급조치**를 한 화면에서 확인하는 모바일 웹(PWA)입니다.

## 핵심 기능

- 현 위치 또는 전국 시·군·구 지역 조회
- 4월~10월 폭염·호우, 11월~3월 폭설·한파 중심 위험 표시
- 폭염 최고 체감온도, 호우 최고 강수량 등 시간대별 예보 그래프
- 단계별 조치사항, 응급조치 가이드, 119 연결
- 홈 화면 추가가 가능한 PWA

## 기술 스택

- React 18 + Vite 5 + TypeScript
- Netlify Functions 서버리스 프록시
- 기상청 공공데이터포털 + Kakao Local 연동
- API 키가 없을 때 Mock 데이터 폴백

## 로컬 실행

```bash
npm install
npm run dev
```

## 검사 및 빌드

```bash
npm test
npm run build
```

## Netlify 배포 설정

GitHub 저장소를 Netlify에 연결한 뒤 아래 값으로 배포합니다.

| 항목 | 값 |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |

`netlify.toml`에 위 설정과 SPA redirect, `/api/*` 서버리스 함수 연결이 포함되어 있습니다.

## 환경변수

Netlify Site configuration > Environment variables에 아래 값을 등록합니다. 키는 GitHub에 커밋하지 않습니다.

| 변수 | 용도 |
|---|---|
| `KMA_SERVICE_KEY` | 기상청 공공데이터포털 서비스키 |
| `KAKAO_REST_KEY` | Kakao Local REST 키 |

환경변수가 없으면 Mock 데이터로 동작합니다.

## GitHub 업로드 시 제외 항목

`.gitignore`에 `node_modules`, `dist`, `.env`, `.netlify` 등이 제외되어 있습니다. GitHub에는 소스코드와 설정 파일만 올리면 됩니다.
