const Sessions = require("../services/session");

exports.start = async (req, res) => {
    const {
        sessionName
    } = req.query

    const session = await Sessions.start(sessionName);

    if (["CONNECTED", "QRCODE", "STARTING"].includes(session.state)) {
        res.status(200).json({ result: 'success', message: session.state });
    } else {
        res.status(200).json({ result: 'error', message: session.state });
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
            res.status(200).json({ result: "success", message: session.state, qrcode: session.qrcode });
        }
    } else {
        res.status(200).json(session);
    }
};