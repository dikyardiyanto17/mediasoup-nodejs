(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const store = require('./store')
let localVideo = document.getElementById('local-video')

const joinRoom = document.getElementById('join-room')
const url = window.location.pathname;
const parts = url.split('/');
const roomName = parts[2];
const goTo = 'room/' + roomName;
let isReady = {video: false, audio: false}

const init = async () => {
    try {
        localStorage.setItem('room_id', roomName)
        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
        await getMyDevices()
        await getMyMic()
        localVideo.srcObject = stream;
        store.setLocalStream(stream)
    } catch (error) {
        let ae = document.getElementById("alert-error");
        ae.className = "show";
        ae.innerHTML = `Error : ${error.message}`
        // Show Warning
        setTimeout(() => { 
            ae.className = ae.className.replace("show", ""); 
            ae.innerHTML = ``
        }, 3000);
        console.log(error.message)
    }
}

const micOptions = document.getElementById('mic-options')
const getMyMic = async () => {
    try {
        let audioDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
            (device) => device.kind === "audioinput"
        );
    
        audioDevices.forEach((audio, index) => {
            // console.log('- Audio : ', index, ' - Total : ', audioDevices.length)
            let newElement = document.createElement("p");
            newElement.className = "dropdown-item dropdown-select-options";
            newElement.textContent = audio.label;
            newElement.setAttribute('value', audio.deviceId)
            micOptions.appendChild(newElement);
        })
    
        isReady.audio = true
    
        if (isReady.audio && isReady.video){
            let submitButton = document.getElementById('submit-button')
            submitButton.removeAttribute('disabled')
        }
    
        let audioIcons = document.getElementById('select-audio')
        audioIcons.className = 'fas fa-microphone'
    
        localStorage.setItem("audioDevices", audioDevices)
        localStorage.setItem("selectedAudioDevices", audioDevices[0].deviceId)
    } catch (error) {
        let ae = document.getElementById("alert-error");
        ae.className = "show";
        ae.innerHTML = `Error : ${error.message}`
        // Show Warning
        setTimeout(() => { 
            ae.className = ae.className.replace("show", ""); 
            ae.innerHTML = ``
        }, 3000);
        console.log(error.message)
    }
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
    try {
        let videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
            (device) => device.kind === "videoinput"
        );
    
        videoDevices.forEach((video, index) => {
            // console.log('- Video : ', index, " - Total : ", videoDevices.length)
            let newElement = document.createElement("p");
            newElement.className = "dropdown-item dropdown-select-options";
            newElement.textContent = video.label;
            newElement.setAttribute('value', video.deviceId)
    
            videoOptions.appendChild(newElement);
        })
    
        isReady.video = true
    
        if (isReady.audio && isReady.video){
            let submitButton = document.getElementById('submit-button')
            submitButton.removeAttribute('disabled')
        }
    
        let videoIcons = document.getElementById('select-video')
        videoIcons.className = 'fas fa-video'
    
        localStorage.setItem('videoDevices', videoDevices)
        localStorage.setItem('selectedVideoDevices', videoDevices[0].deviceId)
    } catch (error) {
        let ae = document.getElementById("alert-error");
        ae.className = "show";
        ae.innerHTML = `Error : ${error.message}`
        // Show Warning
        setTimeout(() => { 
            ae.className = ae.className.replace("show", ""); 
            ae.innerHTML = ``
        }, 3000);
        console.log(error.message)
    }
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
    let buttonSubmit = document.getElementById('submit-button')
    if (!e.target.value){
        buttonSubmit.style.backgroundColor = 'grey'
    } else {
        buttonSubmit.style.backgroundColor = '#2c99ed'
    }
    localStorage.setItem('username', e.target.value);
})

joinRoom.addEventListener('submit', (e) => {
    e.preventDefault();

    const userName = document.getElementById('username').value;

    if (!userName){
        let au = document.getElementById("alert-username");
        au.className = "show";
        // Show Warning
        setTimeout(() => { au.className = au.className.replace("show", ""); }, 3000);
        return
    }

    const newURL = window.location.origin + "/" + goTo;

    console.log("- New URL : ", newURL);

    setTimeout(() => {
        window.location.href = newURL;
    }, 1000);

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
