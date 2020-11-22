const express = require('express')
const router = express.Router()

const { send } = require('../controllers/MessageController')
const { start,  getQrCode} = require('../controllers/ServiceController')

router.post('/send', send)

router.get('/start', start)
router.get('/getQrCode', getQrCode)

router.get('/hello', (req, res) => {
    res.send("Hello World!!")
})

module.exports = router