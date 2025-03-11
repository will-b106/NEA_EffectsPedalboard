import {LoopPedal, ReverbPedal, DelayPedal } from "./classes.js";

const audioContext = new window.AudioContext();
const pedals = [LoopPedal, ReverbPedal, DelayPedal]; // array not used, only to store the LoopPedal to prevent errors //

// manages these variables globally
const audioManager = {    // this is encapsulation!
    audioSourceNode: null,
    audioElement: null,
    masterGainNode: null,
}

let stream;
// Request microphone input
async function requestAudioInput() {
  try {
    // request audio input
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (stream) {
        console.log("Audio input recieved.");
    }
    // creates a MediaStreamSource node for the microphone input
    const inputSource = audioContext.createMediaStreamSource(stream);
    return inputSource;

  } catch (error) {
    console.error("Error accessing microphone:", error);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const permissionButton = document.getElementById('permissionBtn');
    
    permissionButton.addEventListener('click', () => {
        requestAudioInput();
    })
});

// Stop microphone input
function stopAudioInput() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    console.log("Microphone input stopped.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const blockButton = document.getElementById('stopMicBtn');
    
    blockButton.addEventListener('click', () => {
        stopAudioInput();
    })
});

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

    // Create a MediaElementSource node for the audio file
    audioManager.audioSourceNode = audioContext.createMediaElementSource(audio);
    audioManager.audioSourceNode.connect(audioContext.destination); // Connect to the audio context destination

    if (reverbPedalInstance) {
        reverbPedalInstance.connect(audioManager.audioSourceNode);
    }
    if (delayPedalInstance) {
        delayPedalInstance.connect(audioManager.audioSourceNode);
    }
});

// Resume the AudioContext on user interaction
function resumeAudioContext() {
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log("AudioContext resumed successfully.");
        }).catch((error) => {
            console.error("Error resuming AudioContext:", error);
        });
    }
};

// plays the inputted audio file
playBtn.addEventListener('click', () => {
    // Resume the AudioContext before playing the audio file
    resumeAudioContext();
    
    // Disconnect the microphone input (if connected)
    stopAudioInput();

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

let reverbPedalInstance;
let delayPedalInstance;
// Initialize pedals
document.addEventListener('DOMContentLoaded', async () => {
  const containerID = document.getElementById('pedalContainer');

  if (containerID) {
    // Create Reverb Pedal
    const reverbPedalConfig = {
      name: "Reverb",
      label: "Reverb Pedal",
      toggle: () => {},
      active: false,
      index: 1,
    };
    reverbPedalInstance = new ReverbPedal(audioContext, containerID, reverbPedalConfig);
    reverbPedalConfig.toggle = () => reverbPedalInstance.toggleReverb();

    // Create Delay Pedal
    const delayPedalConfig = {
      name: "Delay",
      label: "Delay Pedal",
      toggle: () => {},
      active: false,
      index: 2,
    };
    delayPedalInstance = new DelayPedal(audioContext, containerID, delayPedalConfig);
    delayPedalConfig.toggle = () => delayPedalInstance.toggleDelay();

    // Connect microphone input to pedals
    const micInput = await requestAudioInput();
    if (micInput) {
        reverbPedalInstance.connect(micInput);
        delayPedalInstance.connect(micInput);
    }
  } 
}); 

// Show Documentation Modal
document.getElementById('showDocumentation').addEventListener('click', () => {
    document.getElementById('overlay').classList.add('active');
    document.getElementById('documentationModal').classList.add('active');
});

// Hide Documentation Modal
document.getElementById('closeDocumentation').addEventListener('click', () => {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('documentationModal').classList.remove('active');
});

// Hide Modal when clicking outside of it
document.getElementById('overlay').addEventListener('click', () => {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('documentationModal').classList.remove('active');


});

// Resume the audio context on user interaction
document.addEventListener('DOMContentLoaded', () => {
    const resumeButton = document.getElementById('resumeButton');
    resumeButton.addEventListener('click', () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log("AudioContext resumed successfully.");
            });
        }
    });
}); 