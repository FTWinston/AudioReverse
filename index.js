let mediaRecorder = null;
let audio = null;
let revAudio = null;
let recorder = null;

let audioContext = null;

function startRecording() {
  if (audioContext === null) {
    audioContext = new AudioContext();
  }

  recorder = new Promise(resolve => {
    let chunks = [];
  
    navigator.mediaDevices.getUserMedia({ audio: true }).then(
      function(stream) {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.addEventListener("dataavailable", event => {
          chunks.push(event.data);
        });
        mediaRecorder.addEventListener("stop", () => {
          resolve(chunks);
        })
        mediaRecorder.start();
      }
    );
  })
}

let audioBlob = null;
let samples = [];
let sr = 44100;

function stopRecording() {
  mediaRecorder.stop();
  recorder.then(chunks => {
    audioBlob = new Blob(chunks, {type:'audio/mp3'});
    const audioUrl = URL.createObjectURL(audioBlob);
    audio = new Audio(audioUrl);

    audioBlob.arrayBuffer().then(
      buffer => {
        audioContext.decodeAudioData(buffer, function(buff) {
          sr = buff.sampleRate;
          samples= buff.getChannelData(0);
        });
      }
    );
  });
}

let recording = false;

function startStopRecording() {
  recording = !recording;

  document.getElementById("startStop").classList.toggle('button--active', recording);
  document.getElementById("play").disabled = recording;
  document.getElementById("playRev").disabled = recording;

  if (recording) {
    startRecording();
  }
  else {
    stopRecording();
  }
}

let playing = false;

function playForwards() {
  if (playing) {
    return;
  }

  playing = true;
  document.getElementById("play").classList.add('button--active');
  document.getElementById("startStop").disabled = true;
  document.getElementById("playRev").disabled = true;

  audio.play();
  
  audio.onended = () => {
    playing = false;
    document.getElementById("play").classList.remove('button--active');
    document.getElementById("startStop").disabled = false;
    document.getElementById("playRev").disabled = false;
  };
}

function playBackwards() {
  if (playing) {
    return;
  }

  playing = true;
  document.getElementById("playRev").classList.add('button--active');
  document.getElementById("startStop").disabled = true;
  document.getElementById("play").disabled = true;

  const N = samples.length;
  let myArrayBuffer = audioContext.createBuffer(1, N, sr);
  let audio = myArrayBuffer.getChannelData(0);
  for (let i = 0; i < N; i++) {
    audio[i] = samples[N-i-1];
  }
  let source = audioContext.createBufferSource();
  source.buffer = myArrayBuffer;
  source.connect(audioContext.destination);

  source.onended = () => {
    playing = false;
    document.getElementById("playRev").classList.remove('button--active');
    document.getElementById("startStop").disabled = false;
    document.getElementById("play").disabled = false;
  };

  source.start();
}
