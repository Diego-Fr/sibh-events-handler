const { default: axios } = require("axios")

const parameter = {
    async getParametersFromStation(station_prefix_ids, parameter_type_id){
        console.log(station_prefix_ids, parameter_type_id);
        return axios({
            method: 'get',
            url: `https://cth.daee.sp.gov.br/sibh/api/v1/parameters`,
            params: {station_prefix_ids: station_prefix_ids, parameter_type_id:parameter_type_id},
            headers: {
                "User-Email": 'diego.freitas.professional@outlook.com',
                "User-Token": 'kYKavZ6x1smtTEXoyihE'
            }
        })
    },
    createLevelEvents(measurements, parameter, event_type){
        if(parameter && parameter.values[event_type]){
            return measurements.filter(measurement=>{
                console.log(parameter.values[event_type],event_type);
                return measurement.value >= parameter.values[event_type]
            })
        } else {
            console.log('Parâmetro sem valor de referência de ' + event_type, parameter);
        }
        return []
    }
}

module.exports = parameter