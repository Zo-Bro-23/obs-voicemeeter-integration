const axios = require('axios')

axios.post('http://localhost:23708/updateJSON', {
    'starting soon': {
        inputs: {
            7: {gain: -15},
            0: {mute: true},
            5: {mute: true}
        },
        outputs: {}
    },
    'ending soon': {
        inputs: {
            7: {gain: -15},
            0: {mute: true},
            5: {mute: true}
        },
        outputs: {}
    },
    'intermission': {
        inputs: {
            7: {gain:-15},
            0: {mute: true},
            5: {mute: true}
        },
        outputs: {}
    },
    'backgrounds': {
        inputs: {},
        outputs: {}
    },
    'main': {
        inputs: {
            7: {gain: -30},
            0: {mute: false},
            5: {mute: false}
        },
        outputs: {}
    },
    'config': {
        muteWhenSpeaking: [1]
    }
})
    .then(res => {console.log(res)})
    .catch(err => {console.log(err)})