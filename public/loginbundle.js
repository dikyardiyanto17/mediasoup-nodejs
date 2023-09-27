(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const getUser = async () => {
    try {
        const api = 'https://192.168.18.68:3001/api/user'
        const response = await fetch(api, {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                'access_token': localStorage.getItem('access_token')
            },
        })
        if (!response.ok){
            const error = await response.json()
            throw { name : error.name, message: error.message, status: false }
        } else {
            let responseData = await response.json()
            return data = {...responseData, status: true}
        }
    } catch (error) {
        return error
    }
}

module.exports = { getUser }
},{}],2:[function(require,module,exports){
const { getUser } = require("../api/user")

document.addEventListener("DOMContentLoaded", function () {
	const initialization = async () => {
		try {
			const data = await getUser()
			if (data.status){
				window.location.href = window.location.origin;
			} else throw data
		} catch (error) {
			console.log(error)
		}
	}
	initialization()
	const loginForm = document.getElementById("login-form")

	loginForm.addEventListener("submit", async (event) => {
		try {
			event.preventDefault()
			const email = document.getElementById("login-email").value
			const password = document.getElementById("login-passwords").value
		if (!email) throw { name: 'Bad Request', message: 'Email Is Required' }
		if (!password) throw { name: 'Bad Request', message: 'Password Is Required' }

			const data = {
				email,
				password,
			}

			const response = await fetch("https://192.168.18.68:3001/api/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})
			if (response.ok) {
				const responseData = await response.json()
				console.log('- Login Success')
				localStorage.setItem("access_token", responseData.access_token)
				window.location.href = window.location.origin
			} else {
				const error = await response.json()
				throw { error }
			}
		} catch (error) {
			console.log("- Error : ", error)
			if (error.name == 'Bad Request'){
				let ae = document.getElementById("alert-error")
				ae.className = "show"
				ae.innerHTML = `${error.message}`
				// Show Warning
				setTimeout(() => {
					ae.className = ae.className.replace("show", "")
					ae.innerHTML = ``
				}, 3000)
			} else if (error.error) {
				let ae = document.getElementById("alert-error")
				ae.className = "show"
				ae.innerHTML = `${error.error.message}`
				// Show Warning
				setTimeout(() => {
					ae.className = ae.className.replace("show", "")
					ae.innerHTML = ``
				}, 3000)
			}
		}
	})
})

},{"../api/user":1}]},{},[2]);
