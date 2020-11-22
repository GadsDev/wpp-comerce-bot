// person.js
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const venom = require('venom-bot');

module.exports = class Sessions {

    static async start(sessionName) {
        Sessions.sessions = Sessions.sessions || []; //start array

        var session = Sessions.getSession(sessionName);

        if (session == false) { //create new session
            session = await Sessions.addSesssion(sessionName);
        } else if (["CLOSED"].includes(session.state)) { //restart session
            session.state = "STARTING";
            session.status = 'notLogged';
            session.client = Sessions.initSession(sessionName);
            Sessions.setup(sessionName);
        } else if (["CONFLICT", "UNPAIRED", "UNLAUNCHED"].includes(session.state)) {
            session.client.then(client => {
                client.useHere();
            });
        }
        return session;
    }//start

    static async addSesssion(sessionName) {
        var newSession = {
            name: sessionName,
            qrcode: false,
            client: false,
            status: 'notLogged',
            state: 'STARTING'
        }
        Sessions.sessions.push(newSession);
        console.log("newSession.state: " + newSession.state);

        //setup session
        newSession.client = Sessions.initSession(sessionName);
        Sessions.setup(sessionName);

        return newSession;
    }//addSession

    static async initSession(sessionName) {
        var session = Sessions.getSession(sessionName);
        const client = await venom.create(
            sessionName,
            (base64Qr) => {
                session.state = "QRCODE";
                session.qrcode = base64Qr;                
            },
            (statusFind) => {
                session.status = statusFind;
                console.log("# Change Status: " + session.status);
            },
            {
                headless: true,
                devtools: false,
                useChrome: false,
                debug: false,
                logQR: false,
                browserArgs: [
                    '--log-level=3',
                    '--no-default-browser-check',
                    '--disable-site-isolation-trials',
                    '--no-experiments',
                    '--ignore-gpu-blacklist',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--enable-features=NetworkService',
                    '--disable-setuid-sandbox',
                    '--no-sandbox',
                    // Extras
                    '--disable-webgl',
                    '--disable-threaded-animation',
                    '--disable-threaded-scrolling',
                    '--disable-in-process-stack-traces',
                    '--disable-histogram-customizer',
                    '--disable-gl-extensions',
                    '--disable-composited-antialiasing',
                    '--disable-canvas-aa',
                    '--disable-3d-apis',
                    '--disable-accelerated-2d-canvas',
                    '--disable-accelerated-jpeg-decoding',
                    '--disable-accelerated-mjpeg-decode',
                    '--disable-app-list-dismiss-on-blur',
                    '--disable-accelerated-video-decode',
                ],
                refreshQR: 15000,
                autoClose: 60 * 60 * 24 * 365, //never
                disableSpins: true
            }
        );
        return client;
    }

    static async setup(sessionName) {
        var session = Sessions.getSession(sessionName);
        await session.client.then(client => {

            client.onStateChange(state => {
                console.log("# Change state message", state);
                session.state = state;               
            });
            
            client.onMessage((message) => {
               console.log("# Recive message", message);
            });
        });
    }

    static async closeSession(sessionName) {
        var session = Sessions.getSession(sessionName);
        if (session) { //só adiciona se não existir
            if (session.state != "CLOSED") {
                if (session.client)
                    await session.client.then(async client => {
                        try {
                            await client.close();
                        } catch (error) {
                            console.log("closeSession ERROR: " + error.message);
                        }
                        session.state = "CLOSED";
                        session.client = false;
                    });
                return { result: "success", message: "CLOSED" };
            } else {//close
                return { result: "success", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }//close

    static getSession(sessionName) {
        var foundSession = false;
        if (Sessions.sessions)
            Sessions.sessions.forEach(session => {
                if (sessionName == session.name) {
                    foundSession = session;
                }
            });
        return foundSession;
    }

    static getSessions() {
        if (Sessions.sessions) {
            return Sessions.sessions;
        } else {
            return [];
        }
    }

    static async getQrcode(sessionName) {
        var session = Sessions.getSession(sessionName);
        if (session) {          
            if (["UNPAIRED_IDLE"].includes(session.state)) {
                //restart session
                await Sessions.closeSession(sessionName);
                Sessions.start(sessionName);
                return { result: "error", message: session.state };
            } else if (["CLOSED"].includes(session.state)) {
                Sessions.start(sessionName);
                return { result: "error", message: session.state };
            } else { //CONNECTED
                if (session.status != 'isLogged') {
                    return { result: "success", message: session.state, qrcode: session.qrcode };
                } else {
                    return { result: "success", message: session.state };
                }
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    } 

    static async sendText(sessionName, number, text) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state != "UNPAIRED") {
                await session.client.then(async client => {
                    return await client.sendText(number + '@c.us', text);
                });
                return { result: "success"}
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }

    static async sendFile(sessionName, number, base64Data, fileName, caption) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                await session.client.then(async (client) => {
                    var folderName = fs.mkdtempSync(path.join(os.tmpdir(), session.name + '-'));
                    var filePath = path.join(folderName, fileName);
                    fs.writeFileSync(filePath, base64Data, 'base64');
                   
                    return await client.sendFile(number + '@c.us', filePath, fileName, caption);
                });
                return { result: "success" };
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }
}