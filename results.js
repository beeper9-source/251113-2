// Supabase 설정
const SUPABASE_URL = 'https://nqwjvrznwzmfytjlpfsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xd2p2cnpud3ptZnl0amxwZnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzA4NTEsImV4cCI6MjA3Mzk0Njg1MX0.R3Y2Xb9PmLr3sCLSdJov4Mgk1eAmhaCIPXEKq6u8NQI';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM 요소
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const results = document.getElementById('results');
const evaluationsList = document.getElementById('evaluationsList');
const stats = document.getElementById('stats');
const totalCount = document.getElementById('totalCount');

// 평가 결과 조회 함수
async function loadResults() {
    try {
        // 로딩 표시
        loading.style.display = 'block';
        error.style.display = 'none';
        stats.style.display = 'none';

        // Supabase에서 평가 결과 조회
        // evaluations와 evaluation_scores를 조인하여 조회
        const { data: evaluationsData, error: evalError } = await supabase
            .from('evaluations')
            .select('*')
            .order('created_at', { ascending: false });

        if (evalError) {
            throw evalError;
        }

        if (!evaluationsData || evaluationsData.length === 0) {
            loading.style.display = 'none';
            results.style.display = 'block';
            evaluationsList.innerHTML = '<div class="empty-message">평가 결과가 없습니다.</div>';
            return;
        }

        // 각 평가에 대한 점수들 조회
        const evaluationsWithScores = await Promise.all(
            evaluationsData.map(async (evaluation) => {
                const { data: scoresData, error: scoresError } = await supabase
                    .from('evaluation_scores')
                    .select(`
                        *,
                        peers (
                            id,
                            name
                        )
                    `)
                    .eq('evaluation_id', evaluation.id)
                    .order('score', { ascending: false });

                if (scoresError) {
                    console.error('Error loading scores:', scoresError);
                    return { ...evaluation, scores: [] };
                }

                return {
                    ...evaluation,
                    scores: scoresData || []
                };
            })
        );

        // 로딩 숨기기
        loading.style.display = 'none';

        // 결과 표시
        displayResults(evaluationsWithScores);

        // 이름별 누계 계산 및 저장
        calculateSummary(evaluationsWithScores);

        // 탭 표시
        document.getElementById('viewTabs').style.display = 'flex';

        // 기본 뷰를 이름별 누계로 설정
        switchView('summary');

        // 통계 표시
        totalCount.textContent = evaluationsWithScores.length;
        stats.style.display = 'block';

    } catch (err) {
        // 에러 표시
        loading.style.display = 'none';
        error.style.display = 'block';
        error.textContent = `오류 발생: ${err.message}`;
        console.error('Error loading results:', err);
    }
}

// 평가 결과를 화면에 표시하는 함수
function displayResults(evaluations) {
    results.style.display = 'block';
    evaluationsList.innerHTML = '';

    if (!evaluations || evaluations.length === 0) {
        evaluationsList.innerHTML = '<div class="empty-message">평가 결과가 없습니다.</div>';
        return;
    }

    evaluations.forEach(evaluation => {
        const evaluationCard = document.createElement('div');
        evaluationCard.className = 'evaluation-card';

        // 날짜 포맷팅
        const date = new Date(evaluation.created_at);
        const formattedDate = date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // 점수 합계 계산
        const totalScore = evaluation.scores.reduce((sum, score) => sum + parseFloat(score.score || 0), 0);
        const maxTotalScore = evaluation.scores.reduce((sum, score) => sum + parseFloat(score.max_score || 0), 0);

        evaluationCard.innerHTML = `
            <div class="evaluation-header">
                <div class="evaluator-info">
                    <div class="evaluator-name">평가자: ${evaluation.evaluator_name}</div>
                    <div class="evaluation-date">${formattedDate}</div>
                </div>
                <div class="scores-summary">
                    <div class="total-peers">평가 대상: ${evaluation.scores.length}명</div>
                </div>
            </div>
            <div class="scores-list">
                ${evaluation.scores.map(score => `
                    <div class="score-item">
                        <div class="peer-info">
                            <div class="peer-name">${score.peers?.name || '알 수 없음'}</div>
                            <div class="criteria">${score.criteria || '-'}</div>
                        </div>
                        <div class="score-info">
                            <div class="score-value">${score.score}점</div>
                            <div class="score-max">/ ${score.max_score}점</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        evaluationsList.appendChild(evaluationCard);
    });
}

