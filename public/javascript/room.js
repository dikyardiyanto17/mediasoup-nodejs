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
let screenSharingProducer
let consumer
let isProducer = false
let producersDetails = {}
let deviceId = 0
let totalUsers = 0
let currentTemplate

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
let screenSharingParams = { params }
let consumingTransports = [];
let isScreenSharing = false

// Starting Video Local
const streamSuccess = (stream) => {

    store.setLocalStream(stream)
    localVideo.srcObject = stream

    audioParams = { track: stream.getAudioTracks()[0], ...audioParams };
    videoParams = { track: stream.getVideoTracks()[0], ...videoParams };

    joinRoom()
}

// On Development
const getScreenSharing = async () => {
    isScreenSharing = true
    const screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: "always",
            displaySurface: "window",
            chromeMediaSource: "desktop",
        },
    });

    screenSharingParams = { track: screenSharingStream.getVideoTracks()[0], ...screenSharingParams }

    screenSharingProducer = await producerTransport.produce(screenSharingParams);

    screenSharingProducer.on('trackended', () => {
        console.log('video track ended')

    })

    screenSharingProducer.on('transportclose', () => {
        console.log('video transport ended')
    })

    if (!currentTemplate) {
        currentTemplate = 'user-video-container'
    }

    totalUsers++

    if (totalUsers > 1 && totalUsers < 3) {
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-3');
        });
        currentTemplate = 'user-video-container-3'
    } else if (totalUsers >= 3 && totalUsers <= 5) {
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-6');
        });
        currentTemplate = 'user-video-container-6'
    } else if (totalUsers >= 6 && totalUsers <= 7) {
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-8');
        });
        currentTemplate = 'user-video-container-8'
    }

    const newElem = document.createElement('div')
    newElem.setAttribute('id', `td-screensharing`)

    newElem.setAttribute('class', currentTemplate)
    newElem.innerHTML = '<video id="' + 'screensharing' + '" autoplay class="user-video" ></video><div class="username">' + "Screen Sharing" + '</div>'

    videoContainer.appendChild(newElem)

    document.getElementById('screensharing').srcObject = screenSharingStream
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
                console.log("- Producer Transport Connecting")
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
                console.log("- Producer Transport Producing")
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

        // Connecting Send Transport
        connectSendTransport()
    })
}

// Connecting Send Transport and Producing Audio and Video Producer
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

// Signaling New Consumer Transport
const signalNewConsumerTransport = async (remoteProducerId) => {
    if (consumingTransports.includes(remoteProducerId)) return;
    consumingTransports.push(remoteProducerId);

    // Creating WebRtc Transport
    await socket.emit('createWebRtcTransport', { consumer: true }, ({ params }) => {
        if (params.error) {
            console.log(params.error)
            return
        }
        console.log("- New User Entering With Consumer Id: ", params.id)

        // Creating Receive Transport
        let consumerTransport
        try {
            consumerTransport = device.createRecvTransport(params)
        } catch (error) {
            console.log(error)
            return
        }

        // Connecting Consumer Transport
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

// Initiating When Socket is Estabilished
socket.on('connection-success', ({ socketId }) => {
    console.log(socketId)
    getLocalStream()
})

// Mic Configuration
socket.on('mic-config', (data) => {
    let videoId = document.querySelector('#td-' + data.videoProducerId);
    let micPicture = videoId.querySelector('img');
    let audioId = document.getElementById(data.audioProducerId);
    audioId.srcObject.getAudioTracks()[0].enabled = data.isMicActive
    if (!data.isMicActive) {
        micPicture.src = "/assets/pictures/micOff.png";
    } else {
        micPicture.src = "/assets/pictures/micOn.png";
    }

})

// Signaling New Producer
socket.on('new-producer', ({ producerId }) => {
    signalNewConsumerTransport(producerId)
})

// Cleaning When User Is Disconnected
socket.on('producer-closed', ({ remoteProducerId }) => {
    const producerToClose = consumerTransports.find(transportData => transportData.producerId === remoteProducerId)
    producerToClose.consumerTransport.close()
    producerToClose.consumer.close()

    // Creating Other Variables For other Purposes
    for (const firstKey in producersDetails) {
        for (const secondKey in producersDetails[firstKey]) {
            if (producersDetails[firstKey][secondKey] == remoteProducerId) {
                if (producersDetails[firstKey].screenSharing) {
                    totalUsers--
                }
                delete producersDetails[firstKey]
                totalUsers--
                break
            }
        }
    }

    if (totalUsers < 2) {
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);

        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container');
        });
        currentTemplate = 'user-video-container'
    } else if (totalUsers == 2) {
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-3');
        });
        currentTemplate = 'user-video-container-3'
    } else if (totalUsers >= 3 && totalUsers <= 5) {
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-6');
        });
        currentTemplate = 'user-video-container-6'
    } else if (totalUsers >= 6 && totalUsers <= 7) {
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-8');
        });
        currentTemplate = 'user-video-container-8'
    } else {
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-12');
        });
        currentTemplate = 'user-video-container-12'
    }


    consumerTransports = consumerTransports.filter(transportData => transportData.producerId !== remoteProducerId)

    console.log('- Remove Producer : ', remoteProducerId, " - Producer Details : ", producersDetails)

    videoContainer.removeChild(document.getElementById(`td-${remoteProducerId}`))
})

// Get Producers
const getProducers = () => {
    socket.emit('getProducers', producerIds => {
        console.log("- Get Product Id : ", producerIds)
        producerIds.forEach(signalNewConsumerTransport)
    })
}

