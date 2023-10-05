// Create Audio Visualizer
const createAudioVisualizer = (track, id, appendTo) => {
    const newElement = document.createElement('canvas')
    newElement.className = 'audio-visualizer'
    newElement.id = 'av-' + id
    const attachTo = document.getElementById(`td-${appendTo}`)
    if (attachTo){
        attachTo.appendChild(newElement)
    
        const canvas = document.getElementById(`av-${id}`);
        const ctx = canvas.getContext('2d');
    
        // Access the microphone audio stream (replace with your stream source)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let newTheAudio = new MediaStream([track])
    
        const audioSource = audioContext.createMediaStreamSource(newTheAudio);
        audioSource.connect(analyser);
    
        // Function to draw the single audio bar
        function drawBar() {
            analyser.getByteFrequencyData(dataArray);
    
            const barHeight = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            canvas.style.boxShadow = `inset 0 0 0 ${barHeight/20}px green, 0 0 0 ${barHeight/20}px green`
    
            requestAnimationFrame(drawBar);
        }
    
        // Start drawing the single bar
        drawBar();
    }
}

module.exports = { createAudioVisualizer }