export class PedalSkel {
    constructor(audioContext, container, pedalConfig){
      this.audioContext = audioContext;
      this.container = container;
      this.pedalConfig = pedalConfig;

      this.pedalElement = PedalSkel.createPedal(pedalConfig);

      // Append the pedal to the container
      if (this.container) {
        this.container.appendChild(this.pedalElement);
      } else {
        console.error("Container element not found.");
      }
    }

    static createPedal = ({name = '', label = '', toggle, active = false, index = 0}) => {
      console.log('Creating pedal with config:', { name, label, toggle, active, index });
      const pedal = document.createElement('div');
      pedal.classList.add('pedal');
      const id = name.replace(/\s/g, '-') || ''; // regex expression
      
      pedal.innerHTML = `
        <div class="pedal-body">
          <h2 class="pedal-label">${label}</h2>
          <div class="pedal-knobs>
            <label for="${id}-effect">Effect Amount</label>
            <input type="range" id="${id}-effect" class="effect-knob" min="0" max="100" value="50">

            <label for="${id}-mix">Mix</label>
            <input type="range" id="${id}-mix" class="mix-knob" min="0" max="100" value="50">
          </div>
          <div class="pedal-switch">
            <input type="checkbox" id="${id}Active" class="checkbox" ${active ? 'checked' : ''} />
            <label for="${id}Active" class="pedalButton">On/Off</label>
          </div>
        </div>
        `;

      const input = pedal.querySelector('.checkbox');
      // Check that the checkbox class has been selected
      if (input){
        input.addEventListener('change', () => toggle());
      } else {
        console.error('Checkbox element not found.');
      }

      window.addEventListener('MIDI', ({detail}) => {
        if(detail === index && input){
          input.checked = !input.checked;
          toggle();
        }
      })

      pedal.classList.add(`pedal--${id}`);
      pedal.dataset.type = name;

      return pedal;
    } 
};

export class ReverbPedal extends PedalSkel {
  constructor(audioContext, container, pedalConfig){
      super(audioContext, container, pedalConfig)
      this.reverb = audioContext.createConvolver();
      this.inputNode = audioContext.createGain();
      this.outputNode = audioContext.createGain();

      // Loads reverb buffer
      this.loadReverbBuffer(audioContext);
 
      // Connect nodes
      this.inputNode.connect(this.reverb);
      this.reverb.connect(this.outputNode);

      this.pedalElement.querySelector('.checkbox').addEventListener('change', () => this.apply_Reverb());
  }

  async loadReverbBuffer(audioContext) {
    try {
      console.log('Loading buffer for:', this.pedalConfig.name);
      const response = await fetch(
        "/audio/Conic Long Echo Hall.wav",
      );
      // Decodes Reverb Sound
      const arrayBuff = await response.arrayBuffer();
      const decodedAudio = await audioContext.decodeAudioData(arrayBuff);
      this.reverb.buffer = decodedAudio;
    } catch (error) {
      console.error(`Unable to fetch the audio file: ${error.message}`);
    }
  };

  apply_Reverb() {
    const isActive = this.pedalElement.querySelector('.checkbox').checked;
    console.log(`Reverb effect is now ${isActive ? "ON" : "OFF"}`);

    if (isActive) {
      // Connect the input source to the reverb effect
      if (this.inputSource) {
        this.inputSource.disconnect(); // Disconnect from any previous connections
        this.inputSource.connect(this.inputNode);
        this.outputNode.connect(this.audioContext.destination);
      }
    } else {
      // Bypass the reverb effect
      if (this.inputSource) {
        this.inputSource.disconnect();
        this.inputSource.connect(this.audioContext.destination);
      }
    }
  };

  connect(source){
    if (!source) {
      console.error("No input source provided for Reverb pedal.");
      return;
    }
    console.log("Connecting Reverb Pedal to source.");
    this.inputSource = source;
    this.apply_Reverb(); // applies the effect based on the current state    
  };

  disconnect(){
    console.log("Disconnecting source from Reverb Pedal.");
    this.inputNode.disconnect(this.reverb);
    this.reverb.disconnect(this.audioContext.destination);
  }
  
