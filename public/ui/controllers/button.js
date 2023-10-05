let optionalButtonTrigger = document.getElementById('optional-button-trigger')
let optionalMenuId = document.getElementById('optional-button-id')
optionalButtonTrigger.addEventListener('click', (e) => {
    let optionalButtonIcon = document.getElementById('optional-button-trigger-icon')
    if (optionalMenuId.className == 'optional-button-menu'){
        optionalMenuId.className = 'optional-button-menu-show'
        optionalButtonIcon.className = 'fas fa-sort-down'
    } else if (optionalMenuId.className == 'optional-button-menu hide'){
        optionalMenuId.className = 'optional-button-menu-show'
        optionalButtonIcon.className = 'fas fa-sort-down'
    } else {
        optionalMenuId.className = 'optional-button-menu'
        optionalButtonIcon.className = 'fas fa-sort-up'
    }
})
