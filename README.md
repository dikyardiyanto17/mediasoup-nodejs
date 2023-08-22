# mediasoup-nodejs
## Needs Improvement
- Kamera belakang tidak mau (handphone) https://stackoverflow.com/questions/55808286/can-not-change-camera-in-mobile-chrome-or-safari-during-webrtc-call
- Tambahkan jika buffering
- Tambahkan Turn Off Camera
- Membuat UI yang lebih baik
- Case jika 1000 user online bersamaan

## Critical Information
- 1 worker untuk 1 core CPU
- 1 worker uses 1 port. And on 1 worker you can handle n number of consumers based upon the core capacity of your CPU as each worker runs on it’s core. So if 1 core of you cpu can handle 1500 consumers and you have 32 cores which means you should create max 32 workers then below is the math:

- CPU = 32 cores
- 1 worker = 1 core
- 1 worker = 1500 consumers
- 32 workers = 1500 * 32 = 48000 consumers

- So your CPU with that capacity can handle around 48000 consumers. But in reality actual number of consumers can be lower than this because of the piping, if you are doing, and some other stuff of your server.

- You can calculate the number of consumers in your call session and see the max number of users your CPU can handle