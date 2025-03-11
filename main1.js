import {LoopPedal, ReverbPedal, DelayPedal } from "./classes.js";

const audioContext = new window.AudioContext();
const pedals = [LoopPedal, ReverbPedal, DelayPedal];

if (audioContext.state === 'suspended') {
    audioContext.resume();
};

// manages these variables globally
const audioManager = {    // this is encapsulation!
    audioSourceNode: null,
    audioElement: null,
    masterGainNode: null,
};
let delayPedalInstance;
let stream;

//// Accessing user's microphone input ////
document.addEventListener('DOMContentLoaded', () => {
    const permissionButton = document.getElementById('permissionBtn');
    
    permissionButton.addEventListener('click', () => {
        requestAudioInput();
    })
});

async function requestAudioInput() {
    try{
        // request audio input
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (stream) {
            console.log("Audio input recieved.");
        }
        // creates a MediaStreamSource node for the microphone input
        const inputSource = audioContext.createMediaStreamSource(stream);
        // enables the Create Delay Effect button on the webpage
        //document.getElementById("start-delay-effect").disabled = false;

        return {inputSource};
    } catch(error) {
        console.error("Error accessing audio input:", error);
        return {inputSource: undefined}; 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const blockButton = document.getElementById('stopMicBtn');
    
    blockButton.addEventListener('click', () => {
        stopAudioInput();
    })
});

function stopAudioInput() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        console.log("Microphone input stopped.");
    } else {
        console.log("No active microphone stream to stop.");
    }
}

//// For ReverbPedal ////
document.addEventListener('DOMContentLoaded', () => {
    //console.log('DOMContentLoaded event fired');        <-- ////////

    const containerID = document.getElementById('pedalContainer');
    // Check for pedal container element
    if (containerID){
        //console.log('Container element found:', containerID);     <-- ////////
        // Create Reverb nodes
        const reverbPedalConfig = {
            name: "Reverb",
            label: "Reverb Pedal",
            toggle: () => {}, // placeholder function
            active: false,
            index: 1
        };

        try {
            const reverbPedalInstance = new ReverbPedal(audioContext, containerID, reverbPedalConfig);
            reverbPedalConfig.toggle = () => reverbPedalInstance.toggleReverb();

            // if audioElement doesn't exist, attempt to find it in the DOM
            if(!audioManager.audioElement) {
                audioManager.audioElement = document.querySelector('audio');
                // if it still doesn't exist, log an error to the console
                if(!audioManager.audioElement) {
                    console.error("Audio element not found in the DOM.");
                    return;
                } else {
                    // audioElement successfully found
                    console.log("Audio element assigned to audioManager.audioElement.");
                }
            } else {
                // audioElement successfully found
                console.log("Audio element assigned to audioManager.audioElement.");
            }

            // MediaElementSource created and assigned to audioSourceNode for processing 
            if(audioManager.audioElement) {
                if(!audioManager.audioSourceNode){
                    audioManager.audioSourceNode = audioContext.createMediaElementSource(audioManager.audioElement);
                    console.log("MediaElementSourceNode created for audioManager.audioElement.");
                }
                // connect the audio nodes to the reverb pedal 
                reverbPedalInstance.connect(audioManager.audioSourceNode);
                audioManager.audioSourceNode.connect(audioContext.destination);
            } else {
                console.error("Audio element not found.");
            } 

        } catch (error){
            console.error("Error creating ReverbPedal Instance:", error );
        }
    } else {
        console.error("Container element not found.");
    } 
});

