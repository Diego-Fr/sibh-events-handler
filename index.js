const measurement = require('./lib/measurement')
const event = require('./lib/event')
const moment = require('moment')
let stations = require('./data/stations')
const station_prefix = require('./lib/statio_prefix')

station_prefix.getStations().then(response=>{
    let s = response.data
    stations = s.map(x=>x.id)
    // console.log(stations.map(x=>x.id).length);
    start([162])
    // 
    // console.log(stations);

})

const start = async stations =>{
    let start = 0 
    let utc_offset = moment().parseZone().utcOffset()
    let start_date = moment().subtract(utc_offset, 'minutes').subtract(24, 'hours').format('YYYY-MM-DD HH:mm')
    let end_date = moment().subtract(utc_offset, 'minutes').format('YYYY-MM-DD HH:mm')

    while (start < stations.length){
        const chunk = stations.slice(start, start + 20);
        await measurement.getMeasurements({station_prefix_ids: chunk, start_date: start_date, end_date: end_date, group_type: 'minute'}).then(response=>{
            let _stations = {}
            response.data.json.map(x=>{
                _stations[x.station_prefix_id] = _stations[x.station_prefix_id] || {id:x.station_prefix_id}
                _stations[x.station_prefix_id].measurements = _stations[x.station_prefix_id].measurements || []
                _stations[x.station_prefix_id].measurements.push(x)
                _stations[x.station_prefix_id].station_type_id = x.station_type_id //salvando o tipo do posto
                _stations[x.station_prefix_id].measurement_gap = x.measurement_gap //salvando measurement_gap
            })
            
            event.getRainEvents(_stations,3) //produzindo eventos de chuva para aos postos plu
            event.saveEvents(_stations)
            console.log(_stations[0].rain_events);
            // event.getLevelEvents(['alert','attention', 'extravasation']).then(_=>{ //produzindo eventos de nivel para os postos flu
            //     event.saveEvents()
            // })
            
            // console.log(stations[33212].extravasation_events)
        })
        .catch(data=>{
            start += 20
        }).finally(_=>{
            start += 20
        })
    }
}




return true