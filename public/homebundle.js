(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { getRoomName } = require("../function/url")

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

const joinOrQuitRoomParticipants = async (type) => {
	try {
		const roomName = await getRoomName()
		const data = { roomName, type }
		const api = "https://192.168.18.68:3001/api/room"
		const response = await fetch(api, {
			method: "put",
			headers: {
				"Content-Type": "application/json",
				access_token: localStorage.getItem("access_token"),
			},
			body: JSON.stringify(data),
		})
		if (!response.ok) {
			const error = await response.json()
			throw { name: error.name, message: error.message, status: false }
		} else {
			let responseData = await response.json()
			return { ...responseData, status: true }
		}
	} catch (error) {
		return error
	}
}

module.exports = { createRoom, findRoom, joinOrQuitRoomParticipants }

},{"../function/url":4}],2:[function(require,module,exports){
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
const { findRoom } = require("../api/room")
const { getUser } = require("../api/user")
const { goToHomePage, goToLoginPage, getRoomName } = require("./url")

const checkUser = async () => {
	try {
		const data = await getUser()
		if (data.status) {
			goToHomePage()
		} else throw data
	} catch (error) {
		console.log(error)
	}
}

const checkUserInHomePage = async () => {
	try {
		const data = await getUser()
		if (!data.status) {
            goToLoginPage()
		} else return data
	} catch (error) {
		console.log('- Error : ',error)
	}
}

const checkInLobbyRoom = async () => {
    try {
        const userData = await getUser()
        if (!userData.status) throw userData
        const roomName = await getRoomName()
        const data = { roomName }
        const roomData = await findRoom(data)
        if (!roomData.status) throw roomData
        return true
    } catch (error) {
        console.log('- Error : ',error)
        if (error?.name == 'JsonWebTokenError'){
            goToLoginPage()
        } else if (error?.name == 'Invalid') {
            let ae = document.getElementById("alert-error");
            ae.className = "show";
            ae.innerHTML = `Error : ${error.message}`
            setTimeout(() => { 
                ae.className = ae.className.replace("show", ""); 
                ae.innerHTML = ``
                goToHomePage()
            }, 3000);
        }
    }
}

module.exports = { checkUser, checkUserInHomePage, checkInLobbyRoom }

},{"../api/room":1,"../api/user":2,"./url":4}],4:[function(require,module,exports){
const origin = window.location.origin
const getRoomName = () => {
	const url = window.location.pathname
	const parts = url.split("/")
	const roomName = parts[2]
    return roomName
}

const goToLoginPage = () => {
    window.location.href = origin + '/login'
}

const goToRegisterPage = () => {
    window.location.href = origin + '/register'
}

const goToHomePage = () => {
    window.location.href = origin
}

module.exports = { getRoomName, goToHomePage, goToLoginPage, goToRegisterPage }
},{}],5:[function(require,module,exports){
const store = require('./store')
const joinForm = document.getElementById('join-form');
const url = window.location
const { createRoom, findRoom } = require('../api/room');
const { checkUserInHomePage } = require('../function');
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
        console.log('- Error : ', error)
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

checkUserInHomePage()

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
},{"../api/room":1,"../function":3,"./store":6}],6:[function(require,module,exports){
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
},{}]},{},[5]);
