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
                        event_type_id: 1,//evento de chuva
                        start_date: measurement.date,
                        end_date: measurement.date,
                        options:{
                            qtd_non_zero: 1,
                            sum: measurement.value,
                            total_qtd: 1,
                        }
                    }
                }
                
                const progressEvent = (event, measurement,current_zeros_of_event) =>{
                    event.end_date = measurement.date
                    event.options.sum += measurement.value
                    event.options.qtd_non_zero += 1
                    event.options.total_qtd += (current_zeros_of_event+1)

                    return event
                }

                let event = {
                    
                }

                let current_zeros_of_event = 0
        
                measurements.forEach(measurement=>{
                    console.log('medição', measurement.date, measurement.value)
                    if(measurement.value > 0){
                        console.log('maior que zero');
                        if(!event.start_date){
                            console.log('inciiando evento de chuva');
                            event = startEvent(measurement)
                        } else {
                            console.log('ja tem evento, verificando se vai dar pra incrementar');
                            let new_date = new Date(measurement.date)
                            let diffInMilliseconds = Math.abs(new_date - new Date(event.end_date || event.start_date));
                            const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
                            console.log(diffInMinutes);
                            if(diffInMinutes < hours*60){
                                console.log('progredir evento');
                                event = progressEvent(event, measurement,current_zeros_of_event)
                                current_zeros_of_event = 0
                            } else {
                                console.log('finalizar evento e criar outro',event);
                                current_zeros_of_event = 0
                                this.createEvent(event,station)
                                event = startEvent(measurement)
                            }
                        }
                    } else {
                        console.log('medição igual a zero, verificando se tem evento aberto');
                        if(event.start_date){
                            console.log('verificando se evento deve ser finalizado');
                            let new_date = new Date(measurement.date)
                            let diffInMilliseconds = Math.abs(new_date - new Date(event.end_date || event.start_date));
                            const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
                            console.log(diffInMinutes);
                            if(diffInMinutes > hours*60){
                                console.log('finalizando evento', event);
                                this.createEvent(event,station)
                                current_zeros_of_event = 0
                                event.start_date = ''
                            } else {
                                current_zeros_of_event ++
                            }
                        } else {
                            current_zeros_of_event = 0
                            console.log('nao tem evento aberto');
                        }
                        
                    }     
                })

                if(event.start_date){
                    console.log('ainda tem um evento aberto antes de finalizar');
                    let date = new Date()
                    let new_date = new Date(event.end_date)
                    let diffInMilliseconds = Math.abs(new_date - date);
                    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
                    if(diffInMinutes < hours*60){
                        event.end_date = null
                    }
                    console.log(event);
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
            if(station.rain_events.length > 0){
                this.syncEvents(station.rain_events)
            }
            
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
            console.log(data.response);
        })
    },
    createEvent(event, station){ 
        let new_event = JSON.parse(JSON.stringify(event))

        if(event.start_date){            
            let miliseconds = new_event.end_date ? new Date(new_event.end_date) - new Date(new_event.start_date) : new Date() - new Date(new_event.start_date)
            new_event.options.duration =  miliseconds / (1000*60*60) || 0
            // console.log(new_event.start_date, new_event.end_date, new_event.options.duration);
            if(new_event.options.duration == 0){
                new_event.end_date = new_event.start_date
                new_event.options.duration = (station.measurement_gap || 60) / 60
            }
            new_event.options.intensity = new_event.options.sum / new_event.options.duration
            station.rain_events.push(new_event)
        }
    }
}

module.exports = event