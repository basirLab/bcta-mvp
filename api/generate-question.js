export default async function handler(req, res) {
  const { evaluation, target } = req.body;

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID;

  const questionSet = {
    CT: `- CT-q1 판단형: 1개\n- CT-q2 인과분석형: 2개\n- CT-q3 비교대조형: 1개\n- CT-q4 추론확장형: 2개\n- CT-q5 사례적용형: 1개\n- CT-q6 자기조절형: 2개`,
    AT: `- AT-q1 주장 생성형: 2개\n- AT-q2 논거 정당화형: 2개\n- AT-q3 반박 설계형: 1개\n- AT-q4 입장 전환형: 1개\n- AT-q5 감정 절제형: 1개\n- AT-q6 일관성 검토형: 2개`,
    QT: `- QT-q1 사실 질문형: 2개\n- QT-q2 예측 질문형: 2개\n- QT-q3 대안 탐색형: 2개\n- QT-q4 가정 기반 질문형: 2개\n- QT-q5 창의적 확장 질문형: 2개`
  };

  const prompt = `
다음은 "${target}"이라는 주제에 대해 ${evaluation} 유형의 질문을 생성하는 요청입니다.
다음 규칙에 따라 JSON 형식의 질문들을 생성해 주세요:

[출력 형식 예시]
[
  {
    "question": "당신은 왜 그 선택을 했나요?",
    "tags": {
      "사고기능": "CT-q1 판단형",
      "주제": "환경",
      "정서": "중립"
    }
  }
]

[질문 조건]
- 총 9문제 이상
- 각 문제는 하나의 사고기능 유형(CT, AT, QT 등)에만 속해야 함
- JSON 배열 형태로 출력
- 질문은 한국어로 작성
- 질문 내용은 대상 학습자의 나이(예: 초등학생, 중학생 등)에 맞게 쉽게 표현

[질문 세트 유형 설명]
${questionSet[evaluation]}

---

이제 위 조건을 바탕으로 "${target}"에 대한 질문을 생성해 주세요.
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
    const raw = data.choices?.[0]?.message?.content || "[]";

    let parsed = [];
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("OpenAI 응답 JSON 파싱 오류:", e);
      return res.status(200).json({ question: [] });
    }

    res.status(200).json({ question: parsed });

  } catch (error) {
    console.error("질문 생성 오류:", error);
    res.status(500).json({ error: "질문 생성 중 오류 발생" });
  }
}
