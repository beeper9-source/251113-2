// Supabase 설정
const SUPABASE_URL = 'https://nqwjvrznwzmfytjlpfsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xd2p2cnpud3ptZnl0amxwZnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzA4NTEsImV4cCI6MjA3Mzk0Njg1MX0.R3Y2Xb9PmLr3sCLSdJov4Mgk1eAmhaCIPXEKq6u8NQI';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM 요소
const evaluatorNameInput = document.getElementById('evaluatorName');
const saveBtn = document.getElementById('saveBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const success = document.getElementById('success');
const evaluationForm = document.getElementById('evaluationForm');
const peersList = document.getElementById('peersList');

// 전역 변수
let peersData = [];

// Peers 목록 불러오기
async function loadPeers() {
    // 평가자 이름 확인
    const evaluatorName = evaluatorNameInput.value.trim();
    if (!evaluatorName) {
        showError('평가자 이름을 입력해주세요.');
        return;
    }

    try {
        // 로딩 표시
        loading.style.display = 'block';
        error.style.display = 'none';
        success.style.display = 'none';

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

        if (!data || data.length === 0) {
            showError('평가할 peers가 없습니다.');
            return;
        }

        // 데이터 저장
        peersData = data;

        // 평가 폼 표시
        displayEvaluationForm(data);
        saveBtn.style.display = 'block';

    } catch (err) {
        // 에러 표시
        loading.style.display = 'none';
        showError(`오류 발생: ${err.message}`);
        console.error('Error loading peers:', err);
    }
}

// 평가 폼 표시
function displayEvaluationForm(peers) {
    peersList.innerHTML = '';

    peers.forEach(peer => {
        const peerCard = document.createElement('div');
        peerCard.className = 'peer-card';
        peerCard.innerHTML = `
            <div class="peer-name">${peer.name}</div>
            <div class="form-group">
                <label for="criteria_${peer.id}">평가내용</label>
                <textarea 
                    id="criteria_${peer.id}" 
                    name="criteria_${peer.id}"
                    placeholder="평가내용을 입력하세요 (선택사항)"
                ></textarea>
            </div>
            <div class="form-group">
                <label for="score_${peer.id}">가점</label>
                <select 
                    id="score_${peer.id}" 
                    name="score_${peer.id}"
                >
                    <option value="">선택하지 않음</option>
                    <option value="10">10점</option>
                    <option value="20">20점</option>
                    <option value="30">30점</option>
                    <option value="40">40점</option>
                    <option value="50">50점</option>
                </select>
                <div class="score-display" id="scoreDisplay_${peer.id}"></div>
            </div>
        `;
        peersList.appendChild(peerCard);

        // 점수 선택 시 표시 업데이트
        const scoreSelect = document.getElementById(`score_${peer.id}`);
        const scoreDisplay = document.getElementById(`scoreDisplay_${peer.id}`);
        
        scoreSelect.addEventListener('change', function() {
            if (this.value) {
                scoreDisplay.textContent = `선택된 점수: ${this.value}점`;
            } else {
                scoreDisplay.textContent = '';
            }
        });
    });

    evaluationForm.style.display = 'block';
}

// 평가 저장
async function saveEvaluations() {
    const evaluatorName = evaluatorNameInput.value.trim();
    if (!evaluatorName) {
        showError('평가자 이름을 입력해주세요.');
        return;
    }

    // 입력된 항목만 수집 (빈 값은 제외)
    const evaluations = [];

    peersData.forEach(peer => {
        const criteria = document.getElementById(`criteria_${peer.id}`).value.trim();
        const score = document.getElementById(`score_${peer.id}`).value;

        // 평가내용과 가점이 모두 입력된 경우만 추가
        if (criteria && score) {
            evaluations.push({
                peer_id: peer.id,
                criteria: criteria,
                score: parseFloat(score),
                max_score: 50 // 최대 점수는 50점
            });
        }
    });

    // 최소 1개 이상의 평가가 입력되었는지 확인
    if (evaluations.length === 0) {
        showError('최소 1개 이상의 평가를 입력해주세요.');
        return;
    }

    try {
        // 로딩 표시
        loading.style.display = 'block';
        error.style.display = 'none';
        success.style.display = 'none';
        saveBtn.disabled = true;

        // 1. 평가(evaluation) 생성
        const { data: evaluationData, error: evalError } = await supabase
            .from('evaluations')
            .insert([
                {
                    evaluator_name: evaluatorName
                }
            ])
            .select()
            .single();

        if (evalError) {
            throw evalError;
        }

        const evaluationId = evaluationData.id;

        // 2. 평가 점수들(evaluation_scores) 생성
        const evaluationScores = evaluations.map(eval => ({
            evaluation_id: evaluationId,
            peer_id: eval.peer_id,
            criteria: eval.criteria,
            max_score: eval.max_score,
            score: eval.score
        }));

        const { error: scoresError } = await supabase
            .from('evaluation_scores')
            .insert(evaluationScores);

        if (scoresError) {
            throw scoresError;
        }

        // 성공 표시
        loading.style.display = 'none';
        saveBtn.disabled = false;
        showSuccess('평가가 성공적으로 저장되었습니다!');
        
        // 폼 초기화
        setTimeout(() => {
            resetForm();
        }, 2000);

    } catch (err) {
        // 에러 표시
        loading.style.display = 'none';
        saveBtn.disabled = false;
        showError(`저장 중 오류 발생: ${err.message}`);
        console.error('Error saving evaluations:', err);
    }
}

// 폼 초기화
function resetForm() {
    evaluatorNameInput.value = '';
    peersList.innerHTML = '';
    evaluationForm.style.display = 'none';
    saveBtn.style.display = 'none';
    success.style.display = 'none';
    peersData = [];
}

// 에러 메시지 표시
function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
    success.style.display = 'none';
}

// 성공 메시지 표시
function showSuccess(message) {
    success.textContent = message;
    success.style.display = 'block';
    error.style.display = 'none';
}

// 이벤트 리스너
saveBtn.addEventListener('click', saveEvaluations);

// 평가자 이름 입력 후 자동으로 peers 목록 불러오기
evaluatorNameInput.addEventListener('blur', function() {
    const evaluatorName = this.value.trim();
    if (evaluatorName && (evaluationForm.style.display === 'none' || !evaluationForm.style.display)) {
        loadPeers();
    }
});

// Enter 키 입력 시에도 peers 목록 불러오기
evaluatorNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        this.blur(); // blur 이벤트를 트리거하여 자동 로드
    }
});

