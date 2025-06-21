export default async function handler(req, res) {
  const { question, answer, evaluation } = req.body;

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID;

  const rubric = {
    CT: ["CT1", "CT2", "CT3", "CT4", "CT5", "CT6"],
    AT: ["AT1", "AT2", "AT3", "AT4", "AT5", "AT6"],
    DT: ["DT1", "DT2", "DT3", "DT4", "DT5", "DT6"],
    QT: ["QT1", "QT2", "QT3", "QT4", "QT5", "QT6"]
  };

  const categoryCodes = rubric[evaluation] || [];

  const prompt = `
다음은 사용자의 질문과 답변입니다. 각 항목은 1~4점 루브릭 기준으로 점수만 JSON 형태로 응답해주세요.

[질문]
${question}

[답변]
${answer}

[평가 기준]
${categoryCodes.map(code => `- ${code}: 1~4점`).join("\n")}

[출력 형식 예시]
{ "${categoryCodes[0]}": 3, "${categoryCodes[1]}": 2, ... }

답변 없이 JSON만 출력해주세요.
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
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    }),
  });

  const json = await apiRes.json();

  let result;
  try {
    result = JSON.parse(json.choices?.[0]?.message?.content || '{}');
  } catch (e) {
    result = {};
  }

  res.status(200).json({
    scores: result
  });
}
