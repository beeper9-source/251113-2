# SMTP EHLO 오류 해결 가이드

## 오류 메시지
```
EHLO 실패: (응답 없음)
```

## 문제 원인

EHLO 명령이 실패하는 주요 원인:

1. **Supabase Edge Function의 네트워크 제한**
   - Supabase Edge Function에서 외부 SMTP 서버(smtp.naver.com)로의 직접 연결이 제한될 수 있습니다
   - 방화벽이나 네트워크 정책으로 인한 차단

2. **SMTP 응답 읽기 문제**
   - 응답이 여러 줄로 오는데 제대로 읽지 못함
   - 타임아웃 문제

3. **네이버 SMTP 서버 접근 제한**
   - 네이버가 특정 IP에서의 접근을 제한할 수 있음

## 해결 방법

### 방법 1: Edge Function 로그 확인

1. Supabase 대시보드 → Edge Functions → `send-evaluation-email` → Logs
2. "SMTP 초기 응답" 로그 확인
3. "EHLO 응답" 로그 확인
4. 실제 응답 내용 확인

### 방법 2: 네트워크 연결 테스트

Edge Function에서 네이버 SMTP 서버에 연결할 수 있는지 확인:

```typescript
// 테스트 코드 (Edge Function에 추가)
try {
  const conn = await Deno.connect({ hostname: "smtp.naver.com", port: 587 })
  console.log("SMTP 서버 연결 성공")
  conn.close()
} catch (error) {
  console.error("SMTP 서버 연결 실패:", error)
}
```

### 방법 3: 대안 - 외부 이메일 서비스 사용

Supabase Edge Function에서 SMTP 연결이 제한되는 경우, 다음 대안을 고려:

1. **Resend API** (권장)
   - 간단한 REST API
   - 무료 플랜 제공

2. **SendGrid API**
   - 안정적인 이메일 서비스
   - 무료 플랜 제공

3. **Mailgun API**
   - 개발자 친화적
   - 무료 플랜 제공

## 현재 상태 확인

Edge Function 로그에서 다음을 확인하세요:

1. "SMTP 초기 응답" 메시지
   - 220 응답이 오는지 확인
   - 응답이 없으면 네트워크 연결 문제

2. "EHLO 응답" 메시지
   - 250 응답이 오는지 확인
   - 응답이 없으면 EHLO 명령 문제

## 임시 해결책

SMTP 연결이 불가능한 경우, 이메일 발송 기능을 일시적으로 비활성화할 수 있습니다:

`evaluation.js`에서 이메일 발송 부분을 주석 처리:

```javascript
// 3. 평가 대상자들에게 이메일 발송
// try {
//     const emailResult = await sendEvaluationEmails(...);
// } catch (emailError) {
//     console.error('이메일 발송 중 오류:', emailError);
// }
```

## 다음 단계

1. Edge Function 로그 확인
2. 네트워크 연결 테스트
3. 필요시 외부 이메일 서비스 API로 전환

