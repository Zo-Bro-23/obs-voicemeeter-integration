const axios = require('axios')

axios.post('http://localhost:23708/keypress/addWebhook', {url: 'http://localhost:37492/keypress', key: 'Alt+W'})
axios.post('http://localhost:23708/obs/addWebhook', {url: 'http://localhost:37492/obs', event: 'SwitchScenes'})