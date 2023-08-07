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
