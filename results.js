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
                            name,
                            email
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

        // 전체 평가 데이터 저장 (일별 추이 계산용)
        allEvaluationsData = evaluationsWithScores;

        // 결과 표시
        displayResults(evaluationsWithScores);

        // 이름별 누계 계산 및 저장
        calculateSummary(evaluationsWithScores);

        // 탭 표시
        document.getElementById('viewTabs').style.display = 'flex';
        document.getElementById('copyBtn').style.display = 'block';

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
                ${evaluation.scores.map(score => {
                    // criteria에서 자기평가 음수 점수 정보 추출
                    let displayScore = parseFloat(score.score || 0);
                    let displayCriteria = score.criteria || '-';
                    const selfEvalMatch = displayCriteria.match(/\[자기평가:\s*(-?\d+)점\]/);
                    if (selfEvalMatch) {
                        // 자기평가 음수 점수가 있는 경우 원래 음수 점수 표시
                        displayScore = parseFloat(selfEvalMatch[1]);
                        // criteria에서 자기평가 정보 제거하여 표시
                        displayCriteria = displayCriteria.replace(/\[자기평가:\s*-?\d+점\]\s*/, '').trim();
                    }
                    
                    return `
                    <div class="score-item">
                        <div class="peer-info">
                            <div class="peer-name">${score.peers?.name || '알 수 없음'}</div>
                            ${score.peers?.email ? `<div class="peer-email">${score.peers.email}</div>` : ''}
                            <div class="criteria">${displayCriteria || '-'}</div>
                        </div>
                        <div class="score-info">
                            <div class="score-value">${displayScore}점</div>
                            <div class="score-max">/ ${score.max_score}점</div>
                        </div>
                    </div>
                `;
                }).join('')}
            </div>
        `;

        evaluationsList.appendChild(evaluationCard);
    });
}

// 이름별 누계점수 계산
let summaryData = [];
let allEvaluationsData = []; // 전체 평가 데이터 저장 (일별 추이 계산용)

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
            
            // criteria에서 자기평가 음수 점수 정보 추출
            let actualScore = parseFloat(score.score || 0);
            const criteria = score.criteria || '';
            const selfEvalMatch = criteria.match(/\[자기평가:\s*(-?\d+)점\]/);
            if (selfEvalMatch) {
                // 자기평가 음수 점수가 있는 경우 원래 음수 점수 사용
                actualScore = parseFloat(selfEvalMatch[1]);
            }
            
            summary[peerName].totalScore += actualScore;
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
        
        // 이미지 경로 결정
        const imagePath = getImagePath(item.name);
        
        summaryCard.innerHTML = `
            <div class="summary-header">
                <div class="peer-info-with-image">
                    <label class="peer-checkbox-label">
                        <input type="checkbox" class="peer-checkbox" data-peer-name="${item.name}" value="${item.name}">
                        <span class="checkbox-custom"></span>
                    </label>
                    ${imagePath ? `<img src="${imagePath}" alt="${item.name}" class="peer-image" data-image-src="${imagePath}" data-peer-name="${item.name}">` : ''}
                    <div class="peer-name-large">${item.name}</div>
                </div>
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
                <button class="btn-trend" data-peer-name="${item.name}">
                    📈 개별 추이 보기
                </button>
            </div>
        `;
        summaryList.appendChild(summaryCard);
        
        // 이미지 클릭 이벤트 추가
        if (imagePath) {
            const peerImage = summaryCard.querySelector('.peer-image');
            if (peerImage) {
                peerImage.style.cursor = 'pointer';
                peerImage.addEventListener('click', function() {
                    openImageModal(this.src, this.getAttribute('data-peer-name'));
                });
            }
        }
        
        // 추이 버튼 클릭 이벤트 추가
        const trendBtn = summaryCard.querySelector('.btn-trend');
        if (trendBtn) {
            trendBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const peerName = this.getAttribute('data-peer-name');
                showTrendChart([peerName]);
            });
        }
    });
    
    // 비교 컨트롤 표시
    document.getElementById('compareControls').style.display = 'flex';
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

// 탭 전환 함수
function switchView(viewType) {
    const listTab = document.querySelector('.tab-btn[data-view="list"]');
    const summaryTab = document.querySelector('.tab-btn[data-view="summary"]');
    const resultsDiv = document.getElementById('results');
    const summaryDiv = document.getElementById('summaryResults');
    const copyBtn = document.getElementById('copyBtn');

    if (viewType === 'list') {
        listTab.classList.add('active');
        summaryTab.classList.remove('active');
        resultsDiv.style.display = 'block';
        summaryDiv.style.display = 'none';
        copyBtn.style.display = 'none';
    } else {
        summaryTab.classList.add('active');
        listTab.classList.remove('active');
        resultsDiv.style.display = 'none';
        summaryDiv.style.display = 'block';
        copyBtn.style.display = 'block';
        displaySummary();
    }
}

// 평가 결과 복사 함수
async function copyResults() {
    if (!summaryData || summaryData.length === 0) {
        showCopyMessage('복사할 데이터가 없습니다.', false);
        return;
    }

    try {
        // 현재 페이지 URL
        const pageUrl = window.location.href;

        // 이름별 누계점수 텍스트 생성
        let copyText = '=== 평가 결과 (이름별 누계) ===\n\n';
        
        summaryData.forEach((item, index) => {
            copyText += `${index + 1}. ${item.name}\n`;
            copyText += `   총점: ${item.totalScore}점\n`;
            copyText += `   평가 횟수: ${item.count}회\n`;
            if (index < summaryData.length - 1) {
                copyText += '\n';
            }
        });

        copyText += `\n\n페이지 URL: ${pageUrl}`;
        copyText += `\n생성일시: ${new Date().toLocaleString('ko-KR')}`;

        // 클립보드에 복사
        await navigator.clipboard.writeText(copyText);
        
        // 복사 성공 메시지
        showCopyMessage('결과가 클립보드에 복사되었습니다!', true);
        
        // 버튼 텍스트 일시 변경
        const copyBtnText = document.getElementById('copyBtnText');
        const originalText = copyBtnText.textContent;
        copyBtnText.textContent = '복사 완료!';
        
        setTimeout(() => {
            copyBtnText.textContent = originalText;
        }, 2000);

    } catch (err) {
        console.error('복사 실패:', err);
        showCopyMessage('복사에 실패했습니다. 다시 시도해주세요.', false);
    }
}

// 복사 메시지 표시 함수
function showCopyMessage(message, isSuccess) {
    // 기존 메시지 제거
    const existingMessage = document.getElementById('copyMessage');
    if (existingMessage) {
        existingMessage.remove();
    }

    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.id = 'copyMessage';
    messageDiv.className = isSuccess ? 'copy-success' : 'copy-error';
    messageDiv.textContent = message;
    
    // 메뉴 아래에 메시지 추가
    const viewTabs = document.getElementById('viewTabs');
    viewTabs.parentNode.insertBefore(messageDiv, viewTabs.nextSibling);

    // 3초 후 메시지 제거
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// 이미지 모달 열기
function openImageModal(imageSrc, peerName) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    modalImage.src = imageSrc;
    modalCaption.textContent = peerName || '이미지';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // 스크롤 방지
}

// 이미지 모달 닫기
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // 스크롤 복원
}

// 모달 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    const imageModal = document.getElementById('imageModal');
    const imageCloseBtn = document.querySelector('.modal-close');
    
    // 이미지 모달 닫기 버튼 클릭
    if (imageCloseBtn) {
        imageCloseBtn.addEventListener('click', closeImageModal);
    }
    
    // 이미지 모달 배경 클릭 시 닫기
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            closeImageModal();
        }
    });
    
    // 차트 모달 이벤트 리스너
    const chartModal = document.getElementById('chartModal');
    const chartCloseBtn = document.querySelector('.chart-modal-close');
    
    // 차트 모달 닫기 버튼 클릭
    if (chartCloseBtn) {
        chartCloseBtn.addEventListener('click', closeChartModal);
    }
    
    // 차트 모달 배경 클릭 시 닫기
    chartModal.addEventListener('click', function(e) {
        if (e.target === chartModal) {
            closeChartModal();
        }
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (imageModal.style.display === 'flex') {
                closeImageModal();
            }
            if (chartModal.style.display === 'flex') {
                closeChartModal();
            }
        }
    });
});

// 일별 누계 점수 계산 함수
function calculateDailyTrend(peerName) {
    // 날짜별로 그룹화
    const dailyData = {};
    
    allEvaluationsData.forEach(evaluation => {
        const evaluationDate = new Date(evaluation.created_at);
        const dateKey = evaluationDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
        
        evaluation.scores.forEach(score => {
            if (score.peers?.name === peerName) {
                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = {
                        date: dateKey,
                        totalScore: 0,
                        count: 0
                    };
                }
                
                // criteria에서 자기평가 음수 점수 정보 추출
                let actualScore = parseFloat(score.score || 0);
                const criteria = score.criteria || '';
                const selfEvalMatch = criteria.match(/\[자기평가:\s*(-?\d+)점\]/);
                if (selfEvalMatch) {
                    actualScore = parseFloat(selfEvalMatch[1]);
                }
                
                dailyData[dateKey].totalScore += actualScore;
                dailyData[dateKey].count += 1;
            }
        });
    });
    
    // 날짜순으로 정렬
    const sortedDates = Object.keys(dailyData).sort();
    
    // 누계 점수 계산
    let cumulativeScore = 0;
    const trendData = sortedDates.map(dateKey => {
        cumulativeScore += dailyData[dateKey].totalScore;
        return {
            date: dateKey,
            dailyScore: dailyData[dateKey].totalScore,
            cumulativeScore: cumulativeScore,
            count: dailyData[dateKey].count
        };
    });
    
    return trendData;
}

// 색상 팔레트 (여러 사람 비교 시 사용)
const colorPalette = [
    { border: '#667eea', fill: 'rgba(102, 126, 234, 0.1)' },
    { border: '#764ba2', fill: 'rgba(118, 75, 162, 0.1)' },
    { border: '#f093fb', fill: 'rgba(240, 147, 251, 0.1)' },
    { border: '#4facfe', fill: 'rgba(79, 172, 254, 0.1)' },
    { border: '#00f2fe', fill: 'rgba(0, 242, 254, 0.1)' },
    { border: '#43e97b', fill: 'rgba(67, 233, 123, 0.1)' },
    { border: '#fa709a', fill: 'rgba(250, 112, 154, 0.1)' },
    { border: '#fee140', fill: 'rgba(254, 225, 64, 0.1)' },
    { border: '#30cfd0', fill: 'rgba(48, 207, 208, 0.1)' },
    { border: '#330867', fill: 'rgba(51, 8, 103, 0.1)' }
];

// 추이 차트 표시 함수 (여러 사람 지원)
let trendChartInstance = null;

function showTrendChart(peerNames) {
    if (!Array.isArray(peerNames)) {
        peerNames = [peerNames];
    }
    
    if (peerNames.length === 0) {
        alert('비교할 사람을 선택해주세요.');
        return;
    }
    
    // 모든 날짜 수집
    const allDates = new Set();
    const allTrendData = {};
    
    peerNames.forEach(peerName => {
        const trendData = calculateDailyTrend(peerName);
        if (trendData.length === 0) {
            return;
        }
        allTrendData[peerName] = trendData;
        trendData.forEach(item => allDates.add(item.date));
    });
    
    if (Object.keys(allTrendData).length === 0) {
        alert('선택한 사람들의 평가 데이터가 없습니다.');
        return;
    }
    
    // 날짜 정렬
    const sortedDates = Array.from(allDates).sort();
    
    // 모달 열기
    const chartModal = document.getElementById('chartModal');
    const chartModalTitle = document.getElementById('chartModalTitle');
    
    if (peerNames.length === 1) {
        chartModalTitle.textContent = `${peerNames[0]}님의 일별 누계 점수 추이`;
    } else {
        chartModalTitle.textContent = `${peerNames.length}명의 일별 누계 점수 추이 비교`;
    }
    
    chartModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // 차트 데이터 준비
    const labels = sortedDates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    
    const datasets = [];
    
    peerNames.forEach((peerName, index) => {
        if (!allTrendData[peerName]) return;
        
        const trendData = allTrendData[peerName];
        const cumulativeDataMap = {};
        const dailyDataMap = {};
        trendData.forEach(item => {
            cumulativeDataMap[item.date] = item.cumulativeScore;
            dailyDataMap[item.date] = item.dailyScore;
        });
        
        const cumulativeScores = sortedDates.map(date => {
            // 해당 날짜의 누계 점수 찾기 (없으면 이전 값 사용)
            if (cumulativeDataMap[date] !== undefined) {
                return cumulativeDataMap[date];
            }
            // 이전 날짜의 마지막 값 찾기
            const trendDates = trendData.map(t => t.date).sort();
            const lastDateBefore = trendDates.filter(d => d <= date).pop();
            if (lastDateBefore) {
                return cumulativeDataMap[lastDateBefore] || null;
            }
            return null;
        });
        
        const color = colorPalette[index % colorPalette.length];
        
        // 누계 점수 데이터셋
        datasets.push({
            label: `${peerName} (누계)`,
            data: cumulativeScores,
            borderColor: color.border,
            backgroundColor: color.fill,
            borderWidth: 3,
            fill: peerNames.length === 1, // 1명일 때만 채우기
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: color.border,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            spanGaps: true // null 값 건너뛰기
        });
        
        // 개별 추이일 때 일일 점수도 추가
        if (peerNames.length === 1) {
            const dailyScores = sortedDates.map(date => {
                if (dailyDataMap[date] !== undefined) {
                    return dailyDataMap[date];
                }
                return null;
            });
            
            // 일일 점수용 색상 (보라색 계열)
            const dailyColor = { border: '#764ba2', fill: 'rgba(118, 75, 162, 0.1)' };
            
            datasets.push({
                label: `${peerName} (일일)`,
                data: dailyScores,
                borderColor: dailyColor.border,
                backgroundColor: dailyColor.fill,
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: dailyColor.border,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                borderDash: [5, 5], // 점선
                spanGaps: true
            });
        }
    });
    
    // 기존 차트가 있으면 제거
    const chartCanvas = document.getElementById('trendChart');
    if (trendChartInstance) {
        trendChartInstance.destroy();
    }
    
    // 새 차트 생성
    const ctx = chartCanvas.getContext('2d');
    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        afterLabel: function(context) {
                            // 개별 추이일 때 일일 점수에 평가 횟수 표시
                            if (peerNames.length === 1 && context.datasetIndex === 1) {
                                const dateIndex = context.dataIndex;
                                const date = sortedDates[dateIndex];
                                const trendData = allTrendData[peerNames[0]];
                                if (trendData) {
                                    const item = trendData.find(t => t.date === date);
                                    if (item) {
                                        return `평가 횟수: ${item.count}회`;
                                    }
                                }
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return value + '점';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// 차트 모달 닫기
function closeChartModal() {
    const chartModal = document.getElementById('chartModal');
    chartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    if (trendChartInstance) {
        trendChartInstance.destroy();
        trendChartInstance = null;
    }
}

// 페이지 로드 시 자동으로 데이터 불러오기
window.addEventListener('DOMContentLoaded', loadResults);

// 선택된 사람들의 추이 비교
function compareSelectedPeers() {
    const checkboxes = document.querySelectorAll('.peer-checkbox:checked');
    const selectedPeers = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedPeers.length === 0) {
        alert('비교할 사람을 최소 1명 이상 선택해주세요.');
        return;
    }
    
    showTrendChart(selectedPeers);
}

// 전체 선택/해제
function selectAllPeers() {
    const checkboxes = document.querySelectorAll('.peer-checkbox');
    checkboxes.forEach(cb => cb.checked = true);
}

function deselectAllPeers() {
    const checkboxes = document.querySelectorAll('.peer-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
}

// 탭 버튼 및 복사 버튼 이벤트 리스너 (이벤트 위임 사용)
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-btn')) {
        const viewType = e.target.getAttribute('data-view');
        if (viewType) {
            switchView(viewType);
        }
    } else if (e.target.id === 'copyBtn' || e.target.closest('#copyBtn')) {
        copyResults();
    } else if (e.target.id === 'compareBtn' || e.target.closest('#compareBtn')) {
        compareSelectedPeers();
    } else if (e.target.id === 'selectAllBtn' || e.target.closest('#selectAllBtn')) {
        selectAllPeers();
    } else if (e.target.id === 'deselectAllBtn' || e.target.closest('#deselectAllBtn')) {
        deselectAllPeers();
    }
});

