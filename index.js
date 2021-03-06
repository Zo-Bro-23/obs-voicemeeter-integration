const express = require('express')
const app = express()
const path = require('path')
const axios = require('axios')
const fs = require('fs')
const AutoLaunch = require('auto-launch')
const Validater = require('jsonschema').Validator
let v = new Validater()
const { app: electronApp, dialog, BrowserWindow } = require('electron')
const obs = require('./obs')
const secondServer = require('./voice-control-files/second-server')
const voicemeeter = require('./voicemeeter')
const keypress = require('./keypress')
const voiceControl = require('./voice-control')
let sceneList = []
let serverConfigTemplate = {
    "config": {
        "muteWhenSpeaking": [
            1
        ]
    }
}
let schema = {
    type: "object",
    properties: {
        config: {
            type: "object",
            properties: {
                muteWhenSpeaking: {
                    type: "array"
                }
            },
            additionalProperties: false
        }
    },
    additionalProperties: false,
    required: ['config']
}

const serverConfigPath = path.join(process.env.APPDATA, 'OBS-Voicemeeter-Integration', 'server-config.json')

let close

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

function sceneListUpdate() {
    axios.post('http://localhost:23708/obs/sendRequest/GetSceneList')
        .then(res => {
            sceneList = []
            for (item in res.data.scenes) {
                sceneList.push(res.data.scenes[item].name)
            }
            if (!fs.existsSync(serverConfigPath)) {
                for (scene in sceneList) {
                    serverConfigTemplate[sceneList[scene]] = {
                        "inputs": {},
                        "outputs": {}
                    }
                }
                fs.writeFileSync(serverConfigPath, JSON.stringify(serverConfigTemplate, null, 4))
                global.serverConfig = require(serverConfigPath)
            }
            setTimeout(sceneListUpdate, 5000)
        })
        .catch(err => {
            dialog.showMessageBox(new BrowserWindow({
                show: false,
                alwaysOnTop: true
            }), {
                message: 'OBS & Voicemeeter BOTH need to be open for the application to work!! Quitting now...',
                button: 'Ok'
            })
                .then(() => {
                    close = true
                    setTimeout(() => electronApp.quit(), 5000)
                })

            console.log(err)
        })
}

