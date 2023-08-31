const store = require('./store')
let localVideo = document.getElementById('local-video')

const joinRoom = document.getElementById('join-room')
const url = window.location.pathname;
const parts = url.split('/');
const roomName = parts[2];
const goTo = 'room/' + roomName;

const init = () => {
    localStorage.setItem('room_id', roomName)
    getMyMic().then((config) => {
        return getMyDevices(config)
    }).then((config) => {
        return navigator.mediaDevices.getUserMedia(config)
    })
    .then((stream) => {
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
    return config = { audio: { deviceId: { exact: audioDevices[0].deviceId } } }
}

micOptions.addEventListener("click", (e) => {
    if (e.target.tagName === "P") {
        const clickedValue = e.target.getAttribute("value");
        const selectedVideoDevices = localStorage.getItem('selectedVideoDevices')
        let config = {
            audio: { deviceId: { exact: clickedValue } },
            video: { deviceId: { exact: selectedVideoDevices } }
        }
        localStorage.setItem("selectedAudioDevices", clickedValue)
        navigator.mediaDevices.getUserMedia(config).then((stream) => {
            localVideo.srcObject.getTracks().forEach((track) => {
                track.stop();
            });
            localVideo.srcObject = null;
            store.setLocalStream(stream)
            localVideo.srcObject = stream;
        })
    }
});

const videoOptions = document.getElementById('camera-options')
const getMyDevices = async (config) => {
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
    return config = {...config, video: { deviceId: { exact: videoDevices[0].deviceId } } }
}

videoOptions.addEventListener("click", (e) => {
    if (e.target.tagName === "P") {
        const clickedValue = e.target.getAttribute("value");
        const selectedAudioDevices = localStorage.getItem('selectedAudioDevices')
        let config = {
            video: { deviceId: { exact: clickedValue } },
            audio: { deviceId: { exact: selectedAudioDevices } }
        }

        localStorage.setItem('selectedVideoDevices', clickedValue)
        navigator.mediaDevices.getUserMedia(config).then((stream) => {
            localVideo.srcObject.getTracks().forEach((track) => {
                track.stop();
            });
            localVideo.srcObject = null
            store.setLocalStream(stream)
            localVideo.srcObject = stream;
        })
    }
})



const usernameForm = document.getElementById('username')
usernameForm.addEventListener('input', (e) => {
    localStorage.setItem('username', e.target.value);
})

joinRoom.addEventListener('submit', (e) => {
    e.preventDefault();

    // const userName = document.getElementById('username').value;

    const newURL = window.location.origin + "/" + goTo;

    console.log("- New URL : ", newURL);

    setTimeout(() => {
        window.location.href = newURL;
    }, 2000);

});


init()