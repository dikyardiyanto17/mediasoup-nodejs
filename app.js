const express = require('express')
const cors = require('cors')
const router = require('./routes/index.js')
const app = express()
const port = 3001
// const port = 80
const http = require('http')
const path = require('path');
const https = require('httpolyglot')
const privateKeyPath = './server.key';
const fs = require('fs')
const certificatePath = './server.crt';
const { Server } = require('socket.io')
const mediasoup = require('mediasoup')


// const credentials = {
//     key: fs.readFileSync(privateKeyPath),
//     cert: fs.readFileSync(certificatePath),
// };

const options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
};

const webRtcTransport_options = {
    listenIps: [
        {
            // ip: '127.0.0.1',
            // ip: '192.168.206.123',
            // ip: '192.168.205.229',
            // ip: '192.168.18.68', // Laptop Jaringan 5G
            ip: '203.194.113.166', // VPS Mr. Indra IP
            // ip: '203.175.10.29' // My VPS
            // ip: '192.168.3.135' // IP Kost
            // announcedIp: "88.12.10.41"
        }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
}

app.use(cors())
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

// const httpsServer = https.createServer(options, app)
// httpsServer.listen(port, () => {
//     console.log('App On : ' + port)
// })

// const io = new Server(httpsServer)

const httpServer = http.createServer(app)
httpServer.listen(port, () => {
    console.log('App On : ' + port)
})

const io = new Server(httpServer)

let worker
let rooms = {}
let peers = {}
let transports = []
let producers = []
let consumers = []
let roomsSocketCollection = {}
let allWorkers = {
    worker1: null,
    worker2: null,
    worker3: null,
    worker4: null,
}
let blobRecorder = {}

const createWorker = async () => {
    worker = await mediasoup.createWorker({
        // rtcMinPort: 2000,
        // rtcMaxPort: 10000,
    })

    worker.on('died', error => {
        console.log(error)
        setTimeout(() => process.exit(1), 2000)
    })

    return worker
}


const initWorker = async () => {
    allWorkers.worker1 = { worker: await createWorker(), totalUsers: 0 }
    allWorkers.worker2 = { worker: await createWorker(), totalUsers: 0 }
    allWorkers.worker3 = { worker: await createWorker(), totalUsers: 0 }
    allWorkers.worker4 = { worker: await createWorker(), totalUsers: 0 }
}

initWorker()


worker = createWorker()

const mediaCodecs = [
    {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
    },
    {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
            'x-google-start-bitrate': 1000,
        },
    },
]


