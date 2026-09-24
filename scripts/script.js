document.addEventListener('DOMContentLoaded', () => {
  const quizContainer = document.getElementById('quizContainer');
  const loadingState = document.getElementById('loadingState');
  const submitBtn = document.getElementById('submitBtn');
  const resultModal = document.getElementById('resultModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const finalScoreEl = document.getElementById('finalScore');
  const scoreMessageEl = document.getElementById('scoreMessage');

  let examData = null;
  let totalScore = 0;
  let isSubmitted = false;

  // Random btn
  document.getElementById('randomBtn')?.addEventListener('click', () => {
    if (!examData) return;
    isSubmitted = false;
    totalScore = 0;
    renderExam();
  });

  // Utility to shuffle arrays
  function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  // Fetch data
  fetch('data/data.json')
    .then(response => response.json())
    .then(data => {
      examData = data;
      renderExam();
    })
    .catch(error => {
      console.error('Error loading data:', error);
      loadingState.innerHTML = '<p style="color:red">Failed to load exam data. Please try again later.</p>';
    });

  function renderExam() {
    loadingState.style.display = 'none';
    quizContainer.innerHTML = '';
    
    let globalQuestionNumber = 1;

    const isSectionChecked = (val) => {
        const cb = document.querySelector(`.filters-grid input[value="${val}"]`);
        return cb ? cb.checked : true;
    };

    // 1. Vocabulary: 10 random from 20
    if (isSectionChecked('vocab')) {
      const vocabSelected = shuffle([...examData.vocabulary]).slice(0, 10);
      renderSection('Vocabulary & Grammar', vocabSelected, 'vocab', globalQuestionNumber);
      globalQuestionNumber += 10;
    }

    // 2. Signs: 5 random from 10
    if (isSectionChecked('signs')) {
      const signsSelected = shuffle([...examData.signs]).slice(0, 5);
      renderSection('Signs', signsSelected, 'signs', globalQuestionNumber);
      globalQuestionNumber += 5;
    }

    // 3. Reading: 1 random from 2
    if (isSectionChecked('reading')) {
      const readingSelected = shuffle([...examData.readingPassages]).slice(0, 1)[0];
      renderPassageSection('Reading Comprehension', readingSelected, 'reading', globalQuestionNumber);
      globalQuestionNumber += readingSelected.questions.length;
    }

    // 4. Cloze Text: fixed
    if (isSectionChecked('cloze')) {
      renderPassageSection('Cloze Text', examData.clozeText, 'cloze', globalQuestionNumber);
      globalQuestionNumber += examData.clozeText.questions.length;
    }

    // 5. Sentence Transformation: 5 random from 10
    if (isSectionChecked('sentence')) {
      const sentenceSelected = shuffle([...examData.sentenceTransformation]).slice(0, 5);
      renderTextSection('Sentence Transformation', sentenceSelected, 'sentence', globalQuestionNumber);
      globalQuestionNumber += 5;
    }

    // 6. Listening Fill Blanks
    if (isSectionChecked('list_fb')) {
      renderListeningFillBlanks('Listening: Fill in the Blanks', examData.listeningFillBlanks, 'list_fb', globalQuestionNumber);
      globalQuestionNumber += examData.listeningFillBlanks.questions.length;
    }

    // 7. Listening Choose ABC
    if (isSectionChecked('list_mc')) {
      examData.listeningChooseABC.forEach((task, index) => {
        renderListeningMultipleChoice(`Listening: Multiple Choice (Part ${index + 1})`, task, `list_mc_${index}`, globalQuestionNumber);
        globalQuestionNumber += task.questions.length;
      });
    }

    // 8. Listening True/False
    if (isSectionChecked('list_tf')) {
      examData.listeningTrueFalse.forEach((task, index) => {
        renderListeningMultipleChoice(`Listening: True/False (Part ${index + 1})`, task, `list_tf_${index}`, globalQuestionNumber);
        globalQuestionNumber += task.questions.length;
      });
    }

    submitBtn.style.display = 'inline-block';
  }

  // --- RENDERING HELPERS ---

  function renderSection(title, questions, prefix, startNumber) {
    const sectionHtml = document.createElement('div');
    sectionHtml.className = 'glass-panel';
    sectionHtml.innerHTML = `<h2 class="section-title">${title}</h2>`;
    
    questions.forEach((q, index) => {
      sectionHtml.appendChild(createMultipleChoiceBlock(q, prefix + '_' + q.id, startNumber + index));
    });

    quizContainer.appendChild(sectionHtml);
  }

  function renderPassageSection(title, passageData, prefix, startNumber) {
    const sectionHtml = document.createElement('div');
    sectionHtml.className = 'glass-panel';
    sectionHtml.innerHTML = `
      <h2 class="section-title">${title}</h2>
      ${passageData.title ? `<h3>${passageData.title}</h3>` : ''}
      <div class="reading-content">${passageData.content}</div>
    `;

    passageData.questions.forEach((q, index) => {
      sectionHtml.appendChild(createMultipleChoiceBlock(q, prefix + '_' + q.id, startNumber + index));
    });

    quizContainer.appendChild(sectionHtml);
  }

  function renderTextSection(title, questions, prefix, startNumber) {
    const sectionHtml = document.createElement('div');
    sectionHtml.className = 'glass-panel';
    sectionHtml.innerHTML = `<h2 class="section-title">${title}</h2>`;
    
    questions.forEach((q, index) => {
      sectionHtml.appendChild(createTextBlock(q, prefix + '_' + q.id, startNumber + index));
    });

    quizContainer.appendChild(sectionHtml);
  }

  function renderListeningFillBlanks(title, taskData, prefix, startNumber) {
    const sectionHtml = document.createElement('div');
    sectionHtml.className = 'glass-panel';
    
    let audioHtml = '';
    if (taskData.audio) {
      audioHtml = `<div class="media-container"><audio controls src="${taskData.audio}"></audio></div>`;
    }

    sectionHtml.innerHTML = `
      <h2 class="section-title">${title}</h2>
      ${audioHtml}
      <div class="listening-content">${taskData.content}</div>
    `;

    taskData.questions.forEach((q, index) => {
      const qData = { ...q, question: `Blank (${index + 1})` };
      sectionHtml.appendChild(createTextBlock(qData, prefix + '_' + q.id, startNumber + index));
    });

    quizContainer.appendChild(sectionHtml);
  }

  function renderListeningMultipleChoice(title, taskData, prefix, startNumber) {
    const sectionHtml = document.createElement('div');
    sectionHtml.className = 'glass-panel';
    
    let audioHtml = '';
    if (taskData.audio) {
      audioHtml = `<div class="media-container"><audio controls src="${taskData.audio}"></audio></div>`;
    }

    sectionHtml.innerHTML = `
      <h2 class="section-title">${title}</h2>
      ${audioHtml}
    `;

    taskData.questions.forEach((q, index) => {
      sectionHtml.appendChild(createMultipleChoiceBlock(q, prefix + '_' + q.id, startNumber + index));
    });

    quizContainer.appendChild(sectionHtml);
  }

  // --- COMPONENT CREATORS ---

  function createMultipleChoiceBlock(qData, name, number) {
    const block = document.createElement('div');
    block.className = 'question-block';
    block.dataset.answer = qData.answer;
    block.dataset.type = 'mc';

    let mediaHtml = '';
    if (qData.image_url) {
      mediaHtml = `<div class="media-container"><img src="${qData.image_url}" alt="Question Image" /></div>`;
    }

    const optionsHtml = qData.options.map((opt, i) => {
      // Extract the letter (A, B, C, D) for the value
      const letter = opt.substring(0, 1);
      return `
        <label class="option-label">
          <input type="radio" name="${name}" value="${letter}" />
          <span>${opt}</span>
        </label>
      `;
    }).join('');

    block.innerHTML = `
      <div class="question-text"><strong>${number}.</strong> ${qData.question}</div>
      ${mediaHtml}
      <div class="options-grid">
        ${optionsHtml}
      </div>
      <div class="correct-answer-text">Correct Answer: ${qData.answer}</div>
      <div class="hint-container">
        <button class="btn-hint" type="button">💡 Hint</button>
        <div class="hint-text">${qData.hint}</div>
      </div>
    `;

    // Event listeners
    const inputs = block.querySelectorAll('input[type="radio"]');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => {
        if (isSubmitted) return;
        checkAnswerMultipleChoice(block, e.target.value, qData.answer);
      });
    });

    setupHint(block);
    return block;
  }

  function createTextBlock(qData, name, number) {
    const block = document.createElement('div');
    block.className = 'question-block';
    block.dataset.answer = qData.answer;
    block.dataset.type = 'text';

    let inputHtml = '';
    if (qData.prefix) {
      inputHtml = `<div class="inline-input-group">
        <span class="input-prefix">${qData.prefix}</span>
        <input type="text" class="text-input" placeholder="Type your answer here..." name="${name}" />
      </div>`;
    } else {
      inputHtml = `<input type="text" class="text-input" placeholder="Type your answer here..." name="${name}" />`;
    }

    let correctAnswerDisplay = qData.prefix ? `${qData.prefix} ${qData.answer}` : qData.answer;

    block.innerHTML = `
      <div class="question-text"><strong>${number}.</strong> ${qData.question}</div>
      ${inputHtml}
      <div class="correct-answer-text">Correct Answer: ${correctAnswerDisplay}</div>
      <div class="hint-container">
        <button class="btn-hint" type="button">💡 Hint</button>
        <div class="hint-text">${qData.hint}</div>
      </div>
    `;

    const input = block.querySelector('input');
    input.addEventListener('blur', (e) => {
      if (isSubmitted) return;
      if (e.target.value.trim() !== '') {
        checkAnswerText(block, e.target.value, qData.answer);
      }
    });
    
    // Also check on enter key
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !isSubmitted) {
        input.blur();
      }
    });

    setupHint(block);
    return block;
  }

  function setupHint(block) {
    const hintBtn = block.querySelector('.btn-hint');
    const hintText = block.querySelector('.hint-text');
    hintBtn.addEventListener('click', () => {
      if (hintText.style.display === 'block') {
        hintText.style.display = 'none';
      } else {
        hintText.style.display = 'block';
      }
    });
  }

  // --- CHECKING LOGIC ---

  function checkAnswerMultipleChoice(block, selectedValue, correctAnswer) {
    const optionLabels = block.querySelectorAll('.option-label');
    optionLabels.forEach(label => {
      label.classList.remove('correct-option', 'incorrect-option');
    });

    const selectedLabel = block.querySelector(`input[value="${selectedValue}"]`)?.closest('.option-label');
    const correctLabel = block.querySelector(`input[value="${correctAnswer}"]`)?.closest('.option-label');
    const hintText = block.querySelector('.hint-text');

    if (selectedValue === correctAnswer) {
      block.dataset.isCorrect = "true";
      if (selectedLabel) selectedLabel.classList.add('correct-option');
      if (hintText) hintText.style.display = 'none';
    } else {
      block.dataset.isCorrect = "false";
      if (selectedLabel) selectedLabel.classList.add('incorrect-option');
      if (correctLabel) correctLabel.classList.add('correct-option');
      if (hintText) hintText.style.display = 'block';
    }
  }

  function checkAnswerText(block, userInput, correctAnswer) {
    block.classList.remove('correct', 'incorrect');
    
    const normalizedInput = userInput.replace(/[.,!?]/g, '').trim().toLowerCase();
    const normalizedAnswer = correctAnswer.replace(/[.,!?]/g, '').trim().toLowerCase();
    const hintText = block.querySelector('.hint-text');
    const correctAnswerText = block.querySelector('.correct-answer-text');
    
    if (normalizedInput === normalizedAnswer) {
      block.classList.add('correct');
      block.dataset.isCorrect = "true";
      if (hintText) hintText.style.display = 'none';
      if (correctAnswerText) correctAnswerText.style.display = 'none';
    } else {
      block.classList.add('incorrect');
      block.dataset.isCorrect = "false";
      if (hintText) hintText.style.display = 'block';
      if (correctAnswerText) correctAnswerText.style.display = 'block';
    }
  }

  // --- SUBMIT LOGIC ---

  submitBtn.addEventListener('click', () => {
    isSubmitted = true;
    let correctCount = 0;
    const blocks = document.querySelectorAll('.question-block');
    
    blocks.forEach(block => {
      const type = block.dataset.type;
      const correctAnswer = block.dataset.answer;
      let isCorrect = false;

      // Un-answered questions become incorrect
      if (type === 'mc') {
        const checked = block.querySelector('input:checked');
        if (checked && checked.value === correctAnswer) {
          isCorrect = true;
        }
      } else {
        const inputVal = block.querySelector('input').value.replace(/[.,!?]/g, '').trim().toLowerCase();
        if (inputVal === correctAnswer.replace(/[.,!?]/g, '').trim().toLowerCase()) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        correctCount++;
        if (type === 'mc') {
          const checked = block.querySelector('input:checked');
          if (checked) checked.closest('.option-label').classList.add('correct-option');
        } else {
          block.classList.add('correct');
          block.classList.remove('incorrect');
        }
      } else {
        if (type === 'mc') {
          const checked = block.querySelector('input:checked');
          if (checked) checked.closest('.option-label').classList.add('incorrect-option');
          const correctLabel = block.querySelector(`input[value="${correctAnswer}"]`)?.closest('.option-label');
          if (correctLabel) correctLabel.classList.add('correct-option');
        } else {
          block.classList.add('incorrect');
          block.classList.remove('correct');
          // Show correct answer text
          block.querySelector('.correct-answer-text').style.display = 'block';
        }
      }

      // Disable inputs
      const inputs = block.querySelectorAll('input');
      inputs.forEach(input => input.disabled = true);
    });

    totalScore = correctCount;
    const totalQuestions = blocks.length;
    
    // Show alert (requested in prompt)
    alert(`Exam submitted! Your score is: ${totalScore} / ${totalQuestions}`);

    // Show modal
    finalScoreEl.textContent = totalScore;
    const totalSpan = document.querySelector('.score-circle .total');
    if (totalSpan) totalSpan.textContent = `/ ${totalQuestions}`;

    const percentage = totalQuestions > 0 ? totalScore / totalQuestions : 0;
    if (percentage >= 0.76) {
      scoreMessageEl.textContent = 'Excellent work! You are well prepared for the B1 exam.';
    } else if (percentage >= 0.53) {
      scoreMessageEl.textContent = 'Good effort! Review your mistakes to improve further.';
    } else {
      scoreMessageEl.textContent = 'Keep practicing! Review the answers below to learn from your mistakes.';
    }
    
    resultModal.classList.add('active');
    submitBtn.style.display = 'none';
  });

  closeModalBtn.addEventListener('click', () => {
    resultModal.classList.remove('active');
    // Smooth scroll to top to review answers
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

});
