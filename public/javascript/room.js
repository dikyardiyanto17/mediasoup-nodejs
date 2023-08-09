const mediasoupClient = require("mediasoup-client")
const io = require('socket.io-client')
const socket = io('/')
const store = require('./store')

// Get Room Id
const url = window.location.pathname;
const parts = url.split('/');
const roomName = parts[2];


// Local Video
let localVideo = document.getElementById('local-video')

// Video Container
let videoContainer = document.getElementById('video-container')

// Variable Collection
let device
let rtpCapabilities
let producerTransport
let consumerTransports = []
let audioProducer
let videoProducer
let consumer
let isProducer = false
let producersDetails = {}

// Params for MediaSoup
let params = {
    encodings: [
        {
            rid: 'r0',
            maxBitrate: 100000,
            scalabilityMode: 'S1T3',
        },
        {
            rid: 'r1',
            maxBitrate: 300000,
            scalabilityMode: 'S1T3',
        },
        {
            rid: 'r2',
            maxBitrate: 900000,
            scalabilityMode: 'S1T3',
        },
    ],
    codecOptions: {
        videoGoogleStartBitrate: 1000
    }
}

let audioParams;
let videoParams = { params };
let consumingTransports = [];

// Starting Video Local
const streamSuccess = (stream) => {

    localVideo.srcObject = stream

    audioParams = { track: stream.getAudioTracks()[0], ...audioParams };
    videoParams = { track: stream.getVideoTracks()[0], ...videoParams };

    joinRoom()
}

