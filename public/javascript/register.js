const { checkUser } = require("../function");
const { goToLoginPage } = require("../function/url");

document.addEventListener("DOMContentLoaded", function () {

	checkUser()

	const registerForm = document.getElementById("register-form")

	registerForm.addEventListener("submit", async (event) => {
		try {
			event.preventDefault()
			const email = document.getElementById("register-email").value
			const password = document.getElementById("register-passwords").value
			if (!email) throw { name: "Bad Request", message: "Email Is Required" }
			if (!password) throw { name: "Bad Request", message: "Password Is Required" }

			const data = {
				email,
				password,
			}

			const response = await fetch("https://192.168.18.68:3001/api/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})
			if (response.ok) {
				const responseData = await response.json()
				goToLoginPage()
			} else {
				const error = await response.json()
				throw { error }
			}
		} catch (error) {
			console.log("- Error : ", error)
			if (error.name == "Bad Request") {
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
