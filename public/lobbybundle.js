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
const { checkInLobbyRoom } = require('../function');
const store = require('./store')
let localVideo = document.getElementById('local-video')

const joinRoom = document.getElementById('join-room')
const url = window.location.pathname;
const parts = url.split('/');
const roomName = parts[2];
const goTo = 'room/' + roomName;
let isReady = {video: false, audio: false}
let isAudioActive = true
let isVideoActive = true
let videoImage = document.getElementById('video-image')

const initialization = async () => {
    try {
        const isValid = await checkInLobbyRoom()
        if (isValid) await initStream()
    } catch (error) {
        console.log('- Error : ',error)
    }
}
initialization()

const initStream = async () => {
    try {
        localStorage.setItem('room_id', roomName)
        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
        await getMyDevices()
        await getMyMic()
        localVideo.srcObject = stream;
        store.setLocalStream(stream)
    } catch (error) {
        let ae = document.getElementById("alert-error");
        ae.className = "show";
        ae.innerHTML = `Error : ${error.message}`
        setTimeout(() => { 
            ae.className = ae.className.replace("show", ""); 
            ae.innerHTML = ``
        }, 3000);
        console.log(error)
    }
}

const micOptions = document.getElementById('mic-options')
const getMyMic = async () => {
    try {
        localStorage.setItem('is_audio_active', true)
        let audioDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
            (device) => device.kind === "audioinput"
        );
    
        audioDevices.forEach((audio, index) => {
            // console.log('- Audio : ', index, ' - Total : ', audioDevices.length)
            let newElement = document.createElement("p");
            newElement.className = "dropdown-item dropdown-select-options";
            newElement.textContent = audio.label;
            newElement.setAttribute('value', audio.deviceId)
            micOptions.appendChild(newElement);
        })
    
        isReady.audio = true
    
        if (isReady.audio && isReady.video){
            let audioButton = document.getElementById('select-audio-button')
            let videoButton = document.getElementById('select-video-button')
            let videoDropdownButton = document.getElementById('dropdownMenuButton-video')
            let audioDropdownButton = document.getElementById('dropdownMenuButton-audio')
            videoDropdownButton.removeAttribute('disabled')
            audioDropdownButton.removeAttribute('disabled')
            videoButton.removeAttribute('disabled')
            audioButton.removeAttribute('disabled')
            let submitButton = document.getElementById('submit-button')
            submitButton.removeAttribute('disabled')
        }
    
        let audioIcons = document.getElementById('select-audio')
        audioIcons.className = 'fas fa-microphone'
    
        localStorage.setItem("audioDevices", audioDevices)
        localStorage.setItem("selectedAudioDevices", audioDevices[0].deviceId)
    } catch (error) {
        let ae = document.getElementById("alert-error");
        ae.className = "show";
        ae.innerHTML = `Error : ${error.message}`
        // Show Warning
        setTimeout(() => { 
            ae.className = ae.className.replace("show", ""); 
            ae.innerHTML = ``
        }, 3000);
        console.log(error.message)
    }
}

micOptions.addEventListener("click", (e) => {
    if (e.target.tagName === "P") {
        let audioButton = document.getElementById('select-audio-button')
        let audioIcon = document.getElementById('select-audio')
        audioIcon.className = 'fas fa-microphone'
        isAudioActive = true
        audioButton.style.backgroundColor = ''

        const clickedValue = e.target.getAttribute("value");
        const selectedVideoDevices = localStorage.getItem('selectedVideoDevices')
        let config = {
            audio: { deviceId: { exact: clickedValue } },
            video: { deviceId: { exact: selectedVideoDevices } }
        }
        localStorage.setItem("selectedAudioDevices", clickedValue)
        navigator.mediaDevices.getUserMedia(config).then((stream) => {
            if (localVideo.srcObject){
                localVideo.srcObject.getTracks().forEach((track) => {
                    track.stop();
                });
            }
            localVideo.srcObject = null;
            store.setLocalStream(stream)
            localVideo.srcObject = stream;
        })
    }
});

