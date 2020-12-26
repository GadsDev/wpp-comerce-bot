
const axios = require('axios');
const Sessions = require("../services/session");

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

exports.teste = async (req, res) => {
    res.status(200).json({success: true});
};

// Session
// { 
// 	"name": "session1",
// 	"status": "status",
// 	"is_auth": true,
// 	"phone": "5531987110017",
	
// 	"wa_browser_id": "wa_browser_id",
// 	"wa_secret_bundle": "wa_secret_bundle",
// 	"wa_token_1": "wa_token_1",
// 	"wa_token_2": "wa_token_2"	
// }
exports.dispatchSession = async (session) => {
   this.axios.post("http://127.0.0.1:8000/gustavo", session)
};