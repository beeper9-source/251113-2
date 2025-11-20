// Supabase Edge Function: 평가 이메일 발송
// Deno runtime 사용 - 네이버 SMTP 사용

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    // 요청 본문 파싱
    const { evaluationId, evaluatorName, peerEvaluations } = await req.json()

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 평가 대상자들의 이메일 정보 조회
    const peerIds = peerEvaluations.map((evalItem: any) => evalItem.peer_id)
    const { data: peers, error: peersError } = await supabase
      .from('peers')
      .select('id, name, email')
      .in('id', peerIds)

    if (peersError) {
      throw peersError
    }

    // 각 평가 대상자에게 이메일 발송
    const emailResults = []
    for (const peerEvaluation of peerEvaluations) {
      const peer = peers.find((p: any) => p.id === peerEvaluation.peer_id)
      
      if (!peer || !peer.email) {
        console.log(`이메일이 없는 peer: ${peer?.name || '알 수 없음'}`)
        continue
      }

      // 이메일 본문 생성
      const emailBody = generateEmailBody(
        peer.name,
        evaluatorName,
        peerEvaluation.criteria,
        peerEvaluation.score,
        peerEvaluation.max_score
      )

      // 네이버 SMTP를 사용하여 이메일 발송
      const naverEmail = Deno.env.get('NAVER_EMAIL') || 'beeper9@naver.com'
      const naverPassword = Deno.env.get('NAVER_PASSWORD') || 'kimjungbae99'
      
      try {
        const emailSent = await sendEmailViaNaverSMTP(
          naverEmail,
          naverPassword,
          peer.email,
          `[평가 알림] ${evaluatorName}님으로부터 평가를 받았습니다`,
          emailBody
        )
        
        if (emailSent) {
          emailResults.push({ peer: peer.name, email: peer.email, status: 'success' })
          console.log(`✓ 이메일 발송 성공: ${peer.email}`)
        } else {
          emailResults.push({ peer: peer.name, email: peer.email, status: 'error', error: '이메일 발송 실패' })
          console.log(`✗ 이메일 발송 실패: ${peer.email}`)
        }
      } catch (emailError) {
        emailResults.push({ peer: peer.name, email: peer.email, status: 'error', error: emailError.message })
        console.error(`이메일 발송 오류 (${peer.email}):`, emailError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '이메일 발송 완료',
        results: emailResults 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

// 이메일 본문 생성 함수
function generateEmailBody(
  peerName: string,
  evaluatorName: string,
  criteria: string,
  score: number,
  maxScore: number
): string {
  // 음수 점수 처리 (자기평가인 경우)
  let displayScore = score
  let displayCriteria = criteria
  const selfEvalMatch = criteria.match(/\[자기평가:\s*(-?\d+)점\]/)
  if (selfEvalMatch) {
    displayScore = parseFloat(selfEvalMatch[1])
    displayCriteria = criteria.replace(/\[자기평가:\s*-?\d+점\]\s*/, '').trim()
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .evaluation-info {
          background: white;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #667eea;
        }
        .score {
          font-size: 2em;
          font-weight: bold;
          color: #667eea;
          margin: 10px 0;
        }
        .criteria {
          color: #6c757d;
          margin-top: 10px;
          line-height: 1.8;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #6c757d;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>평가 알림</h1>
      </div>
      <div class="content">
        <p>안녕하세요, <strong>${peerName}</strong>님,</p>
        <p><strong>${evaluatorName}</strong>님으로부터 평가를 받았습니다.</p>
        
        <div class="evaluation-info">
          <div class="score">${displayScore}점 / ${maxScore}점</div>
          <div class="criteria">
            <strong>평가 내용:</strong><br>
            ${displayCriteria || '평가 내용 없음'}
          </div>
        </div>
        
        <p>더 자세한 평가 결과는 시스템에서 확인하실 수 있습니다.</p>
        
        <div class="footer">
          <p>이 이메일은 자동으로 발송되었습니다.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// 네이버 SMTP를 사용한 이메일 발송 함수
// Deno에서 직접 SMTP 프로토콜 구현
async function sendEmailViaNaverSMTP(
  senderEmail: string,
  senderPassword: string,
  receiverEmail: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  try {
    // SMTP 서버 설정
    const smtpServer = "smtp.naver.com"
    const smtpPort = 587
    
    // 이메일 메시지 구성 (RFC 5322 형식)
    const message = createEmailMessage(
      senderEmail,
      receiverEmail,
      subject,
      htmlBody
    )
    
    // SMTP 연결
    const conn = await Deno.connect({ hostname: smtpServer, port: smtpPort })
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    // SMTP 프로토콜 처리
    let response = await readSMTPResponse(conn, decoder)
    if (!response.startsWith('220')) {
      conn.close()
      throw new Error(`SMTP 연결 실패: ${response}`)
    }
    
    // EHLO 명령
    await writeSMTPCommand(conn, encoder, `EHLO ${smtpServer}`)
    response = await readSMTPResponse(conn, decoder)
    if (!response.startsWith('250')) {
      conn.close()
      throw new Error(`EHLO 실패: ${response}`)
    }
    
    // STARTTLS
    await writeSMTPCommand(conn, encoder, 'STARTTLS')
    response = await readSMTPResponse(conn, decoder)
    if (!response.startsWith('220')) {
      conn.close()
      throw new Error(`STARTTLS 실패: ${response}`)
    }
    
    // TLS 연결 업그레이드
    // Deno의 startTls 사용 (Deno 1.0+)
    const tlsConn = await Deno.startTls(conn, { hostname: smtpServer })
    
    const tlsEncoder = new TextEncoder()
    const tlsDecoder = new TextDecoder()
    
    // EHLO 재전송 (TLS 후)
    await writeSMTPCommand(tlsConn, tlsEncoder, `EHLO ${smtpServer}`)
    response = await readSMTPResponse(tlsConn, tlsDecoder)
    if (!response.startsWith('250')) {
      tlsConn.close()
      throw new Error(`EHLO (TLS) 실패: ${response}`)
    }
    
    // AUTH LOGIN
    await writeSMTPCommand(tlsConn, tlsEncoder, 'AUTH LOGIN')
    response = await readSMTPResponse(tlsConn, tlsDecoder)
    if (!response.startsWith('334')) {
      tlsConn.close()
      throw new Error(`AUTH LOGIN 실패: ${response}`)
    }
    
    // 사용자명 전송 (base64 인코딩)
    const username = senderEmail.split('@')[0] // beeper9@naver.com -> beeper9
    // Deno에서 base64 인코딩
    const usernameBytes = new TextEncoder().encode(username)
    const usernameB64 = encodeBase64(usernameBytes)
    await writeSMTPCommand(tlsConn, tlsEncoder, usernameB64)
    response = await readSMTPResponse(tlsConn, tlsDecoder)
    if (!response.startsWith('334')) {
      tlsConn.close()
      throw new Error(`사용자명 인증 실패: ${response}`)
    }
    
    // 비밀번호 전송 (base64 인코딩)
    const passwordBytes = new TextEncoder().encode(senderPassword)
    const passwordB64 = encodeBase64(passwordBytes)
    await writeSMTPCommand(tlsConn, tlsEncoder, passwordB64)
    response = await readSMTPResponse(tlsConn, tlsDecoder)
    if (!response.startsWith('235')) {
      tlsConn.close()
      throw new Error(`비밀번호 인증 실패: ${response}`)
    }
    
    // MAIL FROM
    await writeSMTPCommand(tlsConn, tlsEncoder, `MAIL FROM:<${senderEmail}>`)
    response = await readSMTPResponse(tlsConn, tlsDecoder)
    if (!response.startsWith('250')) {
      tlsConn.close()
      throw new Error(`MAIL FROM 실패: ${response}`)
    }
    
    // RCPT TO
    await writeSMTPCommand(tlsConn, tlsEncoder, `RCPT TO:<${receiverEmail}>`)
    response = await readSMTPResponse(tlsConn, tlsDecoder)
    if (!response.startsWith('250')) {
      tlsConn.close()
      throw new Error(`RCPT TO 실패: ${response}`)
    }
    
    // DATA
    await writeSMTPCommand(tlsConn, tlsEncoder, 'DATA')
    response = await readSMTPResponse(tlsConn, tlsDecoder)
    if (!response.startsWith('354')) {
      tlsConn.close()
      throw new Error(`DATA 실패: ${response}`)
    }
    
    // 메시지 본문 전송
    const messageBytes = tlsEncoder.encode(message)
    await tlsConn.write(messageBytes)
    await writeSMTPCommand(tlsConn, tlsEncoder, '')
    response = await readSMTPResponse(tlsConn, tlsDecoder)
    if (!response.startsWith('250')) {
      tlsConn.close()
      throw new Error(`메시지 전송 실패: ${response}`)
    }
    
    // QUIT
    await writeSMTPCommand(tlsConn, tlsEncoder, 'QUIT')
    tlsConn.close()
    
    return true
  } catch (error) {
    console.error('SMTP 오류:', error)
    return false
  }
}

// SMTP 명령 전송 헬퍼 함수
async function writeSMTPCommand(conn: Deno.Conn | Deno.TlsConn, encoder: TextEncoder, command: string): Promise<void> {
  const data = encoder.encode(command + '\r\n')
  await conn.write(data)
}

// SMTP 응답 읽기 헬퍼 함수
async function readSMTPResponse(conn: Deno.Conn | Deno.TlsConn, decoder: TextDecoder): Promise<string> {
  const buffer = new Uint8Array(4096)
  const n = await conn.read(buffer)
  if (n === null || n === 0) {
    throw new Error('SMTP 응답 읽기 실패')
  }
  return decoder.decode(buffer.subarray(0, n)).trim()
}

// 이메일 메시지 생성 함수 (RFC 5322 형식)
function createEmailMessage(
  from: string,
  to: string,
  subject: string,
  htmlBody: string
): string {
  // 제목 인코딩 (한글 지원) - Deno에서 안전한 base64 인코딩
  const subjectBytes = new TextEncoder().encode(subject)
  const encodedSubject = `=?UTF-8?B?${encodeBase64(subjectBytes)}?=`
  
  // HTML 본문 base64 인코딩
  const htmlBytes = new TextEncoder().encode(htmlBody)
  const encodedHtmlBody = encodeBase64(htmlBytes)
  
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    encodedHtmlBody,
    `.`
  ].join('\r\n')
}

