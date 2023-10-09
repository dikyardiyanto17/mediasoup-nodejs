const mediasoup = require('mediasoup')
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client();
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

    static login (req, res){
        try {
            res.render('login')
        } catch (error) {
            console.log(error)
        }
    }

    static register (req, res) {
        try {
            res.render('register')
        } catch (error) {
            console.log(error)
        }
    }

    static testing (req, res){
        try {
            res.render('testing')
        } catch (error) {
            console.log(error)
        }
    }

    static async googleAuth (req, res) {
        try {
            const ticket = await client.verifyIdToken({
                idToken: req.body.credential,
                audience: '623403491943-290gkq7bnqtgeprtfaci3u76vtb39bjl.apps.googleusercontent.com',  // Specify the CLIENT_ID of the app that accesses the backend
            });
            const payload = ticket.getPayload();
            const userid = payload['sub'];
            console.log('- Payload : ', payload)
        } catch (error) {
            console.log(error)
        }
    }
}
module.exports = Controller