io.on('connection', async socket => {
    socket.emit('connection-success', {
        socketId: socket.id,
    })

    const removeItems = (items, socketId, type) => {
        items.forEach(item => {
            if (item.socketId === socket.id) {
                item[type].close()
            }
        })
        items = items.filter(item => item.socketId !== socket.id)

        return items
    }

    const removeScreenSharingProducer = (items, socketId, type, producerId, room) => {
        // roomsSocketCollection[room]
        roomsSocketCollection[room].map((data) => {
            if (data.socketId == socketId){
                data.screenSharingProducerId = null
                data.audioScreenSharingProducerId = null
            }
            return data
        })

        items.forEach(item => {
            if (item.socketId == socket.id && item[type].id == producerId){
                item[type].close()
            }
        })
        items = items.filter(item => item.producer.id !== producerId)
        return items
    }

    
    socket.on('console-log-server', (data, callback) => {
        // consumers.forEach(consumer => {
        //     console.log('- Consumer : ', consumer.consumer)
        // })
        // console.log(JSON.stringify(rooms, null, 4));
        // console.log(rooms)
        // console.log('- All Workers : ', allWorkers)
        // console.log('- Producers : ', producers)

        // worker.events = (e) => {
        //     console.log(e)
        // }

        console.log('- Errrr Server : ', data)

        // callback({worker})
        // console.log('- Room Collection : ', roomsSocketCollection)
    })

    socket.on('message', function (data) {
        try {
            if (data.type == 'collecting'){
                if (!blobRecorder[socket.id]){
                    blobRecorder[socket.id] = [data.data]
                } else {
                    blobRecorder[socket.id].push(data.data)
                }
            } else if (data.type == 'uploading'){
                // Check if there are chunks to save
                if (blobRecorder[socket.id] && blobRecorder[socket.id].length > 0) {
                    const mergedBuffer = Buffer.concat(blobRecorder[socket.id]);

                    // Generate a unique filename (or use any naming convention you prefer)
                    const filename = `recorded-video-${socket.id}.webm`;
    
                    // Define the file path where the video will be saved
                    const filePath = path.join(__dirname, 'file', filename);
    
                    // Write the mergedBuffer to the file
                    fs.writeFile(filePath, mergedBuffer, function(err) {
                        if (err) {
                            // Handle error while saving the file
                            console.error('Error saving video:', err);
                        } else {
                            // Handle the successful save operation
                            console.log(`Video saved as ${filename}`);
                        }
                    });
                } else {
                    // Handle the case where there are no chunks to save
                    console.log('No chunks to save');
                }
                delete blobRecorder[socket.id]
            }
        } catch (error) {
            console.log('- Error Uploading File : ', error)
        }
    });

    socket.on('screen-sharing', ({ videoProducerId, audioProducerId, socketId, isSharing, producerId }) => {
        socket.to(socketId).emit('screen-sharing', ({ videoProducerId, audioProducerId, isSharing, remoteProducerId: producerId }))
    })

    socket.on('screen-sharing-producer', ({ videoProducerId, audioProducerId, socketId, isSharing, producerId, room }) => {
        producers = removeScreenSharingProducer(producers, socketId, 'producer', producerId, room)
    })

    socket.on('disconnect', () => {
        if (blobRecorder[socket.id]){
            delete blobRecorder[socket.id]
        }
        console.log('peer disconnected')
        consumers = removeItems(consumers, socket.id, 'consumer')
        producers = removeItems(producers, socket.id, 'producer')
        transports = removeItems(transports, socket.id, 'transport')

        if (peers[socket.id]) {
            const { roomName } = peers[socket.id]
            roomsSocketCollection[roomName] = roomsSocketCollection[roomName].filter(item => item.socketId !== socket.id)
            rooms[roomName] = {
                router: rooms[roomName].router,
                peers: rooms[roomName].peers.filter(data => data.socketId !== socket.id),
                worker: rooms[roomName].worker
            }
            let changeHost = true
            for (let i = 0; i < rooms[roomName].peers.length; i++){
                if (!rooms[roomName].peers[i].authority){
                    changeHost = false
                }
            }
            if (changeHost && rooms[roomName].peers.length != 0){
                for (let i = 0; i < rooms[roomName].peers.length; i++){
                    socket.to(rooms[roomName].peers[i].socketId).emit('change-host', {newHost: rooms[roomName].peers[0].socketId})
                }
                rooms[roomName].peers[0].authority = 'Host'
            }
            if (rooms[roomName].peers.length == 0){
                rooms[roomName].router.close()
                delete rooms[roomName]
            }
            peers[socket.id].producers.forEach((producerId) => {
                socket.emit('producer-closed', { remoteProducerId: producerId })
            })
            delete peers[socket.id]
        }

        // console.log("- Room Participant : ", roomsSocketCollection)
        // console.log('- Room : ', rooms)
    })

    socket.on('joinRoom', async (data, callback) => {
        const router1 = await createRoom(data.roomName, socket.id)

        peers[socket.id] = {
            socket,
            roomName: data.roomName,
            transports: [],
            producers: [],
            consumers: [],
            peerDetails: {
                name: data.username,
            }
        }

        if (!roomsSocketCollection[data.roomName]) {
            const newRoom = [{ socketId: socket.id, name: data.username }]
            roomsSocketCollection[data.roomName] = [...newRoom]
        } else {
            const newUser = { socketId: socket.id, name: data.username }
            roomsSocketCollection[data.roomName] = [...roomsSocketCollection[data.roomName], newUser]
        }

        // console.log("- Room Participant : ", roomsSocketCollection)

        const rtpCapabilities = router1.rtpCapabilities

        callback({ rtpCapabilities })
    })

    const createRoom = async (roomName, socketId) => {
        let router1
        let peers = []
        let data
        if (rooms[roomName]) {
            router1 = rooms[roomName].router
            peers = rooms[roomName].peers || []
            data = { socketId, authority: 'Participant'}
        } else {
            if (!worker) {
                worker = await createWorker()
            }
            router1 = await worker.createRouter({ mediaCodecs })
            data = { socketId, authority: 'Host'}
        }

        rooms[roomName] = {
            router: router1,
            peers: [...peers, data],
        }

        return router1
    }

    // const createRoom = async (roomName, socketId) => {
    //     let router1
    //     let peers = []
    //     let choosenWorker = 'worker1'
    //     if (rooms[roomName]) {
    //         router1 = rooms[roomName].router
    //         peers = rooms[roomName].peers || []
    //         choosenWorker = rooms[roomName].worker
    //         console.log('- Choosen Worker : ', choosenWorker)
    //         allWorkers[choosenWorker].totalUsers++
    //     } else {
    //         // Create New Room
    //         let compareRoom = allWorkers.worker1.totalUsers


    //         for (const key in allWorkers){
    //             if (allWorkers[key].totalUsers == 0){
    //                 choosenWorker = key
    //                 break
    //             } else if (allWorkers[key].totalUsers < compareRoom) {
    //                 choosenWorker = key
    //                 compareRoom = allWorkers[key].totalUsers
    //             }
    //         }
    //         router1 = await allWorkers[choosenWorker].worker.createRouter({ mediaCodecs })
    //         allWorkers[choosenWorker].totalUsers++
    //     }

    //     rooms[roomName] = {
    //         router: router1,
    //         peers: [...peers, socketId],
    //         worker: choosenWorker
    //     }


    //     return router1
    // }

    socket.on('unlock-mic-all', ({socketId}) => {
        socket.to(socketId).emit('unlock-mic-all', ({message: 'Hello World'}))
    })

    socket.on('send-message', (data) => {
        socket.to(data.sendTo).emit('receive-message', (data))
    })

    socket.on('createWebRtcTransport', async ({ consumer }, callback) => {
        const roomName = peers[socket.id].roomName

        const router = rooms[roomName].router


        createWebRtcTransport(router).then(
            transport => {
                // console.log("- Transport Id : ", transport.id, ' - My Socket Id: ', socket.id)
                callback({
                    params: {
                        id: transport.id,
                        iceParameters: transport.iceParameters,
                        iceCandidates: transport.iceCandidates,
                        dtlsParameters: transport.dtlsParameters,
                    }
                })

                addTransport(transport, roomName, consumer)
            },
            error => {
                console.log(error)
            })
    })

    const addTransport = (transport, roomName, consumer) => {

        transports = [
            ...transports,
            { socketId: socket.id, transport, roomName, consumer, }
        ]

        peers[socket.id] = {
            ...peers[socket.id],
            transports: [
                ...peers[socket.id].transports,
                transport.id,
            ]
        }
    }

    const addProducer = (producer, roomName) => {
        producers = [
            ...producers,
            { socketId: socket.id, producer, roomName, }
        ]

        peers[socket.id] = {
            ...peers[socket.id],
            producers: [
                ...peers[socket.id].producers,
                producer.id,
            ]
        }
    }

    const addConsumer = (consumer, roomName) => {
        consumers = [
            ...consumers,
            { socketId: socket.id, consumer, roomName, }
        ]

        peers[socket.id] = {
            ...peers[socket.id],
            consumers: [
                ...peers[socket.id].consumers,
                consumer.id,
            ]
        }
    }

    socket.on('getProducers', callback => {
        const { roomName } = peers[socket.id]

        let producerList = []
        producers.forEach(producerData => {
            if (producerData.socketId !== socket.id && producerData.roomName === roomName) {
                producerList = [...producerList, producerData.producer.id]
            }
        })

        callback(producerList)
    })

    socket.on('mic-config', ({ videoProducerId, audioProducerId, socketId, isMicActive }) => {
        socket.to(socketId).emit('mic-config', ({ videoProducerId, audioProducerId, isMicActive, socketId: socket.id }))
    })

    socket.on('camera-config', (data) => {
        socket.to(data.socketId).emit('camera-config', (data))
    })

    socket.on('mute-all', ({socketId}) => {
        socket.to(socketId).emit('mute-all', ({hostSocketId: socketId}))
    })

    socket.on('am-i-host', ({socketId, roomName}, callback) => {
        for (let i = 0; i < rooms[roomName].peers.length; i++){
            if (rooms[roomName].peers[i].socketId == socketId){
                callback({authority: rooms[roomName].peers[i].authority})
            }
            
        }
    })

    const informConsumers = (roomName, socketId, id) => {
        producers.forEach(producerData => {
            if (producerData.socketId !== socketId && producerData.roomName === roomName) {
                const producerSocket = peers[producerData.socketId].socket
                producerSocket.emit('new-producer', { producerId: id, socketId })
            }
        })
    }

    const getTransport = (socketId) => {
        const [producerTransport] = transports.filter(transport => transport.socketId === socketId && !transport.consumer)
        // console.log("- Get Transport : ", producerTransport.socketId, " - My Socket : ", socket.id, " - Is Consumer : ", producerTransport.consumer)
        // console.log('- Producer : ', producerTransport)
        return producerTransport.transport
    }

    socket.on('transport-connect', ({ dtlsParameters }) => {
        getTransport(socket.id).connect({ dtlsParameters })
    })

    socket.on('transport-produce', async ({ kind, rtpParameters, appData }, callback) => {
        const producer = await getTransport(socket.id).produce({
            kind,
            rtpParameters,
            appData
        })
        if (appData?.label === 'Screen Share'){
            console.log('- App Data : ', appData)
        }
        const { roomName } = peers[socket.id]

        roomsSocketCollection[roomName].map(data => {
            if (data.socketId == socket.id && kind == 'video') {
                if (data.producerId) {
                    data.screenSharingProducerId = producer.id
                }
                if (!data.producerId) {
                    data.producerId = producer.id
                    if (!data.picture){
                        data.picture = appData.picture
                    }
                }
                if (!data.screenSharingProducerId) {
                    data.screenSharingProducerId = null
                }
            }
            if (data.socketId == socket.id && kind == 'audio' && appData?.label == 'Screen Share Audio'){
                if (!data.audioScreenSharingProducer){
                    data.audioScreenSharingProducerId = producer.id
                }
            }
            return data
        })

        addProducer(producer, roomName)

        informConsumers(roomName, socket.id, producer.id)

        producer.on('transportclose', () => {
            producer.close()
        })

        callback({
            id: producer.id,
            producersExist: producers.length > 1 ? true : false
        })
    })

    socket.on('transport-recv-connect', async ({ dtlsParameters, serverConsumerTransportId }) => {
        const consumerTransport = transports.find(transportData => (
            transportData.consumer && transportData.transport.id == serverConsumerTransportId
        )).transport
        await consumerTransport.connect({ dtlsParameters })
    })

    socket.on('consume', async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId }, callback) => {
        // console.log("- My Socket Id : ", socket.id, " - Peers", peers)
        // console.log('- Room Collection : ', roomsSocketCollection)
        try {

            const { roomName } = peers[socket.id]
            const router = rooms[roomName].router
            let consumerTransport = transports.find(transportData => (
                transportData.consumer && transportData.transport.id == serverConsumerTransportId
            )).transport

            // let consumerTransportExample = transports.find(transportData => (
            //     transportData.consumer && transportData.transport.id == serverConsumerTransportId
            // ))
            // console.log('- Consumer Transport Example : ', consumerTransportExample)

            const userData = transports.find(transportData => transportData.consumer && transportData.transport.id == serverConsumerTransportId)
            // console.log("- User Data : ", userData.transport)
            // console.log("- getProducerById() : ", userData.transport.getProducerById(), " - getDataProducedById() : ", userData.transport.getDataProducedById())

            if (router.canConsume({
                producerId: remoteProducerId,
                rtpCapabilities
            })) {
                const consumer = await consumerTransport.consume({
                    producerId: remoteProducerId,
                    rtpCapabilities,
                    paused: true,
                })
                
                let params = {
                    id: consumer.id,
                    producerId: remoteProducerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                    serverConsumerId: consumer.id,
                }

                let isAudioScreenShareExist = roomsSocketCollection[roomName].find((data) => data.audioScreenSharingProducerId == remoteProducerId)
                if (isAudioScreenShareExist){
                    params.label = 'Screen Share Audio'
                }

                if (consumer.kind == 'video') {
                    const { roomName } = peers[socket.id]
                    let getUserData = roomsSocketCollection[roomName].find((data) => data.producerId == remoteProducerId)
                    let screenSharingData = roomsSocketCollection[roomName].find((data) => data.screenSharingProducerId == remoteProducerId)
                    // console.log("- Get User Data : ", getUserData, " - Socket Id : ", socket.id)
                    // producers.map((producer) => {
                    //     if (producer.producer.id == remoteProducerId && producer.producer.appData.type == 'Screen-Sharing'){
                    //         params.username = screenSharingData.name + " is Sharing Screen"
                    //     }
                    // })
                    if (screenSharingData){
                        params.username = screenSharingData.name + " is Sharing Screen"
                    }
                    if (getUserData){
                        params.username = getUserData.name
                        params.picture = getUserData.picture
                    }
                }

                consumer.on('transportclose', () => {
                    console.log('transport close from consumer')
                })

                consumer.on('producerclose', () => {
                    socket.emit('producer-closed', { remoteProducerId })

                    consumerTransport.close([])
                    transports = transports.filter(transportData => transportData.transport.id !== consumerTransport.id)
                    consumer.close()
                    consumers = consumers.filter(consumerData => consumerData.consumer.id !== consumer.id)
                })

                addConsumer(consumer, roomName)

                for (const key in peers) {
                    peers[key].producers.forEach((producer) => {
                        if (producer == remoteProducerId) {
                            // console.log("HELLO WORLD")
                            // console.log("- Key : ", key, " - Peers : ", peers[key].producers, " - My Socket ID : ", socket.id, " - Owner : ", peers[key].socket.id, " - Name : ", peers[key].peerDetails.name)
                            if (!params.producerOwnerSocket) {
                                params.producerOwnerSocket = peers[key].socket.id
                            }
                            let authority
                            for (let i = 0; i < rooms[roomName].peers.length; i++){
                                if (rooms[roomName].peers[i].socketId == peers[key].socket.id){
                                    authority = rooms[roomName].peers[i].authority
                                }
                            }
                            if (!params.authority){
                                params.authority = authority
                            }
                            if (!params.producerName) {
                                params.producerName = peers[key].peerDetails.name
                            }
                        }
                    })
                }


                callback({ params })
            }
        } catch (error) {
            console.log(error)
            console.log(error.message)
            callback({
                params: {
                    error: error
                }
            })
        }
    })

    socket.on('get-peers', (data) => {
        console.log('- Peers : ', peers)
    })

    socket.on('consumer-resume', async ({ serverConsumerId }) => {
        const getConsumer = consumers.find(consumerData => consumerData.consumer.id === serverConsumerId)
        if (getConsumer){
            const { consumer } = getConsumer
            await consumer.resume()
        }
    })

    socket.on('consumer-pause', async ({ serverConsumerId }) => {
        const getConsumer = consumers.find(consumerData => consumerData.consumer.id === serverConsumerId)
        if (getConsumer){
            const { consumer } = getConsumer
            await consumer.resume()
        }
    })
})

const createWebRtcTransport = async (router) => {
    return new Promise(async (resolve, reject) => {
        try {


            let transport = await router.createWebRtcTransport(webRtcTransport_options)

            transport.on('dtlsstatechange', dtlsState => {
                if (dtlsState === 'closed') {
                    transport.close()
                }
            })

            transport.on('close', () => {
                console.log('transport closed')
            })

            resolve(transport)

        } catch (error) {
            reject(error)
        }
    })
}

app.use(router)
