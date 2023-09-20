const mediasoupClient = require("mediasoup-client")
const RecordRTC = require('recordrtc')
const io = require('socket.io-client')
const socket = io('/')
const store = require('./store')
// console.log('- Document : ', document)

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
let screenSharingStreamsGlobal
let isRecording = false
let recordedStream
let recordedMedia
let recordedBlob = []
let allStream = {}
let audioContext
let audioDestination
let paginationStartIndex = 0
let paginationEndIndex = 11
let currentPage = 0
let limitedPerPage = 12
let isCameraOn = true
let isMicOn = true
let lockedMic = false
let host
let isMutedAll

// Params for MediaSoup
let params = {
    encodings: [
        {
            // rid: 'r0',
            maxBitrate: 500000,
            scalabilityMode: 'S1T3',
        },
        {
            // rid: 'r1',
            maxBitrate: 700000,
            scalabilityMode: 'S1T3',
        },
        {
            // rid: 'r2',
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
let screenSharingInfo

// Create Audio Visualizer
const createAudioVisualizer = (track, id, appendTo) => {
    const newElement = document.createElement('canvas')
    newElement.className = 'audio-visualizer'
    newElement.id = 'av-' + id
    const attachTo = document.getElementById(`td-${appendTo}`)
    if (attachTo){
        attachTo.appendChild(newElement)
    
        const canvas = document.getElementById(`av-${id}`);
        const ctx = canvas.getContext('2d');
    
        // Access the microphone audio stream (replace with your stream source)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let newTheAudio = new MediaStream([track])
    
        const audioSource = audioContext.createMediaStreamSource(newTheAudio);
        audioSource.connect(analyser);
    
        // Function to draw the single audio bar
        function drawBar() {
            analyser.getByteFrequencyData(dataArray);
    
            const barHeight = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            canvas.style.boxShadow = `inset 0 0 0 ${barHeight/10}px green, 0 0 0 ${barHeight/10}px green`
    
            requestAnimationFrame(drawBar);
        }
    
        // Start drawing the single bar
        drawBar();
    }
}

// Starting Video Local
const streamSuccess = async (stream) => {
    let initialVideo = localStorage.getItem('is_video_active')
    let initialAudio = localStorage.getItem('is_audio_active')
    if (initialVideo == 'true'){
        isCameraOn = true
    } else {
        isCameraOn = false
    }
    if (initialAudio == 'true'){
        isMicOn = true
    } else {
        isMicOn = false
    }
    store.setLocalStream(stream)
    console.log('- Stream Success : ', initialAudio, " ", initialVideo)

    if (!isMicOn){
        const micImage = document.getElementById("mic-image");
        micImage.src = "/assets/pictures/micOff.png";
        let turningOffMic = document.getElementById('local-mic')
        turningOffMic.src = "/assets/pictures/micOff.png";
        const micButton = document.getElementById("user-mic-button");
        micButton.classList.replace('button-small-custom', 'button-small-custom-clicked')

        stream.getAudioTracks()[0].enabled = false
    }
    if (!isCameraOn){
        const turnOffCamera = await createImageTrack('/assets/pictures/unknown.jpg')
        const videoTrack = await createVideoTrackFromImageTrack(turnOffCamera)
        stream.getVideoTracks()[0].stop()
        let newStream = new MediaStream([stream.getAudioTracks()[0], videoTrack])
        let turningOffPicture = document.getElementById('img-current-user-video')
        turningOffPicture.className = 'video-off'
        let cameraIcons = document.getElementById('turn-on-off-camera-icons')
        let cameraButtons = document.getElementById('user-turn-on-off-camera-button')
        cameraButtons.className = 'btn button-small-custom-clicked'
        cameraIcons.classList.remove('fa-video');
        cameraIcons.classList.add('fa-video-slash');
        isCameraOn = false
        store.setLocalStream(newStream)
        stream = newStream
    }

    // Set Local Stream To Global Variabel
    // Set Stream To Local Video
    localVideo.srcObject = stream
    // Add Current Stream To All Stream For Pagination Purpose
    allStream[socket.id] = { video: { track: stream.getVideoTracks()[0], id: 'current-user-video', username: localStorage.getItem('username') ? localStorage.getItem('username') : 'unknown', kind: 'video', status: isCameraOn }, audio: { track: stream.getAudioTracks()[0], id: 'current-user-audio', username: localStorage.getItem('username') ? localStorage.getItem('username') : 'unknown', kind: 'audio', status: isMicOn } }

    // Preparing For Producing Audio Params And Video Params 
    audioParams = { track: stream.getAudioTracks()[0], ...audioParams };
    videoParams = { track: stream.getVideoTracks()[0], ...videoParams };

    const canvas = document.getElementById('av-current-user-audio');
    const ctx = canvas.getContext('2d');

    // Access the microphone audio stream (replace with your stream source)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let theAudio = stream.getAudioTracks()[0]
    let newTheAudio = new MediaStream([theAudio])

    const audioSource = audioContext.createMediaStreamSource(newTheAudio);
    audioSource.connect(analyser);

    // Function to draw the single audio bar
    const drawBar = () => {
        analyser.getByteFrequencyData(dataArray);

        const barHeight = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        // console.log('- Volume : ', barHeight)
        canvas.style.boxShadow = `inset 0 0 0 ${barHeight/10}px green, 0 0 0 ${barHeight/10}px green`
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        // ctx.fillStyle = `rgb(${barHeight + 100}, 255, 100)`;
        // ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

        requestAnimationFrame(drawBar);
    }

    // Start drawing the single bar
    drawBar();

    // Set My Username
    const setUsername = document.getElementById('my-username')
    setUsername.textContent = localStorage.getItem('username')

    // Add 1 Total Users When Joining
    totalUsers++

    // Joining Room
    joinRoom()
}

// Check Initial Configuration
const checkLocalStorage = () => {
    // Set Room Id
    localStorage.setItem("room_id", roomName)
    // Check Config For Audio Devices, Selected Audio Device, Video Devices, Selected Video Devices, Room Id, Username
    if (!localStorage.getItem('audioDevices') || !localStorage.getItem('room_id') || !localStorage.getItem('selectedVideoDevices') || !localStorage.getItem('videoDevices') || !localStorage.getItem('username') || !localStorage.getItem('selectedAudioDevices')) {
        const url = window.location.pathname;
        const parts = url.split('/');
        const roomName = parts[2];
        const goTo = 'lobby/' + roomName;
        const newURL = window.location.origin + "/" + goTo;
        // If There Is Not, It Will Redirect To Lobby
        window.location.href = newURL;
    }
}

// Adjust Template Normal Mode
const normalTemplate = () => {
    if (totalUsers <= 2) {
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container');
        });
        currentTemplate = 'user-video-container'
    } else if (totalUsers == 3) {
        // Check Total User Is 3 To Adjust Template
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-3');
        });
        currentTemplate = 'user-video-container-3'
    } else if (totalUsers >= 4 && totalUsers <= 6) {
        // Check Total User Is Between 4 And 6 To Adjust Template
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-6');
        });
        currentTemplate = 'user-video-container-6'
    } else if (totalUsers >= 7 && totalUsers <= 8) {
        // Check Total User Is 7 Or 8 To Adjust Template
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-8');
        });
        currentTemplate = 'user-video-container-8'
    } else {
        // Check Total User Is More Than 8 To Adjust Template
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-12');
        });
        currentTemplate = 'user-video-container-12'
    }
}

// Screen Sharing Template
const screenSharingTemplate = () => {
    const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
    userVideoContainers.forEach((container, index) => {
        container.classList.remove(currentTemplate);
        container.classList.add('user-video-container-screen-sharing');
    });
    currentTemplate = 'user-video-container-screen-sharing'
}

// Changing Layout User Video
const changeLayout = (isSharing) => {
    // Screen Sharing Layout
    if (isSharing) {
        videoContainer.id = 'video-container-screen-sharing'
        const fullContainer = document.getElementById('full-container-id')
        let newDiv = document.createElement("div");

        newDiv.id = "screen-sharing-container";

        fullContainer.insertBefore(newDiv, fullContainer.firstChild);

        if (!currentTemplate) {
            currentTemplate = 'user-video-container'
        }

        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-screen-sharing');
        });
        currentTemplate = 'user-video-container-screen-sharing'

        let screenSharingElement = document.getElementById('screen-sharing-container')
        screenSharingElement.innerHTML = '<video id="' + 'screen-sharing' + '" autoplay class="user-video" ></video>'

        videoContainer = document.getElementById('video-container-screen-sharing')
    } else {
        // Normal Layout
        videoContainer.id = 'video-container'
        let removeDiv = document.getElementById('screen-sharing-container')
        if (removeDiv) {
            removeDiv.parentNode.removeChild(removeDiv)
        }
        normalTemplate()
        videoContainer = document.getElementById('video-container')
    }
}

