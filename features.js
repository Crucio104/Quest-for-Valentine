const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-text');

const fullscreenBtn = document.getElementById('fullscreen-btn');
const muteBtn = document.getElementById('mute-btn');
const achievementsBtn = document.getElementById('achievements-btn');
const achievementsModal = document.getElementById('achievements-modal');
const achievementsClose = document.getElementById('achievements-close');
const achievementsList = document.getElementById('achievements-list');
const completionPercent = document.getElementById('completion-percent');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const settingsVolumeSlider = document.getElementById('settings-volume-slider');
const volumeValue = document.getElementById('volume-value');
const volumeResetBtn = document.getElementById('volume-reset-btn');

const clearProgressBtn = document.getElementById('clear-progress-btn');
const returnMenuBtn = document.getElementById('return-menu-btn');

const customDialog = document.getElementById('custom-dialog');
const dialogMessage = document.getElementById('dialog-message');
const dialogConfirm = document.getElementById('dialog-confirm');
const dialogCancel = document.getElementById('dialog-cancel');

let isMuted = false;
let masterVolume = 0.8;
let selectedChoiceIndex = 0;
let keyboardEnabled = false;
let hasUsedArrowKeys = false;

let controlPanelFocusIndex = -1;
let settingsFocusIndex = 0;
const controlButtons = [];
const settingsButtons = [];

const allEndings = [
    { id: 'success', name: 'True Love', desc: 'Found your Valentine!' },
    { id: 'cliffFall', name: 'Cliff Diver', desc: 'Took a leap of faith' },
    { id: 'bearEnd', name: 'Bear Hug', desc: 'Hugged the wrong friend' },
    { id: 'lostInForest', name: 'Lost Soul', desc: 'Wandered forever' },
    { id: 'squirrelFriend', name: 'Squirrel King', desc: 'Ruled the forest' },
    { id: 'frozen', name: 'Ice Cube', desc: 'Took a cold swim' },
    { id: 'raft', name: 'Wet Socks', desc: 'Built a terrible raft' },
    { id: 'caveTreasure', name: 'Chocolate Hunter', desc: 'Found the treasure' },
    { id: 'caveBat', name: 'Bat Encounter', desc: 'Disturbed the bats' },
    { id: 'bearFriend', name: 'Bear Rider', desc: 'Made an unlikely friend' },
    { id: 'completionist', name: 'Valentine Master', desc: 'Unlocked all endings!' }
];

(function () {
    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const customDialog = document.getElementById('custom-dialog');
            const settingsModal = document.getElementById('settings-modal');
            const achievementsModal = document.getElementById('achievements-modal');

            // Check if any modal is open
            const isCustomDialogOpen = customDialog && !customDialog.classList.contains('hidden');
            const isSettingsOpen = settingsModal && !settingsModal.classList.contains('hidden');
            const isAchievementsOpen = achievementsModal && !achievementsModal.classList.contains('hidden');

            if (isCustomDialogOpen) {
                const dialogCancel = document.getElementById('dialog-cancel');
                const dialogConfirm = document.getElementById('dialog-confirm');
                if (dialogCancel && dialogCancel.style.display !== 'none') {
                    dialogCancel.click();
                } else if (dialogConfirm) {
                    dialogConfirm.click();
                }
                return false;
            }

            if (isSettingsOpen) {
                settingsModal.classList.add('hidden');
                return false;
            }

            if (isAchievementsOpen) {
                achievementsModal.classList.add('hidden');
                return false;
            }

            // If no modals are open, exit fullscreen
            if (document.fullscreenElement || document.webkitFullscreenElement ||
                document.mozFullScreenElement || document.msFullscreenElement) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        }
    }, true);
})();

function getSaveData() {
    const saved = localStorage.getItem('valentineGameSave');
    return saved ? JSON.parse(saved) : { currentScene: 'start', unlockedEndings: [], choices: {} };
}

