const { device, rtpCapabilities, producerTransport, audioProducer, videoProducer, mediasoupClient } = require("../javascript/room")
const { socket } = require("../socket")
const { addMuteAllButton } = require("../ui/controllers/mute")
const { hideLoadingScreen, showLoadingScreen } = require("../ui/loading/loading")
const { createUserList } = require("../ui/users")

// Creating Media Devices and load RTPCapabilities to MediaSoup Client and Create Send Transport
const createDevice = async () => {
    try {
        // Create Device
        device = new mediasoupClient.Device()

        // Load Device
        await device.load({
            routerRtpCapabilities: rtpCapabilities
        })

        console.log('- Device RTP Capabilities', device.rtpCapabilities)

        // Create Send Transport
        createSendTransport()

    } catch (error) {
        console.log(error)
        if (error.name === 'UnsupportedError')
            console.warn('browser not supported')
    }
}

// Create Send Transport
const createSendTransport = () => {
    // Signaling To Server
    socket.emit('createWebRtcTransport', { consumer: false }, ({ params }) => {
        if (params.error) {
            console.log(params.error)
            return
        }

        console.log("- Create Send Transport : ", params)

        // Producing Producer Transport
        producerTransport = device.createSendTransport(params)

        // Get DLTS Parameter
        producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                console.log("- Producer Transport Connecting")
                // Signaling To Server and Sending DLTS Parameters
                await socket.emit('transport-connect', {
                    dtlsParameters,
                })

                callback()

            } catch (error) {
                errback(error)
            }
        })  

        // Producing Transport and Get Parameters
        producerTransport.on('produce', async (parameters, callback, errback) => {
            console.log("- Create Web RTC Transport / Producer : ", parameters)

            try {
                // Signaling to Server And Sending Parameters
                await socket.emit('transport-produce', {
                    kind: parameters.kind,
                    rtpParameters: parameters.rtpParameters,
                    appData: parameters.appData,
                }, ({ id, producersExist }) => {
                    callback({ id })

                    if (producersExist) getProducers()
                })
            } catch (error) {
                errback(error)
            }
        })

        producerTransport.on('connectionstatechange', async (e) => {
            console.log('- State Change Producer : ', e)
            let buttonRecord = document.getElementById('user-record-button')
            let buttonMic = document.getElementById('user-mic-button')
            let buttonHangUp = document.getElementById('user-hang-up-button')
            let buttonSwitchCamera = document.getElementById('user-switch-camera-button')
            let buttonTurnOffCamera = document.getElementById('user-turn-on-off-camera-button')
            let buttonScreenShare = document.getElementById('user-screen-share-button')
            let buttonChat = document.getElementById('user-chat-button')
            let buttonShare = document.getElementById('share-link-button')
            let buttonUserList = document.getElementById('user-list-button')
            // Enabling Button When Producer Is Connecting
            if (e == 'connected'){
                hideLoadingScreen()
                createUserList(localStorage.getItem('username'), socket.id, isCameraOn)
                buttonRecord.removeAttribute('disabled', 'false')
                buttonMic.removeAttribute('disabled', 'false')
                buttonHangUp.removeAttribute('disabled', 'false')
                buttonSwitchCamera.removeAttribute('disabled', 'false')
                buttonTurnOffCamera.removeAttribute('disabled', 'false')
                buttonScreenShare.removeAttribute('disabled', 'false')
                buttonChat.removeAttribute('disabled', 'false')
                buttonShare.removeAttribute('disabled', 'false')
                buttonUserList.removeAttribute('disabled', 'false')
            } 
            if (e == 'connecting'){
                showLoadingScreen()
                buttonRecord.setAttribute('disabled', 'true')
                buttonMic.setAttribute('disabled', 'true')
                buttonHangUp.setAttribute('disabled', 'true')
                buttonSwitchCamera.setAttribute('disabled', 'true')
                buttonTurnOffCamera.setAttribute('disabled', 'true')
                buttonScreenShare.setAttribute('disabled', 'true')
                buttonChat.setAttribute('disabled', 'true')
                buttonShare.setAttribute('disabled', 'true')
            } 
            const url = window.location.pathname;
            const parts = url.split('/');
            const roomName = parts[2];
            const goTo = 'lobby/' + roomName;
            if (e == 'failed'){
                showLoadingScreen()
                buttonRecord.setAttribute('disabled', 'true')
                buttonMic.setAttribute('disabled', 'true')
                buttonHangUp.setAttribute('disabled', 'true')
                buttonSwitchCamera.setAttribute('disabled', 'true')
                buttonTurnOffCamera.setAttribute('disabled', 'true')
                buttonScreenShare.setAttribute('disabled', 'true')
                buttonChat.setAttribute('disabled', 'true')
                buttonShare.setAttribute('disabled', 'true')
                const newURL = window.location.origin + "/" + goTo;
                window.location.href = newURL;
            } 
            if (e == 'disconnected'){
                showLoadingScreen()
                buttonRecord.setAttribute('disabled', 'true')
                buttonMic.setAttribute('disabled', 'true')
                buttonHangUp.setAttribute('disabled', 'true')
                buttonSwitchCamera.setAttribute('disabled', 'true')
                buttonTurnOffCamera.setAttribute('disabled', 'true')
                buttonScreenShare.setAttribute('disabled', 'true')
                buttonChat.setAttribute('disabled', 'true')
                buttonShare.setAttribute('disabled', 'true')
                // const newURL = window.location.origin + "/" + goTo;
                // window.location.href = newURL;
            }
        })

        // Connecting Send Transport
        connectSendTransport()
    })
}

// Connecting Send Transport and Producing Audio and Video Producer
const connectSendTransport = async () => {
    // Producing Audio And Video Transport
    audioProducer = await producerTransport.produce(audioParams);
    videoProducer = await producerTransport.produce(videoParams);


    socket.emit('am-i-host', {socketId: socket.id, roomName: localStorage.getItem('room_id')}, (data) => {
        if (data.authority == 'Host'){
            addMuteAllButton()
            document.getElementById('my-username').innerHTML = localStorage.getItem('username') + ' ( Host )'
            console.log('- Authority : ', data.authority)
            host = socket.id
        }
    })

    audioProducer.on('trackended', () => {
        console.log('audio track ended')

    })

    audioProducer.on('transportclose', () => {
        console.log('audio transport ended')

    })

    videoProducer.on('trackended', () => {
        console.log('video track ended')

    })

    videoProducer.on('transportclose', () => {
        console.log('video transport ended')

    })
}

module.exports = { createDevice, connectSendTransport }