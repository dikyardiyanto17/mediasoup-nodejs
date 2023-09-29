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
const { checkUser } = require("../function");
const { goToLoginPage } = require("../function/url");

document.addEventListener("DOMContentLoaded", function () {

	checkUser()

	const registerForm = document.getElementById("register-form")

	registerForm.addEventListener("submit", async (event) => {
		try {
			event.preventDefault()
			const email = document.getElementById("register-email").value
			const password = document.getElementById("register-passwords").value
			if (!email) throw { name: "Bad Request", message: "Email Is Required" }
			if (!password) throw { name: "Bad Request", message: "Password Is Required" }

			const data = {
				email,
				password,
			}

			const response = await fetch("https://192.168.18.68:3001/api/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})
			if (response.ok) {
				const responseData = await response.json()
				goToLoginPage()
			} else {
				const error = await response.json()
				throw { error }
			}
		} catch (error) {
			console.log("- Error : ", error)
			if (error.name == "Bad Request") {
				let ae = document.getElementById("alert-error")
				ae.className = "show"
				ae.innerHTML = `${error.message}`
				// Show Warning
				setTimeout(() => {
					ae.className = ae.className.replace("show", "")
					ae.innerHTML = ``
				}, 3000)
			} else if (error.error) {
				let ae = document.getElementById("alert-error")
				ae.className = "show"
				ae.innerHTML = `${error.error.message}`
				// Show Warning
				setTimeout(() => {
					ae.className = ae.className.replace("show", "")
					ae.innerHTML = ``
				}, 3000)
			}
		}
	})
})

},{"../function":3,"../function/url":4}]},{},[5]);