// Screen Sharing
const getScreenSharing = async () => {
    let screenShareButton = document.getElementById('user-screen-share-button')
    try {
        
        // Check If There Is No One Screen Sharing
        if (!isScreenSharing) {
            // Change Layout Based On Which Mode
            changeLayout(true)
            // Get Screen Sharing Id
            let screenSharingVideo = document.getElementById('screen-sharing')
            // Get Screen Sharing Stram
            screenSharingStreamsGlobal = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    displaySurface: "window",
                    chromeMediaSource: "desktop",
                },
            });
            // Insert Screen Sharing Stream To Element
            screenSharingVideo.srcObject = screenSharingStreamsGlobal
            // Preparing Screen Sharing Producer
            screenSharingParams = { track: screenSharingStreamsGlobal.getVideoTracks()[0], ...screenSharingParams }
            // Create Screen Sharing Producer
            screenSharingProducer = await producerTransport.produce(screenSharingParams);
            // Function When Screen Sharing Ended
            screenSharingStreamsGlobal.getVideoTracks()[0].onended = function () {
                // Signaling Other User That Screen Sharing Is Ended
                for (const key in producersDetails) {
                    socket.emit('screen-sharing', ({ videoProducerId: screenSharingProducer.id, audioProducerId: audioProducer.id, socketId: key, isSharing: false, producerId: screenSharingProducer.id }))
                }
                // Closing Screen Sharing Producer
                socket.emit('screen-sharing-producer', ({ videoProducerId: screenSharingProducer.id, audioProducerId: audioProducer.id, socketId: socket.id, isSharing: false, producerId: screenSharingProducer.id, room: localStorage.getItem('room_id') }))
                // Set Screen Sharing is False
                isScreenSharing = false
                // Change Layout To Normal Mode
                changeLayout(false)
                // Set Screen Sharing Global to Null
                screenSharingStreamsGlobal = null
                // Reset Screen Sharing Params
                screenSharingParams = { params }
                // Set Who Is Screen Sharing To Null
                screenSharingInfo = null
            
                screenShareButton.classList.replace('button-small-custom-clicked', 'button-small-custom')

            };

            // for (const key in producersDetails) {
            //     socket.emit('screen-sharing', ({ videoProducerId: videoProducer.id, audioProducerId: audioProducer.id, socketId: key, isScreenSharing: true }))
            // }

            screenSharingProducer.on('trackended', () => {
                console.log('video track ended')

            })

            screenSharingProducer.on('transportclose', () => {
                console.log('video transport ended')
            })

            // Change Current Template
            if (!currentTemplate) {
                currentTemplate = 'user-video-container'
            }

            // Add Info Who Is Screen Sharing
            screenSharingInfo = { socketId: socket.id }
            isScreenSharing = true
            screenShareButton.classList.replace('button-small-custom', 'button-small-custom-clicked')
        } else if (isScreenSharing && screenSharingInfo.socketId != socket.id) {
            // If Someone Is Trying To Sharing Their Screen When Someone Is Already To Screen Share, Warn Them
            let as = document.getElementById("alert-screensharing");
            as.className = "show";
            // Show Warning
            setTimeout(() => { as.className = as.className.replace("show", ""); }, 3000);
        } else {
            // Stopping Screen Sharing and Set All Configuration To Normal Mode
            screenSharingStreamsGlobal.getTracks().forEach((track) => track.stop());
            screenSharingInfo = null
            isScreenSharing = false
            changeLayout(false)
            for (const key in producersDetails) {
                socket.emit('screen-sharing', ({ videoProducerId: screenSharingProducer.id, audioProducerId: audioProducer.id, socketId: key, isSharing: false, producerId: screenSharingProducer.id }))
            }
            socket.emit('screen-sharing-producer', ({ videoProducerId: screenSharingProducer.id, audioProducerId: audioProducer.id, socketId: socket.id, isSharing: false, producerId: screenSharingProducer.id, room: localStorage.getItem('room_id') }))
            screenSharingParams = { params }

            screenSharingStreamsGlobal = null
            screenShareButton.classList.replace('button-small-custom-clicked', 'button-small-custom')
        }
    } catch (error) {
        changeLayout(false)
        console.log(error)
        screenSharingInfo = null
        isScreenSharing = false
        screenShareButton.className = 'btn button-small-custom'
    }
}

