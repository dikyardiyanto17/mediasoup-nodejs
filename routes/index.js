const express = require('express')
const Controller = require('../controllers/index.js')
const router = express.Router()

router.get('/', Controller.home)
router.get('/lobby/:room', Controller.lobby)
router.get('/room/:room', Controller.room)
router.get('/testing', Controller.testing)

module.exports = router