// 이름별 누계점수 계산
let summaryData = [];

function calculateSummary(evaluations) {
    const summary = {};

    evaluations.forEach(evaluation => {
        evaluation.scores.forEach(score => {
            const peerName = score.peers?.name || '알 수 없음';
            if (!summary[peerName]) {
                summary[peerName] = {
                    name: peerName,
                    totalScore: 0,
                    count: 0,
                    averageScore: 0
                };
            }
            summary[peerName].totalScore += parseFloat(score.score || 0);
            summary[peerName].count += 1;
        });
    });

    // 평균 계산 및 배열로 변환
    summaryData = Object.values(summary).map(item => ({
        ...item,
        averageScore: item.count > 0 ? (item.totalScore / item.count).toFixed(1) : 0
    })).sort((a, b) => b.totalScore - a.totalScore); // 총점 기준 내림차순 정렬
}

// 이름별 누계점수 표시
function displaySummary() {
    const summaryResults = document.getElementById('summaryResults');
    const summaryList = document.getElementById('summaryList');

    summaryResults.style.display = 'block';
    summaryList.innerHTML = '';

    if (!summaryData || summaryData.length === 0) {
        summaryList.innerHTML = '<div class="empty-message">누계 데이터가 없습니다.</div>';
        return;
    }

    // 최대 총점 계산 (막대그래프 비율 계산용)
    const maxTotalScore = Math.max(...summaryData.map(item => item.totalScore), 1);

    summaryData.forEach(item => {
        const summaryCard = document.createElement('div');
        summaryCard.className = 'summary-card';
        
        // 막대그래프 비율 계산 (최대값 대비)
        const barPercentage = (item.totalScore / maxTotalScore) * 100;
        
        summaryCard.innerHTML = `
            <div class="summary-header">
                <div class="peer-name-large">${item.name}</div>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-label">평가 횟수</span>
                        <span class="stat-value">${item.count}회</span>
                    </div>
                </div>
            </div>
            <div class="summary-scores">
                <div class="score-row">
                    <span class="score-label">총점</span>
                    <span class="score-value-large">${item.totalScore}점</span>
                </div>
                <div class="bar-chart-container">
                    <div class="bar-chart">
                        <div class="bar-fill" style="width: ${barPercentage}%"></div>
                    </div>
                    <div class="bar-value">${item.totalScore}점</div>
                </div>
            </div>
        `;
        summaryList.appendChild(summaryCard);
    });
}

// 탭 전환 함수
function switchView(viewType) {
    const listTab = document.querySelector('.tab-btn[data-view="list"]');
    const summaryTab = document.querySelector('.tab-btn[data-view="summary"]');
    const resultsDiv = document.getElementById('results');
    const summaryDiv = document.getElementById('summaryResults');

    if (viewType === 'list') {
        listTab.classList.add('active');
        summaryTab.classList.remove('active');
        resultsDiv.style.display = 'block';
        summaryDiv.style.display = 'none';
    } else {
        summaryTab.classList.add('active');
        listTab.classList.remove('active');
        resultsDiv.style.display = 'none';
        summaryDiv.style.display = 'block';
        displaySummary();
    }
}

// 페이지 로드 시 자동으로 데이터 불러오기
window.addEventListener('DOMContentLoaded', loadResults);

// 탭 버튼 이벤트 리스너 (이벤트 위임 사용)
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-btn')) {
        const viewType = e.target.getAttribute('data-view');
        if (viewType) {
            switchView(viewType);
        }
    }
});