// Emitting Join Room and Getting RTP Capabilities From Server and Creating Media Devices
const joinRoom = () => {
    // Emitting Signal To Server
    // Getting RTP Capabilities
    socket.emit('joinRoom', { roomName, username: localStorage.getItem("username") }, (data) => {
        console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`)
        rtpCapabilities = data.rtpCapabilities
        createDevice()
    })
}

// Get Local Stream
const getLocalStream = () => {
    // Config From Lobby
    let config = {
        video: { deviceId: { exact: localStorage.getItem('selectedVideoDevices') } },
        audio: { deviceId: { exact: localStorage.getItem('selectedAudioDevices') } }
    }
    navigator.mediaDevices.getUserMedia(config)
        .then(streamSuccess)
        .catch(error => {
            let ae = document.getElementById("alert-error");
            ae.className = "show";
            ae.innerHTML = `Error : ${error.message}`
            // Show Warning
            setTimeout(() => { 
                ae.className = ae.className.replace("show", ""); 
                ae.innerHTML = ``
            }, 3000);
            console.log(error.message)
        })
}

// Creating Media Devices and load RTPCapabilities to MediaSoup Client and Create Send Transport
const createDevice = async () => {
    try {
        // Create Device
        device = new mediasoupClient.Device()

        // Load Device
        await device.load({
            routerRtpCapabilities: rtpCapabilities
        })

        console.log('- Device RTP Capabilities', device.rtpCapabilities)

        // Create Send Transport
        createSendTransport()

    } catch (error) {
        console.log(error)
        if (error.name === 'UnsupportedError')
            console.warn('browser not supported')
    }
}

// Create User Online List
const createUserList = (username) => {
    let userList = document.getElementById('user-list')
    let myUsername = document.createElement('p')
    myUsername.innerHTML = username
    myUsername.id = 'user-'+username
    userList.appendChild(myUsername)
}

const showLoadingScreen = () => {
    document.getElementById('loading-screen').style.display = 'block';
}

const hideLoadingScreen = () => {
    document.getElementById('loading-screen').style.display = 'none';
}


// Create Send Transport
const createSendTransport = () => {
    // Signaling To Server
    socket.emit('createWebRtcTransport', { consumer: false }, ({ params }) => {
        if (params.error) {
            console.log(params.error)
            return
        }

        console.log("- Create Send Transport : ", params)

        // Producing Producer Transport
        producerTransport = device.createSendTransport(params)

        // Get DLTS Parameter
        producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                console.log("- Producer Transport Connecting")
                // Signaling To Server and Sending DLTS Parameters
                await socket.emit('transport-connect', {
                    dtlsParameters,
                })

                callback()

            } catch (error) {
                errback(error)
            }
        })  

        // Producing Transport and Get Parameters
        producerTransport.on('produce', async (parameters, callback, errback) => {
            console.log("- Create Web RTC Transport / Producer : ", parameters)

            try {
                // Signaling to Server And Sending Parameters
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

        producerTransport.on('connectionstatechange', async (e) => {
            console.log('- State Change Producer : ', e)
            let producerStatus = document.getElementById('producer-status')
            let connectionStatusElement = document.getElementById('connection-status-id')
            let buttonRecord = document.getElementById('user-record-button')
            let buttonMic = document.getElementById('user-mic-button')
            let buttonHangUp = document.getElementById('user-hang-up-button')
            let buttonSwitchCamera = document.getElementById('user-switch-camera-button')
            let buttonTurnOffCamera = document.getElementById('user-turn-on-off-camera-button')
            let buttonScreenShare = document.getElementById('user-screen-share-button')
            // let buttonChat = document.getElementById('user-chat-button')
            let buttonShare = document.getElementById('share-link-button')
            let buttonUserList = document.getElementById('user-list-button')
            // Enabling Button When Producer Is Connecting
            if (e == 'connected'){
                hideLoadingScreen()
                producerStatus.innerHTML = 'Connected'
                createUserList(localStorage.getItem('username'))
                // console.log('- Status Element : ', )
                connectionStatusElement.style.color = 'green'

                buttonRecord.removeAttribute('disabled', 'false')
                buttonMic.removeAttribute('disabled', 'false')
                buttonHangUp.removeAttribute('disabled', 'false')
                buttonSwitchCamera.removeAttribute('disabled', 'false')
                buttonTurnOffCamera.removeAttribute('disabled', 'false')
                buttonScreenShare.removeAttribute('disabled', 'false')
                // buttonChat.removeAttribute('disabled', 'false')
                buttonShare.removeAttribute('disabled', 'false')
                buttonUserList.removeAttribute('disabled', 'false')
                // if (localStorage.getItem('is_video_active') == 'false'){
                //     allStream[socket.id].video.status = false
                //     allStream[socket.id].video.track.stop()
                // }
            } 
            if (e == 'connecting'){
                showLoadingScreen()
                producerStatus.innerHTML = 'Connecting...'
                connectionStatusElement.style.color = '#bbb'
                buttonRecord.setAttribute('disabled', 'true')
                buttonMic.setAttribute('disabled', 'true')
                buttonHangUp.setAttribute('disabled', 'true')
                buttonSwitchCamera.setAttribute('disabled', 'true')
                buttonTurnOffCamera.setAttribute('disabled', 'true')
                buttonScreenShare.setAttribute('disabled', 'true')
                // buttonChat.setAttribute('disabled', 'true')
                buttonShare.setAttribute('disabled', 'true')
            } 
            const url = window.location.pathname;
            const parts = url.split('/');
            const roomName = parts[2];
            const goTo = 'lobby/' + roomName;
            if (e == 'failed'){
                showLoadingScreen()
                producerStatus.innerHTML = 'Failed'
                connectionStatusElement.style.color = 'red'
                buttonRecord.setAttribute('disabled', 'true')
                buttonMic.setAttribute('disabled', 'true')
                buttonHangUp.setAttribute('disabled', 'true')
                buttonSwitchCamera.setAttribute('disabled', 'true')
                buttonTurnOffCamera.setAttribute('disabled', 'true')
                buttonScreenShare.setAttribute('disabled', 'true')
                // buttonChat.setAttribute('disabled', 'true')
                buttonShare.setAttribute('disabled', 'true')
                const newURL = window.location.origin + "/" + goTo;
                window.location.href = newURL;
            } 
            if (e == 'disconnected'){
                showLoadingScreen()
                producerStatus.innerHTML = 'Disconnected'
                connectionStatusElement.style.color = 'red'
                buttonRecord.setAttribute('disabled', 'true')
                buttonMic.setAttribute('disabled', 'true')
                buttonHangUp.setAttribute('disabled', 'true')
                buttonSwitchCamera.setAttribute('disabled', 'true')
                buttonTurnOffCamera.setAttribute('disabled', 'true')
                buttonScreenShare.setAttribute('disabled', 'true')
                // buttonChat.setAttribute('disabled', 'true')
                buttonShare.setAttribute('disabled', 'true')
                // const newURL = window.location.origin + "/" + goTo;
                // window.location.href = newURL;
            }
        })

        // Connecting Send Transport
        connectSendTransport()
    })
}

// Connecting Send Transport and Producing Audio and Video Producer
const connectSendTransport = async () => {
    // Producing Audio And Video Transport
    audioProducer = await producerTransport.produce(audioParams);
    videoProducer = await producerTransport.produce(videoParams);

    socket.emit('am-i-host', {socketId: socket.id, roomName: localStorage.getItem('room_id')}, (data) => {
        if (data.authority == 'Host'){
            addMuteAllButton()
            document.getElementById('my-username').innerHTML = localStorage.getItem('username') + ' ( Host )'
            console.log('- Authority : ', data.authority)
            host = socket.id
        }
    })

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
    // Checking If Remote Proder Id Is Already Exists
    if (consumingTransports.includes(remoteProducerId)) return;
    consumingTransports.push(remoteProducerId);

    // Creating WebRtc Transport and Get Params From Server
    await socket.emit('createWebRtcTransport', { consumer: true }, ({ params }) => {
        if (params.error) {
            console.log(params.error)
            return
        }
        console.log("- New User Entering With Consumer Id: ", params.id)

        // Creating Receive Transport
        let consumerTransport
        try {
            // Create Receive Transport
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

        // console.log('- Cunsomer Transport : ', consumerTransport)

        // Connecting Receive Transport
        connectRecvTransport(consumerTransport, remoteProducerId, params.id)
    })
}

// Socket Collection

// Error Collection
socket.on('error-server', (error) => {
    console.log(error)
})

// Initiating When Socket is Estabilished
socket.on('connection-success', ({ socketId }) => {
    console.log(socketId)
    checkLocalStorage()
    getLocalStream()
})

// Mute All
socket.on('mute-all', (data) => {
    const micButton = document.getElementById("user-mic-button");
    const micImage = document.getElementById("mic-image");
    let localMic = document.getElementById('local-mic')
    let stream = store.getState()
    muteAll = true
    micButton.classList.replace('button-small-custom', 'button-small-custom-clicked')
    for (const key in producersDetails) {
        socket.emit('mic-config', ({ videoProducerId: videoProducer.id, audioProducerId: audioProducer.id, socketId: key, isMicActive: false }))
    }
    allStream[socket.id].audio.track.enabled = false
    allStream[socket.id].audio.status = false
    stream.localStream.getAudioTracks()[0].enabled = false
    if (localMic) localMic.src = "/assets/pictures/micOff.png";
    micImage.src = "/assets/pictures/micOff.png";
    lockedMic = true
    localStorage.setItem('is_mic_active', false)
    isMicOn = false
})

// Change Host
socket.on('change-host', ({newHost}) => {
    host = newHost
    lockedMic = false
    if (socket.id == newHost){
        addMuteAllButton()
    }
})

// Mic Configuration
// Receive Signaling To Change Mic Icon User (Off / On)
// Function to recheck for videoId until it exists or a maximum number of attempts
function checkIfUserIsDisplayed(videoProducerId, audioProducerId, isMicActive, maxAttempts = 10, socketId) {
    let attempts = 0;

    if (allStream[socketId].audio){
        allStream[socketId].audio.track.enabled = isMicActive
        allStream[socketId].audio.status = isMicActive
    }

    const checkVideoId = () => {
        let videoId = document.querySelector('#td-' + videoProducerId);

        if (!videoId) {
            attempts++;

            if (attempts < maxAttempts) {
                setTimeout(checkVideoId, 1000); 
            } else {
                console.log(`Max attempts reached. videoId not found.`);
            }
        } else {

            let micPicture = videoId.querySelector('img');
            let audioId = document.getElementById(audioProducerId);
            audioId.srcObject.getAudioTracks()[0].enabled = isMicActive;

            if (!isMicActive) {
                micPicture.src = "/assets/pictures/micOff.png";
            } else {
                micPicture.src = "/assets/pictures/micOn.png";
            }
        }
    };

    checkVideoId(); // Start checking
}

// Mute Mic Other User
socket.on('mic-config', (data) => {
    checkIfUserIsDisplayed(data.videoProducerId, data.audioProducerId, data.isMicActive, 10, data.socketId);
});

// socket.on('mic-config', (data) => {
//     let videoId = document.querySelector('#td-' + data.videoProducerId);
//     if (allStream[data.socketId].audio){
//         allStream[data.socketId].audio.track.enabled = data.isMicActive
//         for (const firstKey in allStream) {
//             for (const secondKey in allStream[firstKey]) {
//                 if (allStream[firstKey][secondKey].id == data.audioProducerId) {
//                     allStream[firstKey][secondKey].track.enabled = data.isMicActive
//                     allStream[firstKey][secondKey].status = data.isMicActive
//                 }
//             }
//         }
//     }

//     // Changing Mic Icon
//     if (videoId) {
//         let micPicture = videoId.querySelector('img');
//         let audioId = document.getElementById(data.audioProducerId);
//         audioId.srcObject.getAudioTracks()[0].enabled = data.isMicActive
//         if (!data.isMicActive) {
//             micPicture.src = "/assets/pictures/micOff.png";
//         } else {
//             micPicture.src = "/assets/pictures/micOn.png";
//         }
//     }
// })

// Screen Sharing Socket
socket.on('screen-sharing', ({ videoProducerId, audioProducerId, isSharing, remoteProducerId }) => {
    if (!isSharing) {
        // Closing Consumer Screen Sharing Trannsport
        const producerToClose = consumerTransports.find(transportData => transportData.producerId === remoteProducerId)
        producerToClose.consumerTransport.close()
        producerToClose.consumer.close()
        // Changing Layout And Reset Screen Share Parameter
        screenSharingParams = { params }
        isScreenSharing = false
        screenSharingStreamsGlobal = null
        changeLayout(false)
        // Deleting Screen Sharing Stream
        for (const firstKey in allStream) {
            for (const secondKey in allStream[firstKey]) {
                if (allStream[firstKey][secondKey].id == remoteProducerId && secondKey == 'screenSharing') {
                    delete allStream[firstKey][secondKey]
                    break
                }
            }
        }
        // Deleting Screen Sharing Details
        for (const firstKey in producersDetails) {
            for (const secondKey in producersDetails[firstKey]) {
                if (producersDetails[firstKey][secondKey] == videoProducerId && secondKey == 'screenSharing') {
                    console.log('- Deleting : ', producersDetails[firstKey][secondKey])
                    delete producersDetails[firstKey][secondKey]
                    break
                }
            }
        }
    }
})

// Signaling New Producer
socket.on('new-producer', ({ producerId }) => {
    signalNewConsumerTransport(producerId)
})

// Cleaning When User Is Disconnected
socket.on('producer-closed', ({ remoteProducerId }) => {
    try {
        // Close Transport
        const producerToClose = consumerTransports.find(transportData => transportData.producerId === remoteProducerId)
        producerToClose.consumerTransport.close()
        producerToClose.consumer.close()

        // Deleting Disconnected Stream
        for (const firstkey in allStream) {
            for (const secondkey in allStream[firstkey]) {
                // Check If It Is Screen Sharing Stream
                if (allStream[firstkey][secondkey].id == remoteProducerId && allStream[firstkey][secondkey].kind != 'screen-sharing') {
                    // Decrease Total Users By 1
                    totalUsers--
                    delete allStream[firstkey]
                    break
                } else if (allStream[firstkey][secondkey].kind == 'screen-sharing') {
                    // If It Is Delete Only Screen Sharing Stream
                    delete allStream[firstkey][secondkey].kind
                    break
                }
            }
        }

        // Deleting Producer Details
        for (const firstKey in producersDetails) {
            for (const secondKey in producersDetails[firstKey]) {
                // Deleting If Producers Is Screen Sharing Only
                if (producersDetails[firstKey][secondKey] == remoteProducerId && secondKey == 'screenSharing') {
                    delete producersDetails[firstKey][secondKey]
                    break
                }
                // Deleting Producers
                if (producersDetails[firstKey][secondKey] == remoteProducerId) {
                    // console.log('- Deleting : ', producersDetails[firstKey])
                    let deleteUser = document.getElementById('user-'+producersDetails[firstKey].name)
                    deleteUser.remove()
                    delete producersDetails[firstKey]
                    break
                }
            }
        }

        if (!isScreenSharing) {
            normalTemplate()
        } else {
            screenSharingTemplate()
        }


        // Filtering Consumer Transports
        consumerTransports = consumerTransports.filter(transportData => transportData.producerId !== remoteProducerId)

        console.log('- Remove Producer : ', remoteProducerId, " - Producer Details : ", producersDetails)

        // Deleting Consumer Elements
        const removeElement = document.getElementById(`td-${remoteProducerId}`)
        if (removeElement){
            removeElement.remove()
        }
        // if (document.getElementById(`td-${remoteProducerId}`)) {
        //     videoContainer.removeChild(document.getElementById(`td-${remoteProducerId}`))
        // }

        // Change Layout To Normal For Current User
        if (screenSharingInfo) {
            if (screenSharingInfo.producerId == remoteProducerId) {
                isScreenSharing = false
                changeLayout(false)
            }
        }

        let checkPage = videoContainer.querySelectorAll("[id*='td']")
        // console.log('- Check Page : ', checkPage)

        // if (currentPage != 0) {
        //     createPaginationLeft()
        // }

        // Create Right Pagination If Total Users More Than Limited Per Page
        // if (totalUsers > limitedPerPage) {
        //     createPaginationRight()
        // }

        // Checking Pagination
        const isExistLeft = document.getElementById('pagination-left-container')
        const isExistRight = document.getElementById('pagination-right-container')

        // Deleting Pagination
        if (isExistLeft) isExistLeft.remove()
        if (isExistRight) isExistRight.remove()

        // Calculate Total Page
        let totalPage = Math.ceil(totalUsers / limitedPerPage)

        if (totalPage > 1 && currentPage == 0){
            createPaginationRight()
        } else if (currentPage != 0 && currentPage + 1 < totalPage){
            createPaginationLeft()
            createPaginationRight()
        } else if (currentPage != 0 && currentPage + 1 == totalPage){
            createPaginationLeft()
        }


        let counter = 0

        // Reset All Video
        let deleteVideo = videoContainer.querySelectorAll("[id*='td']")
        if (deleteVideo.length == 0){

            // Create Right Pagination If Total Users More Than Limited Per Page
            if (totalUsers > limitedPerPage) {
                createPaginationRight()
            }

            // Reset Pagination
            paginationStartIndex = 0
            paginationEndIndex = limitedPerPage - 1
            currentPage = 0

            // Displaying All Users With Limit
            for (const firstKey in allStream) {
                if (counter >= paginationStartIndex && counter <= paginationEndIndex) {
                    for (const secondKey in allStream[firstKey]) {
                        if (allStream[firstKey][secondKey].kind != 'screen-sharing' && allStream[firstKey][secondKey].kind == 'video') {
                            let authority = false
                            if (firstKey == host){
                                authority = true
                            }
                            createVideo(allStream[firstKey][secondKey].id, secondKey, allStream[firstKey][secondKey].track, allStream[firstKey][secondKey].username, allStream[firstKey].audio.track.enabled, authority, allStream[firstKey].video.status)
                            createAudioVisualizer(allStream[firstKey].audio.track, allStream[firstKey].audio.id, allStream[firstKey].video.id)
                            if (allStream[firstKey][secondKey].serverConsumerId){
                                socket.emit('consumer-resume', { serverConsumerId: allStream[firstKey][secondKey].serverConsumerId })
                            }
                        }
                    }
                } 
                else {
                    // Pausing Video Consumer
                    for (const secondKey in allStream[firstKey]) {
                        if (allStream[firstKey][secondKey].kind != 'screen-sharing' && allStream[firstKey][secondKey].kind == 'video') {
                            console.log('- Paused : ', allStream[firstKey][secondKey].serverConsumerId)
                            if (allStream[firstKey][secondKey].serverConsumerId){
                                socket.emit('consumer-pause', { serverConsumerId: allStream[firstKey][secondKey].serverConsumerId })
                            }
                        }
                    }
                }
                counter++
            }
        } else {
            // Delete All Video Element
            deleteVideo.forEach((element) => {
                element.remove()
            })
    
            // Displaying All Users With Limit
            for (const firstKey in allStream) {
                if (counter >= paginationStartIndex && counter <= paginationEndIndex) {
                    for (const secondKey in allStream[firstKey]) {
                        if (allStream[firstKey][secondKey].kind != 'screen-sharing' && allStream[firstKey][secondKey].kind == 'video') {
                            let authority = false
                            if (firstKey == host){
                                authority = true
                            }
                            createVideo(allStream[firstKey][secondKey].id, secondKey, allStream[firstKey][secondKey].track, allStream[firstKey][secondKey].username, allStream[firstKey].audio.track.enabled, authority, allStream[firstKey].video.status)
                            createAudioVisualizer(allStream[firstKey].audio.track, allStream[firstKey].audio.id, allStream[firstKey].video.id)
                            if (allStream[firstKey][secondKey].serverConsumerId){
                                socket.emit('consumer-resume', { serverConsumerId: allStream[firstKey][secondKey].serverConsumerId })
                            }
                        }
                    }
                } 
                else {
                    // Pausing Video Consumer
                    for (const secondKey in allStream[firstKey]) {
                        if (allStream[firstKey][secondKey].kind != 'screen-sharing' && allStream[firstKey][secondKey].kind == 'video') {
                            console.log('- Paused : ', allStream[firstKey][secondKey].serverConsumerId)
                            if (allStream[firstKey][secondKey].serverConsumerId){
                                socket.emit('consumer-pause', { serverConsumerId: allStream[firstKey][secondKey].serverConsumerId })
                            }
                        }
                    }
                }
                counter++
            }
        }
    } catch (error) {
        console.log(error)
    }

})

// Get Producers
const getProducers = () => {
    socket.emit('getProducers', producerIds => {
        console.log("- Get Product Id : ", producerIds)
        // Informing Consumer Transport
        producerIds.forEach(signalNewConsumerTransport)
    })
}

// Create Video
const createVideo = (remoteId, kind, track, username, micIcon, authority, isVideoActive) => {
    const newElem = document.createElement('div')
    newElem.setAttribute('id', `td-${remoteId}`)
    let newUsername = username
    if (authority){
        newUsername = username + ' ( Host )'
    }
    let isVideo
    if (!isVideoActive || track.canvas){
        isVideo = `<img src="/assets/pictures/unknown.jpg" class="video-off" id="img-${remoteId}"/>`
    } else {
        isVideo = `<img src="/assets/pictures/unknown.jpg" class="video-on" id="img-${remoteId}"/>`
    }
    if (kind == 'video') {
        // If Current User, Get Track From Global Video
        if (remoteId == 'current-user-video') {
            let stream = store.getState()
            track = stream.localStream
            // Check If Mic Is On Or Off
            let isMic
            if (stream.localStream.getAudioTracks()[0].enabled) {
                isMic = 'micOn.png'
            } else {
                isMic = 'micOff.png'
            }
            newElem.setAttribute('class', currentTemplate)
            newElem.innerHTML = '<div class="icons-mic"><img src="/assets/pictures/' + isMic + '" class="mic-image" id="local-mic"/></div><video id="' + remoteId + '" autoplay class="user-video" muted></video>'+ isVideo +'<div class="username">' + newUsername + '</div>'
            // Append Element And Set Track
            videoContainer.appendChild(newElem)
            document.getElementById(remoteId).srcObject = track
        } else {
            // Create Video For Other Users
            let isMic
            if (micIcon) {
                isMic = 'micOn.png'
            } else {
                isMic = 'micOff.png'
            }
            newElem.setAttribute('class', currentTemplate)
            newElem.innerHTML = '<div class="icons-mic"><img src="/assets/pictures/' + isMic + '" poster="/assets/pictures/unknown.jpg" preload="auto" class="mic-image" /></div><video id="' + remoteId + '" autoplay class="user-video" ></video>'+ isVideo +'<div class="username">' + newUsername + '</div>'
            // Append Element And Set Track
            videoContainer.appendChild(newElem)
            document.getElementById(remoteId).srcObject = new MediaStream([track])
        }
    }
}

const createImageTrack = async (imagePath) => {
    const image = new Image();
    image.src = imagePath;
    await image.decode(); // Wait for the image to load

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const stream = canvas.captureStream();
    const track = stream.getVideoTracks()[0];

    return track;
}

const createVideoTrackFromImageTrack = async (imageTrack) => {
    // Get the MediaStream from the image track
    const imageStream = new MediaStream([imageTrack]);

    // Create a new MediaStream containing only the image track
    const videoStream = new MediaStream();
    videoStream.addTrack(imageTrack);

    // Get the video track from the video stream
    const videoTrack = videoStream.getVideoTracks()[0];

    return videoTrack;
};


// Create Screen Sharing
const createScreenSharing = (track) => {
    let screenSharingVideo = document.getElementById('screen-sharing')
    // if (!screenSharingVideo.srcObject){
    // }
    screenSharingVideo.srcObject = new MediaStream([track])
}

// Create Pagination
const createPaginationRight = () => {
    const isExist = document.getElementById('pagination-right-container')
    if (!isExist) {
        let fullContainer = document.getElementById('full-container-id')
        if (isScreenSharing) {
            fullContainer = document.getElementById('video-container-screen-sharing')
        }
        const newPaginationRightContainer = document.createElement('div')
        newPaginationRightContainer.setAttribute('class', `pagination-right`)
        newPaginationRightContainer.setAttribute('id', `pagination-right-container`)
        const newPaginationRightButton = document.createElement('button')
        newPaginationRightButton.setAttribute('class', `pagination-button`)
        newPaginationRightButton.setAttribute('id', `slide-right`)
        const newPaginationRightIcon = document.createElement('i')
        newPaginationRightIcon.setAttribute('class', 'fas fa-arrow-circle-right fa-lg')
        newPaginationRightButton.appendChild(newPaginationRightIcon)
        newPaginationRightContainer.appendChild(newPaginationRightButton)

        // Function When Arrow Is Clicked
        newPaginationRightButton.addEventListener('click', () => {
            // Increase Start and End Index
            paginationStartIndex = paginationStartIndex + limitedPerPage
            paginationEndIndex = paginationEndIndex + limitedPerPage
            // Change Current Page
            currentPage++

            let counter = 0
            // Remove Video Container
            // while (videoContainer.firstChild) {
            //     videoContainer.removeChild(videoContainer.firstChild);
            // }

            // Delete Current User
            // let currentUser = document.getElementById('td-current-user-video')
            // if (currentUser){
            //     currentUser.remove()
            // }

            // Remove Element to Replace The Next Page
            let deleteVideo = videoContainer.querySelectorAll("[id*='td']")
            deleteVideo.forEach((element) => {
                element.remove()
            })

            // Diplaying Video
            for (const firstKey in allStream) {
                // Limiting Displayed Video
                if (counter >= paginationStartIndex && counter <= paginationEndIndex) {
                    for (const secondKey in allStream[firstKey]) {
                        if (allStream[firstKey][secondKey].kind != 'screen-sharing' && allStream[firstKey][secondKey].kind == 'video') {
                            console.log('- Check : ', allStream[firstKey].audio.track.enabled)
                            let authority = false
                            if (firstKey == host){
                                authority = true
                            }
                            createVideo(allStream[firstKey][secondKey].id, secondKey, allStream[firstKey][secondKey].track, allStream[firstKey][secondKey].username, allStream[firstKey].audio.track.enabled, authority, allStream[firstKey].video.status)
                            // Resume Displayed Video Consumer
                            if (allStream[firstKey][secondKey].serverConsumerId){
                                socket.emit('consumer-resume', { serverConsumerId: allStream[firstKey][secondKey].serverConsumerId })
                            }
                        }
                    }
                } 
                else {
                    // Pausing Video Consumer
                    for (const secondKey in allStream[firstKey]) {
                        if (allStream[firstKey][secondKey].kind != 'screen-sharing' && allStream[firstKey][secondKey].kind == 'video') {
                            console.log('- Paused : ', allStream[firstKey][secondKey].serverConsumerId)
                            if (allStream[firstKey][secondKey].serverConsumerId){
                                socket.emit('consumer-pause', { serverConsumerId: allStream[firstKey][secondKey].serverConsumerId })
                            }
                        }
                    }
                }
                counter++
            }
            // Create Left Arrow
            if (currentPage != 0) {
                createPaginationLeft()
            }

            // Calculate Total Page
            let totalPage = Math.ceil(totalUsers / limitedPerPage)

            // Remove Rigt Arrow If Its End Of Page
            if (totalPage == currentPage + 1) {
                newPaginationRightContainer.remove()
            }
        })
        fullContainer.appendChild(newPaginationRightContainer)
    }
}

const createPaginationLeft = () => {
    const isExist = document.getElementById('pagination-left-container')
    if (!isExist) {
        let fullContainer = document.getElementById('full-container-id')
        if (isScreenSharing) {
            fullContainer = document.getElementById('video-container-screen-sharing')
        }
        const newPaginationleftContainer = document.createElement('div')
        newPaginationleftContainer.setAttribute('class', `pagination-left`)
        newPaginationleftContainer.setAttribute('id', `pagination-left-container`)
        const newPaginationleftButton = document.createElement('button')
        newPaginationleftButton.setAttribute('class', `pagination-button`)
        newPaginationleftButton.setAttribute('id', `slide-left`)
        const newPaginationleftIcon = document.createElement('i')
        newPaginationleftIcon.setAttribute('class', 'fas fa-arrow-circle-left fa-lg')
        newPaginationleftButton.appendChild(newPaginationleftIcon)
        newPaginationleftContainer.appendChild(newPaginationleftButton)

        // Function When Arrow Is Clicked
        newPaginationleftButton.addEventListener('click', () => {
            // Decrease Start and End Index
            paginationStartIndex = paginationStartIndex - limitedPerPage
            paginationEndIndex = paginationEndIndex - limitedPerPage
            // Change Current Page
            currentPage--

            let counter = 0

            // Remove Element to Replace The Next Page
            let deleteVideo = videoContainer.querySelectorAll("[id*='td']")
            deleteVideo.forEach((element) => {
                element.remove()
            })

            // Diplaying Video
            for (const firstKey in allStream) {
                // Limiting Displayed Video
                if (counter >= paginationStartIndex && counter <= paginationEndIndex) {
                    for (const secondKey in allStream[firstKey]) {
                        if (allStream[firstKey][secondKey].kind != 'screen-sharing' && allStream[firstKey][secondKey].kind == 'video') {
                            let authority = false
                            if (firstKey == host){
                                authority = true
                            }
                            createVideo(allStream[firstKey][secondKey].id, secondKey, allStream[firstKey][secondKey].track, allStream[firstKey][secondKey].username, allStream[firstKey].audio.track.enabled, authority, allStream[firstKey].video.status)
                            // Resume Displayed Video Consumer
                            if (allStream[firstKey][secondKey].serverConsumerId){
                                socket.emit('consumer-resume', { serverConsumerId: allStream[firstKey][secondKey].serverConsumerId })
                            }
                        }
                    }
                } 
                else {
                    // Pausing Video Consumer
                    for (const secondKey in allStream[firstKey]) {
                        if (allStream[firstKey][secondKey].kind != 'screen-sharing' && allStream[firstKey][secondKey].kind == 'video') {
                            if (allStream[firstKey][secondKey].serverConsumerId){
                                socket.emit('consumer-pause', { serverConsumerId: allStream[firstKey][secondKey].serverConsumerId })
                            }
                        }
                    }
                }
                counter++
            }

            // Create Right Arrow
            createPaginationRight()

            // Remove Left Arrow If Its First Page
            if (currentPage == 0) {
                newPaginationleftContainer.remove()
            }
        })
        fullContainer.appendChild(newPaginationleftContainer)
    }
}

const isScreenSharingType = (input) => {
    return input.includes("Sharing Screen");
}

// Connecting Receive Transport
const connectRecvTransport = async (consumerTransport, remoteProducerId, serverConsumerTransportId) => {
    // Consumer Transport
    await socket.emit('consume', {
        rtpCapabilities: device.rtpCapabilities,
        remoteProducerId,
        serverConsumerTransportId,
    }, async ({ params }) => {
        if (params.authority == 'Host'){
            host = params.producerOwnerSocket
        }
        if (params.error) {
            console.log('Cannot Consume : ', params.error)
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

        if (!currentTemplate) {
            currentTemplate = 'user-video-container'
        }

        const { track } = consumer

        // Check Consumer Connection State
        consumerTransport.on('connectionstatechange', async (e) => {
            console.log('- State Consumer : ', e, ' - Remote Id : ', remoteProducerId)
            
            // If Consumer State is Connected
            if (e == 'connected') {
                // Check If User With 
                let check = false
                
                // Check if Video Is Screen Share
                console.log('- Username : ', params?.username)
                if (params.username) {
                    check = isScreenSharingType(params.username)
                }

                let checkConnection = document.getElementById('td-' + remoteProducerId)
                if (checkConnection){
                    console.log('- Reconnecting')
                    return
                }
                
                // Make a List For Every User
                if (params.kind == 'video' && !check){
                    createUserList(params?.username)
                    totalUsers++
                }

                // Calculate Total Page
                let totalPage2 = Math.ceil(totalUsers / limitedPerPage)

                if (params.kind == 'video' && !check && ((totalUsers <= limitedPerPage && currentPage == 0) || totalUsers >= limitedPerPage && totalPage2 == currentPage + 1 && currentPage != 0)) {
                    let checkAuthority = false
                    if (params.producerOwnerSocket == host){
                        checkAuthority = true
                    }
                    createVideo(remoteProducerId, params.kind, track, params?.username, true, checkAuthority, true)
                }
                
                // Get Local Stream
                let stream = store.getState()

                // Make An Initial Data Object For Spesific Stream Using Socket Id
                if (!allStream[params.producerOwnerSocket]) {
                    allStream[params.producerOwnerSocket] = {}
                }

                // Fill All Stream Object With Audio Or Video Stream
                if (!allStream[params.producerOwnerSocket][params.kind] && !check) {
                    allStream[params.producerOwnerSocket][params.kind] = { track, id: remoteProducerId, username: params?.username, kind: params.kind, status: true, serverConsumerId: params.serverConsumerId }
                }

                // If It Is Audio Stream, Then Create Audio Element And Collect It To One Div
                if (params.kind == 'audio') {
                    let checkAudio = document.getElementById(`td-${remoteProducerId}`)
                    let checkAudio2 = document.getElementById(remoteProducerId)
                    if (!checkAudio){
                        let audioContainer = document.getElementById('audio-collection')
                        const newElem = document.createElement('div')
                        newElem.setAttribute('id', `td-${remoteProducerId}`)
                        // If This Is Current User Id (It Will Running When Pagination is Active / User Is More Than Limited Per Page)
                        if (remoteProducerId == 'current-user-audio') {
                            // Get Audio Stream From Local
                            let stream = store.getState()
                            track = stream.localStream.getAudioTracks()[0]
                            newElem.innerHTML = '<audio id="' + remoteProducerId + '" autoplay></audio>'
                        } else {
                            newElem.innerHTML = '<audio id="' + remoteProducerId + '" autoplay></audio>'
                        }
                        audioContainer.appendChild(newElem)
                        document.getElementById(remoteProducerId).srcObject = new MediaStream([track])
                    }
                }

                // Resuming Consumer Screen Sharing or Audio
                if (check || params.kind == 'audio'){
                    socket.emit('consumer-resume', { serverConsumerId: params.serverConsumerId })
                }

                if (check) {
                    console.log('- Check : ', check)
                    // Change to Screen Share Mode
                    let screenSharingVideo = document.getElementById('screen-sharing')
                    if (!screenSharingVideo){
                        // If It Is, Add Screen Sharing Stream To All Stream Variable
                        if (!allStream[params.producerOwnerSocket].screenSharing) {
                            allStream[params.producerOwnerSocket].screenSharing = { track, id: remoteProducerId, username: params?.username, kind: 'screen-sharing' }
                        }
                        isScreenSharing = true
                        changeLayout(true)
                        createScreenSharing(track)
                        screenSharingInfo = { socketId: params.producerOwnerSocket, producerId: params.producerId }
                    } else {
                        console.log('- Screen Sharing is Reconnecting')
                    }
                }
        
                // Make An Initial Data Object For Every Details of Remote Id
                if (!producersDetails[params.producerOwnerSocket]) {
                    producersDetails[params.producerOwnerSocket] = {}
                    // Fill Producer Details With Audio/Video and Check if Video Is Screen Share Or Not
                    if (!producersDetails[params.producerOwnerSocket][params.kind] && !check) {
                        producersDetails[params.producerOwnerSocket][params.kind] = params.producerId
                        // Limiting Displayed Video
                        // if (totalUsers <= limitedPerPage && currentPage == 0) {
                        //     createVideo(remoteProducerId, params.kind, track, params?.username, true)
                        // }
                    }
                    // Labeling Producer Id With Owner Of Producer
                    if (!producersDetails[params.producerOwnerSocket].name) {
                        producersDetails[params.producerOwnerSocket].name = params.producerName
                    }
                } else {
                    if (check) {
                        // And Add It To Producer Details
                        if (!producersDetails[params.producerOwnerSocket].screenSharing) {
                            producersDetails[params.producerOwnerSocket].screenSharing = params.producerId
                        }
                    }

                    // Check If The Stream Is Not Screen Sharing and Producer Details With Socket Already Exist (Either Video or Audio With Same Socket Id), It Will Means One User Is Completely Join (Audio And Video)
                    if (producersDetails[params.producerOwnerSocket] && !check && (!producersDetails[params.producerOwnerSocket].video || !producersDetails[params.producerOwnerSocket].audio)) {
                        // User Joins +1
                    }

                    // Check If The Stream Is Not Screen Sharing and Its Either Video Or Audio Stream
                    if (!producersDetails[params.producerOwnerSocket][params.kind] && !check) {
                        // Limiting Displayed Video When In Page 1
                        // if (totalUsers <= limitedPerPage && currentPage == 0) {
                        //     createVideo(remoteProducerId, params.kind, track, params?.username, true)
                        // }
                        
                        // Calculate Total Page
                        let totalPage = Math.ceil(totalUsers / limitedPerPage)

                        // Create Pagination If Total Users Is More Than Limited Displayed User Per Page
                        if ((totalUsers > limitedPerPage && currentPage == 0) || (currentPage+1 < totalPage && currentPage != 0)) {
                            createPaginationRight()
                        }

                        // If There Is More Than Limited Displayed User and Current User Is In Last Page
                        // if (totalUsers >= limitedPerPage && totalPage == currentPage + 1 && currentPage != 0) {
                        //     createVideo(remoteProducerId, params.kind, track, params?.username, true)
                        // }

                        producersDetails[params.producerOwnerSocket][params.kind] = params.producerId
                        // If Current User Is Muted, Then Change Other User Mic Icons
                        if (!stream.localStream.getAudioTracks()[0].enabled) {
                            for (const key in producersDetails) {
                                socket.emit('mic-config', ({ videoProducerId: videoProducer.id, audioProducerId: audioProducer.id, socketId: key, isMicActive: false }))
                            }
                        }

                        if (!allStream[socket.id].video.status){
                            socket.emit('camera-config', ({ socketId: params.producerOwnerSocket, isCameraActive: false, videoProducerId: videoProducer.id, videoStreamId: socket.id }))
                        }

                        if (isMutedAll){
                            muteAllParticipants()
                        }
                        // if (!isCameraOn){
                        //     console.log('Off')
                        //     replaceVideoToImage()
                        // }
                    }
                }
        
                // If Current User Is Recording, Add New Audio User Stream To Recording Media
                if (isRecording && params.kind == 'audio') {
                    const audioSource = audioContext.createMediaStreamSource(new MediaStream([track]));
                    audioSource.connect(audioDestination);
                    // recordedStream.addTrack(audioDestination.stream.getAudioTracks()[0]);
                }

                if (!check && allStream[params.producerOwnerSocket].video && allStream[params.producerOwnerSocket].audio){
                    for (const firstKey in allStream){
                        if (firstKey == params.producerOwnerSocket){
                            createAudioVisualizer(allStream[firstKey].audio.track, allStream[firstKey].audio.id, allStream[firstKey].video.id)
                            break
                        }
                    }
                }
        
                // If Its Not In Screen Share Mode To Adjust Template
                if (!isScreenSharing) {
                    // Check Total User Is Less Than 2 To Adjust Template
                    normalTemplate()
                } else {
                    // If In Screen Share Mode, It Will Adjust Template
                    screenSharingTemplate()
                }

                // Calculate Total Page
                let totalPage = Math.ceil(totalUsers / limitedPerPage)
        
                // Resuming Consumer
                if (params.kind == 'video' && !check && ((currentPage == 0 && totalUsers <= limitedPerPage) || (totalUsers >= limitedPerPage && totalPage == currentPage + 1 && currentPage != 0))){
                    socket.emit('consumer-resume', { serverConsumerId: params.serverConsumerId })
                }
            }
        })
    })
}


// Event Listener Collection

// Mic Button
const micButton = document.getElementById("user-mic-button");
const micImage = document.getElementById("mic-image");
micButton.addEventListener("click", () => {
    let localMic = document.getElementById('local-mic')
    let stream = store.getState()

    if (lockedMic) {
        let ae = document.getElementById("alert-error");
        ae.className = "show";
        ae.innerHTML = `Mic is Locked By Host`
        // Show Warning
        setTimeout(() => { 
            ae.className = ae.className.replace("show", ""); 
            ae.innerHTML = ``
        }, 3000);
    } else if (micImage.src.endsWith("micOn.png")) {
        micButton.classList.replace('button-small-custom', 'button-small-custom-clicked')
        for (const key in producersDetails) {
            socket.emit('mic-config', ({ videoProducerId: videoProducer.id, audioProducerId: audioProducer.id, socketId: key, isMicActive: false }))
        }
        allStream[socket.id].audio.track.enabled = false
        allStream[socket.id].audio.status = false
        stream.localStream.getAudioTracks()[0].enabled = false
        if (localMic) localMic.src = "/assets/pictures/micOff.png";
        micImage.src = "/assets/pictures/micOff.png";
        localStorage.setItem('is_mic_active', false)
        isMicOn = false
    } else {
        for (const key in producersDetails) {
            socket.emit('mic-config', ({ videoProducerId: videoProducer.id, audioProducerId: audioProducer.id, socketId: key, isMicActive: true }))
        }
        allStream[socket.id].audio.track.enabled = true
        allStream[socket.id].audio.status = true
        stream.localStream.getAudioTracks()[0].enabled = true
        if (localMic) localMic.src = "/assets/pictures/micOn.png";
        micImage.src = "/assets/pictures/micOn.png";
        micButton.classList.replace('button-small-custom-clicked', 'button-small-custom')
        localStorage.setItem('is_mic_active', true)
        isMicOn = true
    }
});

const switchCamera = document.getElementById('user-switch-camera-button')
switchCamera.addEventListener("click", () => {
    SwitchingCamera()
})
const SwitchingCamera = async () => {
    isCameraOn = true
    localStorage.setItem('is_video_active', true)
    let cameraIcons = document.getElementById('turn-on-off-camera-icons')
    cameraIcons.className = 'fas fa-video' 
    let cameraButtons = document.getElementById('user-turn-on-off-camera-button')
    cameraButtons.className = 'btn button-small-custom'
    allStream[socket.id].video.track.enabled = true
    allStream[socket.id].video.status = true
    isCameraOn = true
    let displayedVideo = document.getElementById('img-current-user-video')
    if (displayedVideo){
        displayedVideo.className = 'video-on'
    }
    for (const key in producersDetails) {
        socket.emit('camera-config', ({ socketId: key, isCameraActive: true, videoProducerId: videoProducer.id, videoStreamId: socket.id }))
    }
    

    let videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === "videoinput"
    );

    let storeData = store.getState()
    let stream = storeData.localStream
    let audio = stream.getAudioTracks()[0]
    let theAudio

    // let cameraIcons = document.getElementById('turn-on-off-camera-icons')
    // cameraIcons.classList.add('fa-video');
    // cameraIcons.classList.remove('fa-video-slash');

    deviceId++
    if (deviceId >= videoDevices?.length) deviceId = 0

    let localVideo2 = document.getElementById('local-video')

    if (localVideo2){
        let config = {
            video: {
                deviceId: { exact: videoDevices[deviceId].deviceId },
                video: { facingMode: "environment" },
            },
            audio: audio.enabled
        }

        let newStream = await navigator.mediaDevices.getUserMedia(config);
        store.setLocalStream(newStream)
        localVideo2.srcObject.getTracks().forEach((track) => {
            track.stop();
        });
        localVideo2.srcObject = null
        localVideo2.srcObject = newStream
        allStream[socket.id].audio.track = newStream.getAudioTracks()[0]
        allStream[socket.id].video.track = newStream.getVideoTracks()[0]
        theAudio = newStream.getAudioTracks()[0]
        await videoProducer.replaceTrack({ track: newStream.getVideoTracks()[0] });
    } else {
        let localVideo3 = document.getElementById('current-user-video')
        if (localVideo3){
            let config = {
                video: {
                    deviceId: { exact: videoDevices[deviceId].deviceId },
                    video: { facingMode: "environment" },
                },
                audio: audio.enabled
        }
            let newStream = await navigator.mediaDevices.getUserMedia(config);
            store.setLocalStream(newStream)
            localVideo3.srcObject.getTracks().forEach((track) => {
                track.stop();
            });
            localVideo3.srcObject = null
            localVideo3.srcObject = newStream
            allStream[socket.id].video.track = newStream.getVideoTracks()[0]
            allStream[socket.id].audio.track = newStream.getAudioTracks()[0]
            theAudio = newStream.getAudioTracks()[0]
            await videoProducer.replaceTrack({ track: newStream.getVideoTracks()[0] });
        } else {
            let config = {
                video: {
                    deviceId: { exact: videoDevices[deviceId].deviceId },
                    video: { facingMode: "environment" },
                },
                audio: audio.enabled
            }
            let newStream = await navigator.mediaDevices.getUserMedia(config);
            store.setLocalStream(newStream)
            allStream[socket.id].audio.track = newStream.getAudioTracks()[0]
            allStream[socket.id].video.track = newStream.getVideoTracks()[0]
            theAudio = newStream.getAudioTracks()[0]
            await videoProducer.replaceTrack({ track: newStream.getVideoTracks()[0] });
        }
    }

    const canvas = document.getElementById('av-current-user-audio');
    const ctx = canvas.getContext('2d');

    // Access the microphone audio stream (replace with your stream source)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let newTheAudio = new MediaStream([theAudio])

    const audioSource = audioContext.createMediaStreamSource(newTheAudio);
    audioSource.connect(analyser);

    // Function to draw the single audio bar
    function drawBar() {
        analyser.getByteFrequencyData(dataArray);

        const barHeight = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        // console.log('- Volume : ', barHeight)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `rgb(${barHeight + 100}, 255, 100)`;
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

        requestAnimationFrame(drawBar);
    }

    // Start drawing the single bar
    drawBar();

    // if (!localVideo2) {
    //     localVideo2 = document.getElementById('current-user-video')
    // }

    // deviceId++
    // if (deviceId >= videoDevices?.length) deviceId = 0

    // let config = {
    //     video: {
    //         deviceId: { exact: videoDevices[deviceId].deviceId },
    //         video: { facingMode: "environment" },
    //     },
    // }
    // localStorage.setItem('selectedVideoDevices', videoDevices[deviceId].deviceId)
    // let newStream = await navigator.mediaDevices.getUserMedia(config);
    // store.setLocalStream(newStream)
    // if (localVideo2) {
    //     localVideo2.srcObject.getTracks().forEach((track) => {
    //         track.stop();
    //     });
    //     localVideo2.srcObject = null
    //     localVideo2.srcObject = newStream
    // }
    // await videoProducer.replaceTrack({ track: newStream.getVideoTracks()[0] });
};

const isVideoDisplayed = async (data) => {
    let maxAttempts = 10
    let attempts = 0
    const checkVideoId = () => {
        let imageId = document.getElementById('img-' + data.videoProducerId);

        if (!imageId) {
            attempts++;

            if (attempts < maxAttempts) {
                setTimeout(checkVideoId, 1000); 
            } else {
                allStream[data.videoStreamId].video.status = data.isCameraActive
                console.log(`Max attempts reached. videoId not found.`);
            }
        } else {
            allStream[data.videoStreamId].video.status = data.isCameraActive
            if (data.isCameraActive){
                imageId.className = 'video-on'
            }
            if (!data.isCameraActive){
                imageId.className = 'video-off'
            }
        }
    };

    checkVideoId(); // Start checking
}

const turnOffCamera = async () => {
    localStorage.setItem('is_video_active', false)
    let storeData = store.getState()
    let stream = storeData.localStream
    allStream[socket.id].video.track.enabled = false
    allStream[socket.id].video.status = false
    stream.getVideoTracks()[0].enabled = true
    isCameraOn = false
    let cameraIcons = document.getElementById('turn-on-off-camera-icons')
    let cameraButtons = document.getElementById('user-turn-on-off-camera-button')
    cameraButtons.className = 'btn button-small-custom-clicked'
    cameraIcons.classList.remove('fa-video');
    cameraIcons.classList.add('fa-video-slash');
    let displayedVideo = document.getElementById('img-current-user-video')
    if (displayedVideo){
        displayedVideo.className = 'video-off'
    }
    for (const key in producersDetails) {
        socket.emit('camera-config', ({ socketId: key, isCameraActive: false, videoProducerId: videoProducer.id, videoStreamId: socket.id }))
    }
    allStream[socket.id].video.track.stop()
}

const turnOnCamera = async () => {
    localStorage.setItem('is_video_active', true)
    let storeData = store.getState()
    let stream = storeData.localStream
    allStream[socket.id].video.status = true
    stream.getVideoTracks()[0].enabled = true
    isCameraOn = true
    let cameraIcons = document.getElementById('turn-on-off-camera-icons')
    let cameraButtons = document.getElementById('user-turn-on-off-camera-button')
    cameraButtons.className = 'btn button-small-custom'
    cameraIcons.classList.add('fa-video');
    cameraIcons.classList.remove('fa-video-slash');
    let displayedVideo = document.getElementById('img-current-user-video')
    if (displayedVideo){
        displayedVideo.className = 'video-on'
    }
    for (const key in producersDetails) {
        socket.emit('camera-config', ({ socketId: key, isCameraActive: true, videoProducerId: videoProducer.id, videoStreamId: socket.id }))
    }
    let localVideo2 = document.getElementById('local-video')
    if (!localVideo2) {
        localVideo2 = document.getElementById('current-user-video')
    }

    let config = {
        video: {
            deviceId: { exact: localStorage.getItem("selectedVideoDevices") },
            video: { facingMode: "environment" },
        },
    }
    let newStream = await navigator.mediaDevices.getUserMedia(config);
    allStream[socket.id].video.track = newStream.getVideoTracks()[0]

    newStream.addTrack(stream.getAudioTracks()[0])
    store.setLocalStream(newStream)
    if (localVideo2) {
        localVideo2.srcObject.getVideoTracks().forEach((track) => {
            track.stop();
        });
        localVideo2.srcObject = null
        localVideo2.srcObject = newStream
    }
    await videoProducer.replaceTrack({ track: newStream.getVideoTracks()[0] });
}

socket.on('camera-config', (data) => {
    isVideoDisplayed(data)
})

const turnOffTheCamera = async () => {
    let storeData = store.getState()
    let stream = storeData.localStream
    isCameraOn = false
    let audioStream = stream.getAudioTracks()[0]
    let localVideo2 = document.getElementById('local-video')
    let cameraIcons = document.getElementById('turn-on-off-camera-icons')
    cameraIcons.classList.remove('fa-video');
    cameraIcons.classList.add('fa-video-slash');
    if (!localVideo2) {
        localVideo2 = document.getElementById('current-user-video')
    }
    const turnOffCamera = await createImageTrack('/assets/pictures/unknown.jpg')
    const videoTrack = await createVideoTrackFromImageTrack(turnOffCamera)
    const newStream = new MediaStream([videoTrack])
    newStream.addTrack(audioStream)
    newStream.getVideoTracks()[0].muted = false
    console.log('- New Media Stream : ', newStream.getVideoTracks()[0])
    store.setLocalStream(newStream)
    if (localVideo2) {
        localVideo2.srcObject.getVideoTracks().forEach((track) => {
            track.stop();
        });
        localVideo2.srcObject = null
        localVideo2.srcObject = newStream
    }
    await videoProducer.replaceTrack({ track: videoTrack });
}

// const replaceVideoToImage = async () => {
//     let storeData = store.getState()
//     let videoStream = storeData.localStream.getVideoTracks()[0]
//     await videoProducer.replaceTrack({ track: videoStream });
// }

const turnOnOffCamera = document.getElementById('user-turn-on-off-camera-button')
turnOnOffCamera.addEventListener('click', async () => {
    if (isCameraOn) {
        await turnOffCamera()
    } else {
        await turnOnCamera()
        // isCameraOn = true

        // let storeData = store.getState()
        // let stream = storeData.localStream

        // let cameraIcons = document.getElementById('turn-on-off-camera-icons')
        // cameraIcons.classList.add('fa-video');
        // cameraIcons.classList.remove('fa-video-slash');

        // let localVideo2 = document.getElementById('local-video')

        // if (!localVideo2) {
        //     localVideo2 = document.getElementById('current-user-video')
        // }

        // let config = {
        //     video: {
        //         deviceId: { exact: localStorage.getItem("selectedVideoDevices") },
        //         video: { facingMode: "environment" },
        //     },
        // }
        // let newStream = await navigator.mediaDevices.getUserMedia(config);
        // newStream.addTrack(stream.getAudioTracks()[0])
        // store.setLocalStream(newStream)
        // if (localVideo2) {
        //     localVideo2.srcObject.getVideoTracks().forEach((track) => {
        //         track.stop();
        //     });
        //     localVideo2.srcObject = null
        //     localVideo2.srcObject = newStream
        // }
        // await videoProducer.replaceTrack({ track: newStream.getVideoTracks()[0] });
    }
})

// Screen Sharing Button
const screenSharingButton = document.getElementById('user-screen-share-button')
screenSharingButton.addEventListener('click', () => {
    getScreenSharing()
})

// Recording Button
const recordButton = document.getElementById('user-record-button')
const startTimer = () => {
    let startTime = Date.now();
    let timerElement = document.getElementById("realtime-timer");

    // Update the timer every second
    let intervalId = setInterval(function () {
        let currentTime = Date.now();
        let elapsedTime = currentTime - startTime;
        let hours = Math.floor(elapsedTime / 3600000);
        let minutes = Math.floor((elapsedTime % 3600000) / 60000);
        let seconds = Math.floor((elapsedTime % 60000) / 1000);

        timerElement.textContent =
            (hours < 10 ? "0" : "") + hours + ":" +
            (minutes < 10 ? "0" : "") + minutes + ":" +
            (seconds < 10 ? "0" : "") + seconds;
    }, 1000);
}

const timerLayout = (trigger) => {
    const fullContainer = document.getElementById('full-container-id')
    const timerImage = document.getElementById('record-image')
    if (trigger) {
        recordButton.classList.replace('button-small-custom', 'button-small-custom-clicked')
        // timerImage.style.color = 'red'
        let container = document.createElement("div");
        container.setAttribute('class', 'record-timer')
        container.id = "timer";
        let timerParagraph = document.createElement("span");
        let span = document.createElement("span");
        span.id = "realtime-timer";
        span.textContent = '00:00:00'
        timerParagraph.appendChild(span);
        container.appendChild(timerParagraph)
        fullContainer.appendChild(container);
        isRecording = true
        startTimer()
    } else {
        recordButton.classList.replace('button-small-custom-clicked', 'button-small-custom')
        // timerImage.style.color = '#bbb'
        fullContainer.removeChild(document.getElementById('timer'))
        isRecording = false
    }
}
const recordingVideo = async () => {
    try {
        if (!isRecording) {
            const videoStream = await navigator.mediaDevices.getDisplayMedia({
                audio: true,
                video: {
                    cursor: "always",
                    displaySurface: "monitor",
                    chromeMediaSource: "desktop",
                },
            });

            const screenSharingStream = new MediaStream();
            videoStream.getVideoTracks().forEach(track => screenSharingStream.addTrack(track));

            let allAudio = []

            for (const key in allStream) {
                allAudio.push(allStream[key].audio.track)
            }

            let allAudioFlat = allAudio.flatMap(stream => stream);

            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioDestination = audioContext.createMediaStreamDestination();

            allAudioFlat.forEach(stream => {
                const audioSource = audioContext.createMediaStreamSource(new MediaStream([stream]));
                audioSource.connect(audioDestination);
            });

            screenSharingStream.addTrack(audioDestination.stream.getAudioTracks()[0]);
            recordedStream = screenSharingStream
            recordedMedia = new RecordRTC(recordedStream, { type: 'video', getNativeBlob: true });
            recordedMedia.startRecording()

            recordedStream.getVideoTracks()[0].onended = () => {
                recordedMedia.stopRecording(() => {
                    timerLayout(false)
                    isRecording = false
                    let blob = recordedMedia.getBlob();
                    // require('recordrtc').getSeekableBlob(recordedMediaRef.current.getBlob(), (seekable) => {
                    //     console.log("- SeekableBlob : ", seekable)
                    //     downloadRTC(seekable)
                    // })
                    // downloadRTC(blob)
                    const currentDate = new Date();
                    const formattedDate = currentDate.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }).replace(/\//g, ''); // Remove slashes from the formatted date

                    const file = new File([blob], formattedDate, {
                        type: "video/mp4"
                    });
                    require('recordrtc').invokeSaveAsDialog(file, file.name)
                    recordedStream.getTracks().forEach((track) => track.stop());
                    recordedStream = null
                    recordedMedia.reset()
                    recordedMedia = null
                })
            }

            isRecording = true
            timerLayout(true)
        } else {
            recordedMedia.stopRecording(() => {
                timerLayout(false)
                isRecording = false
                let blob = recordedMedia.getBlob();
                // require('recordrtc').getSeekableBlob(recordedMedia.getBlob(), (seekable) => {
                //     console.log("- SeekableBlob : ", seekable)
                //     downloadRTC(seekable)
                // })
                // downloadRTC(blob)
                const currentDate = new Date();
                const formattedDate = currentDate.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }).replace(/\//g, ''); // Remove slashes from the formatted date

                const file = new File([blob], formattedDate, {
                    type: "video/mp4"
                });

                require('recordrtc').invokeSaveAsDialog(file, file.name)
                recordedStream.getTracks().forEach((track) => track.stop());
                recordedStream = null
                recordedMedia.reset()
                recordedMedia = null
            })
        }
    } catch (error) {
        isRecording = false
        timerLayout(false)
        if (recordedStream) {
            recordedStream.getTracks().forEach((track) => track.stop());
            recordedStream = null
        }
        if (recordedMedia) {
            recordedMedia.stopRecording(() => {
                let blob = recordedMedia.getBlob();
                const currentDate = new Date();
                const formattedDate = currentDate.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }).replace(/\//g, ''); // Remove slashes from the formatted date

                const file = new File([blob], formattedDate, {
                    type: "video/mp4"
                });
                require('recordrtc').invokeSaveAsDialog(file, file.name)
                recordedMedia.reset()
                recordedMedia = null
            })
        }
        console.log(error)
    }
}
recordButton.addEventListener('click', () => {
    recordingVideo()
})

// Share Link Button
const shareButton = document.getElementById('share-link-button')
shareButton.addEventListener('click', () => {
    shareButton.classList.replace('button-small-custom', 'button-small-custom-clicked')
    let sb = document.getElementById("snackbar");

    sb.className = "show";

    setTimeout(() => { 
        shareButton.classList.replace('button-small-custom-clicked', 'button-small-custom')
        sb.className = sb.className.replace("show", ""); 
    }, 3000);
    navigator.clipboard.writeText(window.location.href);
})

// Hang Up Button
const hangUpButton = document.getElementById('user-hang-up-button')
hangUpButton.addEventListener('click', () => {
    window.location.href = window.location.origin
})

// Chat Button
// const chatButton = document.getElementById('user-chat-button')
// chatButton.addEventListener('click', () => {
//     const chatContainer = document.getElementById('chat-container')
//     if (chatContainer.className == 'invisible') {
//         chatButton.classList.replace('button-small-custom', 'button-small-custom-clicked')
//         chatContainer.className = 'visible'
//     }
//     else {
//         chatContainer.className = 'invisible'
//         chatButton.classList.replace('button-small-custom-clicked', 'button-small-custom')
//     }
// })

// User List Button
const userListButton = document.getElementById('user-list-button')
userListButton.addEventListener('click', () => {
    const userListContainer = document.getElementById('user-container')
    if (userListContainer.className == 'invisible') {
        userListContainer.className = 'visible'
        userListButton.classList.replace('button-small-custom', 'button-small-custom-clicked')
    }
    else {
        userListContainer.className = 'invisible'
        userListButton.classList.replace('button-small-custom-clicked', 'button-small-custom')
    }
})

dragElement(document.getElementById("chat-bar"));
dragElement(document.getElementById("user-bar"));

function dragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "-header")) {
        document.getElementById(elmnt.id + "-header").onmousedown = dragMouseDown;
    } else {
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

const optionButton = document.getElementById("option-button");
const optionMenu = document.getElementById("option-menu");

const addMuteAllButton = () => {
    let allOptionMenu = document.getElementById('all-option-menu')
    let isExist = document.getElementById('mute-all')
    if (!isExist){
        const newElement = document.createElement('li')
        newElement.id = 'mute-all'
        newElement.style.fontSize = '13px'
        newElement.innerHTML = "Mute All Participants"
        allOptionMenu.appendChild(newElement)
        newElement.addEventListener('click', () => {
            if (host == socket.id && newElement.innerHTML == 'Mute All Participants'){
                isMutedAll = true
                muteAllParticipants()
                newElement.innerHTML = 'Unmute All Participants'
            } else if (host == socket.id && newElement.innerHTML == 'Unmute All Participants'){
                isMutedAll = false
                unlockAllMic()
                newElement.innerHTML = 'Mute All Participants'
            } else {
                let ae = document.getElementById("alert-error");
                ae.className = "show";
                ae.innerHTML = `You're Not Host`
                // Show Warning
                setTimeout(() => { 
                    ae.className = ae.className.replace("show", ""); 
                    ae.innerHTML = ``
                }, 3000);
            }
        })
    }
}