  toggleReverb = () => {
    if (!this.pedalElement) {
      console.error("Pedal element is not defined.");
      return;
    }
    // checks if checkbox input in pedal element is checked, returns boolean value 
    const isActive = this.pedalElement.querySelector('.checkbox').checked;
    console.log(`Reverb effect is now ${isActive ? "ON" : "OFF"}`); 

    if (!this.input) {
      console.error("Input source is not defined.");
      return;
    }
    if (!this.reverb) {
      console.error("Reverb effect is not initialised.");
      return;
    }
    if (isActive){
      this.input.connect(this.reverb);
    } else{
      this.input.disconnect(this.reverb);
    }
  };
};
    
export class DelayPedal extends PedalSkel {
  constructor(audioContext, container, pedalConfig){
    super(audioContext, container, pedalConfig)
    this.delayNode = this.audioContext.createDelay();
    this.delayNode.delayTime.value = 0.4; // 0.5 seconds delay

    this.feedbackGain = this.audioContext.createGain();
    this.feedbackGain.gain.value = 0.4; // feedback amount

    this.wetGain = this.audioContext.createGain(); // for delayed sound
    this.wetGain.gain.value = 0.5; // default wet mix level (50%)

    this.dryGain = this.audioContext.createGain(); // for original sound
    this.dryGain.gain.value = 0.5; // default dry mix level (50%)
    
    // this creates the feedback loop
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);

    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.audioContext.destination);
    this.dryGain.connect(this.audioContext.destination);

    this.isActive = false;

    // add event listener for the toggle button
    this.pedalElement.querySelector('.checkbox').addEventListener('change', () => this.apply_Delay());

    // add knob listeners
    this.addKnobListeners();
    
  }
  
  addKnobListeners() {
    const mixKnob = this.pedalElement.querySelector('.mix-knob');
    const delayTimeKnob = this.pedalElement.querySelector('.effect-knob');

    if (mixKnob) {
      mixKnob.addEventListener('input', (event) => {
        const mixValue = event.target.value / 100; // Convert to a 0-1 range
        this.setMix(mixValue);
    })  
    }

    if (delayTimeKnob) {
      delayTimeKnob.addEventListener('input', (event) => {
        const delayTimeValue = event.target.value / 100 // Convert to a 0-1 range
        this.setDelayTime(delayTimeValue);
      })
    }
  };

  setMix(mixValue) {
    // Adjust wet/dry mix
    this.wetGain.gain.value = mixValue;
    this.dryGain.gain.value = 1 - mixValue;
  }

  setDelayTime(delayTimeValue) {
    // Adjust delay time (0 to 1 second)
    this.delayNode.delayTime.value = delayTimeValue;
  }

  apply_Delay() {
    const isActive = this.pedalElement.querySelector('.checkbox').checked;
    console.log(`Delay effect is now ${isActive ? "ON" : "OFF"}`);

    if (isActive) {
      // Connect the input source to the delay effect
      if (this.inputSource) {
        this.inputSource.disconnect(); // Disconnect from any previous connections
        this.inputSource.connect(this.dryGain);
        this.inputSource.connect(this.delayNode);
      }
    } else {
      // Bypass the delay effect
      if (this.inputSource) {
        this.inputSource.disconnect();
        this.inputSource.connect(this.audioContext.destination);
      }
    }
  };

  connect(source){
    if (!source) {
      console.error("No input source provided for Delay pedal.");
      return;
    }
    console.log("Connecting Delay Pedal to source.");
    this.inputSource = source;
    this.apply_Delay(); // applies reverb effect based on current state    
  };
  
  disconnect(){
    console.log("Disconnecting source from Delay Pedal.", this.input);
    if (this.input) {
      this.input.disconnect(this.dryGain);
      this.input.disconnect(this.delayNode);
    }
  }

  toggleDelay = () => {
    console.log("Toggle delay called");

    if (!this.pedalElement) {
      console.error("Delay pedal element is not defined.");
      return;
    }
    const isActive = this.pedalElement.querySelector('.checkbox').checked;
    console.log(`Delay effect is now ${isActive ? "ON" : "OFF"}`);

    if (isActive){
      connectActiveSourceToPedal(this); // applies delay effect to active audio source
    } else{
      this.disconnect(); // removes delay effect from input sound
    }
  }
};

export class LoopPedal extends PedalSkel {
  constructor(audioContext, container, pedalConfig){
    super(audioContext, container, pedalConfig)
  }
};