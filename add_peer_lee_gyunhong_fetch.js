// Supabase에 이균홍 peer 추가 스크립트 (fetch API 사용)
// Node.js 환경에서 실행: node add_peer_lee_gyunhong_fetch.js

// Supabase 설정
const SUPABASE_URL = 'https://nqwjvrznwzmfytjlpfsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xd2p2cnpud3ptZnl0amxwZnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzA4NTEsImV4cCI6MjA3Mzk0Njg1MX0.R3Y2Xb9PmLr3sCLSdJov4Mgk1eAmhaCIPXEKq6u8NQI';

// 이균홍 추가 함수
async function addPeerLeeGyunhong() {
    try {
        console.log('이균홍 peer 추가 중...');
        
        // 먼저 기존 데이터 확인
        const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/peers?name=eq.이균홍&select=*`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });
        
        const existingData = await checkResponse.json();
        
        if (existingData && existingData.length > 0) {
            // 이미 존재하는 경우 업데이트
            console.log('이미 존재하는 peer입니다. 이메일 업데이트 중...');
            const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/peers?name=eq.이균홍`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ email: 'kkunong.lee@samsung.com' })
            });
            
            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`업데이트 실패: ${updateResponse.status} - ${errorText}`);
            }
            
            const updateData = await updateResponse.json();
            console.log('✓ 이균홍 peer 이메일 업데이트 완료:', updateData);
            return { success: true, action: 'updated', data: updateData };
        } else {
            // 새로 추가
            const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/peers`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    name: '이균홍',
                    email: 'kkunong.lee@samsung.com'
                })
            });
            
            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`추가 실패: ${insertResponse.status} - ${errorText}`);
            }
            
            const insertData = await insertResponse.json();
            console.log('✓ 이균홍 peer 추가 완료:', insertData);
            return { success: true, action: 'inserted', data: insertData };
        }
    } catch (err) {
        console.error('오류 발생:', err);
        return { success: false, error: err.message };
    }
}

// 실행
addPeerLeeGyunhong()
    .then(result => {
        if (result.success) {
            console.log(`\n✅ 성공: ${result.action === 'inserted' ? '추가' : '업데이트'} 완료`);
            process.exit(0);
        } else {
            console.error(`\n❌ 실패: ${result.error}`);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('예상치 못한 오류:', err);
        process.exit(1);
    });


