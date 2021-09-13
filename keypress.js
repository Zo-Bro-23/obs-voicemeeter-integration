function keypress(app){
    const express = require('express')
    const {globalShortcut, app: electronApp} = require('electron')
    let keys = require('./keypress-keys.json')
    const axios = require('axios')
    const fs = require('fs')
    let webhooks = require('./keypress-webhooks.json')

    app.post('/keypress/addWebhook', (req, resp) => {
        if(!req.body.url){
            resp.status(400)
            resp.send('URL not sent.')
            return
        }else if(!req.body.key){
            resp.status(400)
            resp.send('Key not sent.')
        }

        for(item in webhooks.subscribed){
            if(webhooks.subscribed[item].url == req.body.url && webhooks.subscribed[item].key == req.body.key){
                resp.status(400)
                resp.send('Webhook already exists.')
                return
            }
        }

        webhooks.subscribed.push({
            url: req.body.url,
            key: req.body.key
        })

        if(!keys.subscribed.includes(req.body.key)){
            keys.subscribed.push(
                req.body.key
            )
            fs.writeFileSync('keypress-keys.json', JSON.stringify(keys, null, 4))
            globalShortcut.register(req.body.key, onKeyPress(req.body.key))
        }

        fs.writeFileSync('keypress-webhooks.json', JSON.stringify(webhooks, null, 4))
        resp.send('Webhook set!')
    })

    app.post('/keypress/deleteWebhook', (req, resp) => {
        if(!req.body.url){
            resp.status(400)
            resp.send('URL not sent.')
            return
        }else if(!req.body.key){
            resp.status(400)
            resp.send('Key not sent.')
            return
        }
        for(item in webhooks.subscribed){
            if(webhooks.subscribed[item].url == req.body.url && webhooks.subscribed[item].key == req.body.key){
                webhooks.subscribed.splice(item, 1)
                fs.writeFileSync('keypress-webhooks.json', JSON.stringify(webhooks, null, 4))
                resp.send('Webhook removed!')
                for(microItem in webhooks.subscribed){
                    if(webhooks.subscribed[microItem].key == req.body.key){
                        return
                    }
                }
                keys.subscribed.splice(keys.subscribed.indexOf(req.body.key))
                fs.writeFileSync('keypress-keys.json', JSON.stringify(keys, null, 4))
                globalShortcut.unregister(req.body.key)
                return
            }
        }
        resp.status(400)
        resp.send('Webhook not found.')
        reload()
    })

    electronApp.whenReady().then(() => {
        for(item in keys.subscribed){
            globalShortcut.register(keys.subscribed[item], onKeyPress(keys.subscribed[item]))
        }
    })

    function onKeyPress(item){
        return () => {
            for(microItem in webhooks.subscribed){
                if(webhooks.subscribed[microItem].key == item){
                    axios.post(webhooks.subscribed[microItem].url, {key: item})
                }
            }
        }
    }

    return new Promise((resolve, reject) => {
        resolve()
    })
}

module.exports = keypress