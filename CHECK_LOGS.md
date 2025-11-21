# Edge Function 로그 확인 가이드

## 로그 확인 방법

### 1. Supabase 대시보드에서 확인

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Edge Functions 메뉴**
   - 왼쪽 메뉴에서 **"Edge Functions"** 클릭
   - `send-evaluation-email` 함수 선택

3. **Logs 탭**
   - **"Logs"** 탭 클릭
   - 최근 실행 로그 확인

### 2. Supabase CLI로 확인

```bash
# 최근 로그 확인
supabase functions logs send-evaluation-email

# 실시간 로그 확인
supabase functions logs send-evaluation-email --follow

# 특정 시간대 로그 확인
supabase functions logs send-evaluation-email --since 1h
```

## 로그에서 확인할 내용

### 정상 실행 시
- "Edge Function 호출됨" 메시지
- "요청 본문" 메시지
- "네이버 SMTP 설정" 메시지
- "이메일 발송 시도" 메시지
- "SMTP 서버 연결 시도" 메시지
- "SMTP 서버 TLS 연결 성공" 메시지
- "사용자명 인증 시도" 메시지
- "비밀번호 인증 시도" 메시지
- "✓ 메일 발송 성공" 메시지

### 오류 발생 시
- "Edge Function 오류 발생" 메시지
- "✗ 메일 발송 실패" 메시지
- "SMTP 오류 상세" 메시지
- 실제 오류 메시지와 스택 트레이스

## 오류 해결

### 오류 메시지가 없는 경우

로그에 오류 레벨만 있고 메시지가 없는 경우:

1. **더 자세한 로그 확인**
   - Supabase 대시보드에서 해당 execution_id의 상세 로그 확인
   - 모든 로그 레벨 확인 (info, warn, error)

2. **코드 재배포**
   - 개선된 오류 로깅이 포함된 코드 재배포
   - 재배포 후 다시 테스트

3. **요청 본문 확인**
   - 클라이언트에서 전송하는 데이터 확인
   - `evaluation.js`의 `sendEvaluationEmails` 함수 확인

### 일반적인 오류

1. **SMTP 연결 실패**
   - 네트워크 문제
   - 방화벽 차단
   - Supabase Edge Function의 네트워크 제한

2. **비밀번호 인증 실패**
   - 네이버 메일 외부 프로그램 사용 설정 확인
   - 비밀번호 확인
   - 2단계 인증 및 앱 비밀번호 확인

3. **요청 파싱 오류**
   - 요청 본문 형식 확인
   - 필수 필드 확인

## 로그 예시

### 성공 로그
```
Edge Function 호출됨: { method: 'POST', url: '...', ... }
요청 본문: { evaluationId: '123', evaluatorName: '홍길동', peerEvaluationsCount: 2 }
네이버 SMTP 설정: 이메일=beeper9@naver.com, 비밀번호 길이=13
이메일 발송 시도: recipient@example.com
SMTP 서버 연결 시도: smtp.naver.com:465 (SSL/TLS)
SMTP 서버 TLS 연결 성공
SMTP 초기 응답: 220 ...
EHLO 응답: 250 ...
사용자명 인증 시도: beeper9@naver.com (base64: ...)
비밀번호 인증 시도: ki*** (base64: ...)
✓ 메일 발송 성공: recipient@example.com
```

### 실패 로그
```
Edge Function 호출됨: { method: 'POST', url: '...', ... }
요청 본문: { evaluationId: '123', evaluatorName: '홍길동', peerEvaluationsCount: 2 }
네이버 SMTP 설정: 이메일=beeper9@naver.com, 비밀번호 길이=13
이메일 발송 시도: recipient@example.com
SMTP 서버 연결 시도: smtp.naver.com:465 (SSL/TLS)
SMTP 서버 TLS 연결 성공
SMTP 초기 응답: 220 ...
EHLO 응답: 250 ...
사용자명 인증 시도: beeper9@naver.com (base64: ...)
비밀번호 인증 시도: ki*** (base64: ...)
비밀번호 인증 응답: 535 5.7.1 Username and Password not accepted
✗ 메일 발송 실패: 비밀번호 인증 실패: 535 5.7.1 Username and Password not accepted
SMTP 오류 상세: { message: '...', stack: '...', name: 'Error', ... }
```

## 문제 해결 체크리스트

- [ ] Supabase 대시보드에서 로그 확인
- [ ] 모든 로그 레벨 확인 (info, warn, error)
- [ ] execution_id로 상세 로그 확인
- [ ] 오류 메시지와 스택 트레이스 확인
- [ ] 네이버 SMTP 설정 확인
- [ ] 코드 재배포 후 재테스트

