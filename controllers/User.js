const { hashPassword, comparePassword } = require("../helpers/bcryptjs")
const { encodeToken, decodeToken } = require("../helpers/jwt")
const User = require("../schema/User")
const Room = require("../schema/Room")

class Users {
	static async register(req, res, next) {
		try {
			const { email, password } = req.body
			const isExist = await User.findOne({ email })
			if (isExist?.email) {
				throw { name: "Registered", message: "Users with name " + email + " is already registered" }
			}
			if (!email) {
				throw { name: "Bad Request", message: "Email Is Required" }
			}
			if (!password) {
				throw { name: "Bad Request", message: "Password Is Required" }
			}
			const hashPasswordUser = hashPassword(password)
			await User.create({ email, password: hashPasswordUser, authority: 'Participants' })
			return res.status(201).json({ message: "Successfully Register" })
		} catch (error) {
			next(error)
		}
	}

	static async login(req, res, next) {
		try {
			const { email, password } = req.body
			if (!email) {
				throw { name: "Bad Request", message: "Email is empty" }
			}
			if (!password) {
				throw { name: "Bad Request", message: "Password is empty" }
			}
			const user = await User.findOne({ email })
			if (!user) {
				throw { name: "Invalid", message: "Invalid Email/Password" }
			}
			let isValidPassword = comparePassword(password, user.password)
			if (!isValidPassword) {
				throw { name: "Invalid", message: "Invalid Email/Password" }
			}
			const encodedToken = { id: user._id }
			const access_token = encodeToken(encodedToken)
			res.status(201).json({ access_token })
		} catch (error) {
			next(error)
		}
	}

	static async getUser (req, res, next) {
		try {
			const { id } = req.user
			const user = await User.findById(id)
			res.status(200).json(user)
		} catch (error) {
			next(error)
		}
	}
}

module.exports = { Users }