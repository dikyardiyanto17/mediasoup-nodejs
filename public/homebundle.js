(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const store = require('./store')
const joinForm = document.getElementById('join-form');
const url = window.location
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const roomId = document.getElementById('room-id').value
    const goTo = url+'lobby/'+roomId
    store.setRoom(roomId)
    window.location.href = goTo;
});

function generateRandomId(length, separator = '-', separatorInterval = 4) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomId = '';

    for (let i = 0; i < length; i++) {
        if (i > 0 && i % separatorInterval === 0) {
            randomId += separator;
        }

        const randomIndex = Math.floor(Math.random() * characters.length);
        randomId += characters.charAt(randomIndex);
    }

    return randomId;
}

const newMeetingButton = document.getElementById('new-meeting')
newMeetingButton.addEventListener('click', (e) => {
    const id = generateRandomId(12)
    localStorage.setItem('room-id', id);
    const goTo = url+'lobby/'+id
    store.setRoom(roomId)
    window.location.href = goTo;
})



const roomId = document.getElementById('room-id')
roomId.addEventListener('input', (e) => {
    const buttonSubmit = document.getElementById('button-submit-room-id')
    if (!e.target.value){
        buttonSubmit.setAttribute('disabled', 'true')
    } else {
        buttonSubmit.removeAttribute('disabled', 'false')
    }
    localStorage.setItem('room-id', e.target.value);
})

// const rightBar = document.getElementById('right-bar-id')
// const totalCarousel = rightBar.children.length
const carousels = document.querySelectorAll('.carousel');
let currentIndex = 0;

function showCarousel(index) {
    carousels[currentIndex].classList.remove('active');
    carousels[currentIndex].classList.add('hide');
    currentIndex = index;
    carousels[currentIndex].classList.add('hide');
    carousels[currentIndex].classList.add('active');
}

function nextSlide() {
    const nextIndex = (currentIndex + 1) % carousels.length;
    showCarousel(nextIndex);
}

function startCarousel() {
    setInterval(nextSlide, 5000); // Change slide every 5 seconds (adjust the interval as needed)
}

// Start the carousel
startCarousel();
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
