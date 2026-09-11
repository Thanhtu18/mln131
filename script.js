document.addEventListener('DOMContentLoaded', () => {
    // 1. Custom Cursor Logic
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    
    // Only run custom cursor on non-touch devices
    if (window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            // Dot follows exactly
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Outline follows with delay (handled by CSS transition partially, but we update pos here)
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Add hover effect to interactive elements
        const interactives = document.querySelectorAll('a, button, .glass-card, .scroll-indicator');
        
        interactives.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.width = '60px';
                cursorOutline.style.height = '60px';
                cursorOutline.style.backgroundColor = 'rgba(127, 90, 240, 0.1)';
            });
            
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.width = '40px';
                cursorOutline.style.height = '40px';
                cursorOutline.style.backgroundColor = 'transparent';
            });
        });
    }

    // 2. Audio Context for Sound Effects
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();

    // Unlock audio context on first click
    document.addEventListener('click', () => {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }, { once: true });

    function playPop() {
        if (audioCtx.state === 'suspended') return; // Cannot play yet
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    // 3. Scroll Reveal Animation Logic via Intersection Observer
    const revealElements = document.querySelectorAll('.reveal');

    const revealOptions = {
        threshold: 0.15, // Trigger when 15% of element is visible
        rootMargin: "0px 0px -50px 0px"
    };

    let isInitialLoad = true;
    
    setTimeout(() => {
        isInitialLoad = false;
    }, 1000);

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        let hasNewReveal = false;
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                if (!entry.target.classList.contains('active')) {
                    entry.target.classList.add('active');
                    hasNewReveal = true;
                }
            }
        });
        
        // Play sound if not initial load and something was revealed
        if (hasNewReveal && !isInitialLoad) {
            playPop();
        }
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });
    
    // Trigger immediately for items already in viewport on load
    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if(rect.top < window.innerHeight) {
                el.classList.add('active');
            }
        });
    }, 100);

    // --- MINI GAME Ô CHỮ ---
    const gameData = [
        { answer: "NHANDAN", question: "1. Chủ thể duy nhất nắm giữ toàn bộ quyền lực nhà nước trong nền dân chủ XHCN là ai?", offset: 0, keywordIndex: 4 },
        { answer: "PHAPLUAT", question: "2. Dân chủ phải đi đôi với kỷ luật, kỷ cương và được thể chế hóa bằng cái gì?", offset: 2, keywordIndex: 2 },
        { answer: "NHANUOC", question: "3. Dân chủ được thực hiện dựa vào sự ủng hộ của nhân dân và dựa vào ... xã hội chủ nghĩa.", offset: 1, keywordIndex: 3 },
        { answer: "CACHMANG", question: "4. Điền từ còn thiếu: '... là sự nghiệp của quần chúng.'", offset: 4, keywordIndex: 0 },
        { answer: "QUOCHOI", question: "5. Cơ quan quyền lực nhà nước cao nhất ở Việt Nam do nhân dân trực tiếp bầu ra là gì?", offset: 0, keywordIndex: 4 },
        { answer: "UYQUYEN", question: "6. Trong dân chủ gián tiếp, nhân dân giao quyền lực cho tổ chức đại diện thông qua hình thức gì?", offset: 4, keywordIndex: 0 }
    ];

    const board = document.getElementById('crossword-board');
    const gamePanel = document.getElementById('game-panel');
    const questionText = document.getElementById('question-text');
    const answerInput = document.getElementById('answer-input');
    const submitBtn = document.getElementById('submit-answer');
    const showBtn = document.getElementById('show-answer');
    const feedbackMsg = document.getElementById('feedback-msg');
    const victoryMsg = document.getElementById('victory-message');
    const revealBtn = document.getElementById('reveal-keyword-btn');
    
    let currentRowIndex = -1;
    let solvedRows = new Set();

    if (board) {
        // Render Board
        gameData.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'cw-row';
            rowDiv.dataset.index = rowIndex;

            const numDiv = document.createElement('div');
            numDiv.className = 'cw-row-num';
            numDiv.innerText = rowIndex + 1;
            rowDiv.appendChild(numDiv);

            // Calculate padding left
            for (let i = 0; i < row.offset; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'cw-cell empty';
                rowDiv.appendChild(emptyCell);
            }

            for (let i = 0; i < row.answer.length; i++) {
                const cell = document.createElement('div');
                cell.className = 'cw-cell hidden-cell';
                if (i === row.keywordIndex) {
                    cell.classList.add('keyword-cell');
                }
                cell.dataset.char = row.answer[i];
                cell.innerText = row.answer[i]; 
                rowDiv.appendChild(cell);
            }

            board.appendChild(rowDiv);

            // Add click event
            rowDiv.addEventListener('click', () => {
                // Reset states
                document.querySelectorAll('.cw-row').forEach(el => el.classList.remove('active-row'));
                rowDiv.classList.add('active-row');
                
                currentRowIndex = rowIndex;
                questionText.innerText = row.question;
                
                if (solvedRows.has(rowIndex)) {
                    answerInput.value = row.answer;
                    answerInput.disabled = true;
                    submitBtn.disabled = true;
                    if (showBtn) showBtn.disabled = true;
                    feedbackMsg.innerText = 'Câu này đã được giải mã!';
                    feedbackMsg.className = 'feedback-msg success';
                } else {
                    answerInput.value = '';
                    answerInput.disabled = false;
                    submitBtn.disabled = false;
                    if (showBtn) showBtn.disabled = false;
                    feedbackMsg.innerText = '';
                    feedbackMsg.className = 'feedback-msg';
                }
                
                gamePanel.classList.remove('hidden');
                
                if (!solvedRows.has(rowIndex)) {
                    answerInput.focus();
                }
                
                // Smooth scroll to panel if needed
                setTimeout(() => {
                    gamePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            });
        });

        // Handle answer submission
        const checkAnswer = () => {
            if (currentRowIndex === -1) return;
            // Xóa khoảng trắng và chuyển in hoa
            const userAns = answerInput.value.trim().toUpperCase().replace(/\s+/g, ''); 
            const correctAns = gameData[currentRowIndex].answer;

            if (userAns === correctAns) {
                // Correct
                feedbackMsg.innerText = 'Chính xác! 🎉';
                feedbackMsg.className = 'feedback-msg success';
                playPop();
                
                const activeRow = document.querySelector(`.cw-row[data-index='${currentRowIndex}']`);
                activeRow.classList.remove('active-row');
                activeRow.classList.add('solved');
                
                // Reveal letters
                activeRow.querySelectorAll('.cw-cell:not(.empty)').forEach(cell => {
                    cell.classList.remove('hidden-cell');
                });

                solvedRows.add(currentRowIndex);
                currentRowIndex = -1;
                
                setTimeout(() => {
                    gamePanel.classList.add('hidden');
                    // Check win condition
                    if (solvedRows.size === gameData.length) {
                        // Just wait for user to click the reveal button
                    }
                }, 1200);
            } else {
                // Incorrect
                feedbackMsg.innerText = 'Sai rồi! Thử lại nhé.';
                feedbackMsg.className = 'feedback-msg error';
                answerInput.value = '';
                answerInput.focus();
                
                // Shake effect for panel
                gamePanel.style.animation = 'none';
                gamePanel.offsetHeight; // trigger reflow
                gamePanel.style.animation = 'shake 0.4s';
            }
        };

        const showAnswer = () => {
            if (currentRowIndex === -1) return;
            const correctAns = gameData[currentRowIndex].answer;
            answerInput.value = correctAns;
            checkAnswer();
        };

        submitBtn.addEventListener('click', checkAnswer);
        if (showBtn) {
            showBtn.addEventListener('click', showAnswer);
        }
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });
        
        if (revealBtn) {
            revealBtn.addEventListener('click', () => {
                // Reveal keyword cells
                document.querySelectorAll('.keyword-cell').forEach(cell => {
                    cell.classList.remove('hidden-cell');
                });
                
                // Highlight the keyword
                board.classList.add('keyword-highlight');
                
                // Hide panel if it's open
                gamePanel.classList.add('hidden');
                
                revealBtn.classList.add('hidden');
                victoryMsg.classList.remove('hidden');
                
                setTimeout(playPop, 100);
                setTimeout(playPop, 300);
                setTimeout(playPop, 500);
            });
        }
    }
});
