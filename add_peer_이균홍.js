// 브라우저 콘솔에서 실행할 수 있는 스크립트
// index.html 또는 evaluation.html 페이지를 열고 브라우저 콘솔(F12)에서 실행하세요

// Supabase 설정
const SUPABASE_URL = 'https://nqwjvrznwzmfytjlpfsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xd2p2cnpud3ptZnl0amxwZnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzA4NTEsImV4cCI6MjA3Mzk0Njg1MX0.R3Y2Xb9PmLr3sCLSdJov4Mgk1eAmhaCIPXEKq6u8NQI';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 이균홍 추가 함수
async function addPeer이균홍() {
    try {
        console.log('이균홍 peer 추가 중...');
        
        const { data, error } = await supabase
            .from('peers')
            .insert([
                { 
                    name: '이균홍', 
                    email: 'kkunong.lee@samsung.com' 
                }
            ])
            .select();
        
        if (error) {
            // 이미 존재하는 경우 업데이트 시도
            if (error.code === '23505') { // 중복 키 오류
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
                alert('이균홍 peer의 이메일이 업데이트되었습니다!');
            } else {
                throw error;
            }
        } else {
            console.log('✓ 이균홍 peer 추가 완료:', data);
            alert('이균홍 peer가 성공적으로 추가되었습니다!');
        }
    } catch (err) {
        console.error('오류 발생:', err);
        alert(`오류 발생: ${err.message}`);
    }
}

// 실행
addPeer이균홍();


