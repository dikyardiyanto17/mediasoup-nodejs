const { decodeToken } = require("../helpers/jwt")
const User = require("../schema/User")

const authentication = async (req, res, next) => {
	const { access_token } = req.headers
	try {
		if (!access_token) throw { name: "Invalid", message: "Token is invalid" }
		const payload = decodeToken(access_token)
		const user = await User.findById(payload.id)
		if (!user) throw { name: "Invalid", message: "Token is invalid" }
		req.user = { id: user.id }
		next()
	} catch (error) {
		next(error)
	}
}

module.exports = authentication