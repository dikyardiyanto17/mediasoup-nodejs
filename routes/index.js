const express = require('express')
const Controller = require('../controllers/index.js')
const router = express.Router()
const { Users } = require("../controllers/User.js")
const authentication = require('../middlewares/authentication.js')
const { Rooms } = require('../controllers/Room.js')

// API Login / Register
router.post("/api/register", Users.register)
router.post("/api/login", Users.login)

// Views
router.get('/', Controller.home)
router.get('/lobby/:room', Controller.lobby)
router.get('/room/:room', Controller.room)
router.get('/testing', Controller.testing)
router.get('/login', Controller.login)
router.get('/register', Controller.register)

// Authentication
router.use(authentication)

// Api
router.get('/api/user', Users.getUser)
router.post('/api/room',Rooms.createRoom)
router.get('/api/room/:roomId',Rooms.findRoom)

module.exports = router