// 브라우저 콘솔에서 실행할 수 있는 스크립트
// Supabase 대시보드의 SQL Editor에서 직접 실행하세요

const sql = `
ALTER TABLE peers 
ADD COLUMN IF NOT EXISTS email TEXT;
`;

console.log('다음 SQL을 Supabase 대시보드의 SQL Editor에 복사하여 실행하세요:');
console.log('');
console.log(sql);
console.log('');
console.log('또는 아래 버튼을 클릭하여 자동으로 복사할 수 있습니다:');

// 클립보드에 복사하는 함수
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(sql);
        alert('SQL이 클립보드에 복사되었습니다!\nSupabase 대시보드의 SQL Editor에 붙여넣으세요.');
    } catch (err) {
        console.error('복사 실패:', err);
        console.log('수동으로 복사하세요:', sql);
    }
}

// 브라우저 환경에서만 실행
if (typeof window !== 'undefined') {
    const button = document.createElement('button');
    button.textContent = 'SQL 복사하기';
    button.style.cssText = 'padding: 10px 20px; font-size: 16px; cursor: pointer; background: #667eea; color: white; border: none; border-radius: 5px;';
    button.onclick = copyToClipboard;
    document.body.appendChild(button);
}

