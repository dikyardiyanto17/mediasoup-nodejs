const io = require('socket.io-client')
const { getLocalStream } = require('../video/initial')
const { checkLocalStorage } = require('../validation/localstorage')
const socket = io('/')

// Initiating When Socket is Estabilished
socket.on('connection-success', ({ socketId }) => {
    checkLocalStorage()
    getLocalStream()
})

module.exports = { socket }