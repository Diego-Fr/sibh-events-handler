const parameter = require('./parameter')
const stations = require('../data/stations')
const axios  = require('axios')


const event = {
    /**
     * 
     * @param {Integer} hours em horas, especificar quando um evento 'acaba' ou continua sendo o mesmo evento
     */
    getRainEvents(stations, hours){
        // console.log(stations);
        Object.values(stations).map(station=>{
            // console.log(station);
            if(station.station_type_id == 2){
                station.rain_events = []//criando array dentro do objeto stations para receber os eventos
                let measurements = station.measurements
                
                const startEvent = (measurement) =>{
                    return {
                        eventable_id :station.id,
                        eventable_type :'StationPrefix',
                        event_type_id: 3,
                        start_date: measurement.date,
                        end_date: '',
                        options:{
                            qtd: 1,
                            sum: measurement.value,
                        }
                    }
                }
                
                const progressEvent = (event, measurement) =>{
                    event.end_date = measurement.date
                    event.options.sum += measurement.value
                    event.options.qtd += 1

                    return event
                }

                let event = {
                    
                }
        
                measurements.forEach(measurement=>{
                    if(measurement.value > 0){
                        // console.log(measurement.date, measurement.value)
                        if(!event.start_date){
                            event = startEvent(measurement)
                        } else {
                            let new_date = new Date(measurement.date)
                            let diffInMilliseconds = Math.abs(new_date - new Date(event.end_date || event.start_date));
                            const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
                            // console.log(diffInMinutes);
                            if(diffInMinutes < hours*60){
                                event = progressEvent(event, measurement)
                            } else {
                                this.createEvent(event,station)
                                event = startEvent(measurement)
                            }
                        }
                    } else {
                        if(event.start_date){
                            let new_date = new Date(measurement.date)
                            let diffInMilliseconds = Math.abs(new_date - new Date(event.end_date || event.start_date));
                            const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
                            if(diffInMinutes > hours*60){
                                this.createEvent(event,station)
                                event.start_date = ''
                            }
                        }
                        
                    }     
                })

                if(event.start_date){
                    let date = new Date()
                    let new_date = new Date(event.end_date)
                    let diffInMilliseconds = Math.abs(new_date - date);
                    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
                    if(diffInMinutes < hours*60){
                        event.end_date = null
                    }
                    this.createEvent(event,station)
                }
            }
            
        })
        
    },
    async getLevelEvents(events_type){
        return parameter.getParametersFromStation(Object.keys(stations), 1).then(response=>{//parametros de valores de referência
            response.data.map(x=>stations[x.parameterizable_id]['parameter'] = x)

            console.log(response.data[0].values);

            Object.values(stations).map(station=>{
                events_type.forEach(event_type=>{
                    station[`${event_type}_events`] = parameter.createLevelEvents(station.measurements, station.parameter, event_type)
                    console.log(station[`${event_type}_events`]);
                })
                
            })
        }).catch(e=>{
            console.log('erro')
            console.log(e);
        })
    },
    async saveEvents(stations){
        
        Object.values(stations).forEach(station=>{
            this.syncEvents(station.rain_events)
        })

    },
    saveEvent(event){
        // console.log(event);
        console.log(event,'salvando');
        axios({
            method: 'post',
            url: `http://localhost:3000/sibh/api/v1/events/new_event`,
            params: {eventable_type: 'StationPrefix', eventable_id: event.eventable_id, event_type_id: 3, start_date: event.start_date, end_date: event.end_date, options:{sum:event.sum, qtd:event.qtd, duration:event.duration, intensity:event.intensity}}
            // headers: {
            //     "User-Email": 'diego.freitas.professional@outlook.com',
            //     "Us0er-Token": 'kYKavZ6x1smtTEXoyihE'
            // }
        }).then(data=>{
            console.log(data);
        }).catch(data=>{
            console.log('ath');
        })
    },
    syncEvents(e){
        // console.log(e);
        axios({
            method: 'post',
            url: `http://localhost:3000/sibh/api/v1/events/new_events`,
            params: {events:e}
            // headers: {
            //     "User-Email": 'diego.freitas.professional@outlook.com',
            //     "Us0er-Token": 'kYKavZ6x1smtTEXoyihE'
            // }
        }).then(data=>{
            // console.log(data.response);
        }).catch(data=>{
            console.log(data.response.data.error);
        })
    },
    createEvent(event, station){ 
        let new_event = JSON.parse(JSON.stringify(event))

        if(event.start_date){            
            let miliseconds = new_event.end_date ? new Date(new_event.end_date) - new Date(new_event.start_date) : new Date() - new Date(new_event.start_date)
            new_event.options.duration =  miliseconds / (1000*60*60) || 0
            console.log(new_event.start_date, new_event.end_date, new_event.options.duration);
            if(new_event.options.duration == 0){
                new_event.end_date = new_event.start_date
                new_event.options.duration = station.measurement_gap || 10
            }
            new_event.options.intensity = new_event.options.sum / new_event.options.duration
            station.rain_events.push(new_event)
        }
    }
}

module.exports = event