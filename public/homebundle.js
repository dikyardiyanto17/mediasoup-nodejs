(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const store = require('./store')
const joinForm = document.getElementById('join-form');
const url = window.location

const init = async () => {
    try {
        const authAPI = 'https://192.168.18.68:3001/api/auth'
        const response = await fetch(authAPI, {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                'access_token': localStorage.getItem('access_token')
            },
        })
        if (!response.ok){
            const goTo = url+'login'
            window.location.href = goTo;
            throw { name : 'Error', message: await response.json()}
        }
    } catch (error) {
        console.log('- Error : ', error)
    }
}

init()

joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const roomId = document.getElementById('room-id').value
    const goTo = url+'lobby/'+roomId
    store.setRoom(roomId)
    window.location.href = goTo;
});

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
