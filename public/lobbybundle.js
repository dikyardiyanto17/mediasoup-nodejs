(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const store = require('./store')
const url = window.location
let localVideo = document.getElementById('local-video')

const joinRoom = document.getElementById('join-room')

const getMyStream = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        localVideo.srcObject = stream;
        store.setLocalStream(stream)
    })
}

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

console.log(store.getState())
getMyStream()
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
