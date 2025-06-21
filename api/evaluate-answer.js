// /api/evaluate-answer.js

export default async function handler(req, res) {
  const { evaluation, question, answer } = req.body;

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID;

  const prompt = `
다음은 학생의 답변입니다. 
각 사고 항목별로 1~5점 점수와 해당 점수에 대한 피드백을 JSON 형식으로 출력하세요.

-- 질문 --
${question}

-- 답변 --
${answer}

-- 평가 항목 --
${evaluation} (예: CT1, CT2, CT3, CT4, CT5, CT6)

-- 출력 형식 (JSON) --
{
  "CT1": { "score": 3, "feedback": "의도는 명확했으나 문맥 해석이 부족했습니다." },
  "CT2": { "score": 4, "feedback": "핵심 요소는 잘 분석했지만, 일부 항목은 연결이 부족합니다." },
  ...
}
`;

  try {
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Project": OPENAI_PROJECT_ID
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });

    const result = await apiRes.json();
    const text = result.choices[0].message.content;

    // JSON 파싱 시도
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({ error: "JSON 파싱 실패", raw: text });
    }

    return res.status(200).json({ scores: json });
  } catch (err) {
    return res.status(500).json({ error: "GPT 평가 실패", detail: err.message });
  }
}
