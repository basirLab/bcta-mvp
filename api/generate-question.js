<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>BCTA 질문 답변</title>
  <style>
    body {
      font-family: "Segoe UI", sans-serif;
      margin: 40px;
    }
    textarea {
      width: 100%;
      height: 120px;
      font-size: 1rem;
      padding: 10px;
    }
    button {
      margin-top: 20px;
      padding: 8px 16px;
      font-size: 1rem;
    }
    .question-box {
      border-left: 4px solid #4caf50;
      padding-left: 16px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>✏️ 질문에 답해주세요</h1>

  <div class="question-box">
    <p id="questionText">질문을 불러오는 중입니다...</p>
    <p id="tagInfo" style="font-size: 0.9rem; color: gray;"></p>
  </div>

  <textarea id="answerInput" placeholder="여기에 답변을 작성하세요..."></textarea>
  <br>
  <button onclick="submitAnswer()">제출하기</button>

  <script>
    // 질문 정보 불러오기
    const questionId = localStorage.getItem("currentQuestionId");
    const questionData = JSON.parse(localStorage.getItem(`question-${questionId}`));
    document.getElementById("questionText").textContent = questionData.question;
    document.getElementById("tagInfo").textContent = `태그: ${questionData.tag}`;

    async function submitAnswer() {
      const answer = document.getElementById("answerInput").value;
      if (!answer) {
        alert("답변을 입력해주세요.");
        return;
      }

      const payload = {
        evaluation: questionData.tag,
        question: questionData.question,
        answer: answer
      };

      try {
        const response = await fetch("/api/evaluate-answer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
          alert("GPT 평가 실패: " + result.error || result.detail);
          console.error(result.raw || result.detail);
          return;
        }

        // 결과 로컬스토리지에 저장
        localStorage.setItem(`result-${questionId}`, JSON.stringify(result.scores));

        // 완료 알림 및 리디렉션
        alert("답변이 제출되었습니다. 결과를 확인하세요.");
        window.location.href = "result.html";

      } catch (err) {
        console.error("요청 실패:", err);
        alert("서버 요청 중 오류가 발생했습니다.");
      }
    }
  </script>
</body>
</html>
