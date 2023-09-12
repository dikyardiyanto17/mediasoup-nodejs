const mediasoup = require('mediasoup')

class Controller {
    static room(req, res, next) {
        try {
            res.render('room')
        } catch (error) {
            console.log(error)
        }
    }

    static home (req, res, next){
        try {
            res.render('home')
        } catch (error) {
            console.log(error)
        }
    }

    static lobby (req, res, next){
        try {
            res.render('lobby')
        } catch (error) {
            console.log(error)
        }
    }

    static testing (req, res, next){
        try {
            res.render('testing')
        } catch (error) {
            console.log(error)
        }
    }

    static register (req, res, next){
        try {
            res.render('register')
        } catch (error) {
            console.log(error)
        }
    }

    static login (req, res, next){
        try {
            res.render('login')
        } catch (error) {
            console.log(error)
        }
    }

    static authentication (req, res, next){
        try {
            console.log('HELLO')
        } catch (error) {
            next(error)
        }
    }
}
module.exports = Controller