// Function to show the option menu
function showOptionMenu() {
    optionMenu.className = "visible";
}

// Function to hide the option menu
function hideOptionMenu() {
    optionMenu.className = "invisible";
}

// Click event for the option button
optionButton.addEventListener("click", function (event) {
    event.stopPropagation(); // Prevent the click event from propagating to the document

    // Toggle the option menu
    if (optionMenu.className === "visible") {
        hideOptionMenu();
    } else {
        showOptionMenu();
    }
});

// Click event for the document (to hide the option menu when clicking outside)
document.addEventListener("click", function () {
    hideOptionMenu();
});

// Mute All Mic
const muteAllParticipants = () => {
    for (const key in producersDetails) {
        socket.emit('mute-all', ({ socketId: key }))
    }
}

// Unlock Mic
const unlockAllMic = () => {
    for (const key in producersDetails) {
        socket.emit('unlock-mic-all', ({ socketId: key }))
    }
}

socket.on('unlock-mic-all', (data) => {
    lockedMic = false
})


// Mute All
// const muteAllButton = document.getElementById('mute-all')
// muteAllButton.addEventListener('click', () => {
//     if (host == socket.id && muteAllButton.innerHTML == 'Mute All Participants'){
//         isMutedAll = true
//         muteAllParticipants()
//         muteAllButton.innerHTML = 'Unmute All Participants'
//     } else if (host == socket.id && muteAllButton.innerHTML == 'Unmute All Participants'){
//         isMutedAll = false
//         unlockAllMic()
//         muteAllButton.innerHTML = 'Mute All Participants'
//     } else {
//         let ae = document.getElementById("alert-error");
//         ae.className = "show";
//         ae.innerHTML = `You're Not Host`
//         // Show Warning
//         setTimeout(() => { 
//             ae.className = ae.className.replace("show", ""); 
//             ae.innerHTML = ``
//         }, 3000);
//     }
// })

