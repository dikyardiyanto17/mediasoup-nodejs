const mongoose = require('mongoose')
const Schema = mongoose.Schema

const roomSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    participants: [{
        user_id: { type: mongoose.ObjectId}
    }],
    password: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Room', roomSchema)