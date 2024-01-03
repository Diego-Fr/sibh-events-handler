const { default: axios } = require("axios")

const measurement = {
    async getMeasurements(params = {}){
        return axios({
            method: 'post',
            url: 'https://cth.daee.sp.gov.br/sibh/api/v1/measurements/grouped',
            data: params
        })
    }
    
}

module.exports = measurement