// Emitting Join Room and Getting RTP Capabilities From Server and Creating Media Devices
const joinRoom = () => {
    let myUsername
    localStorage.setItem("room_id", roomName)

    if (!localStorage.getItem("username")) {
        myUsername = "Unknown"
    } else {
        myUsername = localStorage.getItem("username")
    }
    socket.emit('joinRoom', { roomName, username: myUsername }, (data) => {
        console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`)
        rtpCapabilities = data.rtpCapabilities
        createDevice()
    })
}

// Get Local Stream
const getLocalStream = () => {
    let config = {
        video: { deviceId: { exact: localStorage.getItem('selectedVideoDevices') } },
        audio: { deviceId: { exact: localStorage.getItem('selectedAudioDevices') } }
    }
    navigator.mediaDevices.getUserMedia(config)
        .then(streamSuccess)
        .catch(error => {
            console.log(error.message)
        })
}

// Creating Media Devices and load RTPCapabilities to MediaSoup Client and Create Send Transport
const createDevice = async () => {
    try {
        device = new mediasoupClient.Device()

        await device.load({
            routerRtpCapabilities: rtpCapabilities
        })

        console.log('- Device RTP Capabilities', device.rtpCapabilities)

        createSendTransport()

    } catch (error) {
        console.log(error)
        if (error.name === 'UnsupportedError')
            console.warn('browser not supported')
    }
}

// Create Send Transport
const createSendTransport = () => {
    socket.emit('createWebRtcTransport', { consumer: false }, ({ params }) => {
        if (params.error) {
            console.log(params.error)
            return
        }

        console.log("- Create Send Transport : ", params)

        producerTransport = device.createSendTransport(params)

        producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await socket.emit('transport-connect', {
                    dtlsParameters,
                })

                callback()

            } catch (error) {
                errback(error)
            }
        })

        producerTransport.on('produce', async (parameters, callback, errback) => {
            console.log("- Create Web RTC Transport / Produce : ", parameters)

            try {
                await socket.emit('transport-produce', {
                    kind: parameters.kind,
                    rtpParameters: parameters.rtpParameters,
                    appData: parameters.appData,
                }, ({ id, producersExist }) => {
                    callback({ id })

                    if (producersExist) getProducers()
                })
            } catch (error) {
                errback(error)
            }
        })

        connectSendTransport()
    })
}

const connectSendTransport = async () => {
    audioProducer = await producerTransport.produce(audioParams);
    videoProducer = await producerTransport.produce(videoParams);

    audioProducer.on('trackended', () => {
        console.log('audio track ended')

    })

    audioProducer.on('transportclose', () => {
        console.log('audio transport ended')

    })

    videoProducer.on('trackended', () => {
        console.log('video track ended')

    })

    videoProducer.on('transportclose', () => {
        console.log('video transport ended')

    })
}

const signalNewConsumerTransport = async (remoteProducerId) => {
    if (consumingTransports.includes(remoteProducerId)) return;
    consumingTransports.push(remoteProducerId);

    await socket.emit('createWebRtcTransport', { consumer: true }, ({ params }) => {
        if (params.error) {
            console.log(params.error)
            return
        }
        console.log("- New User Entering : ", params.id)

        let consumerTransport
        try {
            consumerTransport = device.createRecvTransport(params)
        } catch (error) {
            console.log(error)
            return
        }

        consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await socket.emit('transport-recv-connect', {
                    dtlsParameters,
                    serverConsumerTransportId: params.id,
                })

                callback()
            } catch (error) {
                errback(error)
            }
        })

        connectRecvTransport(consumerTransport, remoteProducerId, params.id)
    })
}

// Socket Collection

socket.on('connection-success', ({ socketId }) => {
    console.log(socketId)
    getLocalStream()
})


socket.on('new-producer', ({ producerId }) => {
    signalNewConsumerTransport(producerId)
})

socket.on('producer-closed', ({ remoteProducerId }) => {
    const producerToClose = consumerTransports.find(transportData => transportData.producerId === remoteProducerId)
    producerToClose.consumerTransport.close()
    producerToClose.consumer.close()

    for (const firstKey in producersDetails){
        for (const secondKey in producersDetails[firstKey]){
            if (producersDetails[firstKey][secondKey] == remoteProducerId){
                delete producersDetails[firstKey]
                break
            }
        }
    }

    consumerTransports = consumerTransports.filter(transportData => transportData.producerId !== remoteProducerId)

    console.log('- Remove Producer : ', remoteProducerId, " - Producer Details : ", producersDetails)

    videoContainer.removeChild(document.getElementById(`td-${remoteProducerId}`))
})

const getProducers = () => {
    socket.emit('getProducers', producerIds => {
        console.log("- Get Product Id : ", producerIds)
        producerIds.forEach(signalNewConsumerTransport)
    })
}

const connectRecvTransport = async (consumerTransport, remoteProducerId, serverConsumerTransportId) => {
    await socket.emit('consume', {
        rtpCapabilities: device.rtpCapabilities,
        remoteProducerId,
        serverConsumerTransportId,
    }, async ({ params }) => {
        if (params.error) {
            console.log('Cannot Consume')
            return
        }

        console.log(`- Connect Receive Transport : ${params.kind}`)
        const consumer = await consumerTransport.consume({
            id: params.id,
            producerId: params.producerId,
            kind: params.kind,
            rtpParameters: params.rtpParameters
        })

        consumerTransports = [
            ...consumerTransports,
            {
                consumerTransport,
                serverConsumerTransportId: params.id,
                producerId: remoteProducerId,
                consumer,
            },
        ]



        // console.log("- Producer Socket : ", params.producerOwnerSocket, " - Producer Name : ", params.producerName, " - Kind : ", params.kind, " - Producer Id : ", params.id)

        if (!producersDetails[params.producerOwnerSocket]){
            producersDetails[params.producerOwnerSocket] = {}
            if (!producersDetails[params.producerOwnerSocket][params.kind]){
                producersDetails[params.producerOwnerSocket][params.kind] = params.producerId
            }
            if (!producersDetails[params.producerOwnerSocket].name){
                producersDetails[params.producerOwnerSocket].name = params.producerName
            }
        } else {
            if (!producersDetails[params.producerOwnerSocket][params.kind]){
                producersDetails[params.producerOwnerSocket][params.kind] = params.producerId
            }
        }

        console.log("- Producers Details : ", producersDetails)

        // console.log("- Customer Transports : ", consumerTransports, " - Remote Producer Id : ", remoteProducerId, " - My Socket Id : ", socket.id, " - Username : ", params?.username)

        const newElem = document.createElement('div')
        newElem.setAttribute('id', `td-${remoteProducerId}`)

        if (params.kind == 'audio') {
            newElem.innerHTML = '<audio id="' + remoteProducerId + '" autoplay></audio>'
        } else {
            newElem.setAttribute('class', 'user-video-container')
            newElem.innerHTML = '<video id="' + remoteProducerId + '" autoplay class="user-video" ></video><div class="username">' + params?.username + '</div>'
        }

        videoContainer.appendChild(newElem)

        const { track } = consumer

        document.getElementById(remoteProducerId).srcObject = new MediaStream([track])

        socket.emit('consumer-resume', { serverConsumerId: params.serverConsumerId })
    })
}



const micButton = document.getElementById("user-mic-button");
const micImage = document.getElementById("mic-image");
micButton.addEventListener("click", () => {
    if (micImage.src.endsWith("micOn.png")) {
        micImage.src = "/assets/pictures/micOff.png";
    } else {
        micImage.src = "/assets/pictures/micOn.png";
    }
});

const consoleLogButton = document.getElementById('console-log-button')
consoleLogButton.addEventListener('click', () => {
    console.log('- Consumer Tranport : ', consumingTransports)
    socket.emit('get-peers', (consumerTransports))
})