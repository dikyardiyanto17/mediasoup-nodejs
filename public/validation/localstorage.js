// Check Initial Configuration
const checkLocalStorage = () => {
	const url = window.location.pathname
	const parts = url.split("/")
	const roomName = parts[2]
	// Set Room Id
	localStorage.setItem("room_id", roomName)
	// Check Config For Audio Devices, Selected Audio Device, Video Devices, Selected Video Devices, Room Id, Username
	if (
		!localStorage.getItem("audioDevices") ||
		!localStorage.getItem("room_id") ||
		!localStorage.getItem("selectedVideoDevices") ||
		!localStorage.getItem("videoDevices") ||
		!localStorage.getItem("username") ||
		!localStorage.getItem("selectedAudioDevices")
	) {
		const url = window.location.pathname
		const parts = url.split("/")
		const roomName = parts[2]
		const goTo = "lobby/" + roomName
		const newURL = window.location.origin + "/" + goTo
		// If There Is Not, It Will Redirect To Lobby
		window.location.href = newURL
	}
}

module.exports = { checkLocalStorage }
