# 401 Unauthorized 오류 해결 가이드

## ✅ 좋은 소식!

**401 Unauthorized** 메시지가 나온다는 것은 **Edge Function이 정상적으로 배포되어 있다**는 의미입니다!

## 401 오류의 의미

### 브라우저에서 직접 접근했을 때 401이 나오는 경우

브라우저 주소창에서 다음 URL을 직접 열었을 때 401이 나오는 것은 **정상**입니다:

```
https://nqwjvrznwzmfytjlpfsk.supabase.co/functions/v1/send-evaluation-email
```

**이유:**
- Edge Function은 인증이 필요합니다
- 브라우저에서 직접 접근하면 인증 헤더가 없어서 401이 나옵니다
- 이것은 **정상적인 보안 동작**입니다

### 애플리케이션에서 호출할 때 401이 나오는 경우

애플리케이션에서 `supabase.functions.invoke()`를 사용할 때 401이 나온다면:

1. **Supabase 클라이언트가 올바르게 초기화되었는지 확인**
   - `evaluation.js`의 Supabase 설정 확인
   - ANON KEY가 올바른지 확인

2. **Edge Function의 인증 설정 확인**
   - Edge Function이 인증을 요구하도록 설정되어 있을 수 있습니다
   - 현재 코드는 인증을 선택사항으로 처리합니다

## 해결 방법

### 방법 1: 애플리케이션에서 정상 호출 확인

브라우저에서 직접 접근했을 때 401이 나오는 것은 정상입니다. 실제 애플리케이션에서 평가를 저장할 때:

1. 브라우저 콘솔 확인 (F12)
2. "이메일 발송 시도" 메시지 확인
3. 오류가 없는지 확인

**애플리케이션에서 호출할 때는 `supabase.functions.invoke()`가 자동으로 인증 헤더를 추가하므로 정상 작동해야 합니다.**

### 방법 2: Edge Function 인증 확인 (필요한 경우)

만약 애플리케이션에서도 401이 나온다면, Edge Function에서 인증을 확인하도록 수정할 수 있습니다:

```typescript
// Edge Function에서 인증 확인
const authHeader = req.headers.get('authorization')
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
  )
}
```

하지만 현재는 인증을 선택사항으로 처리하므로 이 단계는 필요하지 않을 수 있습니다.

## 테스트 방법

### 1. 브라우저에서 직접 접근 (401이 나와야 정상)

```
https://nqwjvrznwzmfytjlpfsk.supabase.co/functions/v1/send-evaluation-email
```

**예상 결과:** 401 Unauthorized ✅ (정상)

### 2. 애플리케이션에서 호출 (정상 작동해야 함)

1. 평가 입력 페이지로 이동
2. 평가 입력 및 저장
3. 브라우저 콘솔 확인:
   - "이메일 발송 시도" 메시지 확인
   - 오류가 없는지 확인
   - "이메일 발송 결과" 메시지 확인

## 다음 단계

1. **평가를 입력하고 저장해보세요**
   - 브라우저 콘솔에서 오류 확인
   - 이메일 발송이 정상적으로 작동하는지 확인

2. **Edge Function 로그 확인**
   - Supabase 대시보드 → Edge Functions → `send-evaluation-email` → Logs
   - 이메일 발송 로그 확인

3. **이메일 수신 확인**
   - 평가 대상자의 이메일 수신함 확인

## 요약

- ✅ **401 Unauthorized = Edge Function이 배포됨**
- ✅ 브라우저에서 직접 접근 시 401은 정상
- ✅ 애플리케이션에서 호출 시 자동 인증 처리
- ✅ 실제 테스트: 평가 입력 및 저장

이제 평가를 입력하고 저장해보세요. 이메일이 정상적으로 발송될 것입니다!