function main() {
    Promise.all([obs(app), voicemeeter(app), keypress(app), voiceControl(app)]).then((results) => {
        if (!fs.existsSync(path.join(process.env.APPDATA, 'OBS-Voicemeeter-Integration'))) {
            fs.mkdirSync(path.join(process.env.APPDATA, 'OBS-Voicemeeter-Integration'))
        }

        if (!fs.existsSync(serverConfigPath)) {
            global.serverConfig = {}
        } else {
            global.serverConfig = require(serverConfigPath)
        }

        sceneListUpdate()

        app.listen(23708).on('error', () => {
            electronApp.quit()
        })

        secondServer.listen(37492).on('error', () => {
            electronApp.quit()
        })

        app.get('/', (req, resp) => {
            resp.sendFile('index.html', { root: __dirname })
        })

        secondServer.get('/shouldClose', (req, resp) => {
            if (close) {
                resp.send('Yes!')
                electronApp.quit()
            } else {
                resp.send('No!')
            }
        })

        app.get('/close', (req, resp) => {
            resp.send('Closing!')
            close = true
            setTimeout(() => electronApp.quit(), 5000)
        })

        app.post('/updateJSON', (req, resp) => {
            axios.post('http://localhost:23708/obs/sendRequest/GetSceneList')
                .then(res => {
                    schema = {
                        type: "object",
                        properties: {
                            config: {
                                type: "object",
                                properties: {
                                    muteWhenSpeaking: {
                                        type: "array"
                                    }
                                },
                                additionalProperties: false
                            }
                        },
                        additionalProperties: false,
                        required: ['config']
                    }
                    for (item in res.data.scenes) {
                        schema.properties[res.data.scenes[item].name] = {
                            type: "object",
                            properties: {
                                inputs: {
                                    patternProperties: {
                                        '^[0-7]$': {
                                            type: 'object',
                                            properties: {
                                                mute: { type: 'boolean' },
                                                mono: { type: 'boolean' },
                                                solo: { type: 'boolean' },
                                                gain: { type: 'number', minimum: -60, maximum: 12 },
                                                comp: { type: 'number', minimum: 0, maximum: 10 },
                                                gate: { type: 'number', minimum: 0, maximum: 10 }
                                            },
                                            additionalProperties: false
                                        }
                                    },
                                    additionalProperties: false
                                },
                                outputs: {
                                    patternProperties: {
                                        '^[0-7]$': {
                                            type: 'object',
                                            properties: {
                                                mute: { type: 'boolean' },
                                                mono: { type: 'boolean' },
                                                gain: { type: 'number', minimum: -60, maximum: 12 }
                                            },
                                            additionalProperties: false
                                        }
                                    },
                                    additionalProperties: false
                                }
                            },
                            additionalProperties: false,
                            required: ['inputs', 'outputs']
                        }
                        schema.required.push(res.data.scenes[item].name)
                    }
                    if (v.validate(req.body, schema).errors.length == 0) {
                        serverConfig = req.body
                        resp.send('JSON updated!')
                        fs.writeFileSync(serverConfigPath, JSON.stringify(serverConfigPath, null, 4))
                    } else {
                        resp.status(400)
                        resp.send(JSON.stringify(v.validate(req.body, schema).errors[0], null, 4))
                    }
                    axios.post('http://localhost:23708/obs/sendRequest/GetCurrentScene')
                        .then(response => {
                            changeScene(response.data.name)
                        })
                })
        })

        app.post('/changeScene', (req, resp) => {
            if (!req.body.sceneName) {
                resp.status(400)
                resp.send('Scene name is required.')
                return
            }
            changeScene(req.body.sceneName)
            resp.send('Scene changed!')
        })

        secondServer.post('/keypress', (req, resp) => {
            if (req.body.key == 'Ctrl+Alt+W') {
                for (item in serverConfig.config.muteWhenSpeaking) {
                    axios.post(`http://localhost:23708/voicemeeter/strips/${serverConfig.config.muteWhenSpeaking[item]}`, { mute: true })
                }
                axios.get('http://localhost:23708/voiceControl/dictate')
                    .then(res => {
                        for (item in serverConfig.config.muteWhenSpeaking) {
                            axios.post(`http://localhost:23708/voicemeeter/strips/${serverConfig.config.muteWhenSpeaking[item]}`, { mute: false })
                        }
                        let string = res.data.toLowerCase()
                        if (string.includes('switch to')) {
                            let sceneName = string.split('switch to')[string.split('switch to').length - 1].trim()
                            if (sceneList.includes(sceneName)) {
                                changeScene(sceneName)
                                axios.post('http://localhost:23708/voiceControl/speak', { message: `Switching to ${sceneName}` })
                            } else {
                                axios.post('http://localhost:23708/voiceControl/speak', { message: `${sceneName} is not a valid scene!` })
                            }
                        }
                    })
                    .catch(err => {
                    })
            }
        })

        secondServer.post('/obs', (req, resp) => {
            if (req.body.updateType == 'SwitchScenes') {
                changeScene(req.body['scene-name'])
            }
        })
    }).catch(err => {
        dialog.showMessageBox(new BrowserWindow({
            show: false,
            alwaysOnTop: true
        }), {
            message: 'OBS & Voicemeeter BOTH need to be open for the application to work!! Quitting now...',
            button: 'Ok'
        })
            .then(() => {
                electronApp.quit()
            })

        console.log(err)
    })
}

main()

function changeScene(sceneName) {
    axios.post('http://localhost:23708/obs/sendRequest/SetCurrentScene', { 'scene-name': sceneName })
    for (item in serverConfig[sceneName].inputs) {
        axios.post(`http://localhost:23708/voicemeeter/strips/${item}`, serverConfig[sceneName].inputs[item])
    }
    for (item in serverConfig[sceneName].outputs) {
        axios.post(`http://localhost:23708/voicemeeter/buses/${item}`, serverConfig[sceneName].outputs[item])
    }
}

let autoLaunch = new AutoLaunch({
    name: 'OBS Voicemeeter Integration Server',
    path: electronApp.getPath('exe'),
})

autoLaunch.isEnabled().then((isEnabled) => {
    if (!isEnabled) autoLaunch.disable()
})