const elementToControl = document.getElementById('element-to-control');
let isCursorMoving = false;
let hideTimeout;

// Function to show the element
function showElement() {
    elementToControl.classList.remove('hidden');
    isCursorMoving = true;
}

// Function to hide the element
function hideElement() {
    elementToControl.classList.add('hidden');
    isCursorMoving = false;
}

// Add mousemove event listener to detect cursor movement across the entire screen
document.addEventListener('mousemove', () => {
    if (!isCursorMoving) {
        showElement();
    }

    // Reset cursor movement detection and hide the element after a certain time (e.g., 3 seconds)
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(hideElement, 2000); // Adjust the time as needed
});

// Initially hide the element
hideElement();
