require("dotenv").config()
const express = require('express')
const axios = require('axios')
const router = express.Router()
let location = []

router.get('/:name/:id', (req, res, next) => {
    const performerName = req.params.name
    const options = createOptions(req.params.id)
    const optionsTasteDive = createOptionsTasteDive(performerName)
    const url = `https://${options.hostname}${options.path}`
    const urlTasteDive = `https://${optionsTasteDive.hostname}${optionsTasteDive.path}`

    const optionsPerformerImagePath = createOptionsImagePath(req.params.id)
    const performerImagePath = `https://${optionsPerformerImagePath.hostname}${optionsPerformerImagePath.path}`
    let performerImageUrl = ''

    try {
        if (!process.env.SEATGEEK_KEY) {
          throw new Error("You forgot to set SEATGEEK_KEY in .env file");
        }
        if (!process.env.TASTEDIVE_KEY) {
            throw new Error("You forgot to set TASTEDIVE_KEY in .env file");
        }

        // query api, get image url of performer, and store it in a variable
        axios.get(performerImagePath)
            .then( response => {
                performerImageUrl = response.data.performers[0].image
            })
            .catch( error => {
                console.error( error ) 
            })

        // call SeatGeek API
        axios.get(url)
            .then( response => {
                return response.data
            })
            .then( response => {
                // call TasteDive API
                axios.get(urlTasteDive)
                    .then( responseTasteDive => {
                        return responseTasteDive.data
                    })
                    .then( responseTasteDive => {
                        // print results on the DOM
                        // TasteDive returns 'undefined' when there's no description available
                        const description = responseTasteDive.Similar.Info[0].wTeaser
                        const hasDescription = description !== undefined && description !== ""
                        const artistDescription = hasDescription 
                                            ? `<h2>${performerName}</h2><p>${description}</p>`
                                            : `<h2>${performerName}</h2><p>The performer has no available information.</p>`
                        
                        const relatedArtists = responseTasteDive.Similar.Results
                        const Artist = {
                            imageUrl: performerImageUrl,
                            description: artistDescription,
                            upcomingConcerts: createResults(response),
                            createMap: createMap(location),
                            relatedArtists: hasDescription ? searchRelatedArtists(relatedArtists) : ' '
                        }

                        res.render('artistInformation', { artist: Artist })
                        // empty the location array to avoid storing old events from previous search
                        location = []
                    })
                    .catch( errorTasteDive => {
                        console.error(`Error TasteDive in seatgeekevents.js: ${errorTasteDive}`)
                    })
            })
            .catch( error => {
                console.error(`Error in seatgeekevents.js: ${error}`)
            })

    // catch error if environment variables are not set
    } catch (err) {
        next(err);
    }
})

function createOptionsImagePath(performerId) {
    const options = {
        hostname: 'api.seatgeek.com/2',
        port: 443,
        path: '/performers?',
        method: 'GET'
    }
    const str = `id=${performerId}&client_id=${process.env.SEATGEEK_KEY}`
    options.path += str;
    return options;
}

function createOptions(performerId) {
    const options = {
        hostname: 'api.seatgeek.com/2',
        port: 444,
        path: '/events?',
        method: 'GET'
    }
    const str = `performers.id=${performerId}&client_id=${process.env.SEATGEEK_KEY}`
    options.path += str;
    return options;
}

function createOptionsTasteDive(performerName) {
    const options = {
        hostname: 'tastedive.com/api',
        port: 445,
        path: '/similar?',
        method: 'GET'
    }
    const str = `q=${performerName}&type=music&info=1&limit=5&k=${process.env.TASTEDIVE_KEY}`
    options.path += str;
    return options;
}

function createResults(res) {
    const heading = `<h2>Upcoming Concerts</h2>`
    let OpeningUl = '<ul class="concert-list">'
    const ClosingUl = '</ul>'
    const events = res.events
    
    if (events.length <= 0) {
        return `<p>The performer has no upcoming concerts.</p>`
    }
        
    events.forEach( event => {
        const eventTitle = event.title
        const date = new Date(event.datetime_local)
        const dateStr = date.toLocaleString()
        const time = event.time_tbd ? 'Time TBD' : date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
        const monthDayOptions = { year: 'numeric', month: 'short', day: 'numeric' }
        const monthDayYear = date.toLocaleDateString('en-US', monthDayOptions)

        const venueName = event.venue.name
        const venueCity = event.venue.city
        const venueState = event.venue.state
        const lat = event.venue.location.lat
        const lon = event.venue.location.lon
        const latLon = {
            name: eventTitle,
            venue: `${venueName} &#x2022; ${venueCity}, ${venueState}`,
            date: dateStr,
            lat: lat,
            lon: lon
        }
        location.push(latLon)
        const str = `<li>
                        <div class="concert-date">
                        ${monthDayYear}
                        <br>
                        <span>${weekday} &#x2022; ${time}</span>
                        </div>

                        <div class="concert-title">
                            ${eventTitle}
                            <ul>
                                <li>${venueName} &#x2022; ${venueCity}, ${venueState}</li>
                            </ul
                        </div>
                     </li>`
        OpeningUl += str
    })

    return heading + OpeningUl + ClosingUl
}

function searchRelatedArtists(relatedArtists) {
    const heading = `<h2>Related Artists</h2>`
    let OpeningUl = '<ul class="related-artists">'
    const ClosingUl = '</ul>'

    relatedArtists.forEach( artist => {
        const str = `<li>${artist.Name}</li>`
        OpeningUl += str
    })

    return heading + OpeningUl + ClosingUl
}

function createMap(location) {
    if (location.length <= 0) {
        return ' '
    }

    let str = `
                <div id="map" style="height:500px; width:100%;"></div>
                <script>
                    map = L.map('map').setView([${location[0].lat}, ${location[0].lon}], 5);
                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap'
                    }).addTo(map);
                `
    for (let i = 0; i < location.length; i++) {
        let name = location[i].name
        let venue = location[i].venue
        let date = location[i].date
        let lat = location[i].lat
        let lon = location[i].lon
        str += `L.marker([${lat}, ${lon}]).addTo(map).bindPopup("<b>${name} ${date}</b><br>${venue}").openPopup();`
    }

    return str + '</script>'
}

module.exports = router