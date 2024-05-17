const { default: axios } = require("axios")

const parameter = {
    async getParametersFromStation(station_prefix_ids, parameter_type_id){
        console.log(station_prefix_ids, parameter_type_id);
        return axios({
            method: 'get',
            url: `http://localhost:3000/sibh/api/v1/parameters`,
            params: {station_prefix_ids: station_prefix_ids, parameter_type_id:parameter_type_id},
            headers: {
                "User-Email": 'diego.freitas.professional@outlook.com',
                "User-Token": 'kYKavZ6x1smtTEXoyihE'
            }
        })
    },
    //
    createLevelEvents(measurements, parameter, event_type){
        let events = []
        let event = {
            start_date:'', end_date:'', event_type: event_type, measurement_ids: []
        }

        const startEvent = measurement =>{
            event.start_date = measurement.date
            event.end_date = measurement.date
            event.measurement_ids = [measurement.id]
        }

        const eventProgress = measurement =>{
            event.end_date = measurement.date
            event.measurement_ids.push(measurement.id)
        }

        const eventEnd = _ =>{
            event.options = {parameter_id: parameter.id}
            events.push(event)
            event = {start_date:'', end_date:'', event_type: eventTypeByLabel(event_type), qtd:0, measurement_ids: []}//resetando evento
        }

        const eventTypeByLabel = label =>{
            switch(label){
                case 'attention': return 2;
                default: return null
            }
        }
        if(parameter && parameter.values[event_type]){

            measurements.map(measurement=>{
                if(measurement.value >= parameter.values[event_type]){
                    if(!event.start_date){
                        //começar evento
                        startEvent(measurement)
                    } else {
                        //verificar se é novo evento ou se é continuação (usando a diff de minutos entre as datas
                        //caso MAIOR QUE 120 minutos, SERÁ UM NOVO EVENTO )

                        let new_date = new Date(measurement.date)
                        let diffInMilliseconds = Math.abs(new_date - new Date(event.end_date));
                        const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));

                        if(diffInMinutes <= 120){
                            eventProgress(measurement)
                        } else {
                            eventEnd()//finalizando pois passou os minutos de tolerancia do mesmo evento
                            startEvent(measurement) //já começando outro pois a própria medição ultrapassa o valor de ref.
                        }
                    }
                } else {
                    // console.log('ermino');
                    //valor da medição abaixo do valor de referência. Caso já exista um evento, quer dizer que ele finalizou
                    if(event.start_date){
                        //end event
                        eventEnd()
                    }
                }
            })

            if(event.start_date){
                //end event
                eventEnd()
            }

            // return measurements.filter(measurement=>{
            //     return measurement.value >= parameter.values[event_type]
            // })

            return events
        } else {
            console.log('Parâmetro sem valor de referência de ' + event_type, parameter);
        }
        return []
    }
}

module.exports = parameter