// Pagination Button Right
// const rightPagination = document.getElementById('slide-right')
// rightPagination.addEventListener('click', () => {
//     paginationStartIndex = paginationStartIndex + 2
//     paginationEndIndex = paginationEndIndex + 2
//     currentPage++

//     let counter = 0
//     while (videoContainer.firstChild) {
//         videoContainer.removeChild(videoContainer.firstChild);
//     }
//     for (const firstKey in allStream) {
//         if (counter >= paginationStartIndex && counter <= paginationEndIndex) {
//             for (const secondKey in allStream[firstKey]) {
//                 createVideo(allStream[firstKey][secondKey].id, secondKey, allStream[firstKey][secondKey].track, allStream[firstKey][secondKey].username)
//             }
//         }
//         counter++
//     }
// })

// Pagination Button
// const leftPagination = document.getElementById('slide-left')
// leftPagination.addEventListener('click', () => {
//     paginationStartIndex = paginationStartIndex - 2
//     paginationEndIndex = paginationEndIndex - 2
//     currentPage--

//     let counter = 0
//     while (videoContainer.firstChild) {
//         videoContainer.removeChild(videoContainer.firstChild);
//     }
//     for (const firstKey in allStream) {
//         if (counter >= paginationStartIndex && counter <= paginationEndIndex) {
//             for (const secondKey in allStream[firstKey]) {
//                 createVideo(allStream[firstKey][secondKey].id, secondKey, allStream[firstKey][secondKey].track, allStream[firstKey][secondKey].username)
//             }
//         }
//         counter++
//     }

