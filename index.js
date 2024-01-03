const measurement = require('./lib/measurement')
const event = require('./lib/event')
const stations = require('./data/stations')



measurement.getMeasurements({station_prefix_ids: [33212], start_date: '2023-12-22 03:00', end_date: '2023-12-23 02:59', group_type: 'minute'}).then(response=>{
    response.data.json.map(x=>{
        stations[x.station_prefix_id] = stations[x.station_prefix_id] || {}
        stations[x.station_prefix_id].measurements = stations[x.station_prefix_id].measurements || []
        stations[x.station_prefix_id].measurements.push(x)
        stations[x.station_prefix_id].station_type_id = x.station_type_id //salvando o tipo do posto
    })
    
    event.getRainEvents(1)
    
    event.getLevelEvents('attention')
    
    // console.log(stations[33212].extravasation_events)
})
.catch(data=>{
    console.error(data.response)
});

return true