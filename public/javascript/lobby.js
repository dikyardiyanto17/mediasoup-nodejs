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