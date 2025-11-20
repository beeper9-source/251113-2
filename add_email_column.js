// Supabase 설정
const SUPABASE_URL = 'https://nqwjvrznwzmfytjlpfsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xd2p2cnpud3ptZnl0amxwZnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzA4NTEsImV4cCI6MjA3Mzk0Njg1MX0.R3Y2Xb9PmLr3sCLSdJov4Mgk1eAmhaCIPXEKq6u8NQI';

// Supabase 클라이언트 초기화
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// RPC 함수를 사용하여 SQL 실행
async function addEmailColumn() {
    try {
        // Supabase는 직접 SQL 실행을 지원하지 않으므로
        // Management API를 사용하거나 SQL Editor를 통해 실행해야 합니다.
        // 
        // 대신, 이 스크립트는 Node.js 환경에서 Supabase Management API를 사용하거나
        // 또는 브라우저 콘솔에서 실행할 수 있는 방법을 제공합니다.
        
        console.log('⚠️ Supabase는 보안상의 이유로 클라이언트에서 직접 SQL을 실행할 수 없습니다.');
        console.log('다음 방법 중 하나를 사용하세요:');
        console.log('');
        console.log('방법 1: Supabase 대시보드 SQL Editor 사용');
        console.log('1. https://supabase.com/dashboard 접속');
        console.log('2. 프로젝트 선택 → SQL Editor');
        console.log('3. 다음 SQL 실행:');
        console.log('');
        console.log('ALTER TABLE peers ADD COLUMN IF NOT EXISTS email TEXT;');
        console.log('');
        console.log('방법 2: Supabase CLI 사용 (설치 필요)');
        console.log('supabase db execute "ALTER TABLE peers ADD COLUMN IF NOT EXISTS email TEXT;"');
        console.log('');
        console.log('방법 3: Supabase Management API 사용 (서비스 키 필요)');
        
    } catch (error) {
        console.error('오류 발생:', error);
    }
}

// 실행
addEmailColumn();

