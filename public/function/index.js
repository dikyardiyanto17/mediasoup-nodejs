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
