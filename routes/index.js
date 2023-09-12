const express = require("express")
const Controller = require("../controllers/index.js")
const { Users } = require("../controllers/User.js")
const authentication = require("../middlewares/authentication.js")
const router = express.Router()

// API Login / Register
router.post("/api/register", Users.register)
router.post("/api/login", Users.login)

// Website Login / Register
router.get("/register", Controller.register)
router.get("/login", Controller.login)

// Access Website
router.get("/", Controller.home)
router.get("/lobby/:room", Controller.lobby)
router.get("/room/:room", Controller.room)
router.get("/testing", Controller.testing)

// Authentication
router.use(authentication)

// API Main Feature
router.get('/api/auth', Controller.authentication)
module.exports = router