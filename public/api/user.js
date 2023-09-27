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