const showLoadingScreen = () => {
    document.getElementById('loading-screen').style.display = 'block';
}

const hideLoadingScreen = () => {
    document.getElementById('loading-screen').style.display = 'none';
}

module.exports = { showLoadingScreen, hideLoadingScreen}