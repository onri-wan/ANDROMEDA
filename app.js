const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')

const indexRouter = require('./routes/index')
const performersRouter = require('./routes/seatgeekperformers')
const eventsRouter = require('./routes/seatgeekevents')

// View engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(express.static(path.join(__dirname, "public")))

const hostname = '127.0.0.1'
const port = 4000

// Additional middleware module to extract incoming data of a POST request
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', indexRouter)
app.use(`/search?`, performersRouter)
app.use(`/events?`, eventsRouter)

app.listen(port, function () {
    console.log(`Express app listening at http://${hostname}:${port}/`);
})