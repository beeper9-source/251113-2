// Supabase에 이균홍 peer 추가 스크립트
// Node.js 환경에서 실행: node add_peer_이균홍_mcp.js

const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://nqwjvrznwzmfytjlpfsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xd2p2cnpud3ptZnl0amxwZnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzA4NTEsImV4cCI6MjA3Mzk0Njg1MX0.R3Y2Xb9PmLr3sCLSdJov4Mgk1eAmhaCIPXEKq6u8NQI';

// Supabase 클라이언트 초기화
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 이균홍 추가 함수
async function addPeer이균홍() {
    try {
        console.log('이균홍 peer 추가 중...');
        
        // 먼저 기존 데이터 확인
        const { data: existingData, error: checkError } = await supabase
            .from('peers')
            .select('*')
            .eq('name', '이균홍');
        
        if (checkError) {
            console.error('기존 데이터 확인 오류:', checkError);
        }
        
        if (existingData && existingData.length > 0) {
            // 이미 존재하는 경우 업데이트
            console.log('이미 존재하는 peer입니다. 이메일 업데이트 중...');
            const { data: updateData, error: updateError } = await supabase
                .from('peers')
                .update({ email: 'kkunong.lee@samsung.com' })
                .eq('name', '이균홍')
                .select();
            
            if (updateError) {
                throw updateError;
            }
            console.log('✓ 이균홍 peer 이메일 업데이트 완료:', updateData);
            return { success: true, action: 'updated', data: updateData };
        } else {
            // 새로 추가
            const { data: insertData, error: insertError } = await supabase
                .from('peers')
                .insert([
                    { 
                        name: '이균홍', 
                        email: 'kkunong.lee@samsung.com' 
                    }
                ])
                .select();
            
            if (insertError) {
                throw insertError;
            }
            console.log('✓ 이균홍 peer 추가 완료:', insertData);
            return { success: true, action: 'inserted', data: insertData };
        }
    } catch (err) {
        console.error('오류 발생:', err);
        return { success: false, error: err.message };
    }
}

// 실행
addPeer이균홍()
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