//// For DelayPedal ////
document.addEventListener('DOMContentLoaded', async () => {
    console.log('2nd DOMContentLoaded event fired');

    const containerID = document.getElementById('pedalContainer');

    if (containerID){
        //console.log('Container element found:', containerID);

        let userMicInput;
        try {
            // retrieve user microphone input
            const {inputSource} = await requestAudioInput();
            if (inputSource != undefined) {
                console.log("Received microphone input: ", inputSource);
                userMicInput = inputSource;
            } else {
                //console.warn("No microphone input detected. Defaulting to undefined.");
                userMicInput = undefined;
            }

        } catch (error) {
            console.error("Error accessing user microphone input", error);
            userMicInput = undefined;
        }
        // Create Delay Nodes
        const delayPedalConfig = {
            name: "Delay",
            label: "Delay Pedal",
            toggle: () => {}, // placeholder function
            active: false,
            index: 2
        };
        
        try {
            delayPedalInstance = new DelayPedal(audioContext, containerID, delayPedalConfig);
            delayPedalConfig.toggle = () => delayPedalInstance.toggleDelay();
            document.getElementById('pedalContainer').appendChild(delayPedalInstance.pedalElement);

            
            function connectActiveSourceToPedal(pedalInstance) {
                if (audioManager.audioSourceNode) {
                  // Audio file is active
                  console.log("Connecting audio file to pedal.");
                  pedalInstance.connect(audioManager.audioSourceNode);
                } else if (userMicInput) {
                  // Microphone input is active
                  console.log("Connecting microphone input to pedal.");
                  pedalInstance.connect(userMicInput);
                } else {
                  console.error("No active audio source found.");
                }
              }

            // connects delay effect to file input (if applicable)
            if(!audioManager.audioElement) {
                audioManager.audioElement = document.querySelector('audio');

                if(!audioManager.audioElement) {
                    console.error("Audio element not found in the DOM.");
                    return;
                }
                console.log("Audio element assigned to audioManager.audioElement");
            }

            // create or reuse the 'MediaElementSource'
            if(!audioManager.audioSourceNode) {
                audioManager.audioSourceNode = audioContext.createMediaElementSource(audioManager.audioElement);
                console.log("New MediaElementSourceNode created for audioManager.audioElement");
            } else {
                console.log("Reusing existing MediaElementSourceNode from audioManager");
            }

        } catch (error){
            console.error("Error creating DelayPedal Instance:", error );
        }
    }
});

//// For DelayPedal ////
/* const startDelayBtn = document.getElementById('start-delay-effect');

startDelayBtn.addEventListener('click', () => {
    if(audioManager.audioElement){
        console.log("Applying delay effect to audio file...");
        
        if(!audioManager.audioSourceNode) {
            audioManager.audioSourceNode = audioContext.createMediaElementSource(audioManager.audioElement);
        }
        delayPedalInstance.connect(audioManager.audioSourceNode);
        audioManager.audioSourceNode.connect(audioContext.destination);
        //delayPedal.createDelayEffect();
    } else {
        console.error("No audio file to apply delay effect to.");
    }
});  */


//// Selecting and playing the user inputted audio file ////
const fileSelectBtn = document.getElementById('file-selectBtn');
const fileInput = document.getElementById('audioFileInput');
const playBtn = document.getElementById('playButton');
let audio;

fileSelectBtn.addEventListener('click', () => {
    fileInput.click();
  });

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length === 0) { // if no file is selected
        fileSelectBtn.nextElementSibling.textContent = "No file chosen";
        return;
    }
    const file = e.target.files[0]; // this is the file selected by the user
    
    const validFileTypes = [".mp3", ".wav", ".ogg"];  // allowed file types
    if(!validFileTypes.some(ext => file.name.endsWith(ext))) {
        console.error("Incorrect file type selected."); // error message
        fileSelectBtn.nextElementSibling.textContent = "No file chosen";
        return;
    }

    fileSelectBtn.nextElementSibling.textContent = file.name; // displays the file name chosen
    audio = new Audio(URL.createObjectURL(file)); // creates a new audio element with the selected audio file as its source
    console.log("Valid audio file selected to play: ", file.name);
});

playBtn.addEventListener('click', () => {
    if (audio) {
        if (audio.paused) {
            audio.play(); //plays selected audio file
            playBtn.textContent = 'Stop File'; // changes the play button to a stop button
            //delayPedal.createDelayEffect(audio);
            console.log("Audio file is currently playing.");
        } else {
            audio.pause(); // pauses audio file 
            audio.currentTime = 0; // resets audio file to beginning
            playBtn.textContent = 'Play File'; // changes stop button back to play button once clicked
            console.log("Audio file has stopped playing.");
        }
    } else {
        console.log("No file has been selected to play.");
    }
});

//////////////////////////////////////////////////////////////////////////////////////////////


/* audioManager.masterGainNode = audioContext.createGain();
audioManager.masterGainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
console.log("Master Gain Node Created");

audioManager.audioSourceNode.connect(audioManager.masterGainNode);
    audioManager.masterGainNode.connect(audioContext.destination);
    console.log("Audio chain connected successfully");

const masterVolumeKnob = document.getElementById('master-volume');
masterVolumeKnob.addEventListener('change', (event) => {
    if (audioManager.masterGainNode) {
        const volume = parseFloat(event.target.value);
        audioManager.masterGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        console.log(`Master volume set to: ${volume}`);
    }
});  */
