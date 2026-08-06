// 🟢 CODE ĐÃ SỬA CHUẨN:
function endgameservice() {
    const min = -10;
    const max = 20;
    const b1 = Math.random() * (max - min) + min;
    const a1 = Math.sin(b1) + 1;
    return { b1, a1 };
}
