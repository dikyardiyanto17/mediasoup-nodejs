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