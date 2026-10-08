# 프로젝트실 예약 Apps Script 자동배포

`room.k-bigdata.kr`의 Apps Script 백엔드는 GitHub 저장소의 `apps-script/`를 원본으로 관리합니다.

```text
GitHub main
  -> security regression tests
  -> appsscript.json 검증
  -> clasp push
  -> 기존 Web App deployment 재배포
```

## 필요한 GitHub Repository Secrets

저장소의 `Settings -> Secrets and variables -> Actions -> Repository secrets`에 다음 3개를 등록합니다.

| Secret | 값 |
|---|---|
| `GAS_SCRIPT_ID` | 프로젝트실 예약 Apps Script Script ID |
| `GAS_DEPLOYMENT_ID` | 현재 운영 Web App Deployment ID |
| `CLASP_CREDENTIALS_JSON` | `clasp login`으로 생성된 `.clasprc.json` 전체 JSON |

### GAS_SCRIPT_ID

현재 clasp 목록에서 확인된 프로젝트실 예약 Apps Script Script ID:

```text
1sHdqLSI30nfIpaJYAoRc-LbP3Th_PxDA0eRKBRj3AkV_10CeMYr2N4p9
```

### GAS_DEPLOYMENT_ID

현재 `js/api.js`가 사용하는 운영 Web App URL의 Deployment ID:

```text
AKfycbxyQB19x1W4nrUAKnBV5lnKaChcd95RFquNVjFW0gH-s5mL0V4G58aA59phZ6wqCWY2fw
```

기존 Deployment ID를 갱신하므로 `room.k-bigdata.kr`이 사용하는 기존 `/exec` URL은 유지됩니다.

### CLASP_CREDENTIALS_JSON

READY와 Job Apply에 사용한 같은 Google 계정이면 동일한 인증 JSON을 사용할 수 있습니다. 단, Secret은 저장소별로 별도 등록합니다.

Windows 11 PowerShell:

```powershell
Get-Content -Raw "$HOME\.clasprc.json" | Set-Clipboard
```

복사된 JSON은 채팅이나 저장소 파일에 올리지 않고 GitHub Secret에만 저장합니다.

## 자동배포 동작

`apps-script/**`, `tests/**`, workflow가 main에서 변경되면 자동 실행됩니다.

1. `node --test tests/security.test.mjs`
2. `appsscript.json` 검증
3. Secret 설정 확인
4. clasp 인증 확인
5. `clasp push --force`
6. 기존 Deployment ID로 Web App 새 버전 배포

Secret이 없으면 테스트까지만 수행하고 실제 GAS 배포는 안전하게 건너뜁니다. 자동배포 실패 시 마지막 성공 Web App 버전은 그대로 유지됩니다.
