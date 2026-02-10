// sounds.js
const SOUND_URLS = {
    message: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3",
    ringtone: "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3",
    dialing: "https://assets.mixkit.co/active_storage/sfx/1355/1355-preview.mp3"
};

const audioPlayers = {};

// Preload sounds
Object.keys(SOUND_URLS).forEach(key => {
    audioPlayers[key] = new Audio(SOUND_URLS[key]);
});

// Attach to window so it's accessible everywhere
window.SoundManager = {
    playMessage: () => {
        audioPlayers.message.currentTime = 0;
        audioPlayers.message.play().catch(() => console.log("Audio waiting for click"));
    },
    startRingtone: () => {
        audioPlayers.ringtone.loop = true;
        audioPlayers.ringtone.play().catch(() => {});
    },
    stopRingtone: () => {
        audioPlayers.ringtone.pause();
        audioPlayers.ringtone.currentTime = 0;
    },
    startDialing: () => {
        audioPlayers.dialing.loop = true;
        audioPlayers.dialing.play().catch(() => {});
    },
    stopDialing: () => {
        audioPlayers.dialing.pause();
        audioPlayers.dialing.currentTime = 0;
    }
};