function saveGame(sceneId) {
    const data = getSaveData();
    data.currentScene = sceneId;
    localStorage.setItem('valentineGameSave', JSON.stringify(data));
}

function unlockEnding(endingId) {
    const data = getSaveData();
    if (!data.unlockedEndings.includes(endingId)) {
        data.unlockedEndings.push(endingId);
        localStorage.setItem('valentineGameSave', JSON.stringify(data));
        playAchievementSound();
        showAchievementNotification(endingId);

        // Check for completionist achievement
        if (endingId !== 'completionist') {
            const normalEndings = allEndings.filter(e => e.id !== 'completionist');
            const unlockedNormal = data.unlockedEndings.filter(id => id !== 'completionist');

            if (unlockedNormal.length >= normalEndings.length) {
                setTimeout(() => {
                    unlockEnding('completionist');
                }, 2000);
            }
        }
    }
}

function playAchievementSound() {
    if (typeof audioCtx === 'undefined') return;

    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, index) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }, index * 100);
    });
}

function showAchievementNotification(endingId) {
    const ending = allEndings.find(e => e.id === endingId);
    if (!ending) return;

    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-notif-icon">🏆</div>
        <div class="achievement-notif-content">
            <div class="achievement-notif-title">Achievement Unlocked!</div>
            <div class="achievement-notif-name">${ending.name}</div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 4000);
}

function showDialog(message, showCancel = false) {
    return new Promise((resolve) => {
        dialogMessage.textContent = message;
        customDialog.classList.remove('hidden');

        if (showCancel) {
            dialogCancel.style.display = 'block';
        } else {
            dialogCancel.style.display = 'none';
        }

        const handleConfirm = () => {
            playClickSound();
            customDialog.classList.add('hidden');
            dialogConfirm.removeEventListener('click', handleConfirm);
            dialogCancel.removeEventListener('click', handleCancel);
            resolve(true);
        };

        const handleCancel = () => {
            playClickSound();
            customDialog.classList.add('hidden');
            dialogConfirm.removeEventListener('click', handleConfirm);
            dialogCancel.removeEventListener('click', handleCancel);
            resolve(false);
        };

        dialogConfirm.onclick = handleConfirm;
        dialogCancel.onclick = handleCancel;
    });
}

function updateAchievements() {
    const data = getSaveData();
    achievementsList.innerHTML = '';

    allEndings.forEach(ending => {
        const item = document.createElement('div');
        item.className = 'achievement-item';

        const isUnlocked = data.unlockedEndings.includes(ending.id);

        if (isUnlocked) {
            item.classList.add('unlocked');
        } else {
            item.classList.add('locked');
        }

        item.innerHTML = `
            <div class="achievement-title">${ending.name}</div>
            <div class="achievement-desc">${isUnlocked ? ending.desc : '???'}</div>
        `;

        achievementsList.appendChild(item);
    });

    const percent = Math.round((data.unlockedEndings.length / allEndings.length) * 100);
    completionPercent.textContent = `${percent}% Complete`;
}

if (fullscreenBtn) {
    fullscreenBtn.onclick = () => {
        playClickSound();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            fullscreenBtn.textContent = '⛶';
        } else {
            document.exitFullscreen();
            fullscreenBtn.textContent = '⛶';
        }
    };
}

if (muteBtn) {
    muteBtn.onclick = () => {
        playClickSound();
        isMuted = !isMuted;
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        if (isMuted) {
            musicVolume = 0;
        } else {
            musicVolume = masterVolume * 0.08;
        }
    };
}

if (settingsBtn) {
    settingsBtn.onclick = () => {
        playClickSound();
        settingsModal.classList.remove('hidden');
        if (settingsVolumeSlider) {
            settingsVolumeSlider.value = masterVolume * 100;
            volumeValue.textContent = Math.round(masterVolume * 100) + '%';
        }
    };
}

if (settingsVolumeSlider) {
    settingsVolumeSlider.oninput = () => {
        masterVolume = settingsVolumeSlider.value / 100;
        volumeValue.textContent = Math.round(masterVolume * 100) + '%';
        if (!isMuted) {
            musicVolume = masterVolume * 0.08;
        }
    };
}