const videoOptions = document.getElementById('camera-options')
const getMyDevices = async (config) => {
    try {
        localStorage.setItem('is_video_active', true)
        let videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
            (device) => device.kind === "videoinput"
        );
    
        videoDevices.forEach((video, index) => {
            let newElement = document.createElement("p");
            newElement.className = "dropdown-item dropdown-select-options";
            newElement.textContent = video.label;
            newElement.setAttribute('value', video.deviceId)
    
            videoOptions.appendChild(newElement);
        })
    
        isReady.video = true
    
        if (isReady.audio && isReady.video){
            let audioButton = document.getElementById('select-audio-button')
            let videoButton = document.getElementById('select-video-button')
            let videoDropdownButton = document.getElementById('dropdownMenuButton-video')
            let audioDropdownButton = document.getElementById('dropdownMenuButton-audio')
            videoDropdownButton.removeAttribute('disabled')
            audioDropdownButton.removeAttribute('disabled')
            videoButton.removeAttribute('disabled')
            audioButton.removeAttribute('disabled')
            let submitButton = document.getElementById('submit-button')
            submitButton.removeAttribute('disabled')
        }
    
        let videoIcons = document.getElementById('select-video')
        videoIcons.className = 'fas fa-video'
    
        localStorage.setItem('videoDevices', videoDevices)
        localStorage.setItem('selectedVideoDevices', videoDevices[0].deviceId)
    } catch (error) {
        let ae = document.getElementById("alert-error");
        ae.className = "show";
        ae.innerHTML = `Error : ${error.message}`
        // Show Warning
        setTimeout(() => { 
            ae.className = ae.className.replace("show", ""); 
            ae.innerHTML = ``
        }, 3000);
        console.log(error.message)
    }
}

videoOptions.addEventListener("click", (e) => {
    if (e.target.tagName === "P") {
        let videoButton = document.getElementById('select-video-button')
        let videoIcon = document.getElementById('select-video')
        videoIcon.className = 'fas fa-video'
        isAudioActive = true
        videoButton.style.backgroundColor = ''
        const clickedValue = e.target.getAttribute("value");
        const selectedAudioDevices = localStorage.getItem('selectedAudioDevices')
        let config = {
            video: { deviceId: { exact: clickedValue } },
            audio: { deviceId: { exact: selectedAudioDevices } }
        }

        localStorage.setItem('selectedVideoDevices', clickedValue)
        let data = store.getState()
        let oldStream = data.localStream
        oldStream.getVideoTracks()[0].stop()

        navigator.mediaDevices.getUserMedia(config).then((stream) => {
            if (localVideo.srcObject){
                localVideo.srcObject.getTracks().forEach((track) => {
                    track.stop();
                });
            }
            videoImage.className = 'video-on'
            localVideo.srcObject = null
            store.setLocalStream(stream)
            localVideo.srcObject = stream;
        })
    }
})



const usernameForm = document.getElementById('username')
usernameForm.addEventListener('input', (e) => {
    let buttonSubmit = document.getElementById('submit-button')
    if (!e.target.value){
        buttonSubmit.style.backgroundColor = 'grey'
    } else {
        buttonSubmit.style.backgroundColor = '#2c99ed'
    }
    localStorage.setItem('username', e.target.value);
})

joinRoom.addEventListener('submit', (e) => {
    e.preventDefault();

    const userName = document.getElementById('username').value;

    if (!userName){
        let au = document.getElementById("alert-username");
        au.className = "show";
        // Show Warning
        setTimeout(() => { au.className = au.className.replace("show", ""); }, 3000);
        return
    }

    const newURL = window.location.origin + "/" + goTo;

    console.log("- New URL : ", newURL);

    setTimeout(() => {
        window.location.href = newURL;
    }, 1000);

});

let audioButton = document.getElementById('select-audio-button')
audioButton.addEventListener('click', (e) => {
    let audioIcon = document.getElementById('select-audio')
    if (isAudioActive){
        audioButton.style.backgroundColor = 'red'
        localStorage.setItem('is_audio_active', false)
        isAudioActive = false
        audioIcon.className = 'fas fa-microphone-slash'
        if (isVideoActive){
            const selectedVideoDevices = localStorage.getItem('selectedVideoDevices')
            let config = {
                video: { deviceId: { exact: selectedVideoDevices } }
            }
            navigator.mediaDevices.getUserMedia(config).then((stream) => {
                if (localVideo.srcObject){
                    localVideo.srcObject.getTracks().forEach((track) => {
                        track.stop();
                    });
                }
                videoImage.className = 'video-on'
                localVideo.srcObject = null;
                store.setLocalStream(stream)
                localVideo.srcObject = stream;
            })
        } else {
            if (localVideo.srcObject){
                localVideo.srcObject.getTracks().forEach((track) => {
                    track.stop();
                });
            }
            videoImage.className = 'video-off'
            localVideo.srcObject = null;
            store.setLocalStream(null)
        }
    } else {
        audioButton.style.backgroundColor = ''
        localStorage.setItem('is_audio_active', true)
        isAudioActive = true
        audioIcon.className = 'fas fa-microphone'
        if (isVideoActive){
            const selectedVideoDevices = localStorage.getItem('selectedVideoDevices')
            const selectedAudioDevices = localStorage.getItem('selectedAudioDevices')
            let config = {
                audio: { deviceId: { exact: selectedAudioDevices } },
                video: { deviceId: { exact: selectedVideoDevices } }
            }
            navigator.mediaDevices.getUserMedia(config).then((stream) => {
                if (localVideo.srcObject){
                    localVideo.srcObject.getTracks().forEach((track) => {
                        track.stop();
                    });
                }
                videoImage.className = 'video-on'
                localVideo.srcObject = null;
                store.setLocalStream(stream)
                localVideo.srcObject = stream;
            })
        } else {
            const selectedAudioDevices = localStorage.getItem('selectedAudioDevices')
            let config = {
                audio: { deviceId: { exact: selectedAudioDevices } }
            }
            navigator.mediaDevices.getUserMedia(config).then((stream) => {
                if (localVideo.srcObject){
                    localVideo.srcObject.getTracks().forEach((track) => {
                        track.stop();
                    });
                }
                videoImage.className = 'video-off'
                localVideo.srcObject = null;
                store.setLocalStream(stream)
                localVideo.srcObject = stream;
            })
        }
    }
})

