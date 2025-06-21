export default async function handler(req, res) {
  const { answers, scores, rubrics } = req.body;

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID;

  // 총평 요청 프롬프트 구성
  const rubricSummaryList = scores.map((score, index) => {
    const rubricDetail = Object.entries(score).map(([code, value]) => {
      const rubricText = rubrics[code] || '루브릭 없음';
      return `${index + 1}. [${code}] 점수: ${value} / 루브릭: ${rubricText}`;
    }).join('\n');
    return rubricDetail;
  }).join('\n\n');

  const finalPrompt = `
당신은 사고력 평가를 기반으로 총평을 생성하는 전문가입니다.

다음은 사용자의 각 항목별 점수와 루브릭입니다. 평가 코드를 기반으로 총평을 생성해주세요.
각 항목에 대한 평가 이유도 함께 작성하되, 간결하면서도 의미 있게 정리하세요.

${rubricSummaryList}

출력 형식 (JSON):
{
  "총평": "전체적인 피드백",
  "세부평가": {
    "CT1": "항목별 이유 및 피드백",
    "CT2": "...",
    ...
  }
}
`;

  const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Project': OPENAI_PROJECT_ID
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: finalPrompt }],
      temperature: 0.2
    }),
  });

  const json = await apiRes.json();
  const result = json.choices?.[0]?.message?.content || '';

  res.status(200).json({ result });
}
