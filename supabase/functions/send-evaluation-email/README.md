# 평가 이메일 발송 Edge Function

이 Edge Function은 평가가 저장될 때 평가 대상자들에게 이메일을 발송합니다.

## 설정 방법

### 1. Supabase CLI 설치 및 로그인

```bash
npm install -g supabase
supabase login
```

### 2. 프로젝트 연결

```bash
supabase link --project-ref nqwjvrznwzmfytjlpfsk
```

### 3. 이메일 서비스 설정 (Resend 사용 예시)

1. [Resend](https://resend.com)에서 계정 생성 및 API 키 발급
2. Supabase 대시보드에서 환경 변수 설정:
   - Settings → Edge Functions → Secrets
   - `RESEND_API_KEY` 추가

또는 배포 시 환경 변수 설정:

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

### 4. Edge Function 배포

```bash
supabase functions deploy send-evaluation-email
```

### 5. 환경 변수 확인

Supabase 대시보드에서 다음 환경 변수가 자동으로 설정됩니다:
- `SUPABASE_URL`: 자동 설정됨
- `SUPABASE_SERVICE_ROLE_KEY`: 자동 설정됨
- `RESEND_API_KEY`: 수동 설정 필요

## 사용 방법

평가가 저장되면 자동으로 평가 대상자들에게 이메일이 발송됩니다.

## 이메일 서비스 대안

Resend 외에도 다음 서비스를 사용할 수 있습니다:
- SendGrid
- Mailgun
- AWS SES
- Postmark

각 서비스의 API에 맞게 코드를 수정하면 됩니다.

