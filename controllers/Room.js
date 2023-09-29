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
                throw { name: 'Invalid', message: "Invalid Room"}
            }
			await res.status(200).json(room)
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

			await res.status(201).json(room);
		} catch (error) {
			next(error)
		}
	}

	static async joinRoom (req, res, next) {
		try {
			const { roomName, type } = req.body
			const { id } = req.user
			if (!roomName){
				throw { name: 'Bad Request', message: "Room ID Is Required" }
            }

			const room = await Room.find({name: roomName})
			if (type == 'Join'){
				const isExist = room[0].participants.find(data => data == id)
				if (!isExist) {
					room[0].participants.push(id)
					room[0].save()
					await res.status(200).json({message: 'Join Success'})
				} else {
					await res.status(200).json({message: 'Already Joined'})
				}
			} else {
				console.log('- QUIT : ', id)
				const newParticipants = room[0].participants.filter(data => data != id)
				room[0].participants = newParticipants
				room[0].save()
				await res.status(204)
			}
		} catch (error) {
			next(error)
		}
	}
}

module.exports = { Rooms }