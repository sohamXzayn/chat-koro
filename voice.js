// voice.js

let currentAudio = null;
let currentBtn = null;

window.toggleVoice = (btn, audioSrc) => {
    // If clicking a different voice note, stop the previous one
    if (currentAudio && currentBtn !== btn) {
        stopCurrentVoice();
    }

    let audio = btn.querySelector('audio');
    
    if (!audio) {
        audio = new Audio(audioSrc);
        btn.appendChild(audio);
        
        audio.onended = () => {
            btn.parentElement.classList.remove('playing');
            btn.querySelector('span').innerText = 'play_arrow';
            currentAudio = null;
            currentBtn = null;
        };
    }

    if (audio.paused) {
        audio.play();
        btn.parentElement.classList.add('playing');
        btn.querySelector('span').innerText = 'pause';
        currentAudio = audio;
        currentBtn = btn;
    } else {
        audio.pause();
        btn.parentElement.classList.remove('playing');
        btn.querySelector('span').innerText = 'play_arrow';
    }
};

function stopCurrentVoice() {
    if (currentAudio) {
        currentAudio.pause();
        currentBtn.parentElement.classList.remove('playing');
        currentBtn.querySelector('span').innerText = 'play_arrow';
    }
}