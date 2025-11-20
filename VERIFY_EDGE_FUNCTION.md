# Edge Function 배포 확인 가이드

## "Failed to fetch" 오류 해결

이 오류는 Edge Function이 배포되지 않았거나 접근할 수 없을 때 발생합니다.

## 빠른 확인 방법

### 1. 브라우저에서 직접 확인

다음 URL을 브라우저 주소창에 입력하세요:

```
https://nqwjvrznwzmfytjlpfsk.supabase.co/functions/v1/send-evaluation-email
```

**결과에 따른 조치:**
- **404 Not Found**: Edge Function이 배포되지 않았습니다 → 배포 필요
- **401 Unauthorized**: 정상 (인증이 필요하므로) → 배포됨
- **다른 오류**: 배포는 되었지만 다른 문제가 있음

### 2. Supabase 대시보드에서 확인

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택 (nqwjvrznwzmfytjlpfsk)

2. **Edge Functions 메뉴 확인**
   - 왼쪽 메뉴에서 **"Edge Functions"** 클릭
   - 함수 목록에서 `send-evaluation-email` 확인

3. **함수가 없는 경우**
   - 아래 배포 방법을 따라 배포하세요

## Edge Function 배포 방법

### 방법 1: Supabase 대시보드 사용 (가장 간단)

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Edge Functions 메뉴로 이동**
   - 왼쪽 메뉴에서 **"Edge Functions"** 클릭

3. **새 함수 생성**
   - **"Create a new function"** 또는 **"New Function"** 버튼 클릭
   - 함수 이름: `send-evaluation-email` (정확히 이 이름으로, 하이픈 포함)

4. **코드 복사 및 붙여넣기**
   - 프로젝트의 `supabase/functions/send-evaluation-email/index.ts` 파일 열기
   - 전체 내용 복사 (Ctrl+A, Ctrl+C)
   - Supabase 대시보드의 코드 에디터에 붙여넣기 (Ctrl+V)

5. **배포**
   - **"Deploy"** 또는 **"Save"** 버튼 클릭
   - 배포 완료까지 몇 초 대기
   - 배포 성공 메시지 확인

6. **환경 변수 설정 (선택사항)**
   - Settings → Edge Functions → Secrets
   - 다음 환경 변수 추가:
     - `NAVER_EMAIL`: beeper9@naver.com
     - `NAVER_PASSWORD`: kimjungbae99

### 방법 2: Supabase CLI 사용

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

## 배포 후 확인

### 1. 브라우저 새로고침
- 페이지를 완전히 새로고침 (Ctrl+F5 또는 Cmd+Shift+R)

### 2. 평가 입력 및 저장
- 평가를 입력하고 저장 버튼 클릭

### 3. 브라우저 콘솔 확인
- 개발자 도구 (F12) → Console 탭
- "이메일 발송 시도" 메시지 확인
- "Edge Function URL" 메시지 확인
- 오류 메시지가 사라졌는지 확인

### 4. 네트워크 탭 확인
- 개발자 도구 → Network 탭
- `send-evaluation-email` 요청 확인
- 상태 코드가 200인지 확인

### 5. Edge Function 로그 확인
- Supabase 대시보드 → Edge Functions → `send-evaluation-email` → Logs
- 최근 로그에서 오류 확인

## 문제 해결

### 여전히 "Failed to fetch" 오류가 발생하는 경우

1. **함수 이름 확인**
   - 함수 이름이 정확히 `send-evaluation-email`인지 확인
   - 대소문자 구분 확인
   - 하이픈(-) 포함 확인

2. **배포 상태 확인**
   - Supabase 대시보드에서 함수가 "Active" 상태인지 확인
   - 배포가 완료되었는지 확인

3. **브라우저 캐시 삭제**
   - 브라우저 캐시 완전 삭제
   - 시크릿 모드에서 테스트

4. **네트워크 문제 확인**
   - 인터넷 연결 확인
   - 방화벽이나 프록시 설정 확인

5. **Supabase 프로젝트 확인**
   - 프로젝트가 활성화되어 있는지 확인
   - 프로젝트 참조 ID가 올바른지 확인

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