//     console.log('- Start Index : ', paginationStartIndex)
//     console.log('- End Index : ', paginationEndIndex)
// })

// Hide Control Button
const elementToControl = document.getElementById('control-button');
let isCursorMoving = false;
let hideTimeout;

// Function to show the element
const showElement = () => {
    elementToControl.className = 'controller';
    isCursorMoving = true;
}

// Hide Element
const hideElement = () => {
    elementToControl.className = 'controller hidden';
    isCursorMoving = false;
}

// Hide Element When There is No Mouse Movement
document.addEventListener('mousemove', () => {
    if (!isCursorMoving) {
        showElement();
    }
    const hideAll = () => {
        hideElement()
        hideOptionMenu()
    }

    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(hideAll, 3000); 
});



// Console Log Button
// const consoleLogButton = document.getElementById('console-log-button')
// consoleLogButton.addEventListener('click', () => {
//     consumerTransports.forEach((transport) => {
//         transport.consumer.getStats().then((stat) => {
//             [...stat.entries()].forEach((data, index) => {
//                 if (index == [...stat.entries()].length - 1) {
//                     console.log('- Data : ', data)
//                 }
//             })
//             stat.forEach((report) => {
//                 if (report.type === 'inbound-rtp' && report.kind === 'video') {
//                     console.log('- Received Bit Rate : ', report)
//                 }
//             })
//             console.log('- Stat : ', stat)
//         })
//     })
//     socket.emit('get-peers', (consumerTransports))
//     console.log("- Producer : ", producerTransport)
//     console.log("- Video Producer : ", videoProducer)
//     producerTransport.getStats().then((data) => {
//         console.log(data)
//     })
//     console.log('- Current Template : ', currentTemplate, " - Total Users : ", totalUsers)
//     console.log("- Producer Details : ", producersDetails)
//     console.log('- Local Video : ', localVideo.srcObject.getAudioTracks()[0].enabled)
//     console.log("- Screen Sharing Producers : ", screenSharingProducer)
//     console.log('- My Socket Id : ', socket.id,' - All Stream : ', allStream)

//     let allAudio = []

//     for (const key in allStream){
//         allAudio.push(allStream[key].audio)
//     }

//     let allAudioFlat = allAudio.flatMap(stream => stream);
//     console.log('- All Audio Flat : ', allAudioFlat)

//     console.log('- All Stream : ', allStream)
//     socket.emit('console-log-server', { message: 'hello world!' }, (data) => {
//         console.log(data)
//     })

//     console.log('- Total User : ', totalUsers)
//     let stream = store.getState()
//     console.log('- Stream : ', stream.localStream.getVideoTracks()[0])
//     console.log('- Host : ', host)
//     console.log('- All Stream : ', allStream)
//     console.log('- Video Container : ', videoContainer)
//     const videoElements = document.querySelectorAll('#video-container video');
//     videoElements.forEach((data) => {
//         console.log("- Src Object : ", data.srcObject.getVideoTracks()[0])
//     })
// })
