import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const { answers, evaluationType } = req.body;

    if (!answers || !evaluationType) {
      return res.status(400).json({ error: "answers and evaluationType are required." });
    }

    // 루브릭 불러오기
    const rubricPath = path.resolve(process.cwd(), 'rubric.json');
    const rubricData = JSON.parse(fs.readFileSync(rubricPath, 'utf-8'));
    const selectedRubric = rubricData[evaluationType];

    if (!selectedRubric) {
      return res.status(400).json({ error: "Invalid evaluation type." });
    }

    // 평가 항목 코드 리스트 (예: CT1 ~ CT6)
    const rubricCodes = selectedRubric.map(r => r.code);

    // 각 답변을 평가
    const results = [];
    for (let i = 0; i < answers.length; i++) {
      const { question, answer } = answers[i];

      const scores = {};
      const reasoning = {};

      for (const rubric of selectedRubric) {
        const prompt = buildPrompt(answer, rubric);

        const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': Bearer ${process.env.OPENAI_API_KEY},
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }]
          })
        });

        const json = await gptResponse.json();
        const gptContent = json.choices?.[0]?.message?.content?.trim();

        const levelMatch = gptContent.match(/^[1-4]/); // 점수 추출
        const level = levelMatch ? parseInt(levelMatch[0]) : 0;

        scores[${rubric.code} ${rubric.kr_name}] = level;
        reasoning[${rubric.code} ${rubric.kr_name}] = rubric.levels[level] || "응답 분석 불가";
      }

      results.push({
        question,
        answer,
        scores,
        reasoning,
        feedback: generateFeedback(scores) // 간단한 총평 생성
      });
    }

    res.status(200).json({ result: results });

  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: '서버 오류 또는 GPT 호출 실패' });
  }
}

// 개별 프롬프트 구성 함수
function buildPrompt(userAnswer, rubric) {
  const rubricLevels = Object.entries(rubric.levels)
    .map(([level, desc]) => ${level}. ${desc}).join('\n');

  return 
사용자 답변: "${userAnswer}"

"${rubric.code}: ${rubric.kr_name}"을 기준으로 판단할 때, 다음 중 어느 수준에 해당하나요?

${rubricLevels}

가장 적절한 번호 (1~4)만 숫자로 답하세요.
  .trim();
}

// 총평 생성 함수 (간단 버전)
function generateFeedback(scoreObj) {
  const values = Object.values(scoreObj);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg >= 3.5) return "전반적으로 매우 우수한 사고력을 보였습니다.";
  if (avg >= 2.5) return "기본적인 사고는 가능하나 개선 여지가 있습니다.";
  return "사고 구조에 대한 명확한 보완이 필요합니다.";
}
