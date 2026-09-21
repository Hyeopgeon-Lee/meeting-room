# 학과 프로젝트실 예약 서비스

GitHub Pages 정적 프론트엔드와 Google Apps Script JSON API를 연결한 8318·8319 프로젝트실 예약 서비스입니다.

## 주소

- 기본: `https://hyeopgeon-lee.github.io/meeting-room/`
- 8318 QR: `https://room.k-bigdata.kr/room.html?room=8318`
- 8319 QR: `https://room.k-bigdata.kr/room.html?room=8319`

## 구성

- `index.html`, `room.html`: 모바일 화면 진입점
- `js/api.js`: Apps Script API 호출(POST는 simple request)
- `js/app.js`, `css/style.css`: 현황·예약·내 예약 화면
- `apps-script/Code.gs`: 서버 검증, 중복 예약 잠금, Calendar/Sheets 저장

Apps Script 프로젝트의 Script Properties에 `SHEET_ID`를 설정하고 `initializeSystem`을 한 번 실행한 뒤, 웹 앱을 새 버전으로 배포합니다. 현재 API 배포 주소는 `https://script.google.com/macros/s/AKfycbyN9oLPf7JIaX4P2ZrBnDMstCJCBkUKqPls0a5rPP3hNCuZ0NQ0dRRnp1J3OBiWQQ0CCA/exec`입니다. API는 `getReservations`, `checkAvailability`, `createReservation`, `findReservation`, `cancelReservation`을 제공합니다. 예약 원장은 `예약API` 시트에 `예약번호, 프로젝트실, 시작, 종료, 예약자, 학번, 용도, 메모, PIN해시, 상태, 이벤트ID, 생성일시, 취소일시` 순서로 저장됩니다.

## GitHub Pages

저장소 Settings → Pages에서 `main` 브랜치의 root를 배포 대상으로 선택합니다. 사용자 도메인을 쓸 때는 Pages의 Custom domain에 `room.k-bigdata.kr`을 입력하고 DNS에 CNAME `room → hyeopgeon-lee.github.io`를 설정합니다.
