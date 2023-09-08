const express = require("express")
const Controller = require("../controllers/index.js")
const { Users } = require("../controllers/User.js")
const router = express.Router()

router.get("/", Controller.home)
router.get("/lobby/:room", Controller.lobby)
router.get("/room/:room", Controller.room)
router.get("/testing", Controller.testing)
router.get("/register", Controller.register)
router.get("/login", Controller.login)

// API
router.post("/api/register", Users.register)
router.post("/api/login", Users.login)

module.exports = router