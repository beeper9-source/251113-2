# CORS 오류 해결 및 Edge Function 배포 가이드

## CORS 오류 해결

CORS 오류를 해결하기 위해 Edge Function의 CORS 헤더를 수정했습니다:

1. `Access-Control-Allow-Methods` 헤더 추가
2. OPTIONS 응답에 명시적인 status 200 설정
3. `Access-Control-Max-Age` 헤더 추가

## Edge Function 배포 방법

### 방법 1: Supabase CLI 사용 (권장)

#### 1-1. Supabase CLI 설치

```bash
npm install -g supabase
```

#### 1-2. Supabase 로그인

```bash
supabase login
```

브라우저가 열리면 Supabase 계정으로 로그인하세요.

#### 1-3. 프로젝트 연결

```bash
supabase link --project-ref nqwjvrznwzmfytjlpfsk
```

#### 1-4. 환경 변수 설정 (선택사항)

```bash
supabase secrets set NAVER_EMAIL=beeper9@naver.com
supabase secrets set NAVER_PASSWORD=kimjungbae99
```

#### 1-5. Edge Function 배포

```bash
supabase functions deploy send-evaluation-email
```

### 방법 2: Supabase 대시보드 사용

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택 (nqwjvrznwzmfytjlpfsk)

2. **Edge Functions 메뉴로 이동**
   - 왼쪽 메뉴에서 "Edge Functions" 클릭

3. **새 함수 생성**
   - "Create a new function" 클릭
   - 함수 이름: `send-evaluation-email`

4. **코드 복사 및 붙여넣기**
   - `supabase/functions/send-evaluation-email/index.ts` 파일의 내용을 복사
   - 대시보드의 코드 에디터에 붙여넣기

5. **환경 변수 설정**
   - Settings → Edge Functions → Secrets
   - 다음 환경 변수 추가 (선택사항):
     - `NAVER_EMAIL`: beeper9@naver.com
     - `NAVER_PASSWORD`: kimjungbae99

6. **배포**
   - "Deploy" 버튼 클릭

## 배포 확인

배포가 완료되면 다음을 확인하세요:

1. **Edge Function 로그 확인**
   ```bash
   supabase functions logs send-evaluation-email
   ```

2. **브라우저에서 테스트**
   - 평가를 입력하고 저장
   - 브라우저 개발자 도구 콘솔에서 오류 확인
   - CORS 오류가 사라졌는지 확인

## 문제 해결

### 여전히 CORS 오류가 발생하는 경우

1. **Edge Function이 배포되었는지 확인**
   - Supabase 대시보드에서 Edge Functions 목록 확인
   - `send-evaluation-email` 함수가 있는지 확인

2. **함수 URL 확인**
   - 함수 URL이 올바른지 확인:
   - `https://nqwjvrznwzmfytjlpfsk.supabase.co/functions/v1/send-evaluation-email`

3. **브라우저 캐시 삭제**
   - 브라우저 캐시를 삭제하고 다시 시도

4. **Edge Function 로그 확인**
   - Supabase 대시보드에서 Edge Functions → Logs 확인
   - 오류 메시지 확인

### Edge Function이 호출되지 않는 경우

1. **evaluation.js 확인**
   - `sendEvaluationEmails` 함수가 올바르게 호출되는지 확인
   - 브라우저 콘솔에서 오류 메시지 확인

2. **네트워크 탭 확인**
   - 브라우저 개발자 도구 → Network 탭
   - `send-evaluation-email` 요청 확인
   - 요청 상태 코드 확인

## 다음 단계

배포가 완료되면:

1. 평가를 입력하고 저장
2. 평가 대상자에게 이메일이 발송되는지 확인
3. Edge Function 로그에서 이메일 발송 상태 확인

