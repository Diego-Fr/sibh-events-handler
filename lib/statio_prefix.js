const { default: axios } = require("axios")

const station_prefix = {
    async getStations(params = {}){
        return axios({
            method: 'get',
            url: 'http://localhost:3000/sibh/api/v1/station_prefixes?pluviometricas=true&operation_status=1',
            params: params
        })
    }
    
}

module.exports = station_prefix