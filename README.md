# mediasoup-nodejs
## Needs Improvement
### Primary
- Kamera belakang tidak mau (handphone) (Sudah di diperbaiki, belum ditesting)
- Responsive Design
- Membuat UI yang lebih baik

### Secondary
- Tambahkan jika buffering
- Tambahkan Turn Off Camera
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

## Question
- Is 1 Core have a different port?
```js
const createWorker = async () => {
    worker = await mediasoup.createWorker({
        rtcMinPort: 2000,
        rtcMaxPort: 10000,
    })

    worker.on('died', error => {
        console.log(error)
        setTimeout(() => process.exit(1), 2000)
    })

    return worker
}
```