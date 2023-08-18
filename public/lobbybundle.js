(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const store = require('./store')
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
        localStorage.setItem("selectedAudioDevices", clickedValue)
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

        localStorage.setItem('selectedVideoDevices', clickedValue)
        navigator.mediaDevices.getUserMedia(config).then((stream) => {
            store.setLocalStream(stream)
            localVideo.srcObject = stream;
        })
    }
})





joinRoom.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const userName = document.getElementById('username').value;
    localStorage.setItem('username', userName);
    
    const url = window.location.pathname;
    const parts = url.split('/');
    const roomName = parts[2];
    const goTo = 'room/' + roomName;
    localStorage.setItem('room_id', roomName)
    
    const newURL = window.location.origin + "/" + goTo;
    
    console.log("- New URL : ", newURL);
    
    window.location.href = newURL;
});


init()
},{"./store":2}],2:[function(require,module,exports){
let state = {
    localStream: null,
    room: ''
}

const setLocalStream = (localStream) => {
    state = {
        ...state,
        localStream
    }
}

const setRoom = (room) => {
    state = {
        ...state,
        room
    }
}

const getState = () => {
    return state
}

module.exports = { setLocalStream, getState, setRoom }
},{}]},{},[1]);
