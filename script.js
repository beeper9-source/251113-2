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

// 이름에 따른 이미지 경로 반환 함수
function getImagePath(name) {
    // 박지우는 park 이미지
    if (name === '박지우') {
        return 'img/park.png';
    }
    
    // 김세영은 say 이미지
    if (name === '김세영') {
        return 'img/say.jfif';
    }
    
    // 김구는 일자별로 랜덤하게 kimku, kimku2, kimku3 중 선택
    if (name === '김구') {
        const images = ['img/kimku.png', 'img/kimku2.png', 'img/kimku3.png'];
        const imageIndex = getDayBasedRandom(images.length);
        return images[imageIndex];
    }
    
    // 다른 이름은 이미지 없음
    return null;
}

// 일자별로 랜덤한 값을 반환하는 함수 (같은 날에는 같은 값)
function getDayBasedRandom(max) {
    // 오늘 날짜를 문자열로 변환 (YYYY-MM-DD)
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // 날짜 문자열을 시드로 사용하여 간단한 해시 생성
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        const char = dateString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit 정수로 변환
    }
    
    // 해시 값을 양수로 변환하고 max로 나눈 나머지 반환
    return Math.abs(hash) % max;
}

// Peers 데이터를 테이블에 표시하는 함수
function displayPeers(peers) {
    // 테이블 본문 초기화
    peersTableBody.innerHTML = '';

    if (!peers || peers.length === 0) {
        peersTableBody.innerHTML = `
            <tr>
                <td class="empty-message">데이터가 없습니다.</td>
            </tr>
        `;
        return;
    }

    // 각 peer를 테이블 행으로 추가
    peers.forEach(peer => {
        const row = document.createElement('tr');
        const imagePath = getImagePath(peer.name);
        const imageHtml = imagePath 
            ? `<img src="${imagePath}" alt="${peer.name}" class="peer-table-image" data-image="${imagePath}">`
            : '';
        
        row.innerHTML = `
            <td>
                <div class="peer-name-cell">
                    ${imageHtml}
                    <span>${peer.name || '-'}</span>
                </div>
            </td>
        `;
        peersTableBody.appendChild(row);
    });

    // 이미지 클릭 이벤트 추가
    const images = document.querySelectorAll('.peer-table-image');
    images.forEach(img => {
        img.addEventListener('click', function() {
            showImageModal(this.src);
        });
    });
}

// 이미지 확대 모달 표시
function showImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageSrc;
    modal.style.display = 'flex';
}

// 이미지 확대 모달 닫기
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
}

// 모달 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('imageModal');
    const closeBtn = document.querySelector('.image-modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeImageModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeImageModal();
            }
        });
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeImageModal();
        }
    });
});

// 페이지 로드 시 자동으로 데이터 불러오기
window.addEventListener('DOMContentLoaded', loadPeers);

