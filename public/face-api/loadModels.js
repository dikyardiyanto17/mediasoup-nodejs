const { isFaceApiReady } = require("../javascript/room")

const initFaceApi = () => {
    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("../testing/face-api/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("../testing/face-api/models"),
        faceapi.nets.ssdMobilenetv1.loadFromUri("../testing/face-api/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("../testing/face-api/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("../testing/face-api/models"),
    ]).then((_) => {
        console.log('Face API Rady')
        isFaceApiReady = true
    })
}

module.exports = { initFaceApi }