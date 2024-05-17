const { default: axios } = require("axios")

const measurement = {
    async getMeasurements(params = {}){
        return axios({
            method: 'get',
            url: 'http://localhost:3000/sibh/api/v1/measurements/grouped',
            params: params
        })
    }
    
}

module.exports = measurement