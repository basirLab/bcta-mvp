
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const { answers, evaluationType } = req.body;

    if (!answers || !evaluationType) {
      return res.status(400).json({ error: "answers and evaluationType are required." });
    }

    const rubricPath = path.resolve(process.cwd(), 'rubric.json');
    const rubricData = JSON.parse(fs.readFileSync(rubricPath, 'utf-8'));

    const selectedRubric = rubricData[evaluationType];
    if (!selectedRubric) {
      return res.status(400).json({ error: "Invalid evaluation type." });
    }

    const rubricText = selectedRubric.map(r => {
      return `- ${r.code} ${r.kr_name} (${r.name}):\n` + Object.entries(r.levels).map(([lvl, desc]) => `  [${lvl}] ${desc}`).join('\n');
    }).join('\n\n');

    const prompt = `
당신은 평가 전문가입니다. 아래는 학생의 답변 목록이며, 평가 기준은 ${evaluationType} 루브릭입니다.

각 항목에 대해 1~4점 점수를 매기고, 이유와 총평을 작성해주세요.

루브릭:
${rubricText}

답변 목록:
${JSON.stringify(answers, null, 2)}

출력 형식 예시:
[
  {
    "question": "...",
    "answer": "...",
    "scores": {
      "${evaluationType}1 항목명": 3,
      ...
    },
    "reasoning": {
      "${evaluationType}1 항목명": "설명",
      ...
    },
    "feedback": "총평"
  }
]
    `.trim();

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const json = await openaiRes.json();
    const result = json.choices?.[0]?.message?.content;

    if (!result) {
      throw new Error('GPT 응답이 없습니다.');
    }

    res.status(200).json({ result });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: '서버 오류 또는 GPT 호출 실패' });
  }
}
