const Room = require("../schema/Room")

class Rooms {
	static async findRoom(req, res, next) {
		try {
			const { roomId } = req.params
            if (!roomId){
				throw { name: 'Bad Request', message: "Room ID Is Required" }
            }
			const room = await Room.findOne({ name: roomId })
            if (!room){
                throw { name: 'Invalid', message: "Invalid Room/Password"}
            }
			res.status(200).json(room)
		} catch (error) {
			next(error)
		}
	}

	static async createRoom (req, res, next) {
		try {
			const { roomName } = req.body
			const { id } = req.user
			if (!roomName){
				throw { name: 'Bad Request', message: "Room ID Is Required" }
            }
			const room = await Room.create({
				name: roomName,
				participants: [id]
			});

			res.status(201).json(room);
		} catch (error) {
			next(error)
		}
	}
}

module.exports = { Rooms }