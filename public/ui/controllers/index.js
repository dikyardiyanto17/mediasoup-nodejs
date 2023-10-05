const resetButton = () => {
    resetButtonUserList()
    resetButtonChat()
}

const resetButtonUserList = () => {
    const userListButton = document.getElementById('user-list-button')
    let userBarElement = document.getElementById('user-bar')
    userListButton.classList.replace('button-small-custom-clicked', 'button-small-custom')
    userBarElement.removeAttribute('style')
}

const resetButtonChat = () => {
    const chatButton = document.getElementById('user-chat-button')
    let chatBarBoxElement = document.getElementById('chat-bar-box-id')
    chatButton.classList.replace('button-small-custom-clicked', 'button-small-custom')
    chatBarBoxElement.removeAttribute('style')
}

module.exports = { resetButton, resetButtonUserList, resetButtonChat }