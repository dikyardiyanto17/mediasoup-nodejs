const mediasoup = require('mediasoup')
class Controller {
    static room(req, res, next) {
        try {
            res.render('room')
        } catch (error) {
            next(error)
        }
    }

    static home (req, res, next){
        try {
            res.render('home')
        } catch (error) {
            next(error)
        }
    }

    static lobby (req, res, next){
        try {
            res.render('lobby')
        } catch (error) {
            next(error)
        }
    }

    static login (req, res, next){
        try {
            res.render('login')
        } catch (error) {
            next(error)
        }
    }

    static register (req, res, next) {
        try {
            res.render('register')
        } catch (error) {
            next(error)
        }
    }

    static testing (req, res, next){
        try {
            res.render('testing')
        } catch (error) {
            next(error)
        }
    }
}
module.exports = Controller