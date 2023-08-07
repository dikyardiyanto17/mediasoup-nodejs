let state = {
    localStream: null
}

const setLocalStream = (localStream) => {
    state = {
        ...state,
        localStream
    }
}

const getState = () => {
    return state
}

module.exports = {setLocalStream, getState}