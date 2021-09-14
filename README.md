# OBS Voicemeeter Integration
## A server to integrate OBS and Voicemeeter using your voice, keyboard shortcuts and more!

Okay, so let me get this straight. This is not a plugin. It's not even an application with a proper UI. Then why bother? Well, don't ask me. You're the one who's here!

OBS Voicemeeter Integration Server (for lack of a better name) is an application that allows you to synchronize between OBS and Voicemeeter (🤯). I'm a huge user of both the applications. In case you didn't know, OBS Studio let's you live stream pretty much anything, while Voicemeeter is like a virtual audio mixer. OBS does have audio provisions, but if you're already a Voicemeeter user, you'll find it annoying to change all your configuration. Voicemeeter doesn't let you use any audio devices while it's open, so you have to close it and spend a good half-an-hour each time you want to stream. And that's exactly why I made this application!

## Using it out of the box

Download and install the EXE.

NOTE: Voicemeeter is only there for Windows, so naturally, this application is there only for Windows.

Run the EXE file. It will probably give you an error and shut down. You need to open OBS, genius! You need to open Voicemeeter too.

Using Postman (or any other application), do a HTTP POST request to the following URL: 'http://localhost:23708/updateJSON' with some JSON in the following format. Make sure that all your scene names are in small letters and that they don't contain any characters such as hyphen, period, brackets, etc. Also, make sure that there is no scene named "config". Again, if you're building the app yourself, you can just run update-config after editing the code a bit. Here's the JSON format:

{
    "scene1": {
        "inputs": {
            "0": {
                "gain": 1,
                "mute": true
            }
        },
        "outputs": {}
    },
    "scene2": {
        "inputs": {
            "0": {
                "gain": 10,
                "mute": false
            }
        }
    },
    "config": {
        muteWhenSpeaking: [1]
    }
}

Note: All scene names (along with config) and the Outputs and Inputs part are mandatory, but the strip numbers and effect (gain/mute) are optional (along with the muteWhenSpeaking part). Any strip numbers provided inside the muteWhenSpeaking array will be muted when the application is listening for the user's voice.

Press Ctrl + Alt + W. Make sure that this combination isn't used for any other application. There's no way to change it if you're using the EXE. If you're building the app yourself (see build instructions below), however, just edit the one-time-config.js by replacing Key parameter in the /keypress/addWebhook line with the key you want to assign. Then run node one-time-config.js.

Wait for a few seconds. A browser tab should open. Press Start Server. Say something like "Switch to [scene name]". It should switch scenes in OBS. It should also change your Voicemeeter config a bit (according to your JSON).

Now change the scene in OBS. Voicemeeter should change automatically too. And that's the magic of my application!

## Using the in-built APIs

This application has a LOT of APIs. And all of them are exposed! Some of you will be muttering about security, but only the ports on your local PC is exposed. Here is a list of all the APIs that my application brings with it. Feel free to use any of them, but some of them (especially the ones with a different port) may destroy the application. If that happens, just re-install it and you should be fine!

Note: All endpoints are GET unless specified

### On port 23708

/ - Trump photo

/close - Quit application

/updateJSON (POST) - Update OBS/Voicemeeter scene link

/changeScene (POST) - Change scene through REST (both OBS and Voicemeeter are affected). Name in format: { "sceneName": "*name*"}

/keypress/addWebhook (POST) - Add webhook for any shortcut (Windows Key doesn't usually work). Send url and key in request body. Key in format Ctrl+Alt+W, etc.

/keypress/deleteWebhook (POST) - Delete an existing webhook. Send url and key in request body.

/obs/addWebhook (POST) - Add a webhook for an OBS event. Send url and event in request body. See here for a full list of possible events.

/obs/deleteWebhook (POST) - Delete an existing webhook. Send url and event in request body.

/obs/sendRequest/:request (POST) - Replace :request with the type of request you want to send. Send any parameters in the request body. See here for a full list of possible requests.

/voiceControl - Opens a browser tab. If the Start Server button is clicked, then the dictate and speak endpoints will start to function.

/voiceControl/dictate - Listens for something the user has to say. Sends either the deciphered message (after user finishes speaking) or a blank string (after the deciphering failed). If the user doesn't say something for around 20s, the deciphering is counted as failed. If the user doesn't have http://localhost:23708/voiceControl open, it is automatically opened after a few seconds.

/voiceControl/speak - Speaks a message. If the user doesn't have http://localhost:23708/voiceControl open, it is automatically opened after a few seconds.

/voicemeeter/info - Gets all available information from Voicemeeter.

/voicemeeter/preFaderLevel/:strip - Gets the pre-fader level for a given strip

/voicemeeter/postFaderLevel/:strip - Gets the post-fader level for a given strip

/voicemeeter/postMuteLevel/:strip - Gets the post-mute level for a given strip

/voicemeeter/outputLevel/:bus - Gets the level for a given bus

/voicemeeter/strips/:strip (POST) - Adjusts settings for a strip. Give the settings in the following format:
{ mute: boolean, mono: boolean, solo: boolean, gain: integer, comp: integer, gate: integer }
Give only the settings you need to change.

/voicemeeter/buses/:bus (POST) - Adjusts settings for a bus. Give the settings in the following format:
{ mute: boolean, mono: boolean, gain: integer }
Give only the settings you need to change.

/voicemeeter/stripsRelative/:strip - Adjusts settings relative to the current setting. Give the settings in the following format:
{ gain: integer, comp: integer, gate: integer }
Give only the settings you need to change.

/voicemeeter/busesRelative/:bus - Adjusts settings relative to the current setting. Give the settings in the following format:
{ gain: integer }
Give only the settings you need to change.

### On port 37492

/shouldClose - Endpoint used internally by the application to determine if any open /voiceControl browser tabs should close (see /voiceControl). Gets either 'Yes!' or 'No!' as an answer.

/keypress - Used internally by the application to trigger the voice action. Request body should be in the following format:
{"key": 'Ctrl+Alt+W'}

/obs - Used internally by the application to trigger a change of scene. Request body should be in the following format:
{"updateType": "SwitchScenes", "scene-name": "scene1"}

/shouldDictate - Used by /voiceControl browser application to know when to start recognizing speech.
/shouldSpeak - Used by /voiceControl browser application to know when to read out a message.
/doneDictating - Used by /voiceControl browser application when it finishes recognizing speech.
/doneSpeaking - Used by /voiceControl browser application when it finishes speaking.
/open - Used by /voiceControl browser application when it gets opened.
/close - Used by /voiceControl browser application when it closes.

## Build instructions

Download the ZIP file. Extract it. Open a new Command Prompt in the root location of the folder. Install packages with the command npm i. Change whatever you need to, and run the command npm run build. The EXE file should be generated at "./dist/OBS Voicemeeter Integration Server Setup 1.1.1.exe".

## Further resources

You can find the files for this application here. If you want to run only one of the four bits of this application (Voicemeeter, OBS, Voice recognition, Keyboard shortcut), you can find the APIs separately here.