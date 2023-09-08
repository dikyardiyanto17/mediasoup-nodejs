document.addEventListener("DOMContentLoaded", function () {
	const loginForm = document.getElementById("login-form")

	loginForm.addEventListener("submit", async (event) => {
		try {
			const email = document.getElementById("login-email").value
			const password = document.getElementById("login-password").value
			event.preventDefault()

			// Create a data object to send in the request body
			const data = {
				email,
				password,
			}

			// Send a POST request to your API endpoint
			const response = await fetch("https://192.168.18.68:3001/api/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})
			if (response.ok) {
				const responseData = await response.json()
                console.log("- Access Token : ", responseData)
				// Redirect To Login Page
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
