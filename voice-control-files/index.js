function everything(){
  document.getElementById('button').style.display = 'none'
  document.getElementById('img').style.display = 'block'

  navigator.permissions.query({ name: 'microphone' })
    .then(permissionStatus => {
        if(permissionStatus.state == 'denied'){
            document.getElementById('p').innerHTML = 'Permission is denied.'
            document.getElementById('img').style.display = 'none'
        }
        permissionStatus.onchange = () => window.location.reload()

      })

  function speak(text){
    return new Promise((resolve, reject) => {
      try{
        const synth = window.speechSynthesis
        let utterThis = new SpeechSynthesisUtterance(text)
        // utterThis.voice = synth.getVoices()[20]
        utterThis.onend = () => {
          resolve()
        }
        synth.speak(utterThis)
      }catch(err){
        reject(err)
      }
    })
  }

  function dictate(){
    return new Promise((resolve, reject) => {
      try{
        window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.start()
        recognition.onresult = event => {
          resolve(event.results[0][0].transcript)
        }
        recognition.onerror = err => {
          reject(JSON.stringify(err))
        }
      }catch(err){
        reject(err)
      }
    })
  }

  function dictateFunc(){
    axios.get('http://localhost:37492/shouldDictate').then(res => {
      temp = res.data
      if(temp == 'Yes!'){
        starting.play()
        dictate().then(res => {
          ending.play()
          axios.post('http://localhost:37492/doneDictating', {message: res})
          dictateFunc()
        }).catch(err => {
          ending.play()
          axios.post('http://localhost:37492/doneDictating', {message: 'Error occured.'})
          dictateFunc()
        })
      }else{
        dictateFunc()
      }
    }).catch(err => {
      dictateFunc()
    })
  }

  dictateFunc()

  function speakFunc(){
    axios.get('http://localhost:37492/shouldSpeak').then(res => {
      temp = res.data
      if(temp.shouldSpeak == true){
        speak(temp.message).then(() => {
          axios.post('http://localhost:37492/doneSpeaking')
          speakFunc()
        }).catch(err => {
          axios.post('http://localhost:37492/doneSpeaking')
          speakFunc()
        })
      }else{
        speakFunc()
      }
    }).catch(err => {
      speakFunc()
    })
  }

  speakFunc()

  window.onbeforeunload = () => {
    axios.post('http://localhost:37492/close')
    return "Are you sure?"
  }

  window.onunload = () => {}
}

const axios = require('axios')
let temp
var starting = new Audio('chime-starting.mp3')
var ending = new Audio('chime-ending.mp3')
document.getElementById('button').onclick = everything

function closingFunc(){
  axios.get('http://localhost:37492/shouldClose')
    .then(res => {
      if(res.data == 'Yes!'){
        window.onbeforeunload = () => {}
        window.close()
      }else{
        closingFunc()
      }
    }).catch(err => {
      closingFunc()
    })
}

closingFunc()

window.onload = () => {
  axios.post('http://localhost:37492/open')
}

window.onunload = () => {
  axios.post('http://localhost:37492/close')
}

function openStatus(){
  setTimeout(() => {axios.post('http://localhost:37492/open'); openStatus()}, 1000)
}

openStatus()