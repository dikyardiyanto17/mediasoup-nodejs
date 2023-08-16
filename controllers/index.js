const mediasoup = require('mediasoup')

class Controller {
    static room(req, res) {
        try {
            res.render('room')
        } catch (error) {
            console.log(error)
        }
    }

    static home (req, res){
        try {
            res.render('home')
        } catch (error) {
            console.log(error)
        }
    }

    static lobby (req, res){
        try {
            res.render('lobby')
        } catch (error) {
            console.log(error)
        }
    }

    static dummy (req, res){
        try {
            res.render('dummy')
            
        } catch (error) {
            console.log(error)
        }
    }
}
module.exports = Controller