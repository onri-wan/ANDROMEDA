const express = require('express')
const router = express.Router()

// GET home page
router.get('/', (req, res) => {
    res.render('index')
})

// POST home page
let formData = ''
router.post('/', (req, res) => {
    formData = req.body.artist
    // change spaces in name with + sign. E.g. 'Mickey Mouse' > 'Mickey+Mouse'
    const fixedFormData = formData.split(' ').join('+')
    // go to the /search endpoint of the app with the form data
    res.redirect(`/search/${fixedFormData}`)
})

module.exports = router