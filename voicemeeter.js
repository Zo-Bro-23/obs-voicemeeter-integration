function voicemeeter(app) {
    const express = require('express')
    const voicemeeter = require('easy-voicemeeter-remote')
    let value

    app.get('/voicemeeter/info', (req, resp) => {
        voicemeeter.getAllParameter().then(r => {
            resp.send(r)
        })
    })

    app.get('/voicemeeter/preFaderLevel/:strip', (req, resp) => {
        resp.send(voicemeeter.getLevelByID(0, req.param.strip))
    })

    app.get('/voicemeeter/postFaderLevel/:strip', (req, resp) => {
        resp.send(voicemeeter.getLevelByID(1, req.param.strip))
    })

    app.get('/voicemeeter/postMuteLevel/:strip', (req, resp) => {
        resp.send(voicemeeter.getLevelByID(2, req.param.strip))
    })

    app.get('/voicemeeter/outputLevel/:bus', (req, resp) => {
        resp.send(voicemeeter.getLevelByID(3, req.param.bus))
    })

    app.post('/voicemeeter/strips/:strip', (req, resp) => {
        for (key in req.body) {
            if (!['mute', 'mono', 'solo', 'gain', 'comp', 'gate'].includes(key)) {
                resp.status(400)
                resp.send("That's not a valid setting!")
                return
            }
            voicemeeter["setStrip" + key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()](parseInt(req.params.strip), req.body[key])
        }
        resp.send("Ok!")
    })

    app.post('/voicemeeter/buses/:bus', (req, resp) => {
        for (key in req.body) {
            if (!['mute', 'mono', 'gain'].includes(key)) {
                resp.status(400)
                resp.send("That's not a valid setting!")
                return
            }
            voicemeeter["setBus" + key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()](parseInt(req.params.bus), req.body[key])
        }
        resp.send("Ok!")
    })

    app.post('/voicemeeter/stripsRelative/:strip', (req, resp) => {
        for (key in req.body) {
            if (!['gain', 'comp', 'gate'].includes(key)) {
                throw "That's not a valid setting!"
            }
            voicemeeter.getAllParameter().then(r => {
                value = r.inputs[req.params.strip][key]
                voicemeeter["setStrip" + key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()](parseInt(req.params.strip), (value + req.body[key]))
            })
        }
        resp.send("Ok!")
    })

    app.post('/voicemeeter/busesRelative/:bus', (req, resp) => {
        for (key in req.body) {
            if (!['gain'].includes(key)) {
                throw "That's not a valid setting!"
            }
            voicemeeter.getAllParameter().then(r => {
                value = r.inputs[req.params.bus][key]
                voicemeeter["setBus" + key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()](parseInt(req.params.bus), (value + req.body[key]))
            })
        }
        resp.send("Ok!")
    })

    return new Promise((resolve, reject) => {
        voicemeeter.init().then(() => {
            voicemeeter.login()
            resolve()
        }).catch(err => {
            reject()
        })
    })
}

module.exports = voicemeeter