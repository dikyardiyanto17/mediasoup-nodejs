// const elementToControl = document.getElementById('element-to-control');
// let isCursorMoving = false;
// let hideTimeout;

// // Function to show the element
// function showElement() {
//     elementToControl.classList.remove('hidden');
//     isCursorMoving = true;
// }

// // Function to hide the element
// function hideElement() {
//     elementToControl.classList.add('hidden');
//     isCursorMoving = false;
// }

// // Add mousemove event listener to detect cursor movement across the entire screen
// document.addEventListener('mousemove', () => {
//     if (!isCursorMoving) {
//         showElement();
//     }

//     // Reset cursor movement detection and hide the element after a certain time (e.g., 3 seconds)
//     clearTimeout(hideTimeout);
//     hideTimeout = setTimeout(hideElement, 2000); // Adjust the time as needed
// });

// // Initially hide the element
// hideElement();

// Face Recognition
// const video = document.getElementById("video")

// Promise.all([
// 	faceapi.nets.tinyFaceDetector.loadFromUri("./face-api/models"),
// 	faceapi.nets.faceLandmark68Net.loadFromUri("./face-api/models"),
// 	faceapi.nets.ssdMobilenetv1.loadFromUri("./face-api/models"),
// 	faceapi.nets.faceRecognitionNet.loadFromUri("./face-api/models"),
// 	faceapi.nets.faceExpressionNet.loadFromUri("./face-api/models"),
// ]).then(startWebcam)

// function startWebcam() {
// 	navigator.mediaDevices
// 		.getUserMedia({
// 			video: true,
// 			audio: false,
// 		})
// 		.then((stream) => {
// 			video.srcObject = stream
// 		})
// 		.catch((error) => {
// 			console.error(error)
// 		})
// }

// video.addEventListener("play", () => {
// 	let faceContainer = document.getElementById("face-recognition")
// 	const canvas = faceapi.createCanvasFromMedia(video)
// 	// document.body.append(canvas)
// 	faceContainer.append(canvas)
// 	faceapi.matchDimensions(canvas, { height: video.videoHeight, width: video.videoWidth })
// 	setInterval(async () => {
// 		const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceExpressions()

// 		const resizedDetections = faceapi.resizeResults(detections, {
// 			height: video.videoHeight,
// 			width: video.videoWidth,
// 		})
// 		canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
// 		faceapi.draw.drawDetections(canvas, resizedDetections)
// 		faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
// 	}, 100)
// })

// Detect Person
// const video = document.getElementById("video");

// Promise.all([
//   faceapi.nets.ssdMobilenetv1.loadFromUri("./face-api/models"),
//   faceapi.nets.faceRecognitionNet.loadFromUri("./face-api/models"),
//   faceapi.nets.faceLandmark68Net.loadFromUri("./face-api/models"),
// ]).then(startWebcam);

// function startWebcam() {
//   navigator.mediaDevices
//     .getUserMedia({
//       video: true,
//       audio: false,
//     })
//     .then((stream) => {
//       video.srcObject = stream;
//     })
//     .catch((error) => {
//       console.error(error);
//     });
// }

// function getLabeledFaceDescriptions() {
//   const labels = ["Dika", "Diky"];
//   return Promise.all(
//     labels.map(async (label) => {
//       const descriptions = [];
//       for (let i = 1; i <= 2; i++) {
//         const img = await faceapi.fetchImage(`./face-api/${label}/${i}.jpeg`);
//         const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
//         if (detections){
//             descriptions.push(detections.descriptor);
//         }
//       }
//       return new faceapi.LabeledFaceDescriptors(label, descriptions);
//     })
//   );
// }

// video.addEventListener("play", async () => {
//   const labeledFaceDescriptors = await getLabeledFaceDescriptions();
//   let faceContainer = document.getElementById('face-recognition')
//   const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

//   const canvas = faceapi.createCanvasFromMedia(video);
//   faceContainer.append(canvas);

//   const displaySize = { width: video.videoWidth, height: video.videoHeight };
//   faceapi.matchDimensions(canvas, displaySize);

//   setInterval(async () => {
//     const detections = await faceapi
//       .detectAllFaces(video)
//       .withFaceLandmarks()
//       .withFaceDescriptors();

//     const resizedDetections = faceapi.resizeResults(detections, displaySize);

//     canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

//     const results = resizedDetections.map((d) => {
//       return faceMatcher.findBestMatch(d.descriptor);
//     });
//     results.forEach((result, i) => {
//       const box = resizedDetections[i].detection.box;
//       const drawBox = new faceapi.draw.DrawBox(box, {
//         label: result,
//       });
//       drawBox.draw(canvas);
//     });
//   }, 100);
// });

const handleCredentialResponse = async (response) => {
	try {
		console.log("response", response)
		// let baseUrl = 'https://localhost:3001/'

		// const result = await fetch (baseUrl + 'google-auth',{
		// 	method: 'POST',
		// 	headers: {
		// 		access_token_google: response.credential,
		// 	},
		// })

		// console.log('- Result : ', result)

		// let access_token = result.access_token
	} catch (error) {
		console.log("- Error : ", error)
	}
}

window.onload = () => {
	google.accounts.id.initialize({
		client_id: "623403491943-290gkq7bnqtgeprtfaci3u76vtb39bjl.apps.googleusercontent.com",
		callback: handleCredentialResponse,
	})
	google.accounts.id.prompt() // also display the One Tap dialog
}