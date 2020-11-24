const express = require('express')
const router = express.Router()

const { send } = require('../controllers/MessageController')
const { start, getQrCode } = require('../controllers/ServiceController')
const { getAll } = require('../controllers/ContactController')

router.post('/send', send)

router.get('/start', start)
router.get('/getQrCode', getQrCode)

router.get('/contacts/all', getAll)

module.exports = router