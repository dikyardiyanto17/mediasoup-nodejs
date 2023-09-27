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
