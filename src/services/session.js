// person.js
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const venom = require('venom-bot');

module.exports = class Sessions {

    static async start(sessionName) {
        try {
            Sessions.sessions = Sessions.sessions || []; //start array

            let session = await Sessions.getSession(sessionName);
    
            if (session.result == "error") { //create new session
                session = await Sessions.addSesssion(sessionName);
            }else if (["CONFLICT", "UNPAIRED", "UNLAUNCHED"].includes(session.state)) {
                session.client.then(client => {
                    client.useHere();
                });
            }
            return session;
            
        } catch (error) {
            console.log(`ERRO TO START SESSIONS: ${sessionName}`);
        }
    }

    static async addSesssion(sessionName) {
        var newSession = {
            name: sessionName,
            qrcode: false,
            client: false,
            status: 'notLogged',
            state: 'STARTING'
        }
        Sessions.sessions.push(newSession);      
       
        newSession.client = Sessions.initSession(sessionName);
        Sessions.setup(sessionName);

        return newSession;
    }

    static async initSession(sessionName) {
        let session = await Sessions.getSession(sessionName);
      
        const client = await venom.create(
            sessionName,
            (base64Qr) => {              
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
        let session = await Sessions.getSession(sessionName);

        await session.client.then(async client => {
            await client.onStateChange(async state => {
                console.log("# Change state message", state);
                session.state = state;                         
                if (session.state == "UNPAIRED") await Sessions.closeSession(session.name)
            });
            
            client.onMessage((message) => {
            //    console.log("# Recive message", message);
            });
        });
    }

    static async closeSession(sessionName) {
        let session = await Sessions.getSession(sessionName);
      
        if (session.result !== "error") { 
            await session.client.then(async client => {               
                await client.close();
                //Remove Array ITEM
                Sessions.sessions.forEach((session, index, object) => {
                    if (sessionName == session.name) {
                        object.splice(index, 1);
                    }
                }); 

                return { result: "success", message: "CLOSED" };
            });
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }

    static async getSession(sessionName) {
        var foundSession = false;
        if (Sessions.sessions && Sessions.sessions.status != "desconnectedMobile") {           
            Sessions.sessions.forEach(session => {
                if (sessionName == session.name) {
                    foundSession = session;
                }
            });   
        } else {
            return { result: "error", message: "NOTFOUND" };
        }                       
        if (foundSession) {          
            if (["UNPAIRED_IDLE"].includes(foundSession.state)) {
                //restart cona
                await Sessions.closeSession(sessionName);
                Sessions.start(sessionName);
                return { result: "error", message: foundSession.state };
            } else { //CONNECTED
               return foundSession
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    }

    static getSessions() {
        if (Sessions.sessions) {
            return Sessions.sessions;
        } else {
            return [];
        }
    }

    static async getQrcode(sessionName) {
        var session = await Sessions.getSession(sessionName);
       
        if (session.result !== "error") {
            return session.result.qrcode
        } else {
            return null
        }
            
    } 

    static async sendText(sessionName, number, text) {
        let session = await Sessions.getSession(sessionName);

        if (session.result != "error") { 
            await session.client.then(async client => {
                return await client.sendText(number + '@c.us', text);
            });
            return { result: "success"}
        } else {
            return session
        }       
    }

    static async contactList(sessionName, isSave = false) {
        let session = await Sessions.getSession(sessionName);
        if (session.result != "error" && session.status != 'notLogged') { 
            let responseData = []
            await session.client.then(async client => {
                const constacts = await client.getAllContacts()
                responseData = await constacts.map(currentValue => {    
                    if (isSave) {
                        if (currentValue.isMyContact) {
                            return {
                                pushname: currentValue.pushname,
                                name: currentValue.name,
                                user: currentValue.user,
                                id: currentValue.id,
                                isMyContact: currentValue.isMyContact
                            }
                        }                        
                    } else {
                        return {
                            pushname: currentValue.pushname,
                            name: currentValue.name,
                            user: currentValue.user,
                            id: currentValue.id,
                            isMyContact: currentValue.isMyContact                           
                        }
                    }
                    
                })               
            });            
            return { result: "success", ...responseData}
        } else {
            return {result: "error", ...session}
        }       
    }

    static async sendFile(sessionName, number, base64Data, fileName, caption) {
        var session = await Sessions.getSession(sessionName);
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