let faceInterval

const attachFaceApi = () => {
    let isFaceApiExist = document.getElementById('face-recognition')
    if (!isFaceApiExist){
        let elementFaceRecognition = document.createElement('div')
        elementFaceRecognition.className = 'face-recognition'
        elementFaceRecognition.id = "face-recognition"
        let isExist = document.getElementById('td-current-user-video')
        let video = document.getElementById('current-user-video')
        if (!video){
            video = document.getElementById('local-video')
        }
        if (isExist){
            const canvas = faceapi.createCanvasFromMedia(video)
            canvas.className = 'rotate'
            isExist.appendChild(elementFaceRecognition)
            elementFaceRecognition.append(canvas)
            faceapi.matchDimensions(canvas, { height: video.videoHeight, width: video.videoWidth })
            faceInterval = setInterval(() => {
                animateFaceExpression({ video, canvas })   
            }, 100)
        }
    }
}

const animateFaceExpression = async ({video, canvas}) => {
    let isFaceApiExist = document.getElementById('face-recognition')
    if (isFaceApiExist){
        const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceExpressions()
        const resizedDetections = faceapi.resizeResults(detections, {
            height: video.videoHeight,
            width: video.videoWidth,
        })
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizedDetections)
        // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
    } else {
        await deleteFaceApi()
    }
}

const deleteFaceApi = () => {
    clearInterval(faceInterval)
    let faceapiElement = document.getElementById('face-recognition')
    if (faceapiElement) faceapiElement.remove()
    faceInterval = null
}

module.exports = {
    deleteFaceApi, attachFaceApi
}