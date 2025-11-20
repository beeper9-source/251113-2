# ⚠️ Edge Function 배포 필요

현재 "Failed to fetch" 오류가 발생하고 있습니다. 이는 **Edge Function이 아직 배포되지 않았기 때문**입니다.

## 🚀 지금 바로 배포하기 (3분 소요)

### 1단계: Supabase 대시보드 접속

1. 브라우저에서 **https://supabase.com/dashboard** 접속
2. 로그인 (필요한 경우)
3. 프로젝트 선택: **nqwjvrznwzmfytjlpfsk**

### 2단계: Edge Functions 메뉴로 이동

1. 왼쪽 메뉴에서 **"Edge Functions"** 클릭
2. 함수 목록이 표시됩니다

### 3단계: 함수 확인 또는 생성

**함수가 이미 있는 경우:**
- `send-evaluation-email` 함수를 클릭
- 코드를 확인하고 필요시 업데이트

**함수가 없는 경우:**
1. **"Create a new function"** 또는 **"New Function"** 버튼 클릭
2. 함수 이름 입력: `send-evaluation-email` (정확히 이 이름으로, 하이픈 포함)
3. **"Create function"** 클릭

### 4단계: 코드 복사 및 붙여넣기

1. 프로젝트 폴더에서 다음 파일 열기:
   ```
   supabase/functions/send-evaluation-email/index.ts
   ```

2. **전체 내용 선택 및 복사**
   - Ctrl+A (전체 선택)
   - Ctrl+C (복사)

3. Supabase 대시보드의 코드 에디터로 돌아가기

4. **기존 코드 모두 삭제 후 붙여넣기**
   - Ctrl+A (전체 선택)
   - Delete (삭제)
   - Ctrl+V (붙여넣기)

### 5단계: 배포

1. **"Deploy"** 또는 **"Save"** 버튼 클릭
2. 배포 완료 메시지 확인 (몇 초 소요)
3. 함수 상태가 **"Active"**로 표시되는지 확인

### 6단계: 환경 변수 설정 (선택사항, 권장)

1. Settings → Edge Functions → Secrets 클릭
2. **"Add new secret"** 클릭
3. 다음 환경 변수 추가:

   **첫 번째 환경 변수:**
   - Name: `NAVER_EMAIL`
   - Value: `beeper9@naver.com`
   - **"Add secret"** 클릭

   **두 번째 환경 변수:**
   - Name: `NAVER_PASSWORD`
   - Value: `kimjungbae99`
   - **"Add secret"** 클릭

### 7단계: 테스트

1. 브라우저로 돌아가서 페이지 **완전히 새로고침** (Ctrl+F5)
2. 평가 입력 및 저장
3. 브라우저 콘솔 (F12) 확인
   - "이메일 발송 시도" 메시지 확인
   - 오류가 사라졌는지 확인

## ✅ 배포 확인 방법

### 방법 1: Supabase 대시보드에서 확인

1. Edge Functions 메뉴로 이동
2. `send-evaluation-email` 함수가 목록에 있는지 확인
3. 상태가 **"Active"**인지 확인

### 방법 2: 브라우저에서 직접 확인

다음 URL을 브라우저 주소창에 입력:

```
https://nqwjvrznwzmfytjlpfsk.supabase.co/functions/v1/send-evaluation-email
```

**결과:**
- **404 Not Found** → 아직 배포되지 않음
- **401 Unauthorized** → ✅ 정상 (배포됨, 인증 필요)
- **다른 오류** → 배포는 되었지만 다른 문제

## 🔧 문제 해결

### 배포 후에도 오류가 발생하는 경우

1. **브라우저 캐시 완전 삭제**
   - Ctrl+Shift+Delete
   - 캐시 삭제 후 다시 시도

2. **함수 이름 확인**
   - 정확히 `send-evaluation-email`인지 확인
   - 대소문자, 하이픈 확인

3. **코드 확인**
   - Supabase 대시보드에서 코드가 올바르게 저장되었는지 확인
   - 문법 오류가 없는지 확인

4. **로그 확인**
   - Edge Functions → `send-evaluation-email` → Logs
   - 오류 메시지 확인

## 📝 중요 사항

- Edge Function 배포는 **필수**입니다
- 배포 없이는 이메일 발송 기능이 작동하지 않습니다
- 배포는 몇 초만에 완료됩니다
- 배포 후 즉시 사용 가능합니다

## 🆘 도움이 필요한 경우

배포 중 문제가 발생하면:
1. Supabase 대시보드의 오류 메시지 확인
2. 브라우저 콘솔의 오류 메시지 확인
3. Edge Function 로그 확인

