# 평가 이메일 발송 기능 배포 가이드

## 개요

평가가 입력되면 평가 대상자들에게 자동으로 이메일이 발송됩니다.
**네이버 SMTP**를 사용하여 이메일을 발송합니다.

## 배포 단계

### 1. Supabase CLI 설치

```bash
npm install -g supabase
```

### 2. Supabase 로그인 및 프로젝트 연결

```bash
# Supabase에 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref nqwjvrznwzmfytjlpfsk
```

### 3. 네이버 계정 설정

**중요**: 네이버는 보안상의 이유로 일반 비밀번호 대신 **앱 비밀번호**를 사용해야 할 수 있습니다.

#### 3-1. 네이버 앱 비밀번호 생성 (필요한 경우)

1. 네이버 메일에 로그인
2. 우측 상단 프로필 → 내 정보
3. 보안 설정 → 2단계 인증 활성화
4. 앱 비밀번호 생성
5. 생성된 앱 비밀번호를 안전하게 보관

#### 3-2. 환경 변수 설정

**방법 A: Supabase 대시보드 사용**
1. Supabase 대시보드 접속
2. Settings → Edge Functions → Secrets
3. 다음 환경 변수 추가:
   - `NAVER_EMAIL`: beeper9@naver.com (또는 설정된 이메일)
   - `NAVER_PASSWORD`: kimjungbae99 (또는 앱 비밀번호)

**방법 B: CLI 사용**
```bash
supabase secrets set NAVER_EMAIL=beeper9@naver.com
supabase secrets set NAVER_PASSWORD=kimjungbae99
```

**참고**: 기본값이 설정되어 있으므로 환경 변수를 설정하지 않아도 작동합니다.
하지만 보안을 위해 환경 변수 사용을 권장합니다.

### 4. Edge Function 배포

```bash
supabase functions deploy send-evaluation-email
```

### 5. 테스트

평가를 입력하면 자동으로 평가 대상자들에게 이메일이 발송됩니다.

## 네이버 SMTP 설정

현재 설정:
- **SMTP 서버**: smtp.naver.com
- **포트**: 587 (STARTTLS)
- **발신자 이메일**: beeper9@naver.com
- **인증 방식**: AUTH LOGIN

### 네이버 보안 설정

네이버는 보안상의 이유로 다음을 권장합니다:
1. **2단계 인증 활성화**
2. **앱 비밀번호 사용** (일반 비밀번호 대신)

앱 비밀번호를 사용하는 경우:
- 환경 변수 `NAVER_PASSWORD`에 앱 비밀번호를 설정하세요

## 문제 해결

### 이메일이 발송되지 않는 경우

1. **환경 변수 확인**
   - Supabase 대시보드에서 Edge Functions Secrets 확인
   - `NAVER_EMAIL`, `NAVER_PASSWORD`가 올바르게 설정되었는지 확인

2. **Edge Function 로그 확인**
   ```bash
   supabase functions logs send-evaluation-email
   ```

3. **네이버 계정 확인**
   - 네이버 메일 로그인이 정상적으로 되는지 확인
   - 앱 비밀번호를 사용하는 경우 올바른 비밀번호인지 확인
   - 네이버 보안 설정에서 SMTP 접근이 허용되어 있는지 확인

4. **브라우저 콘솔 확인**
   - 평가 저장 후 브라우저 개발자 도구 콘솔에서 오류 메시지 확인

5. **네이버 보안 정책 확인**
   - 네이버는 보안상의 이유로 외부 앱 접근을 제한할 수 있습니다
   - 필요시 네이버 고객센터에 문의

### 이메일이 스팸으로 분류되는 경우

1. 네이버 메일은 일반적으로 스팸으로 분류되지 않습니다
2. 이메일 내용 개선 (스팸 키워드 제거)
3. 발신자 이메일 주소가 네이버 도메인(@naver.com)이므로 신뢰도가 높습니다

## 비용

- **네이버 SMTP**: 무료 (네이버 계정만 있으면 사용 가능)
- 일일 발송 제한: 네이버 정책에 따름 (일반적으로 충분함)

## 보안 주의사항

- 네이버 계정 비밀번호는 절대 클라이언트 코드에 노출하지 마세요
- Edge Functions의 Secrets 기능을 사용하여 안전하게 관리하세요
- 가능하면 네이버 앱 비밀번호를 사용하세요 (일반 비밀번호보다 안전)
- 프로덕션 환경에서는 환경 변수를 반드시 설정하세요
- 네이버 계정의 2단계 인증을 활성화하세요

