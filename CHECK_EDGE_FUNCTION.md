# Edge Function 배포 확인 및 문제 해결

## 오류 메시지
```
FunctionsFetchError: Failed to send a request to the Edge Function
```

이 오류는 Edge Function이 배포되지 않았거나 접근할 수 없을 때 발생합니다.

## 해결 방법

### 1단계: Edge Function 배포 확인

**Supabase 대시보드에서 확인:**
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 (nqwjvrznwzmfytjlpfsk)
3. 왼쪽 메뉴에서 **"Edge Functions"** 클릭
4. `send-evaluation-email` 함수가 목록에 있는지 확인

**함수가 없는 경우:** 아래 배포 방법을 따라 배포하세요.

### 2단계: Edge Function 배포

#### 방법 A: Supabase 대시보드 사용 (가장 간단)

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Edge Functions 메뉴로 이동**
   - 왼쪽 메뉴에서 **"Edge Functions"** 클릭

3. **새 함수 생성**
   - **"Create a new function"** 또는 **"New Function"** 버튼 클릭
   - 함수 이름: `send-evaluation-email` (정확히 이 이름으로)

4. **코드 복사 및 붙여넣기**
   - 프로젝트의 `supabase/functions/send-evaluation-email/index.ts` 파일 열기
   - 전체 내용 복사 (Ctrl+A, Ctrl+C)
   - Supabase 대시보드의 코드 에디터에 붙여넣기 (Ctrl+V)

5. **배포**
   - **"Deploy"** 또는 **"Save"** 버튼 클릭
   - 배포 완료까지 몇 초 대기

6. **환경 변수 설정 (선택사항)**
   - Settings → Edge Functions → Secrets
   - 다음 환경 변수 추가:
     - `NAVER_EMAIL`: beeper9@naver.com
     - `NAVER_PASSWORD`: kimjungbae99

#### 방법 B: Supabase CLI 사용

```bash
# 1. Supabase CLI 설치
npm install -g supabase

# 2. 로그인
supabase login

# 3. 프로젝트 연결
supabase link --project-ref nqwjvrznwzmfytjlpfsk

# 4. Edge Function 배포
supabase functions deploy send-evaluation-email

# 5. 환경 변수 설정 (선택사항)
supabase secrets set NAVER_EMAIL=beeper9@naver.com
supabase secrets set NAVER_PASSWORD=kimjungbae99
```

### 3단계: 배포 확인

1. **브라우저 새로고침**
   - 페이지를 완전히 새로고침 (Ctrl+F5)

2. **평가 입력 및 저장**
   - 평가를 입력하고 저장 버튼 클릭

3. **브라우저 콘솔 확인**
   - 개발자 도구 (F12) → Console 탭
   - "이메일 발송 시도" 메시지 확인
   - 오류 메시지가 사라졌는지 확인

4. **네트워크 탭 확인**
   - 개발자 도구 → Network 탭
   - `send-evaluation-email` 요청 확인
   - 상태 코드가 200인지 확인

### 4단계: Edge Function 로그 확인

**Supabase 대시보드에서:**
1. Edge Functions 메뉴로 이동
2. `send-evaluation-email` 함수 클릭
3. **"Logs"** 탭 클릭
4. 최근 로그 확인

**CLI에서:**
```bash
supabase functions logs send-evaluation-email
```

## 문제 해결

### 여전히 오류가 발생하는 경우

1. **함수 이름 확인**
   - 함수 이름이 정확히 `send-evaluation-email`인지 확인
   - 대소문자 구분 확인

2. **함수 URL 확인**
   - 올바른 URL: `https://nqwjvrznwzmfytjlpfsk.supabase.co/functions/v1/send-evaluation-email`
   - 브라우저에서 직접 접속해보기 (404가 나오면 배포되지 않은 것)

3. **인증 확인**
   - Supabase ANON KEY가 올바른지 확인
   - `evaluation.js`의 Supabase 설정 확인

4. **코드 확인**
   - Edge Function 코드에 문법 오류가 없는지 확인
   - Supabase 대시보드에서 코드 저장 후 다시 배포

5. **브라우저 캐시 삭제**
   - 브라우저 캐시 완전 삭제
   - 시크릿 모드에서 테스트

## 임시 해결책

Edge Function 배포가 어려운 경우, 이메일 발송 기능을 일시적으로 비활성화할 수 있습니다:

`evaluation.js`의 `saveEvaluations` 함수에서 이메일 발송 부분을 주석 처리:

```javascript
// 3. 평가 대상자들에게 이메일 발송
// try {
//     const emailResult = await sendEvaluationEmails(evaluationId, evaluatorName, evaluations, peersData);
//     if (emailResult && emailResult.success === false) {
//         console.warn('이메일 발송 실패:', emailResult.message || emailResult.error);
//     }
// } catch (emailError) {
//     console.error('이메일 발송 중 오류:', emailError);
// }
```

이렇게 하면 평가 저장은 정상적으로 작동하지만 이메일은 발송되지 않습니다.

## 다음 단계

배포가 완료되면:
1. 평가를 입력하고 저장
2. 브라우저 콘솔에서 "이메일 발송 결과" 메시지 확인
3. 평가 대상자의 이메일 수신함 확인
4. Edge Function 로그에서 발송 상태 확인