let videoButton = document.getElementById('select-video-button')
videoButton.addEventListener('click', (e) => {
    let videoIcon = document.getElementById('select-video')
    if (isVideoActive){
        videoButton.style.backgroundColor = 'red'
        localStorage.setItem('is_video_active', false)
        isVideoActive = false
        videoIcon.className = 'fas fa-video-slash'
        if (isAudioActive){
            const selectedAudioDevices = localStorage.getItem('selectedAudioDevices')
            let config = {
                audio: { deviceId: { exact: selectedAudioDevices } }
            }
            navigator.mediaDevices.getUserMedia(config).then((stream) => {
                if (localVideo.srcObject){
                    localVideo.srcObject.getTracks().forEach((track) => {
                        track.stop();
                    });
                }
                videoImage.className = 'video-off'
                localVideo.srcObject = null;
                store.setLocalStream(stream)
                localVideo.srcObject = stream;
            })
        } else {
            if (localVideo.srcObject){
                localVideo.srcObject.getTracks().forEach((track) => {
                    track.stop();
                });
            }
            videoImage.className = 'video-off'
            localVideo.srcObject = null;
            store.setLocalStream(null)
        }
    } else {
        videoButton.style.backgroundColor = ''
        localStorage.setItem('is_video_active', true)
        isVideoActive = true
        videoIcon.className = 'fas fa-video'
        if (isAudioActive){
            const selectedVideoDevices = localStorage.getItem('selectedVideoDevices')
            const selectedAudioDevices = localStorage.getItem('selectedAudioDevices')
            let config = {
                audio: { deviceId: { exact: selectedAudioDevices } },
                video: { deviceId: { exact: selectedVideoDevices } }
            }
            navigator.mediaDevices.getUserMedia(config).then((stream) => {
                if (localVideo.srcObject){
                    localVideo.srcObject.getTracks().forEach((track) => {
                        track.stop();
                    });
                }
                videoImage.className = 'video-on'
                localVideo.srcObject = null;
                store.setLocalStream(stream)
                localVideo.srcObject = stream;
            })
        } else {
            const selectedVideoDevices = localStorage.getItem('selectedVideoDevices')
            let config = {
                video: { deviceId: { exact: selectedVideoDevices } }
            }
            navigator.mediaDevices.getUserMedia(config).then((stream) => {
                if (localVideo.srcObject){
                    localVideo.srcObject.getTracks().forEach((track) => {
                        track.stop();
                    });
                }
                videoImage.className = 'video-on'
                localVideo.srcObject = null;
                store.setLocalStream(stream)
                localVideo.srcObject = stream;
            })
        }
    }
})
let buttonSubmitHover = document.getElementById('submit-button')
let triggerInput = document.getElementById('username')
buttonSubmitHover.addEventListener('mouseover', (e) => {
    console.log(triggerInput.value)
    if (!triggerInput.value){
        buttonSubmitHover.style.backgroundColor = 'red'
    } else {
        buttonSubmitHover.style.backgroundColor = 'green'
    }
})
buttonSubmitHover.addEventListener('mouseout', (e) => {
    if (!triggerInput.value){
        buttonSubmitHover.style.backgroundColor = 'grey'
    } else {
        buttonSubmitHover.style.backgroundColor = '#2c99ed'
    }
})
},{"../function":3,"./store":6}],6:[function(require,module,exports){
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
