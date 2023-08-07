let state = {
    localStream: null
}

export const setLocalStream = (localStream) => {
    state = {
        ...state,
        localStream
    }
}

export const getState = () => {
    return state
}