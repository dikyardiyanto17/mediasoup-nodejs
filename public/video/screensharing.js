const { isScreenSharing, screenSharingStreamsGlobal, screenSharingParams, screenSharingProducer, producerTransport, producersDetails, audioProducer, screenSharingInfo, currentTemplate } = require("../javascript/room")
const { socket } = require("../socket")
const { changeLayout } = require("../ui/template")

// Screen Sharing
const getScreenSharing = async () => {
    let screenShareButton = document.getElementById('user-screen-share-button')
    try {
        // Check If There Is No One Screen Sharing
        if (!isScreenSharing) {
            // Change Layout Based On Which Mode
            changeLayout(true)
            // Get Screen Sharing Id
            let screenSharingVideo = document.getElementById('screen-sharing')
            // Get Screen Sharing Stram
            screenSharingStreamsGlobal = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    displaySurface: "window",
                    chromeMediaSource: "desktop",
                },
            });
            // Insert Screen Sharing Stream To Element
            screenSharingVideo.srcObject = screenSharingStreamsGlobal
            // Preparing Screen Sharing Producer
            screenSharingParams = { track: screenSharingStreamsGlobal.getVideoTracks()[0] }
            // Create Screen Sharing Producer
            screenSharingProducer = await producerTransport.produce(screenSharingParams);
            // Function When Screen Sharing Ended
            screenSharingStreamsGlobal.getVideoTracks()[0].onended = function () {
                // Signaling Other User That Screen Sharing Is Ended
                for (const key in producersDetails) {
                    socket.emit('screen-sharing', ({ videoProducerId: screenSharingProducer.id, audioProducerId: audioProducer.id, socketId: key, isSharing: false, producerId: screenSharingProducer.id }))
                }
                // Closing Screen Sharing Producer
                socket.emit('screen-sharing-producer', ({ videoProducerId: screenSharingProducer.id, audioProducerId: audioProducer.id, socketId: socket.id, isSharing: false, producerId: screenSharingProducer.id, room: localStorage.getItem('room_id') }))
                // Set Screen Sharing is False
                isScreenSharing = false
                // Change Layout To Normal Mode
                changeLayout(false)
                // Set Screen Sharing Global to Null
                screenSharingStreamsGlobal = null
                // Reset Screen Sharing Params
                screenSharingParams = { }
                // Set Who Is Screen Sharing To Null
                screenSharingInfo = null
            
                screenShareButton.classList.replace('button-small-custom-clicked', 'button-small-custom')

            };

            screenSharingProducer.on('trackended', () => {
                console.log('video track ended')

            })

            screenSharingProducer.on('transportclose', () => {
                console.log('video transport ended')
            })

            // Change Current Template
            if (!currentTemplate) {
                currentTemplate = 'user-video-container'
            }

            // Add Info Who Is Screen Sharing
            screenSharingInfo = { socketId: socket.id }
            isScreenSharing = true
            screenShareButton.classList.replace('button-small-custom', 'button-small-custom-clicked')
        } else if (isScreenSharing && screenSharingInfo.socketId != socket.id) {
            // If Someone Is Trying To Sharing Their Screen When Someone Is Already To Screen Share, Warn Them
            let as = document.getElementById("alert-screensharing");
            as.className = "show";
            // Show Warning
            setTimeout(() => { as.className = as.className.replace("show", ""); }, 3000);
        } else {
            // Stopping Screen Sharing and Set All Configuration To Normal Mode
            screenSharingStreamsGlobal.getTracks().forEach((track) => track.stop());
            screenSharingInfo = null
            isScreenSharing = false
            changeLayout(false)
            for (const key in producersDetails) {
                socket.emit('screen-sharing', ({ videoProducerId: screenSharingProducer.id, audioProducerId: audioProducer.id, socketId: key, isSharing: false, producerId: screenSharingProducer.id }))
            }
            socket.emit('screen-sharing-producer', ({ videoProducerId: screenSharingProducer.id, audioProducerId: audioProducer.id, socketId: socket.id, isSharing: false, producerId: screenSharingProducer.id, room: localStorage.getItem('room_id') }))
            screenSharingParams = { }

            screenSharingStreamsGlobal = null
            screenShareButton.classList.replace('button-small-custom-clicked', 'button-small-custom')
        }
    } catch (error) {
        changeLayout(false)
        console.log(error)
        screenSharingInfo = null
        isScreenSharing = false
        screenShareButton.className = 'btn button-small-custom'
    }
}

module.exports = { getScreenSharing }