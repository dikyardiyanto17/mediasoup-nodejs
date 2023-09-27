(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const createRoom = async (data) => {
	try {
		const api = "https://192.168.18.68:3001/api/room"
		const response = await fetch(api, {
			method: "post",
			headers: {
				"Content-Type": "application/json",
				access_token: localStorage.getItem("access_token"),
			},
			body: JSON.stringify(data),
		})
		console.log(await response.json())
		if (!response.ok) {
			const error = await response.json()
			throw { name: error.name, message: error.message, status: false }
		} else {
			let responseData = await response.json()
			return (data = { ...responseData, status: true })
		}
	} catch (error) {
		return error
	}
}

const findRoom = async (data) => {
	try {
		const api = "https://192.168.18.68:3001/api/room/" + data.roomName
		const response = await fetch(api, {
			method: "get",
			headers: {
				"Content-Type": "application/json",
				access_token: localStorage.getItem("access_token"),
			},
		})
		if (!response.ok) {
			const error = await response.json()
			throw { name: error.name, message: error.message, status: false }
		} else {
			let responseData = await response.json()
			return data = { ...responseData, status: true }
		}
	} catch (error) {
		return error
	}
}

module.exports = { createRoom, findRoom }

},{}],2:[function(require,module,exports){
const getUser = async () => {
    try {
        const api = 'https://192.168.18.68:3001/api/user'
        const response = await fetch(api, {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                'access_token': localStorage.getItem('access_token')
            },
        })
        if (!response.ok){
            const error = await response.json()
            throw { name : error.name, message: error.message, status: false }
        } else {
            let responseData = await response.json()
            return data = {...responseData, status: true}
        }
    } catch (error) {
        return error
    }
}

module.exports = { getUser }
},{}],3:[function(require,module,exports){
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
},{"../api/room":1,"../api/user":2,"./store":4}],4:[function(require,module,exports){
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
},{}]},{},[3]);
