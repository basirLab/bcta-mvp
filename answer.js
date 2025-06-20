const chatContainer = document.getElementById('chat-container');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');

// 질문 리스트 샘플 (원래는 서버에서 받아오거나 로컬스토리지에서 불러올 것)
const storedQuestions = JSON.parse(localStorage.getItem("bcta_questions") || "[]");

const questions = storedQuestions.map(q => ({
  number: q.number || "",
  code: q.code || "",
  text: q.question || q.text || ""
}));

let currentIndex = 0;
const userAnswers = [];

function showQuestion(index) {
  const questionText = questions[index];
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble question';
  bubble.innerText = questionText;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function submitAnswer() {
  const answer = answerInput.value.trim();
  if (answer === '') return;

  // 사용자 답변 표시
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble answer';
  bubble.innerText = answer;
  chatContainer.appendChild(bubble);

  userAnswers.push({
    question: questions[currentIndex],
    answer: answer
  });

  currentIndex++;
  answerInput.value = '';

  // 다음 질문 or 완료
  if (currentIndex < questions.length) {
    setTimeout(() => {
      showQuestion(currentIndex);
    }, 500);
  } else {
    // 모든 질문 완료 → 결과 페이지로 이동 (또는 저장)
    localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
    window.location.href = 'result.html';
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

submitBtn.addEventListener('click', submitAnswer);
answerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') submitAnswer();
});

// 시작 시 첫 질문 표시
showQuestion(currentIndex);
