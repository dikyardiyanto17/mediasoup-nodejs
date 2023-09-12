const Room = require("../schema/Room")

class Rooms {
	static async findRoom(req, res, next) {
		try {
			const { roomName, password } = req.body
            if (!roomName){
				throw { name: 'Bad Request', message: "Room ID Is Required" }
            }
            if (!password){
                throw { name: 'Bad Request', message: "Password Is Required"}
            }
			const room = await Room.findOne({ room: roomName })
            if (password != room.password || !room){
                throw { name: 'Invalid', message: "Invalid Room/Password"}
            }
		} catch (error) {
			next(error)
		}
	}

}

module.exports = { Rooms }
