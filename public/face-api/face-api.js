const initFaceApi = () => {
    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("./face-api/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("./face-api/models"),
        faceapi.nets.ssdMobilenetv1.loadFromUri("./face-api/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("./face-api/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("./face-api/models"),
    ]).then((_) => {
        console.log('FACE API SUCCESS')
    })
}

const attachFaceApi = () => {
    let elementFaceRecognition = document.createElement('div')
	elementFaceRecognition.className = 'face-recognition'
    elementFaceRecognition.id = "face-recognition"
    let isExist = document.getElementById('td-current-user-video')
    let video = document.getElementById('current-user-video')
    if (isExist){
        const canvas = faceapi.createCanvasFromMedia(video)
        isExist.appendChild(elementFaceRecognition)
        elementFaceRecognition.append(canvas)
        faceapi.matchDimensions(canvas, { height: video.videoHeight, width: video.videoWidth })
        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceExpressions()
            const resizedDetections = faceapi.resizeResults(detections, {
                height: video.videoHeight,
                width: video.videoWidth,
            })
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
            faceapi.draw.drawDetections(canvas, resizedDetections)
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
        }, 100)
    }
}