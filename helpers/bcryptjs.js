const bcrypt = require('bcryptjs')

const hashPassword = (password) => {
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(password, salt)
    return password = hash
}

const comparePassword = (inputPassword, password) => {
    let isValidPassword = bcrypt.compareSync(inputPassword, password)
    return isValidPassword
}

module.exports = {hashPassword, comparePassword}