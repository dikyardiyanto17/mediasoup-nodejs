# mediasoup-nodejs
## Needs Improvement
### Urgent


### Primary
- Kamera belakang tidak mau *(handphone) *(Sudah di diperbaiki, belum ditesting)
- Responsive Design *(basic design)
- Membuat UI yang lebih baik *(on Development)
- Pause consumer jika tidak sedang digunakan *(sudah di testing untuk case 1 halaman maksimal 3 user dengan total 7 user (3 page))
- Konfigurasi menjalankan consumer yang didisplay saja, dalam kasus ini maksimal 12 user per page. 11 x 2 = 24 consumer per user. 24 x 12 = 288 consumer  *(sudah di testing untuk case 1 halaman maksimal 3 user dengan total 7 user (3 page))
- Konfigurasi Worker untuk setiap core, maksimal 1 worker terdapat 50 orang. 1 orang menerima 98 consumer dari 49 video dan audio dan total consumer adalah 50 x 98 = 4900 Consumer *(skema ada dibawah)(skema sudah di terapkan dikodingan)
- Deployment ke dua video putus-putus (Perbedaan dari deployment ke dua dengan pertama adalah cara memasukan videonya), kemungkinan masalah : 1. Terkena bandwidth di VPS Server. (&#x2713;)
- Jika semua sudah ready, tombol controller di enable. (&#x2713;)
- Kasih penanda jika sudah terhubung atau belum. (&#x2713;)
- Tampilkan semua error notification
- Handling jika jika producer state : failed, connecting, connected (&#x2713;)
- Cek Saat Mode Normal dan Mode Screen Share Di Limited Usernya
- Kadang saat user baru join di mode pagination, tembus padahal sudah lebih dari limitedPerPage (&#x2713;)
- Bug duplikat Video (&#x2713;)

### Secondary
- Case jika 1000 user online bersamaan
- Case jika seseorang sedang merekam, lalu tiba-tiba kepencet exit, harus auto download
- Check bottom and upper limit for available port

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
- When Someone Screen Sharing, new user join, it will enable Screen Share Mode Display (&#x2713;)
- When total user join room more than limited displayed video, new user video wont displayed and consumer get paused (only tested with limited displayed video = 3) (&#x2713;)
- When new user join room, and current user is on last page, new user video should be displayed (&#x2713;)
- When current user is recording, and new user joining, the recorded audio will include new user audio (&#x2713;)
- When user has weak network, the producer will trying to reconnect first for 8 seconds, if its failed or disconnected it will redirect to lobby (&#x2713;)

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

## Consideration
- Is it neccessary to save transport in database ? No

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

## Bug Log
### 0.1.0
- Host title is not displayed when host is changing (&#x2713;)
### 0.1.1
- Bug on socket.on('mic-config', .....) audio track is null (&#x2713;)
- Bug when append video visualization on screensharing mode is error, sometime screensharing is not displayed or audio is not working properly (A is screen sharing mode and new user is joining) (&#x2713;)
- Bug when screen share mode sometime its user video changed to screensharing (&#x2713;)
### 0.1.3
- Screen sharing video fps is not good / lagging
- Sometimes user mic is not working properly
- Bug in switch camera (Not sure) (Reported by Mr. Yoga)
- Bug mute-all button is appending even though current user is not Host (&#x2713;)
- Bug in mic icons (&#x2713;)
- Displayed video format sometimes is wrong, example, if there is 3 users in room, the video class name should be container-3 but its container 4 (Testing is needed) (&#x2713;)
- Error when screensharing producer is reconnecting  (&#x2713;) (Testing is needed) (Reported by Mr. Sabdho)
### 0.2.1
- Camera indicator is still flashing even though camera is off

## Test Log
### 0.1.0
- Screen sharing mode when mute and unmute all participants (&#x2713;)
- Participants cant unmute when Host is locking the mic (&#x2713;)
- Participants cant unmute / mute all participants (&#x2713;)
- Host title will change if host leaving room (&#x2713;)
- Router will be closed when there is no one in room (&#x2713;)
- Host can mute / unmute all participants (&#x2713;)

### 0.1.1
- Repetitive when user A and B in screen sharing mode and new user joining room to check the audio is normal and screen sharing mode is displaying properly  (&#x2713;)
- Test host title text on username is displayed or not, when host title changing constantly (&#x2713;)

### 0.1.2
- Audio feedback bug

## Change Log
### 0.0.1
- Starting Development
### 0.1.0
- Adding unmute and mute all participants
- Lock mic when host mute all participants
- Host title will change to the earliest participant that joined the room
- If Host is hanging up/leave room, participant who is join after host will be the new host
- Router is closed when there is no one in the room
### 0.1.1
- Fixing bug in when Host title is not displayed when changing host
- Changing minimum bitrate video to 500 kbps - 900 kbps
### 0.1.2
- Mute all button only displayed in host interface
- Chat button removed
- Fixed bug when in screen sharing mode and new user join, it wont display the screensharing
- Fixed bug audio sometimes is not working properly when in screen sharing mode
- Fixed bug screensharing mode and user camera sometime switched when other user leaving room
- Adding padding to name tag
- Change recording text and background
### 0.1.3
- Fixed bug audio feedback
### 0.2.1
- Lobby and Home UI improvement
- Displayed video from stretch to aspect ratio
- Fixed bug when screensharing stream producer is reconnecting
- Fixed bug on counting total users that cause displayed wrong class video
- Fixed bug mic icons sometimes not working properly
- Fixed bug mute-all button option displayed on participants
- Added feature turn on / off camera
- Added generate random id
### 0.2.2
- Changing design in lobby
- Stop track when camera is off so indicator is turning off

## Note
### Testing (9-15-2023) (v-0.1.2)
- Agak jeda
- Sharescreen agak jeda
- Audio ada yang tidak masuk
- Handle rekoneksi jangan ke lobby
- Bug di mute-all tombol
- Lagging karena jaringan?
- Bug di switch camera?
- Bug di mic-icons
- Tampilan layout kadang tidak sesuai, misal ada user 4 join, yang harusnya menggunakan kelas container-4 malah container-12
- Screen sharing saat reconnecting jadi double. perlu dihandel

## Keterangan
- Font recording disesuaikan (&#x2713;)
- Nama dikasih jarak (&#x2713;)
- Fitur unmute all participant hanya ada di host (&#x2713;)
- Mirrror video (&#x2713;)
- Tampilan home dan lobby perlu improvement
- Tampilan mobile browser
- Matikan camera hanya mempause video