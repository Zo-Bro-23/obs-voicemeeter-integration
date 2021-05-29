function voiceControl(app){
    const express = require('express')
    const timeout = require('connect-timeout')
    const fs = require('fs')
    const {shell} = require('electron')
    const cors = require('cors')
    const secondServer = require('./voice-control-files/second-server')
    let dictate = false
    let speak = false
    let open = false
    let tempFunc
    let tempSpeakFunc

    secondServer.use(express.urlencoded({extended: true}))
    secondServer.use(express.json())
    secondServer.use(cors())
    app.use('/voiceControl', express.static(__dirname + '/voice-control-files'))
    app.use(cors())
    app.use((req, resp, next) => {
        req.setTimeout(2147483647)
        next()
    })

    app.get('/voiceControl/dictate', (req, resp) => {
        if(tempFunc == undefined){
            dictate = true
            if(!open){
                shell.openExternal('http://localhost:23708/voiceControl')
            }
            tempFunc = (message) => resp.send(message)
        }else{
            resp.status(400)
            resp.send('Gimme one job at a time, bro!')
        }
    })

    app.post('/voiceControl/speak', (req, resp) => {
        if(tempSpeakFunc == undefined){
            if(!req.body.message){
                resp.status(400)
                resp.send('Message not sent.')
                return
            }
            speak = req.body.message
            if(!open){
                shell.openExternal('http://localhost:23708/voiceControl')
            }
            tempSpeakFunc = (message) => resp.send(message)
        }else{
            resp.status(400)
            resp.send('My mouth\'s full enough as is!')
        }
    })

    secondServer.get('/shouldDictate', (req, resp) => {
        if(dictate){
            resp.send('Yes!')
            dictate = false
        }else{
            resp.send('No, not yet!')
        }
    })

    secondServer.get('/shouldSpeak', (req, resp) => {
        if(speak){
            resp.send({shouldSpeak: true, message: speak})
            speak = false
        }else{
            resp.send({shouldSpeak: false})
        }
    })

    secondServer.post('/doneDictating', (req, resp) => {
        if(!req.body.message){
            resp.status(400)
            resp.send('Oops! You forgot the message!')
            return
        }
        tempFunc(req.body.message)
        tempFunc = undefined
        resp.send('Cool! Managed everything!')
    })

    secondServer.post('/doneSpeaking', (req, resp) => {
        tempSpeakFunc('Done speaking!')
        tempSpeakFunc = undefined
        resp.send('Cool! Managed everything!')
    })

    secondServer.post('/open', (req, resp) => {
        open = true
        resp.send('Hey, thanks for letting me know!')
    })

    secondServer.post('/close', (req, resp) => {
        if(tempFunc){
            tempFunc('Client application is closing. Request cancelled.')
            tempFunc = undefined
        }
        if(tempSpeakFunc){
            tempSpeakFunc('Client application is closing. Request cancelled.')
            tempSpeakFunc = undefined
        }
        open = false
        resp.send('Again, thanks for letting me know!')
    })

    return new Promise((resolve, reject) => {
        resolve()
    })   
}

module.exports = voiceControl