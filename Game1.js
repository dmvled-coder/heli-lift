// 1. Cấu hình Firebase
  const firebaseConfig = {
    databaseURL: "https://heli-best-score-default-rtdb.asia-southeast1.firebasedatabase.app",
  };
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();

  let rankNoticeTimer = null;

 window.requestLandscape = function() {
    const docElm = document.documentElement;
    if (docElm.requestFullscreen) {
        docElm.requestFullscreen().catch(() => {});
    } else if (docElm.webkitRequestFullscreen) {
        docElm.webkitRequestFullscreen();
    } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen();
    }

    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch((err) => {
            console.log("Trình duyệt không hỗ trợ tự khóa xoay: ", err);
        });
    }
}; 

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

// Hàm khôi phục nút bấm về trạng thái bình thường
function resetSaveButton() {
    const btn = document.getElementById('submit-score-btn');
    if (btn) {
        btn.disabled = false;
        btn.style.pointerEvents = 'auto'; // Cho phép bấm lại
        btn.style.opacity = '1';
        btn.innerText = "SAVE";
    }
}

window.submitScore = function() {
    const nameInput = document.getElementById('player-name');
    let finalScore = window.globalScore || 0;
    const name = nameInput.value.trim();
    
    if (!name) {
        window.showRankNotice("You haven't entered a name!");
        resetSaveButton(); // 🔓 Mở lại nút nếu chưa nhập tên
        return;
    }

    if (!navigator.onLine) {
        window.showRankNotice("No internet connection!");
        resetSaveButton(); // 🔓 Mở lại nút nếu không có mạng
        return;
    }

    const { b1, a1 } = endgameservice();
    const newScoreRef = database.ref('leaderboard').push();

    newScoreRef.set({
        name: name,
        score: Math.floor(finalScore),
        b1: b1,                  
        a1: a1,                
        timestamp: Date.now()
    })
    .then(() => {
        database.ref('leaderboard').once('value', (snapshot) => {
            let allScores = [];
            snapshot.forEach((child) => { allScores.push(child.val().score); });
            allScores.sort((a, b) => b - a);
            const rank = allScores.indexOf(Math.floor(finalScore)) + 1;

            let rankMessage = (rank <= 100) 
                ? `GREAT! You are ranked #${rank} in the world!`
                : `You are ranked #${rank}. Keep trying to get into top 100!`;

            window.closeScorePopup();
            resetSaveButton(); // 🔓 Mở lại cho lần sau
          
            const saveTrigger = document.getElementById('save-score-trigger');
            if (saveTrigger) saveTrigger.style.display = 'none';
          
            window.showRankNotice(rankMessage);
            if (typeof loadLeaderboard === "function") loadLeaderboard();
        });
    })
    .catch((err) => {
        resetSaveButton(); // 🔓 Mở lại nếu lưu thất bại
        const btn = document.getElementById('submit-score-btn');
        if (btn) btn.innerText = "TRY AGAIN";
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

    
    // Ép xoay màn hình ngang khi nhấn "VÀO CHƠI"
document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
    
    // Tự động thử xoay ngang nếu phát hiện màn hình đang ở chiều dọc
    if (window.innerHeight > window.innerWidth) {
        window.requestLandscape();
    }

    // Gán sự kiện cho nút ENTER GAME (gọi chung hàm requestLandscape)
    const enterFsBtn = document.getElementById('enter-fs-btn');
    if (enterFsBtn) {
        enterFsBtn.addEventListener('click', window.requestLandscape);
        enterFsBtn.addEventListener('touchend', window.requestLandscape);
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

       if (submitBtn.disabled || submitBtn.style.pointerEvents === 'none') {
                return;
            }

            // 🛑 KHÓA NÚT NGAY LẬP TỨC TRÊN GIAO DIỆN
            submitBtn.disabled = true;
            submitBtn.style.pointerEvents = 'none'; // Vô hiệu hóa mọi cú chạm tiếp theo
            submitBtn.style.opacity = '0.6';
            submitBtn.innerText = "Saving...";   
          
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
