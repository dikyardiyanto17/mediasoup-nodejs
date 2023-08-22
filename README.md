# mediasoup-nodejs
## Needs Improvement
- Kamera belakang tidak mau (handphone) https://stackoverflow.com/questions/55808286/can-not-change-camera-in-mobile-chrome-or-safari-during-webrtc-call
- Jika user lebih dari 12 (saat tidak screensharing, di geser)
- Jika user lebih dari 6 (saat screensharing, di geser)
- Tambahkan jika buffering
- Tambahkan Turn Off Camera
- Membuat UI yang lebih baik
- Case jika 1000 user online bersamaan
- Button Controller dibuat block (bukan absolute)
- Bug di screensharing saat diaktifkan, kemudian dinonaktifkan dan diaktifkan kembali (- Curiga bug screensharing producer belum di close)
- Antisipasi jika ada user disconnect saat screensharing, handle close producer, transport dan consumer
- Perlu ngehandle saat user join kadang masuk pagination kadang tidak

## Critical Information
- 1 worker untuk 1 core CPU