// Connecting Receive Transport
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



        if (!currentTemplate) {
            currentTemplate = 'user-video-container'
        }

        console.log("- Producers Details : ", producersDetails)

        // console.log("- Customer Transports : ", consumerTransports, " - Remote Producer Id : ", remoteProducerId, " - My Socket Id : ", socket.id, " - Username : ", params?.username)

        const newElem = document.createElement('div')
        newElem.setAttribute('id', `td-${remoteProducerId}`)

        if (params.kind == 'audio') {
            newElem.innerHTML = '<audio id="' + remoteProducerId + '" autoplay></audio>'
        } else {
            newElem.setAttribute('class', currentTemplate)
            newElem.innerHTML = '<img src="/assets/pictures/micOn.png" class="icons-mic" /><video id="' + remoteProducerId + '" autoplay class="user-video" ></video><div class="username">' + params?.username + '</div>'
        }

        videoContainer.appendChild(newElem)

        const { track } = consumer

        document.getElementById(remoteProducerId).srcObject = new MediaStream([track])



        if (totalUsers > 1 && totalUsers < 3) {
            const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
            userVideoContainers.forEach((container, index) => {
                container.classList.remove(currentTemplate);
                container.classList.add('user-video-container-3');
            });
            currentTemplate = 'user-video-container-3'
        } else if (totalUsers >= 3 && totalUsers <= 5) {
            const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
            userVideoContainers.forEach((container, index) => {
                container.classList.remove(currentTemplate);
                container.classList.add('user-video-container-6');
            });
            currentTemplate = 'user-video-container-6'
        } else if (totalUsers >= 6 && totalUsers <= 7) {
            const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
            userVideoContainers.forEach((container, index) => {
                container.classList.remove(currentTemplate);
                container.classList.add('user-video-container-8');
            });
            currentTemplate = 'user-video-container-8'
        }


        let stream = store.getState()

        if (!producersDetails[params.producerOwnerSocket]) {
            producersDetails[params.producerOwnerSocket] = {}
            if (!producersDetails[params.producerOwnerSocket][params.kind]) {
                producersDetails[params.producerOwnerSocket][params.kind] = params.producerId
            }
            if (!producersDetails[params.producerOwnerSocket].name) {
                producersDetails[params.producerOwnerSocket].name = params.producerName
            }
        } else {
            if (!producersDetails[params.producerOwnerSocket][params.kind]) {
                producersDetails[params.producerOwnerSocket][params.kind] = params.producerId
                if (!stream.localStream.getAudioTracks()[0].enabled) {
                    for (const key in producersDetails) {
                        socket.emit('mic-config', ({ videoProducerId: videoProducer.id, audioProducerId: audioProducer.id, socketId: key, isMicActive: false }))
                    }
                }
            }
            if (producersDetails[params.producerOwnerSocket].video) {
                if (!producersDetails[params.producerOwnerSocket].screenSharing) {
                    totalUsers++
                    producersDetails[params.producerOwnerSocket].screenSharing = params.producerId
                }
            }
        }

        if (params.kind == 'video') totalUsers++

        socket.emit('consumer-resume', { serverConsumerId: params.serverConsumerId })
    })
}


// Event Listener Collection

// Mic Button
const micButton = document.getElementById("user-mic-button");
const micImage = document.getElementById("mic-image");
const localMic = document.getElementById('local-mic')
micButton.addEventListener("click", () => {
    let stream = store.getState()

    if (micImage.src.endsWith("micOn.png")) {
        for (const key in producersDetails) {
            socket.emit('mic-config', ({ videoProducerId: videoProducer.id, audioProducerId: audioProducer.id, socketId: key, isMicActive: false }))
        }
        stream.localStream.getAudioTracks()[0].enabled = false
        localMic.src = "/assets/pictures/micOff.png";
        micImage.src = "/assets/pictures/micOff.png";
    } else {
        for (const key in producersDetails) {
            socket.emit('mic-config', ({ videoProducerId: videoProducer.id, audioProducerId: audioProducer.id, socketId: key, isMicActive: true }))
        }
        stream.localStream.getAudioTracks()[0].enabled = true
        localMic.src = "/assets/pictures/micOn.png";
        micImage.src = "/assets/pictures/micOn.png";
    }
});

const switchCamera = document.getElementById('user-switch-camera-button')
switchCamera.addEventListener("click", () => {
    SwitchingCamera()
})
const SwitchingCamera = async () => {
    let videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === "videoinput"
    );

    deviceId++
    if (deviceId >= videoDevices?.length) deviceId = 0

    let config = {
        audio: { deviceId: { exact: localStorage.getItem("selectedAudioDevices") } },
        video: {
            deviceId: { exact: videoDevices[deviceId].deviceId },
            video: { facingMode: "environment" },
        },
    }
    localStorage.setItem('selectedVideoDevices', videoDevices[deviceId].deviceId)
    let newStream = await navigator.mediaDevices.getUserMedia(config);
    store.setLocalStream(newStream)
    localVideo.srcObject = newStream

    await videoProducer.replaceTrack({ track: newStream.getVideoTracks()[0] });
};

// Screen Sharing Button
const screenSharingButton = document.getElementById('user-screen-share-button')
screenSharingButton.addEventListener('click', () => {
    getScreenSharing()
})

// Console Log Button
const consoleLogButton = document.getElementById('console-log-button')
consoleLogButton.addEventListener('click', () => {
    // console.log('- Consumer Tranport : ', consumingTransports)
    // socket.emit('get-peers', (consumerTransports))
    // console.log("- Producer : ", producerTransport)
    // console.log("- Video Producer : ", videoProducer)
    // producerTransport.getStats().then((data) => {
    //     console.log(data)
    // })
    console.log("- Producer Details : ", producersDetails)
    // console.log('- Local Video : ', localVideo.srcObject.getAudioTracks()[0].enabled)

})