if (volumeResetBtn) {
    volumeResetBtn.onclick = () => {
        playClickSound();
        masterVolume = 0.8;
        settingsVolumeSlider.value = 80;
        volumeValue.textContent = '80%';
        if (!isMuted) {
            musicVolume = 0.08;
        }
    };
}



if (clearProgressBtn) {
    clearProgressBtn.onclick = async () => {
        playClickSound();
        const confirmed = await showDialog('Delete all progress? You will return to the main menu.', true);
        if (confirmed) {
            localStorage.clear();
            await showDialog('Progress deleted! Returning to menu...');
            location.reload();
        }
    };
}

if (returnMenuBtn) {
    returnMenuBtn.onclick = async () => {
        playClickSound();
        const confirmed = await showDialog('Return to main menu? Unsaved progress will be lost.', true);
        if (confirmed) {
            if (typeof resetGame === 'function') {
                resetGame();
                settingsModal.classList.add('hidden');
            } else {
                location.reload();
            }
        }
    };
}

if (settingsClose) {
    settingsClose.onclick = () => {
        playClickSound();
        settingsModal.classList.add('hidden');
    };
}

if (achievementsBtn) {
    achievementsBtn.onclick = () => {
        playClickSound();
        updateAchievements();
        achievementsModal.classList.remove('hidden');
    };
}

if (achievementsClose) {
    achievementsClose.onclick = () => {
        playClickSound();
        achievementsModal.classList.add('hidden');
    };
}

document.addEventListener('keydown', (e) => {


    if (!settingsModal.classList.contains('hidden')) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            settingsFocusIndex = (settingsFocusIndex - 1 + settingsButtons.length) % settingsButtons.length;
            updateSettingsFocus();
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            settingsFocusIndex = (settingsFocusIndex + 1) % settingsButtons.length;
            updateSettingsFocus();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (settingsButtons[settingsFocusIndex]) {
                settingsButtons[settingsFocusIndex].click();
            }
        }
        return;
    }

    if (achievementsModal.classList.contains('hidden') &&
        settingsModal.classList.contains('hidden') &&
        customDialog.classList.contains('hidden') &&
        (currentSceneId === 'start' || controlPanelFocusIndex !== -1)) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (controlPanelFocusIndex === -1) {
                controlPanelFocusIndex = controlButtons.length - 1;
            } else {
                controlPanelFocusIndex = (controlPanelFocusIndex - 1 + controlButtons.length) % controlButtons.length;
            }
            updateControlPanelFocus();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (controlPanelFocusIndex !== -1) {
                const choices = document.querySelectorAll('.choice-btn:not(#no-btn)');
                if (choices.length > 0) {
                    controlPanelFocusIndex = -1;
                    updateControlPanelFocus();
                    selectedChoiceIndex = choices.length - 1;
                    keyboardEnabled = true;
                    hasUsedArrowKeys = true;
                    updateSelectedChoice(choices);
                } else {
                    controlPanelFocusIndex = -1;
                    updateControlPanelFocus();
                }
            }
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            if (controlPanelFocusIndex === -1) {
                controlPanelFocusIndex = 0;
            } else {
                controlPanelFocusIndex = (controlPanelFocusIndex + 1) % controlButtons.length;
            }
            updateControlPanelFocus();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (controlPanelFocusIndex >= 0 && controlButtons[controlPanelFocusIndex]) {
                controlButtons[controlPanelFocusIndex].click();
            }
        }
    }
}, { capture: true });

const imagesToPreload = [
    'assets/Start.gif',
    'assets/Forest_night.png',
    'assets/Forest_bear.png',
    'assets/Forest_gate.png',
    'assets/Forest_sign.png',
    'assets/Cliff.png',
    'assets/Forest_lake.png',
    'assets/Final.png',
    'assets/River.png',
    'assets/Cave.png'
];

