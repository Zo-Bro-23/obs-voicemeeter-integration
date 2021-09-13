function obsFunc(app) {
    const express = require('express')
    const axios = require('axios')
    const OBSWebSocket = require('obs-websocket-js')
    const fs = require('fs')
    const obs = new OBSWebSocket()
    let webhooks = require('./obs-webhooks.json')
    let events = require('./obs-events.json')

    for (item in events.subscribed) {
        obs.on(events.subscribed[item], onEvent(events.subscribed[item]))
    }

    app.post('/obs/sendRequest/:request', (req, resp) => {
        obs.send(req.params.request, req.body).then(data => {
            resp.send(JSON.stringify(data, null, 4))
        }).catch(err => {
            resp.status(400)
            resp.send(JSON.stringify(err, null, 4))
        })
    })

    app.post('/obs/addWebhook', (req, resp) => {
        if (!req.body.url) {
            resp.status(400)
            resp.send('URL not sent.')
            return
        } else if (!req.body.event) {
            resp.status(400)
            resp.send('Event not sent.')
            return
        }
        for (item in webhooks.subscribed) {
            if (webhooks.subscribed[item].url == req.body.url && webhooks.subscribed[item].event == req.body.event) {
                resp.status(400)
                resp.send('Webhook already exists.')
                return
            }
        }
        webhooks.subscribed.push({
            url: req.body.url,
            event: req.body.event
        })
        if (!events.subscribed.includes(req.body.event)) {
            events.subscribed.push(
                req.body.event
            )
            fs.writeFileSync('obs-events.json', JSON.stringify(events, null, 4))
            obs.on(req.body.event, onEvent(req.body.event))
        }
        fs.writeFileSync('obs-webhooks.json', JSON.stringify(webhooks, null, 4))
        resp.send('Webhook set!')
    })

    app.post('/obs/deleteWebhook', (req, resp) => {
        if (!req.body.url) {
            resp.status(400)
            resp.send('URL not sent.')
            return
        } else if (!req.body.event) {
            resp.status(400)
            resp.send('Event not sent.')
            return
        }
        for (item in webhooks.subscribed) {
            if (webhooks.subscribed[item].url == req.body.url && webhooks.subscribed[item].event == req.body.event) {
                webhooks.subscribed.splice(item, 1)
                fs.writeFileSync('obs-webhooks.json', JSON.stringify(webhooks, null, 4))
                resp.send('Webhook removed!')
                for (microItem in webhooks.subscribed) {
                    if (webhooks.subscribed[microItem].event == req.body.event) {
                        return
                    }
                }
                events.subscribed.splice(events.subscribed.indexOf(req.body.event), 1)
                fs.writeFileSync('obs-events.json', JSON.stringify(events, null, 4))
                return
            }
        }
        resp.status(400)
        resp.send('Webhook not found.')
    })

    function onEvent(event) {
        return (data) => {
            for (microItem in webhooks.subscribed) {
                if (webhooks.subscribed[microItem].event == event) {
                    axios.post(webhooks.subscribed[microItem].url, data)
                }
            }
        }
    }

    return obs.connect({ address: '127.0.0.1:4444' })
}

module.exports = obsFunc