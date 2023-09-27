const store = require('./store')
const joinForm = document.getElementById('join-form');
const url = window.location
const { getUser } = require('../api/user');
const { createRoom, findRoom } = require('../api/room');
joinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const roomId = document.getElementById('room-id').value
        const data = { roomName: roomId }
        const response = await findRoom(data)
        if (response.status){
            const goTo = url+'lobby/'+roomId
            store.setRoom(roomId)
            window.location.href = goTo;
        } else throw response
        
    } catch (error) {
        console.log(error)
        let ae = document.getElementById("alert-error");
        ae.className = "show";
        ae.innerHTML = `Error : ${error.message}`
        setTimeout(() => { 
            ae.className = ae.className.replace("show", ""); 
            ae.innerHTML = ``
        }, 3000);
        console.log(error.message)
    }
});

const initialization = async () => {
    try {
        const data = await getUser()
        if (data.status){
            console.log('do nothing')
        } else throw data
    } catch (error) {
        console.log(error)
        if (error?.name == 'JsonWebTokenError'){
            const goTo = url+'login'
            window.location.href = goTo;
        }
    }
}
initialization()

const generateRandomId = (length, separator = '-', separatorInterval = 4) => {
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
    const data = { roomName: id }
    createRoom(data)
    // localStorage.setItem('room-id', id);
    // const goTo = url+'lobby/'+id
    // store.setRoom(roomId)
    // window.location.href = goTo;
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

startCarousel();