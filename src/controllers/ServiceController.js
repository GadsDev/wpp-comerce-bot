
const axios = require('axios');
const Sessions = require("../services/session");

const { start, getQrCode, callTeste } = require('../controllers/ServiceController')

exports.start = async (req, res) => {
    const {
        sessionName
    } = req.query

    const session = await Sessions.start(sessionName);

    if (["CONNECTED", "QRCODE", "STARTING"].includes(session.state)) {
        res.status(200).json({ success: true, message: session.state, data: session });
    } else {
        res.status(200).json({ success: false, message: session.state });
    }
};

exports.getQrCode = async (req, res) => {
    const {
        sessionName,
        image = false
    } = req.query

    let session = await Sessions.getSession(sessionName)
    if (session.result !== "error") { 
        if (image && session.qrcode) {
            session.qrcode = session.qrcode.replace('data:image/png;base64,', '');
            
            const imageBuffer = Buffer.from(session.qrcode, 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': imageBuffer.length
            });
            res.end(imageBuffer);
        } else {
            res.status(200).json({ success: true, message: session.state, qrcode: session.qrcode });
        }
    } else {
        res.status(200).json({ success: false, message: session.state });
    }
};

exports.callTeste = async (req, res) => {
    const data = await Sessions.teste()
    res.status(200).json({ success: true, message: data });
};