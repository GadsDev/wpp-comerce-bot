const express = require('express')
const router = express.Router()

const { send } = require('../controllers/MessageController')

router.post('/send', send)

router.get('/hello', (req, res) => {
    res.send("Hello World!!")
})

module.exports = router