const { totalUsers, currentTemplate, videoContainer } = require("../../javascript/room");

// Adjust Template Normal Mode
const normalTemplate = () => {
    if (totalUsers <= 2) {
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container');
        });
        currentTemplate = 'user-video-container'
    } else if (totalUsers == 3) {
        // Check Total User Is 3 To Adjust Template
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-3');
        });
        currentTemplate = 'user-video-container-3'
    } else if (totalUsers >= 4 && totalUsers <= 6) {
        // Check Total User Is Between 4 And 6 To Adjust Template
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-6');
        });
        currentTemplate = 'user-video-container-6'
    } else if (totalUsers >= 7 && totalUsers <= 8) {
        // Check Total User Is 7 Or 8 To Adjust Template
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-8');
        });
        currentTemplate = 'user-video-container-8'
    } else {
        // Check Total User Is More Than 8 To Adjust Template
        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-12');
        });
        currentTemplate = 'user-video-container-12'
    }
}

// Screen Sharing Template
const screenSharingTemplate = () => {
    const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
    userVideoContainers.forEach((container, index) => {
        container.classList.remove(currentTemplate);
        container.classList.add('user-video-container-screen-sharing');
    });
    currentTemplate = 'user-video-container-screen-sharing'
}

const videoContainerScreenSharingTrigger = (trigger) => {
    let videoContainerScreenSharing = document.getElementById('video-container-screen-sharing')
    if (trigger){
        videoContainerScreenSharing.style.minWidth = '0%'
        videoContainerScreenSharing.style.display = 'flex'
        videoContainerScreenSharing.classList.add('slide-right-animation')
        setTimeout(() => {
            videoContainerScreenSharing.style.minWidth = '25%'
        }, 100);
        setTimeout(() => {
            videoContainerScreenSharing.classList.remove('slide-right-animation')
        }, 1000);
    } else {
        videoContainerScreenSharing.style.minWidth = '0%'
        videoContainerScreenSharing.classList.add('slide-left-animation')
        setTimeout(() => {
            videoContainerScreenSharing.classList.remove('slide-left-animation')
            videoContainerScreenSharing.style.display = 'none'
        }, 1000);
    }
}

// Changing Layout User Video
const changeLayout = (isSharing) => {
    // Screen Sharing Layout
    let chatBarBoxElement = document.getElementById('chat-bar-box-id')
    let userBarElement = document.getElementById('user-bar')
    // resetButton()
    if (isSharing) {
        if (userBarElement.style.display == 'block' || chatBarBoxElement.style.display == 'block'){
            videoContainer.style.display = 'none'
        } else videoContainer.style.minWidth = '25%'
        let screenSharingLabel = document.createElement('div')
        screenSharingLabel.className = 'username'
        screenSharingLabel.innerHTML = 'Screen Sharing'
        videoContainer.id = 'video-container-screen-sharing'
        const fullContainer = document.getElementById('full-container-id')
        let newDiv = document.createElement("div");

        newDiv.id = "screen-sharing-container";

        fullContainer.insertBefore(newDiv, fullContainer.firstChild);

        if (!currentTemplate) {
            currentTemplate = 'user-video-container'
        }

        const userVideoContainers = document.querySelectorAll('.' + currentTemplate);
        userVideoContainers.forEach((container, index) => {
            container.classList.remove(currentTemplate);
            container.classList.add('user-video-container-screen-sharing');
        });
        currentTemplate = 'user-video-container-screen-sharing'

        let screenSharingElement = document.getElementById('screen-sharing-container')
        screenSharingElement.innerHTML = '<video id="' + 'screen-sharing' + '" autoplay class="user-video" ></video>'
        let screenSharingVideoElement = document.getElementById('screen-sharing')
        screenSharingVideoElement.appendChild(screenSharingLabel)

        videoContainer = document.getElementById('video-container-screen-sharing')
    } else {
        // Normal Layout
        videoContainer.id = 'video-container'
        let removeDiv = document.getElementById('screen-sharing-container')
        if (removeDiv) {
            removeDiv.parentNode.removeChild(removeDiv)
        }
        normalTemplate()
        videoContainer = document.getElementById('video-container')
        if (userBarElement.style.display == 'block' || chatBarBoxElement.style.display == 'block'){
            videoContainer.removeAttribute('style')
            videoContainer.style.minWidth = '75%'
        } else {
            videoContainer.removeAttribute('style')
            videoContainer.style.minWidth = '100%'
        }
    }
}

module.exports = { normalTemplate, screenSharingTemplate, videoContainerScreenSharingTrigger, changeLayout }