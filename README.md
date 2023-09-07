# mediasoup-nodejs
## Needs Improvement
### Urgent
- Saat producer dalam kondisi disconnect, mulai ulang reconnect jangan langsung ke lobby

### Primary
- Kamera belakang tidak mau (handphone) (Sudah di diperbaiki, belum ditesting)
- Responsive Design (basic design)
- Membuat UI yang lebih baik (on Development)
- Pause consumer jika tidak sedang digunakan (sudah ditambahkan, belum ditesting)
- Konfigurasi menjalankan consumer yang didisplay saja, dalam kasus ini maksimal 12 user per page. 11 x 2 = 24 consumer per user. 24 x 12 = 288 consumer  (sudah ditambahkan, belum ditesting)
- Konfigurasi Worker untuk setiap core, maksimal 1 worker terdapat 50 orang. 1 orang menerima 98 consumer dari 49 video dan audio dan total consumer adalah 50 x 98 = 4900 Consumer (skema ada dibawah)(skema sudah di terapkan dikodingan)
- Deployment ke dua video putus-putus (Perbedaan dari deployment ke dua dengan pertama adalah cara memasukan videonya), kemungkinan masalah : 1. Terkena bandwidth di VPS Server.
- Jika semua sudah ready, tombol controller di enable.
- Kasih penanda jika sudah terhubung atau belum.
- Tampilkan semua error notification
- Tampilkan jika semua sudah ready
- Handling jika jika producer state : failed, connecting, connected
- Cek Saat Mode Normal dan Mode Screen Share Di Limited Usernya
- Kadang saat user baru join di mode pagination, tembus padahal sudah lebih dari limitedPerPage
- Bug duplikat Video (DONE)

### Secondary
- Tambahkan Turn Off / On Camera (Masih perlu perbaikan)
- Case jika 1000 user online bersamaan
- Case jika seseorang sedang merekam, lalu tiba-tiba kepencet exit, harus auto download

## Critical Information
- 1 worker untuk 1 core CPU
- 1 worker uses 1 port. And on 1 worker you can handle n number of consumers based upon the core capacity of your CPU as each worker runs on it’s core. So if 1 core of you cpu can handle 1500 consumers and you have 32 cores which means you should create max 32 workers then below is the math:

- CPU = 32 cores
- 1 worker = 1 core
- 1 worker = 1500 consumers
- 32 workers = 1500 * 32 = 48000 consumers

- So your CPU with that capacity can handle around 48000 consumers. But in reality actual number of consumers can be lower than this because of the piping, if you are doing, and some other stuff of your server.

- You can calculate the number of consumers in your call session and see the max number of users your CPU can handle

## Testing
- When Someone Screen Sharing, new user join, it will enable Screen Share Mode Display (DONE)
- When total user join room more than limited displayed video, new user video wont displayed and consumer get paused (only tested with limited displayed video = 3) (DONE)
- When new user join room, and current user is on last page, new user video should be displayed (DONE)
- When current user is recording, and new user joining, the recorded audio will include new user audio (DONE)
- When user has weak network, the producer will trying to reconnect first for 8 seconds, if its failed or disconnected it will redirect to lobby (DONE)

## Question
- When 100 user hit the join room in the sametime?
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

- If I loop the stream, will the voice get through?

## Scenario Worker Info
```js
let allWorkers = {
    worker1: createWorker(),
    worker2: createWorker(),
    worker3: createWorker(),
    worker4: createWorker(),
    worker5: createWorker(),
    ...
}
let workerInfo = {
    worker1: {
        roomName: [
            socketId, socketId, socketId
        ]
    },
    worker2: {
        roomName: [
            socketId, socketId, socketId
        ]
    },
    worker3:  {
        roomName: [
            socketId, socketId, socketId
        ]
    },
    worker4: {
        roomName: [
            socketId, socketId, socketId
        ]
    },
    worker5: {
        roomName: [
            socketId, socketId, socketId
        ]
    },
    worker6: {
        roomName: [
            socketId, socketId, socketId
        ]
    },
    worker7: {
        roomName: [
            socketId, socketId, socketId
        ]
    },
    worker8: {
        roomName: [
            socketId, socketId, socketId
        ]
    }
}

let capacity = {
    wokrer1 = 0
    wokrer2 = 0
    wokrer3 = 0
    wokrer4 = 0
    wokrer5 = 0
    ...
}
```

## Methods
```js
socket.on('joinRoom', (data) => {
    // Checking Worker Capacity
    const { roomName } = data
    let newRoom = true
    let usedWorker
    let total = 0
    // Checking if its new room or not
    for (const firstKey in workerInfo){
        for (const secondKey in workerInfo[firstKey]){
            if (secondKey == roomName){
                newRoom = false
                usedWorker = firstKey
                for (const thirdKey in workerInfo[firstkey]){
                    total = total + workerInfo[firstKey][thirdKey].length
                }
                break
            }
        }
        workerInfo[key]
    }

    if (total >= 15){
        // socket bla-bla-bla
        return
    }

    if (newRoom){
        let choosenWorker
        let theLeastConsumer
        // Choosing worker with fewer consumer
        for (const firstKey in capacity)[
            if (theLeastConsumer < capacity[firstKey]){
                theLesatConsumer = capacity[firstKey]
                choosenWorker = firstKey
            }
        ]
        capacity[choosenWorker]++
        if (!workerInfo[choosenWorker][roomName]){
            // bla-bla create router
            workerInfo[choosenWorker][roomName] = []
            workerInfo[choosenWorker][roomName].push(socket.id)
        } else {
            // bla-bla getRouter
            workerInfo[usedWorker][roomName].push(socket.id)
        }
    }
})
```

## Handle Error
- Error Database
- Error Server

## Database
- Account :
-- Username
-- Password
-- Email
-- Identitas
-- Authority

- Room
-- RoomId
-- Participants (Account)
-- Producer ID
-- Consumer ID
-- Transport ID

- Chat
-- Room
-- Sender (Account)
-- Date
-- Message

## Optional
- Changing Displayed Video By Collecting Stream First
- Dont Need To Delete Element To Replace Next or Previus Video