const addMuteAllButton = () => {
    let allOptionMenu = document.getElementById('all-option-menu')
    let isExist = document.getElementById('mute-all')
    if (!isExist){
        const newElement = document.createElement('li')
        newElement.id = 'mute-all'
        newElement.style.fontSize = '13px'
        newElement.innerHTML = "Mute All Participants"
        allOptionMenu.appendChild(newElement)
        newElement.addEventListener('click', () => {
            if (host == socket.id && newElement.innerHTML == 'Mute All Participants'){
                isMutedAll = true
                muteAllParticipants()
                newElement.innerHTML = 'Unmute All Participants'
            } else if (host == socket.id && newElement.innerHTML == 'Unmute All Participants'){
                isMutedAll = false
                unlockAllMic()
                newElement.innerHTML = 'Mute All Participants'
            } else {
                let ae = document.getElementById("alert-error");
                ae.className = "show";
                ae.innerHTML = `You're Not Host`
                // Show Warning
                setTimeout(() => { 
                    ae.className = ae.className.replace("show", ""); 
                    ae.innerHTML = ``
                }, 3000);
            }
        })
    }
}

module.exports = { addMuteAllButton }