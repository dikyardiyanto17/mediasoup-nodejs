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
