require("dotenv").config()
const express = require('express')
const axios = require('axios')
const router = express.Router()

router.get('/:performer', (req, res, next) => {
    const options = createOptions(req.params.performer)
    const url = `https://${options.hostname}${options.path}`

    try {
        if (!process.env.SEATGEEK_KEY) {
          throw new Error("You forgot to set SEATGEEK_KEY in .env file");
        }

        axios.get(url)
        .then( response => {
            return response.data
        })
        .then( response => {
            res.render('performersList', { performers: createPerformersList(response) })
        })
        .catch( error => {
            console.error(`Error in seatgeekperformers.js: ${error}`)
        })

    // catch error if environment variables are not set
    } catch (err) {
        next(err);
    }
})

function createOptions(performerName) {
    const options = {
        hostname: 'api.seatgeek.com/2',
        port: 444,
        path: '/performers?',
        method: 'GET'
    }
    const str = `q=${performerName}&client_id=${process.env.SEATGEEK_KEY}`
    options.path += str;
    return options;
}

function createPerformersList(res) {
    let performersObj = {
        hasResults: true,
        list: []
    }
    const performers = res.performers
    
    // No results found for the user input
    if (res.performers.length <= 0) {
        performersObj.hasResults = false
        return performersObj
    }

    performers.forEach( performer => {
        const performerName = performer.name
        const performerId = performer.id
        const performerImageUrl = performer.image
        const str = `<a href='/events/${performerName}/${performerId}'><img src='${performerImageUrl}'> ${performerName}</a>`
        performersObj.list.push(str)
    })
    return performersObj
}

module.exports = router