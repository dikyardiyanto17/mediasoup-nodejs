// Create User Online List
const createUserList = (username, socketId, cameraTrigger = true) => {
	let userList = document.getElementById("user-list")
	let isExist = document.getElementById("user-" + socketId)
	let cameraInitSetting = ""
	if (cameraTrigger) {
		cameraInitSetting = "fas fa-video"
	} else {
		cameraInitSetting = "fas fa-video-slash"
	}
	if (!isExist) {
		let elementUser = document.createElement("div")
		elementUser.id = "user-" + socketId
		elementUser.className = "user-list-container"
		userList.appendChild(elementUser)
		let myUsername = document.createElement("span")
		myUsername.innerHTML = username
		myUsername.id = "ulu-" + socketId
		elementUser.appendChild(myUsername)
		let icons = document.createElement("div")
		icons.className = "user-list-icons-container"
		icons.id = "uli-" + socketId
		icons.innerHTML = `<section class="user-list-microphone"><img src="/assets/pictures/micOn.png" id="ulim-${socketId}"/></section><section class="user-list-camera"><i class="${cameraInitSetting}" id="ulic-${socketId}" style="color: #ffffff;"></i></section>`
		elementUser.appendChild(icons)
	}
}

module.exports = { createUserList }
