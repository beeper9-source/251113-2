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
let allPeersList = [];
let todayUsedScore = 0; // 오늘 사용한 점수
const MAX_DAILY_SCORE = 200; // 하루 최대 점수
let aiEvaluationResults = {}; // AI 평가 결과 저장 (peer_id를 키로 사용)

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

// 평가자 목록 불러오기
async function loadEvaluatorList() {
    try {
        const { data, error: fetchError } = await supabase
            .from('peers')
            .select('*')
            .order('name', { ascending: true });

        if (fetchError) {
            throw fetchError;
        }

        allPeersList = data || [];
        
        // 드롭다운에 옵션 추가
        evaluatorNameInput.innerHTML = '<option value="">선택하세요</option>';
        allPeersList.forEach(peer => {
            const option = document.createElement('option');
            option.value = peer.name;
            option.textContent = peer.name;
            evaluatorNameInput.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading evaluator list:', err);
    }
}

// 평가자 선택 시 이미지 표시
function updateEvaluatorImage() {
    const selectedName = evaluatorNameInput.value;
    const evaluatorImageContainer = document.getElementById('evaluatorImage');
    const evaluatorImageSrc = document.getElementById('evaluatorImageSrc');
    
    if (selectedName) {
        const imagePath = getImagePath(selectedName);
        if (imagePath) {
            evaluatorImageSrc.src = imagePath;
            evaluatorImageContainer.style.display = 'block';
        } else {
            evaluatorImageContainer.style.display = 'none';
        }
    } else {
        evaluatorImageContainer.style.display = 'none';
    }
}

// Peers 목록 불러오기 (평가 대상)
async function loadPeers() {
    // 평가자 이름 확인
    const evaluatorName = evaluatorNameInput.value.trim();
    if (!evaluatorName) {
        showError('평가자 이름을 선택해주세요.');
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

        // 오늘 사용한 점수 조회
        await loadTodayUsedScore(evaluatorName);
        
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
    
    // 평가자 이름 가져오기
    const evaluatorName = evaluatorNameInput.value.trim();

    peers.forEach(peer => {
        const peerCard = document.createElement('div');
        peerCard.className = 'peer-card';
        
        // 이미지 경로 가져오기
        const imagePath = getImagePath(peer.name);
        const imageHtml = imagePath 
            ? `<img src="${imagePath}" alt="${peer.name}" class="peer-evaluation-image">`
            : '';
        
        // 평가자가 본인을 평가하는 경우 -50부터 50까지 옵션 추가
        const isSelfEvaluation = evaluatorName === peer.name;
        let scoreOptions = '<option value="">선택하지 않음</option>';
        
        if (isSelfEvaluation) {
            // 본인 평가: -50점부터 50점까지 10점 단위
            scoreOptions += `
                <option value="-50">-50점</option>
                <option value="-40">-40점</option>
                <option value="-30">-30점</option>
                <option value="-20">-20점</option>
                <option value="-10">-10점</option>
                <option value="0">0점</option>
                <option value="10">10점</option>
                <option value="20">20점</option>
                <option value="30">30점</option>
                <option value="40">40점</option>
                <option value="50">50점</option>
            `;
        } else {
            // 타인 평가: 양수 점수 옵션
            scoreOptions += `
                <option value="10">10점</option>
                <option value="20">20점</option>
                <option value="30">30점</option>
                <option value="40">40점</option>
                <option value="50">50점</option>
            `;
        }
        
        peerCard.innerHTML = `
            <div class="peer-name-with-image">
                ${imageHtml}
                <div class="peer-info">
                    <div class="peer-name">${peer.name}</div>
                    ${peer.email ? `<div class="peer-email">${peer.email}</div>` : ''}
                </div>
            </div>
            <div class="form-group">
                <label for="criteria_${peer.id}">평가내용</label>
                <div class="criteria-input-container">
                    <textarea 
                        id="criteria_${peer.id}" 
                        name="criteria_${peer.id}"
                        placeholder="평가내용을 입력하세요 (선택사항)"
                    ></textarea>
                    <button 
                        type="button" 
                        class="btn-ai-evaluate" 
                        id="aiEvaluateBtn_${peer.id}"
                        data-peer-id="${peer.id}"
                    >
                        🤖 AI 평가
                    </button>
                </div>
                <div id="aiEvaluationResult_${peer.id}" class="ai-evaluation-result" style="display: none;">
                    <div class="ai-evaluation-header">
                        <span class="ai-evaluation-label">AI 평가 결과</span>
                    </div>
                    <div class="ai-evaluation-content">
                        <div class="ai-evaluation-opinion">
                            <strong>평가 의견:</strong>
                            <p id="aiOpinion_${peer.id}"></p>
                        </div>
                        <div class="ai-evaluation-score">
                            <strong>추천 점수:</strong>
                            <span id="aiScore_${peer.id}" class="ai-score-value"></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="score_${peer.id}">가점</label>
                <select 
                    id="score_${peer.id}" 
                    name="score_${peer.id}"
                >
                    ${scoreOptions}
                </select>
                <div class="score-display" id="scoreDisplay_${peer.id}"></div>
            </div>
        `;
        peersList.appendChild(peerCard);

        // 점수 선택 시 표시 업데이트 및 총점 계산
        const scoreSelect = document.getElementById(`score_${peer.id}`);
        const scoreDisplay = document.getElementById(`scoreDisplay_${peer.id}`);
        
        scoreSelect.addEventListener('change', function() {
            if (this.value) {
                scoreDisplay.textContent = `선택된 점수: ${this.value}점`;
            } else {
                scoreDisplay.textContent = '';
            }
            // 총점 업데이트
            updateTotalScore();
        });

        // AI 평가 버튼 이벤트 리스너
        const aiEvaluateBtn = document.getElementById(`aiEvaluateBtn_${peer.id}`);
        aiEvaluateBtn.addEventListener('click', function() {
            const criteria = document.getElementById(`criteria_${peer.id}`).value.trim();
            if (!criteria) {
                showError('평가내용을 먼저 입력해주세요.');
                return;
            }
            evaluateWithAI(peer.id, criteria);
        });
    });

    evaluationForm.style.display = 'block';
    updateTotalScore(); // 초기 총점 표시
}

// 오늘 사용한 점수 조회
async function loadTodayUsedScore(evaluatorName) {
    try {
        // 오늘 날짜 범위 계산 (한국 시간 기준)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStart = `${year}-${month}-${day}T00:00:00.000Z`;
        const todayEnd = `${year}-${month}-${day}T23:59:59.999Z`;
        
        // 오늘 날짜의 평가 조회
        const { data: todayEvaluations, error: evalError } = await supabase
            .from('evaluations')
            .select(`
                id,
                evaluation_scores (
                    score,
                    criteria
                )
            `)
            .eq('evaluator_name', evaluatorName)
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd);
        
        if (evalError) {
            console.error('오늘 사용한 점수 조회 오류:', evalError);
            todayUsedScore = 0;
            return;
        }
        
        // 오늘 사용한 총 점수 계산
        todayUsedScore = 0;
        if (todayEvaluations) {
            todayEvaluations.forEach(evaluation => {
                if (evaluation.evaluation_scores) {
                    evaluation.evaluation_scores.forEach(score => {
                        // criteria에서 자기평가 음수 점수 정보 추출
                        let actualScore = parseFloat(score.score || 0);
                        const criteria = score.criteria || '';
                        const selfEvalMatch = criteria.match(/\[자기평가:\s*(-?\d+)점\]/);
                        if (selfEvalMatch) {
                            // 자기평가 음수 점수가 있는 경우 원래 음수 점수 사용
                            actualScore = parseFloat(selfEvalMatch[1]);
                        }
                        todayUsedScore += actualScore;
                    });
                }
            });
        }
        
        updateScoreLimitDisplay();
    } catch (err) {
        console.error('오늘 사용한 점수 조회 중 오류:', err);
        todayUsedScore = 0;
        updateScoreLimitDisplay();
    }
}

// 총점 계산 및 표시 업데이트
function updateTotalScore() {
    let currentTotal = todayUsedScore;
    
    // 현재 입력된 점수 합산
    peersData.forEach(peer => {
        const scoreSelect = document.getElementById(`score_${peer.id}`);
        if (scoreSelect && scoreSelect.value) {
            const scoreValue = parseFloat(scoreSelect.value);
            currentTotal += scoreValue;
        } else {
            // 점수가 선택되지 않았지만 AI 평가가 있는 경우 AI 추천 점수 포함
            if (aiEvaluationResults[peer.id] && aiEvaluationResults[peer.id].score) {
                currentTotal += aiEvaluationResults[peer.id].score;
            }
        }
    });
    
    // 표시 업데이트
    const usedScoreElement = document.getElementById('usedScore');
    const scoreLimitBar = document.getElementById('scoreLimitBar');
    const scoreLimitWarning = document.getElementById('scoreLimitWarning');
    
    if (usedScoreElement) {
        usedScoreElement.textContent = `${currentTotal}점`;
        
        // 진행 바 업데이트
        const percentage = Math.min((currentTotal / MAX_DAILY_SCORE) * 100, 100);
        scoreLimitBar.style.width = `${percentage}%`;
        
        // 색상 변경 (80% 이상이면 주황색, 100% 이상이면 빨간색)
        if (currentTotal >= MAX_DAILY_SCORE) {
            scoreLimitBar.style.background = 'linear-gradient(90deg, #dc3545 0%, #c82333 100%)';
            usedScoreElement.style.color = '#dc3545';
            scoreLimitWarning.style.display = 'block';
        } else if (currentTotal >= MAX_DAILY_SCORE * 0.8) {
            scoreLimitBar.style.background = 'linear-gradient(90deg, #ffc107 0%, #e0a800 100%)';
            usedScoreElement.style.color = '#ffc107';
            scoreLimitWarning.style.display = 'none';
        } else {
            scoreLimitBar.style.background = 'linear-gradient(90deg, #28a745 0%, #218838 100%)';
            usedScoreElement.style.color = '#28a745';
            scoreLimitWarning.style.display = 'none';
        }
    }
}

// 점수 제한 표시 업데이트
function updateScoreLimitDisplay() {
    const dailyScoreLimit = document.getElementById('dailyScoreLimit');
    if (dailyScoreLimit) {
        dailyScoreLimit.style.display = 'block';
        updateTotalScore();
    }
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
            const scoreValue = parseFloat(score);
            // 음수 점수의 경우 max_score를 절댓값으로 설정하여 제약 조건 만족
            // 예: -10점이면 max_score는 10, -50점이면 max_score는 50
            // 양수 점수의 경우 max_score는 50
            const maxScore = scoreValue < 0 ? Math.abs(scoreValue) : 50;
            
            // AI 평가 정보 가져오기
            const aiEvaluation = aiEvaluationResults[peer.id] || null;
            
            evaluations.push({
                peer_id: peer.id,
                criteria: criteria,
                score: scoreValue,
                max_score: maxScore,
                ai_opinion: aiEvaluation ? aiEvaluation.opinion : null,
                ai_score: aiEvaluation ? aiEvaluation.score : null
            });
        }
    });

    // 최소 1개 이상의 평가가 입력되었는지 확인
    if (evaluations.length === 0) {
        showError('최소 1개 이상의 평가를 입력해주세요.');
        return;
    }
    
    // 현재 입력된 총 점수 계산 (AI 추천 점수 포함)
    let currentTotalScore = evaluations.reduce((sum, eval) => sum + eval.score, 0);
    
    // 점수가 선택되지 않았지만 AI 평가가 있는 경우 AI 추천 점수 추가
    peersData.forEach(peer => {
        const scoreSelect = document.getElementById(`score_${peer.id}`);
        const criteria = document.getElementById(`criteria_${peer.id}`).value.trim();
        
        // 평가내용은 있지만 점수가 선택되지 않은 경우
        if (criteria && (!scoreSelect || !scoreSelect.value)) {
            if (aiEvaluationResults[peer.id] && aiEvaluationResults[peer.id].score) {
                currentTotalScore += aiEvaluationResults[peer.id].score;
            }
        }
    });
    
    const totalScore = todayUsedScore + currentTotalScore;
    
    // 200점 초과 확인
    if (totalScore > MAX_DAILY_SCORE) {
        const remainingScore = MAX_DAILY_SCORE - todayUsedScore;
        showError(`하루 최대 200점까지만 부여할 수 있습니다.\n오늘 이미 사용한 점수: ${todayUsedScore}점\n남은 점수: ${remainingScore}점\n현재 입력한 점수: ${currentTotalScore}점`);
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
        // 음수 점수의 경우 데이터베이스 제약 조건을 만족하도록 처리
        const evaluationScores = evaluations.map(eval => {
            let score = eval.score;
            let maxScore = eval.max_score;
            let criteria = eval.criteria;
            
            // 음수 점수인 경우: score를 양수로 변환하고 criteria에 원래 음수 점수 정보 추가
            // 데이터베이스 제약 조건 (score >= 0)을 만족시키기 위해
            if (score < 0) {
                // 원래 음수 점수 정보를 criteria에 추가
                const originalScore = score;
                criteria = `[자기평가: ${originalScore}점] ${criteria}`;
                // score를 양수로 변환하여 저장
                score = Math.abs(score);
                maxScore = score; // 음수였던 경우 max_score를 score와 동일하게
            }
            
            return {
                evaluation_id: evaluationId,
                peer_id: eval.peer_id,
                criteria: criteria,
                max_score: maxScore,
                score: score,
                ai_opinion: eval.ai_opinion || null,
                ai_score: eval.ai_score || null
            };
        });
        
        // 평가내용은 있지만 점수가 선택되지 않은 경우도 처리 (AI 추천 점수 사용)
        peersData.forEach(peer => {
            const criteria = document.getElementById(`criteria_${peer.id}`).value.trim();
            const scoreSelect = document.getElementById(`score_${peer.id}`);
            
            // 평가내용은 있지만 점수가 선택되지 않고 AI 평가가 있는 경우
            if (criteria && (!scoreSelect || !scoreSelect.value)) {
                const aiEvaluation = aiEvaluationResults[peer.id];
                if (aiEvaluation && aiEvaluation.score) {
                    const aiScoreValue = aiEvaluation.score;
                    const maxScore = 50; // AI 추천 점수는 기본적으로 50점 만점
                    
                    evaluationScores.push({
                        evaluation_id: evaluationId,
                        peer_id: peer.id,
                        criteria: criteria,
                        max_score: maxScore,
                        score: aiScoreValue,
                        ai_opinion: aiEvaluation.opinion,
                        ai_score: aiScoreValue
                    });
                }
            }
        });

        const { error: scoresError } = await supabase
            .from('evaluation_scores')
            .insert(evaluationScores);

        if (scoresError) {
            throw scoresError;
        }

        // 3. 평가 대상자들에게 이메일 발송
        try {
            const emailResult = await sendEvaluationEmails(evaluationId, evaluatorName, evaluations, peersData);
            if (emailResult && emailResult.success === false) {
                console.warn('이메일 발송 실패:', emailResult.message || emailResult.error);
            }
        } catch (emailError) {
            // 이메일 발송 실패는 평가 저장을 막지 않음
            console.error('이메일 발송 중 오류:', emailError);
        }

        // 오늘 사용한 점수 업데이트
        todayUsedScore += currentTotalScore;
        updateScoreLimitDisplay();
        
        // 성공 표시
        loading.style.display = 'none';
        saveBtn.disabled = false;
        showSuccess('평가가 성공적으로 저장되었습니다!');
        
        // AI 평가 결과 초기화
        aiEvaluationResults = {};
        
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

// 평가 이메일 발송 함수
async function sendEvaluationEmails(evaluationId, evaluatorName, evaluations, peersData) {
    try {

        // 평가 대상자 정보와 평가 내용 매핑
        const peerEvaluations = evaluations.map(eval => {
            const peer = peersData.find(p => p.id === eval.peer_id);
            return {
                peer_id: eval.peer_id,
                peer_name: peer?.name || '알 수 없음',
                criteria: eval.criteria,
                score: eval.score,
                max_score: eval.max_score,
                ai_opinion: eval.ai_opinion || null,
                ai_score: eval.ai_score || null
            };
        });
        
        // AI 평가만 있고 점수가 선택되지 않은 경우도 추가
        peersData.forEach(peer => {
            const criteria = document.getElementById(`criteria_${peer.id}`).value.trim();
            const scoreSelect = document.getElementById(`score_${peer.id}`);
            
            // 평가내용은 있지만 점수가 선택되지 않고 AI 평가가 있는 경우
            if (criteria && (!scoreSelect || !scoreSelect.value)) {
                const aiEvaluation = aiEvaluationResults[peer.id];
                if (aiEvaluation && aiEvaluation.score) {
                    peerEvaluations.push({
                        peer_id: peer.id,
                        peer_name: peer.name || '알 수 없음',
                        criteria: criteria,
                        score: aiEvaluation.score,
                        max_score: 50,
                        ai_opinion: aiEvaluation.opinion || null,
                        ai_score: aiEvaluation.score || null
                    });
                }
            }
        });

        console.log('이메일 발송 시도:', {
            evaluationId,
            evaluatorName,
            peerCount: peerEvaluations.length
        });

        // Edge Function URL 확인
        const functionUrl = `${SUPABASE_URL}/functions/v1/send-evaluation-email`;
        console.log('Edge Function URL:', functionUrl);

        // Supabase Edge Function 호출
        const { data, error } = await supabase.functions.invoke('send-evaluation-email', {
            body: {
                evaluationId: evaluationId,
                evaluatorName: evaluatorName,
                peerEvaluations: peerEvaluations
            }
        });

        if (error) {
            console.error('Edge Function 호출 오류 상세:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                context: error.context
            });
            
            // Edge Function이 배포되지 않은 경우를 위한 안내
            if (error.message && (error.message.includes('Failed to send') || error.message.includes('Failed to fetch'))) {
                console.error('');
                console.error('❌ ============================================');
                console.error('❌ Edge Function이 배포되지 않았습니다!');
                console.error('❌ ============================================');
                console.error('');
                console.error('📋 배포 방법 (3분 소요):');
                console.error('');
                console.error('1️⃣  Supabase 대시보드 접속');
                console.error('   → https://supabase.com/dashboard');
                console.error('   → 프로젝트 선택: nqwjvrznwzmfytjlpfsk');
                console.error('');
                console.error('2️⃣  Edge Functions 메뉴로 이동');
                console.error('   → 왼쪽 메뉴에서 "Edge Functions" 클릭');
                console.error('');
                console.error('3️⃣  새 함수 생성');
                console.error('   → "Create a new function" 클릭');
                console.error('   → 함수 이름: send-evaluation-email (정확히)');
                console.error('');
                console.error('4️⃣  코드 복사 및 붙여넣기');
                console.error('   → supabase/functions/send-evaluation-email/index.ts 파일 열기');
                console.error('   → 전체 내용 복사 (Ctrl+A, Ctrl+C)');
                console.error('   → Supabase 대시보드 코드 에디터에 붙여넣기 (Ctrl+V)');
                console.error('');
                console.error('5️⃣  배포');
                console.error('   → "Deploy" 또는 "Save" 버튼 클릭');
                console.error('   → 배포 완료까지 대기');
                console.error('');
                console.error('6️⃣  환경 변수 설정 (선택사항)');
                console.error('   → Settings → Edge Functions → Secrets');
                console.error('   → NAVER_EMAIL: beeper9@naver.com');
                console.error('   → NAVER_PASSWORD: kimjungbae99');
                console.error('');
                console.error('7️⃣  테스트');
                console.error('   → 브라우저 새로고침 (Ctrl+F5)');
                console.error('   → 평가 입력 및 저장');
                console.error('');
                console.error('🔍 배포 확인:');
                console.error(`   → ${SUPABASE_URL}/functions/v1/send-evaluation-email`);
                console.error('   → 브라우저에서 직접 열어보기');
                console.error('   → 404 오류 = 배포 안됨, 401 오류 = 배포됨 ✅');
                console.error('');
                console.error('📄 자세한 가이드: DEPLOY_NOW.md 파일 참고');
                console.error('');
                
                // 평가 저장은 성공했으므로 오류를 throw하지 않음
                return { 
                    success: false, 
                    message: 'Edge Function이 배포되지 않았습니다. 이메일은 발송되지 않았습니다.',
                    error: error.message,
                    needsDeployment: true
                };
            }
            
            throw error;
        }

        console.log('이메일 발송 결과:', data);
        return data;
    } catch (err) {
        console.error('이메일 발송 오류:', err);
        
        // 평가 저장은 성공했으므로 오류를 throw하지 않고 로그만 남김
        // 이렇게 하면 이메일 발송 실패가 평가 저장을 방해하지 않음
        console.warn('이메일 발송에 실패했지만 평가는 저장되었습니다.');
        return { 
            success: false, 
            error: err.message || '이메일 발송 중 오류가 발생했습니다.' 
        };
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
    todayUsedScore = 0;
    aiEvaluationResults = {}; // AI 평가 결과 초기화
    const dailyScoreLimit = document.getElementById('dailyScoreLimit');
    if (dailyScoreLimit) {
        dailyScoreLimit.style.display = 'none';
    }
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

// 평가자 선택 변경 시 이미지 업데이트 및 peers 목록 불러오기
evaluatorNameInput.addEventListener('change', async function() {
    updateEvaluatorImage();
    const evaluatorName = this.value.trim();
    
    // 평가자 이름이 변경되면 오늘 사용한 점수 초기화 및 재조회
    todayUsedScore = 0;
    
    if (evaluatorName) {
        // 오늘 사용한 점수 조회
        await loadTodayUsedScore(evaluatorName);
        
        // 평가 폼이 이미 표시되어 있으면 평가 폼을 새로 렌더링 (자기평가 옵션 업데이트)
        if (evaluationForm.style.display === 'block' && peersData.length > 0) {
            // 기존 입력값 저장 (선택사항 - 사용자가 입력한 내용 유지하려면)
            const savedInputs = {};
            peersData.forEach(peer => {
                const criteriaInput = document.getElementById(`criteria_${peer.id}`);
                const scoreSelect = document.getElementById(`score_${peer.id}`);
                if (criteriaInput && scoreSelect) {
                    savedInputs[peer.id] = {
                        criteria: criteriaInput.value,
                        score: scoreSelect.value
                    };
                }
            });
            
            // 평가 폼 다시 렌더링
            displayEvaluationForm(peersData);
            
            // 저장된 입력값 복원
            peersData.forEach(peer => {
                if (savedInputs[peer.id]) {
                    const criteriaInput = document.getElementById(`criteria_${peer.id}`);
                    const scoreSelect = document.getElementById(`score_${peer.id}`);
                    if (criteriaInput && scoreSelect) {
                        criteriaInput.value = savedInputs[peer.id].criteria;
                        scoreSelect.value = savedInputs[peer.id].score;
                        
                        // 점수 표시 업데이트
                        const scoreDisplay = document.getElementById(`scoreDisplay_${peer.id}`);
                        if (scoreDisplay && scoreSelect.value) {
                            scoreDisplay.textContent = `선택된 점수: ${scoreSelect.value}점`;
                        }
                    }
                }
            });
            
            // 총점 업데이트
            updateTotalScore();
        } else if (evaluationForm.style.display === 'none' || !evaluationForm.style.display) {
            // 평가 폼이 표시되지 않았으면 peers 목록 불러오기
            loadPeers();
        }
    } else {
        // 평가자가 선택되지 않았으면 점수 제한 표시 숨기기
        const dailyScoreLimit = document.getElementById('dailyScoreLimit');
        if (dailyScoreLimit) {
            dailyScoreLimit.style.display = 'none';
        }
    }
});

// AI 평가 함수
async function evaluateWithAI(peerId, assessmentContent) {
    const aiEvaluateBtn = document.getElementById(`aiEvaluateBtn_${peerId}`);
    const aiEvaluationResult = document.getElementById(`aiEvaluationResult_${peerId}`);
    const aiOpinion = document.getElementById(`aiOpinion_${peerId}`);
    const aiScore = document.getElementById(`aiScore_${peerId}`);

    try {
        // 버튼 비활성화 및 로딩 표시
        aiEvaluateBtn.disabled = true;
        aiEvaluateBtn.textContent = '⏳ 평가 중...';
        aiEvaluationResult.style.display = 'none';

        // Edge Function 호출
        const { data, error } = await supabase.functions.invoke('evaluate-peer-assessment', {
            body: {
                assessmentContent: assessmentContent
            }
        });

        if (error) {
            throw error;
        }

        if (!data || !data.opinion || !data.score) {
            throw new Error('AI 평가 결과가 올바르지 않습니다.');
        }

        // 결과 표시
        aiOpinion.textContent = data.opinion;
        aiScore.textContent = `${data.score}점`;
        aiEvaluationResult.style.display = 'block';

        // AI 평가 결과를 전역 변수에 저장
        aiEvaluationResults[peerId] = {
            opinion: data.opinion,
            score: data.score
        };

        // 추천 점수를 자동으로 선택 (선택사항)
        const scoreSelect = document.getElementById(`score_${peerId}`);
        if (scoreSelect) {
            // 가장 가까운 점수 옵션 찾기
            const recommendedScore = data.score;
            const options = Array.from(scoreSelect.options);
            let closestOption = null;
            let minDiff = Infinity;

            options.forEach(option => {
                if (option.value) {
                    const optionScore = parseFloat(option.value);
                    const diff = Math.abs(optionScore - recommendedScore);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestOption = option;
                    }
                }
            });

            if (closestOption && minDiff <= 10) {
                // 추천 점수와 차이가 10점 이내인 경우 자동 선택
                scoreSelect.value = closestOption.value;
                const scoreDisplay = document.getElementById(`scoreDisplay_${peerId}`);
                if (scoreDisplay) {
                    scoreDisplay.textContent = `선택된 점수: ${closestOption.value}점`;
                }
                updateTotalScore();
            } else {
                // 자동 선택되지 않았어도 총점 업데이트 (AI 추천 점수 포함)
                updateTotalScore();
            }
        } else {
            // 점수 선택이 없어도 총점 업데이트
            updateTotalScore();
        }

    } catch (err) {
        console.error('AI 평가 오류:', err);
        showError(`AI 평가 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`);
    } finally {
        // 버튼 활성화
        aiEvaluateBtn.disabled = false;
        aiEvaluateBtn.textContent = '🤖 AI 평가';
    }
}

// 페이지 로드 시 평가자 목록 불러오기
window.addEventListener('DOMContentLoaded', function() {
    loadEvaluatorList();
});

