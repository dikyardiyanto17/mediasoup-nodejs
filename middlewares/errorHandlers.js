const errorHandler = (err, req, res, next) => {
    console.log("- Error : ", err)
    if (err.name == "Bad Request") {
      res.status(400).json({ name: err.name, message: err.message })
    } else if (err.name == "Registered" || err.name == "Invalid") {
      res.status(401).json({ name: err.name, message: err.message })
    } else if (err.name == "Not Found") {
      res.status(404).json({ name: err.name, message: err.message })
    } else if (err.name == 'Invalid' || err.name == 'JsonWebTokenError') {
      res.status(401).json({ name: err.name, message: err.message })
    } else if (err.name == 'JsonWebTokenError') { 
      res.status(401).json({ name: err.name, message: err.message })
    } else {
      res.status(500).json({ name: 'Internal Error Server', message: err})
    }
  }
  
  module.exports = errorHandler