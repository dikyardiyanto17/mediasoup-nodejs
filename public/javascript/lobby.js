const store = require('./store')
const url = window.location
let localVideo = document.getElementById('local-video')

const joinRoom = document.getElementById('join-room')

const init = () => {
    getMyMic()
    getMyDevices()
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        localVideo.srcObject = stream;
        store.setLocalStream(stream)
    })
}

const micOptions = document.getElementById('mic-options')
const getMyMic = async () => {
    let audioDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === "audioinput"
    );

    audioDevices.forEach((audio) => {
        let newElement = document.createElement("p");
        newElement.className = "dropdown-item dropdown-select-options";
        newElement.textContent = audio.label;
        newElement.setAttribute('value', audio.deviceId)


        micOptions.appendChild(newElement);

    })

    localStorage.setItem("audioDevices", audioDevices)
    localStorage.setItem("selectedAudioDevices", audioDevices[0].deviceId)
}

micOptions.addEventListener("click", (e) => {
    if (e.target.tagName === "P") {
        const clickedValue = e.target.getAttribute("value");
        const selectedVideoDevices = localStorage.getItem('selectedVideoDevices')
        let config = {
            audio: { deviceId: { exact: clickedValue } },
            video: { deviceId: { exact: selectedVideoDevices } }
        }
        navigator.mediaDevices.getUserMedia(config).then((stream) => {
            localVideo.srcObject = null;
            store.setLocalStream(stream)
            localVideo.srcObject = stream;
        })
    }
});

const videoOptions = document.getElementById('camera-options')
const getMyDevices = async () => {
    let videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === "videoinput"
    );

    videoDevices.forEach((video) => {
        let newElement = document.createElement("p");
        newElement.className = "dropdown-item dropdown-select-options";
        newElement.textContent = video.label;
        newElement.setAttribute('value', video.deviceId)

        videoOptions.appendChild(newElement);
    })

    localStorage.setItem('videoDevices', videoDevices)
    localStorage.setItem('selectedVideoDevices', videoDevices[0].deviceId)
}

videoOptions.addEventListener("click", (e) => {
    if (e.target.tagName === "P") {
        const clickedValue = e.target.getAttribute("value");
        const selectedAudioDevices = localStorage.getItem('selectedAudioDevices')
        let config = {
            video: { deviceId: { exact: clickedValue } },
            audio: { deviceId: { exact: selectedAudioDevices } }
        }

        console.log('- Config : ', config)
        localStorage.setItem('selectedVideoDevices', clickedValue)
        navigator.mediaDevices.getUserMedia(config).then((stream) => {
            store.setLocalStream(stream)
            localVideo.srcObject = stream;
        })
    }
})





joinRoom.addEventListener('submit', (e) => {
    e.preventDefault();
    const userName = document.getElementById('username').value
    localStorage.setItem('username', userName)
    // const goTo = url+'room/'+
    // store.setRoom(roomId)
    const data = store.getState()
    console.log("- Data : ", data, " - Username : ", userName)
    // window.location.href = goTo;
});

init()