// Supabase 설정
const SUPABASE_URL = 'https://nqwjvrznwzmfytjlpfsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xd2p2cnpud3ptZnl0amxwZnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzA4NTEsImV4cCI6MjA3Mzk0Njg1MX0.R3Y2Xb9PmLr3sCLSdJov4Mgk1eAmhaCIPXEKq6u8NQI';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM 요소
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const results = document.getElementById('results');
const peersTableBody = document.getElementById('peersTableBody');
const stats = document.getElementById('stats');
const totalCount = document.getElementById('totalCount');

// Peers 데이터 조회 함수
async function loadPeers() {
    try {
        // 로딩 표시
        loading.style.display = 'block';
        error.style.display = 'none';
        stats.style.display = 'none';

        // Supabase에서 peers 데이터 조회
        const { data, error: fetchError } = await supabase
            .from('peers')
            .select('*')
            .order('name', { ascending: true });

        // 로딩 숨기기
        loading.style.display = 'none';

        // 에러 처리
        if (fetchError) {
            throw fetchError;
        }

        // 결과 표시
        displayPeers(data);

        // 통계 표시
        if (data && data.length > 0) {
            totalCount.textContent = data.length;
            stats.style.display = 'block';
        }

    } catch (err) {
        // 에러 표시
        loading.style.display = 'none';
        error.style.display = 'block';
        error.textContent = `오류 발생: ${err.message}`;
        console.error('Error loading peers:', err);
    }
}

// Peers 데이터를 테이블에 표시하는 함수
function displayPeers(peers) {
    // 테이블 본문 초기화
    peersTableBody.innerHTML = '';

    if (!peers || peers.length === 0) {
        peersTableBody.innerHTML = `
            <tr>
                <td colspan="2" class="empty-message">데이터가 없습니다.</td>
            </tr>
        `;
        return;
    }

    // 각 peer를 테이블 행으로 추가
    peers.forEach(peer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${peer.id}</td>
            <td>${peer.name || '-'}</td>
        `;
        peersTableBody.appendChild(row);
    });
}

// 페이지 로드 시 자동으로 데이터 불러오기
window.addEventListener('DOMContentLoaded', loadPeers);

