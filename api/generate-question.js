export default async function handler(req, res) {
  const { evaluation, target } = req.body;

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID;

  const questionSet = {
    CT: {
      list: [
        { type: "판단", count: 1 },
        { type: "인과분석", count: 2 },
        { type: "비교대조", count: 1 },
        { type: "추론확장", count: 2 },
        { type: "사례적용", count: 1 },
        { type: "자기조절", count: 2 }
      ]
    }
    // AT, QT 등은 필요 시 추가 가능
  };

  const totalCount = questionSet[evaluation].list.reduce((sum, item) => sum + item.count, 0);
  const countInfo = questionSet[evaluation].list.map(i => `- ${i.type}: ${i.count}개`).join("\n");

  const prompt = `
다음은 "${target}" 학습자를 위한 **비판적 사고 평가(Critical Thinking) 질문** 생성 요청입니다.
이 요청은 학습자의 인지적 사고 역량을 평가할 목적으로 구성됩니다.

🧠 질문 목표
- 평가 유형: ${evaluation}
- 사고 기능: 판단, 인과분석, 비교대조, 추론확장, 사례적용, 자기조절
- 주제: 사회, 기술, 환경, 감정, 윤리, 인간관계 등
- 정서: 공감, 갈등, 비판, 호기심, 책임감, 혼란 등 유도 가능

🧾 생성 조건
- 총 ${totalCount}개의 질문을 생성해주세요.
${countInfo}

💡 출력 예시 형식 (JSON 배열로)
[
  {
    "question": "1/${totalCount}. 당신은 왜 그렇게 생각했나요?",
    "tags": {
      "질문분류": "판단",
      "사고기능": "추론",
      "주제": "의사결정",
      "정서": "책임감"
    }
  },
  ...
]

※ 질문은 반드시 **${target}의 이해 수준에 맞춰 친절하고 쉽우며 명확하게 작성**해주세요.
※ tag는 질문의 성격을 정확히 반영해야 합니다.
※ 출력은 반드시 **JSON 배열** 형태여야 합니다.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Project": OPENAI_PROJECT_ID
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 1.0
      })
    });

    const data = await response.json();
    let raw = data.choices?.[0]?.message?.content || "[]";

    // ```json 또는 ``` 제거
    raw = raw.replace(/```json|```/g, '').trim();

    let parsed = [];
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("OpenAI 응답 JSON 파싱 오류:", e, "\n원본문자:", raw);
      return res.status(200).json({ question: [] });
    }

    res.status(200).json({ question: parsed });

  } catch (error) {
    console.error("질문 생성 중 오류:", error);
    res.status(500).json({ error: "질문 생성 중 오류 발생" });
  }
}
