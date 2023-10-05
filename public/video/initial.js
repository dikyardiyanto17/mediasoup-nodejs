const { params } = require('../config/mediasoup');
const { isCameraOn, isMicOn, localVideo, totalUsers, allStream } = require('../javascript/room');
const store = require('../javascript/store');
const { createDevice } = require('../mediasoup/producer');
let audioParams;
let videoParams = { params };

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
        canvas.style.boxShadow = `inset 0 0 0 ${barHeight/20}px green, 0 0 0 ${barHeight/20}px green`

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

module.exports = { joinRoom, getLocalStream, streamSuccess }