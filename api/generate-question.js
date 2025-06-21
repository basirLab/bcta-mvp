export default async function handler(req, res) {
  const { evaluation, target } = req.body;

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID;

const questionSet = {
  CT: "- CT-q1 판단형: 1개\n- CT-q2 인과분석형: 2개\n- CT-q3 비교대조형: 1개\n- CT-q4 추론확장형: 2개\n- CT-q5 사례적용형: 1개\n- CT-q6 자기조절형: 2개",
  AT: "- AT-q1 주장 생성형: 2개\n- AT-q2 논거 정당화형: 2개\n- AT-q3 반박 설계형: 1개\n- AT-q4 입장 전환형: 1개\n- AT-q5 감정 절제형: 1개\n- AT-q6 일관성 검토형: 2개",
  QT: "- QT-q1 사실확인형: 1개\n- QT-q2 개념 연결형: 2개\n- QT-q3 가설 설정형: 1개\n- QT-q4 반대입장 유도형: 1개\n- QT-q5 자기성찰형: 2개",
  DT: "- DT-q1 대화 반응형: 2개\n- DT-q2 맥락 파악형: 2개\n- DT-q3 갈등 조정형: 1개\n- DT-q4 다자 전략형: 1개\n- DT-q5 질문 확장형: 2개"
};

  const prompt = `
당신은 교육 전문가이자 인지심리 기반 평가 설계 AI입니다.

다음 조건에 따라 "${evaluation}" 유형의 질문을 생성하고, 질문마다 자동으로 아래 세 가지 태그를 지정하십시오:

- 사고기능
- 주제
- 정서

절대 인사말, 설명, 마크다운, 줄바꿈, 문장 등은 포함하지 마십시오.  
**오직 아래 JSON 형식만 출력하십시오.**

출력 예시 형식:
[
  {
    "question": "(질문 내용)",
    "type": "(예: CT-q1)",
    "tags": ["사고기능", "주제", "정서"]
  }
]

대상: ${target}  
질문 유형 및 개수:  
${questionSet[evaluation]}
`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: Bearer ${OPENAI_API_KEY},
        'Content-Type': 'application/json',
        'OpenAI-Project': OPENAI_PROJECT_ID,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenAI 응답 실패:", response.status, errorText);
      return res.status(500).json({ error: "OpenAI 응답 실패", message: errorText });
    }

    const json = await response.json();
    const result = json.choices?.[0]?.message?.content || '';

    // 📌 GPT 응답이 JSON 외 텍스트를 포함할 경우 보정
    const firstBracket = result.indexOf('[');
    const lastBracket = result.lastIndexOf(']');
    const jsonText = result.slice(firstBracket, lastBracket + 1);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("📛 JSON 파싱 오류:", e.message);
      return res.status(500).json({ error: "JSON 파싱 실패", result });
    }

    return res.status(200).json({ question: parsed });
  } catch (error) {
    console.error("🔥 GPT 호출 실패:", error.message);
    return res.status(500).json({ error: "GPT 호출 예외", message: error.message });
  }
}
