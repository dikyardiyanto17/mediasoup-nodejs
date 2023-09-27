const mongoose = require('mongoose')
const Schema = mongoose.Schema

const roomSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    password: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model('Room', roomSchema)