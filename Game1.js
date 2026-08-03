
  // 1. Cấu hình Firebase
  const firebaseConfig = {
    databaseURL: "https://heli-best-score-default-rtdb.asia-southeast1.firebasedatabase.app",
  };
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();

  let rankNoticeTimer = null;

  // 2. Các Hàm Mở/Đóng Popup Thông Báo Custom
  window.showRankNotice = function(message) {
    const popup = document.getElementById('rank-notice-popup');
    const msgEl = document.getElementById('rank-notice-msg');
    
    if (msgEl) msgEl.innerText = message;
    if (popup) popup.style.display = 'flex';

    if (rankNoticeTimer) clearTimeout(rankNoticeTimer);

    // Tự động đóng sau 5 giây
    rankNoticeTimer = setTimeout(() => {
        window.closeRankNotice();
    }, 5000);
  };

  window.closeRankNotice = function() {
    const popup = document.getElementById('rank-notice-popup');
    if (popup) popup.style.display = 'none';
    if (rankNoticeTimer) clearTimeout(rankNoticeTimer);
  };

  // 3. Các Hàm Mở/Đóng Popup Nhập Tên
  window.showScorePopup = function() {
    const finalScore = window.globalScore || 0;
    const popup = document.getElementById('score-popup');
    const scoreDisplay = document.getElementById('popup-score-text');
    const nameInput = document.getElementById('player-name');
    const btn = document.getElementById('submit-score-btn');
    
    if(popup) popup.style.display = 'flex';
    if(scoreDisplay) scoreDisplay.innerText = Math.floor(finalScore) + "km";
    
    if(nameInput) {
        nameInput.disabled = false;
    }
    
    if(btn) {
        btn.disabled = false;
        btn.innerText = "SAVE";
    }
  };

  window.closeScorePopup = function() {
    const popup = document.getElementById('score-popup');
    if(popup) popup.style.display = 'none';
  };

  // 4. Hàm gửi điểm chính thức
  window.submitScore = function() {
    const nameInput = document.getElementById('player-name');
    const btn = document.getElementById('submit-score-btn');
    let finalScore = window.globalScore || 0;
    const name = nameInput.value.trim();
    
    if (!name) {
        window.showRankNotice("You haven't entered a name!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Saving...";

    const newScoreRef = database.ref('leaderboard').push();
    newScoreRef.set({
        name: name,
        score: Math.floor(finalScore),
        timestamp: Date.now()
    })
    .then(() => {
        database.ref('leaderboard').once('value', (snapshot) => {
            let allScores = [];
            snapshot.forEach((child) => { allScores.push(child.val().score); });
            allScores.sort((a, b) => b - a);
            const rank = allScores.indexOf(Math.floor(finalScore)) + 1;

            let rankMessage = "";
            if (rank <= 100) {
                rankMessage = `GREAT! You are ranked #${rank} in the world!`;
            } else {
                rankMessage = `You are ranked #${rank}. Keep trying to get into top 100!`;
            }

            window.closeScorePopup();
            btn.disabled = false;
            btn.innerText = "SAVE";

            window.showRankNotice(rankMessage);

            if (typeof loadLeaderboard === "function") loadLeaderboard();
        });
    })
    .catch((err) => {
        btn.disabled = false;
        btn.innerText = "TRY AGAIN";
        window.showRankNotice("Error: " + err.message);
    });
  };

  // 5. Hàm load bảng xếp hạng Sidebar (đơn vị km)
  function loadLeaderboard() {
    const leaderboardRef = database.ref('leaderboard').orderByChild('score').limitToLast(100);
    leaderboardRef.on('value', (snapshot) => {
        let data = [];
        snapshot.forEach((child) => { data.push(child.val()); });
        data.sort((a, b) => b.score - a.score);
        
        let html = '';
        data.forEach((entry, index) => {
            let displayName = entry.name.length > 12 ? entry.name.substring(0, 10) + '..' : entry.name;
            html += `
                <div class='lb-entry'>
                    <span class='lb-rank'>${index + 1}.</span>
                    <span class='lb-name'>${displayName}</span>
                    <span class='lb-score'>${Math.floor(entry.score)} km</span>
                </div>`;
        });
        const listDiv = document.getElementById('leaderboard-list');
        if(listDiv) listDiv.innerHTML = html || "<div style='text-align:center;font-size:10px;'>Chưa có dữ liệu</div>";
    });
  }

  // 6. Khởi tạo sự kiện
document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
    
    // Ép xoay màn hình ngang khi nhấn "VÀO CHƠI"
    const enterFsBtn = document.getElementById('enter-fs-btn');
    if (enterFsBtn) {
        const lockLandscape = () => {
            const docElm = document.documentElement;
            if (docElm.requestFullscreen) docElm.requestFullscreen();
            else if (docElm.webkitRequestFullscreen) docElm.webkitRequestFullscreen();
            else if (docElm.msRequestFullscreen) docElm.msRequestFullscreen();

            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch((err) => {
                    console.log("Trình duyệt không hỗ trợ tự khóa xoay: ", err);
                });
            }
        };
        enterFsBtn.addEventListener('click', lockLandscape);
        enterFsBtn.addEventListener('touchend', lockLandscape);
    }
    
    // Xử lý nút mở Popup Lưu Điểm
    const saveTrigger = document.getElementById('save-score-trigger');
    if (saveTrigger) {
        const handleOpenPopup = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.showScorePopup();
        };
        saveTrigger.addEventListener('click', handleOpenPopup);
        saveTrigger.addEventListener('touchend', handleOpenPopup);
    }

    // Fix Input mượt mà trên Mobile
    const nameInput = document.getElementById('player-name');
    if (nameInput) {
        ['touchstart', 'touchend', 'mousedown', 'mouseup', 'click'].forEach(evt => {
            nameInput.addEventListener(evt, (e) => {
                e.stopPropagation();
            }, { passive: true });
        });

        nameInput.addEventListener('focus', () => {
            setTimeout(() => {
                nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    }

    // Xử lý nút LƯU LẠI trong Popup
    const submitBtn = document.getElementById('submit-score-btn');
    if (submitBtn) {
        const handleSubmit = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.submitScore();
        };
        submitBtn.addEventListener('click', handleSubmit);
        submitBtn.addEventListener('touchend', handleSubmit, { passive: false });
    }

    // Xử lý nút HỦY trong Popup
    const cancelBtn = document.getElementById('cancel-score-btn');
    if (cancelBtn) {
        const handleCancel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.closeScorePopup();
        };
        cancelBtn.addEventListener('click', handleCancel);
        cancelBtn.addEventListener('touchend', handleCancel, { passive: false });
    }

    // Xử lý nút CLOSE trong Popup Thông Báo Custom
    const closeNoticeBtn = document.getElementById('close-rank-notice-btn');
    if (closeNoticeBtn) {
        const handleCloseNotice = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.closeRankNotice();
        };
        closeNoticeBtn.addEventListener('click', handleCloseNotice);
        closeNoticeBtn.addEventListener('touchend', handleCloseNotice, { passive: false });
    }
    
    // Tap ra ngoài popup => ẩn bàn phím
    document.addEventListener('touchstart', (e) => {
        const popup = document.getElementById('score-popup');
        const input = document.getElementById('player-name');

        if (!popup || popup.style.display !== 'flex') return;

        if (!e.target.closest('#score-popup > div')) {
            if (input) {
                input.blur();
            }
        }
    }, { passive: true });   
    
});

