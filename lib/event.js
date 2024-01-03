const parameter = require('./parameter')
const stations = require('../data/stations')

const event = {
    /**
     * 
     * @param {Integer} hours em horas, especificar quando um evento 'acaba' ou continua sendo o mesmo evento
     */
    getRainEvents(hours){
        Object.values(stations).map(station=>{
            // console.log(station);
            station.rain_events = []//criando array dentro do objeto stations para receber os eventos
            let measurements = station.measurements
            
            const startEvent = (measurement) =>{
                return {
                    start_date: measurement.date,
                    end_date: measurement.date,
                    qtd: 1,
                    sum: measurement.value,
                    // measurement_ids: [measurement.id]
                }
            }
            
            const progressEvent = (event, measurement) =>{
                event.end_date = measurement.date
                event.sum += measurement.value
                event.qtd += 1
                // event.measurement_ids.push(measurement.id)
                return event
            }
    
            let only_rain = measurements.filter(x=>x.value > 0)
            // console.log(only_rain)
    
            let current_sum, current_date
    
            let event = {
                start_date:'', end_date:'', sum:0, qtd:0, measurement_ids: []
            }
    
            only_rain.forEach(measurement=>{
                // console.log(measurement);
                if(!event.start_date){
                    event = startEvent(measurement)
                } else {
                    let new_date = new Date(measurement.date)
                    let diffInMilliseconds = Math.abs(new_date - new Date(event.end_date));
                    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
                    // console.log(diffInMinutes);
                    if(diffInMinutes < hours*60){
                        event = progressEvent(event, measurement)
                    } else {
                        this.createEvent(event,station)
                        event = startEvent(measurement)
                    }
                }
                
            })

           this.createEvent(event,station)
        })
        
    },
    getLevelEvents(event_type){
        parameter.getParametersFromStation(Object.keys(stations), 1).then(response=>{//parametros de valores de referência
            response.data.map(x=>stations[x.parameterizable_id]['parameter'] = x)

            console.log(response.data[0].values);

            Object.values(stations).map(station=>{
                station[`${event_type}_events`] = parameter.createLevelEvents(station.measurements, station.parameter, event_type)
            })

            console.log(stations);

        }).catch(e=>{
            console.log('erro')
            console.log(e);
        })
    },
    createEvent(event, station){ 
        let new_event = JSON.parse(JSON.stringify(event))
        if(event.end_date && event.start_date){
            new_event.duration =  (new Date(new_event.end_date) - new Date(new_event.start_date)) / (1000*60*60)
            if(new_event.duration > 0){
                new_event.intensity = new_event.sum / new_event.duration
            }
            station.rain_events.push(new_event)
        }
    }
}

module.exports = event