const jwt = require('jsonwebtoken')
const SASUKEEENARUTOOOO = process.env.JWT_SECRET

const encodeToken = (payload) => {
    return jwt.sign(payload, SASUKEEENARUTOOOO)
}

const decodeToken = (token) => {
    return jwt.verify(token, SASUKEEENARUTOOOO)
}

module.exports = {encodeToken, decodeToken}