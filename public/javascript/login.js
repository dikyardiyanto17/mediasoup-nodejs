const { checkUser } = require("../function");
const { goToHomePage } = require("../function/url");

document.addEventListener("DOMContentLoaded", function () {

	checkUser()
	
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
				goToHomePage()
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