let loadedImages = 0;

function preloadImages() {
    return new Promise((resolve) => {
        if (imagesToPreload.length === 0) {
            resolve();
            return;
        }

        imagesToPreload.forEach(src => {
            const img = new Image();
            img.onload = img.onerror = () => {
                loadedImages++;
                const progress = (loadedImages / imagesToPreload.length) * 100;
                loadingBar.style.width = `${progress}%`;
                loadingText.textContent = `Loading... ${Math.round(progress)}%`;

                if (loadedImages === imagesToPreload.length) {
                    setTimeout(() => {
                        loadingScreen.classList.add('hidden');
                        resolve();
                    }, 500);
                }
            };
            img.src = src;
        });
    });
}

document.addEventListener('keydown', (e) => {
    const choices = document.querySelectorAll('.choice-btn:not(#no-btn)');

    if (e.key === 'Enter' || e.key === ' ') {
        if (keyboardEnabled && choices.length > 0) {
            e.preventDefault();
            choices[selectedChoiceIndex].click();
        } else if (typeof gameContainer !== 'undefined' && gameContainer.onclick) {
            e.preventDefault();
            gameContainer.onclick();
        }
        return;
    }

    if (!keyboardEnabled) return;
    if (choices.length === 0) return;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        hasUsedArrowKeys = true;
        if (selectedChoiceIndex === 0) {
            disableKeyboardNav();
            controlPanelFocusIndex = controlButtons.length - 1;
            updateControlPanelFocus();
        } else {
            selectedChoiceIndex = (selectedChoiceIndex - 1 + choices.length) % choices.length;
            updateSelectedChoice(choices);
        }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        hasUsedArrowKeys = true;
        if (selectedChoiceIndex === choices.length - 1) {
            disableKeyboardNav();
            controlPanelFocusIndex = 0;
            updateControlPanelFocus();
        } else {
            selectedChoiceIndex = (selectedChoiceIndex + 1) % choices.length;
            updateSelectedChoice(choices);
        }
    }
});

function updateSelectedChoice(choices) {
    if (!hasUsedArrowKeys) return;

    choices.forEach((choice, index) => {
        if (index === selectedChoiceIndex) {
            choice.style.outline = '3px solid #FF69B4';
            choice.style.outlineOffset = '4px';
        } else {
            choice.style.outline = 'none';
        }
    });
}

function enableKeyboardNav() {
    keyboardEnabled = true;
    hasUsedArrowKeys = false;
    selectedChoiceIndex = 0;
}

function disableKeyboardNav() {
    keyboardEnabled = false;
    hasUsedArrowKeys = false;
    const choices = document.querySelectorAll('.choice-btn');
    choices.forEach(choice => {
        choice.style.outline = 'none';
    });
}

function updateControlPanelFocus() {
    controlButtons.forEach((btn, index) => {
        if (index === controlPanelFocusIndex && controlPanelFocusIndex >= 0) {
            btn.style.outline = '3px solid #FF69B4';
            btn.style.outlineOffset = '4px';
        } else {
            btn.style.outline = 'none';
        }
    });
}

function updateSettingsFocus() {
    settingsButtons.forEach((btn, index) => {
        if (index === settingsFocusIndex) {
            btn.style.outline = '3px solid #FF69B4';
            btn.style.outlineOffset = '4px';
        } else {
            btn.style.outline = 'none';
        }
    });
}

window.addEventListener('load', () => {
    preloadImages();

    if (fullscreenBtn) controlButtons.push(fullscreenBtn);
    if (muteBtn) controlButtons.push(muteBtn);
    if (achievementsBtn) controlButtons.push(achievementsBtn);
    if (settingsBtn) controlButtons.push(settingsBtn);


    if (clearProgressBtn) settingsButtons.push(clearProgressBtn);
    if (returnMenuBtn) settingsButtons.push(returnMenuBtn);
    if (settingsClose) settingsButtons.push(settingsClose);
});
