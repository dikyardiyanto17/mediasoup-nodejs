document.addEventListener("DOMContentLoaded", function () {
	const registerForm = document.getElementById("register-form")

	registerForm.addEventListener("submit", async (event) => {
		try {
			const email = document.getElementById("register-email").value
			const password = document.getElementById("register-password").value
			console.log(email, password)
			event.preventDefault()

			// Create a data object to send in the request body
			const data = {
				email,
				password,
			}

			// Send a POST request to your API endpoint
			const response = await fetch("https://192.168.18.68:3001/api/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})
			if (response.status == 201) {
				const responseData = await response.json()
				// Redirect To Login Page
				const newURL = window.location.origin + "/" + 'login'

				window.location.href = newURL
			} else {
				const errorFromServer = await response.json()
				throw { errorFromServer }
			}
		} catch (error) {
			const { errorFromServer } = error
			if (errorFromServer) {
				let ae = document.getElementById("alert-error")
				ae.className = "show"
				ae.innerHTML = `${errorFromServer.message}`
				// Show Warning
				setTimeout(() => {
					ae.className = ae.className.replace("show", "")
					ae.innerHTML = ``
				}, 3000)
			}
			console.log("- Error : ", error)
		}
	})
})
