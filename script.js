const gameContainer = document.getElementById('game-container');
const sceneImage = document.getElementById('scene-image');
const dialogueText = document.getElementById('dialogue-text');
const choicesContainer = document.getElementById('choices-container');

const titleScreen = document.getElementById('title-screen');
const startBtn = document.getElementById('start-btn');
const dialogueBox = document.getElementById('dialogue-box');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

if (audioCtx.state === 'suspended') {
    document.addEventListener('click', () => {
        audioCtx.resume();
    }, { once: true });
}

function playBeep(frequency = 440, duration = 0.05, type = 'square') {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

function playClickSound() {
    playBeep(600, 0.1, 'sine');
}

function playTypeSound() {
    const freq = 300 + Math.random() * 100;
    playBeep(freq, 0.03, 'triangle');
}

if (titleScreen) {
    titleScreen.onclick = () => {
        const achievementsModal = document.getElementById('achievements-modal');
        const settingsModal = document.getElementById('settings-modal');

        if ((achievementsModal && !achievementsModal.classList.contains('hidden')) ||
            (settingsModal && !settingsModal.classList.contains('hidden'))) {
            return;
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (currentSceneId === 'start') {
            showScene('forest');
        }
    };

    document.addEventListener('keydown', (e) => {
        if ((e.key === ' ' || e.key === 'Enter') && currentSceneId === 'start') {
            const achievementsModal = document.getElementById('achievements-modal');
            const settingsModal = document.getElementById('settings-modal');

            if ((achievementsModal && !achievementsModal.classList.contains('hidden')) ||
                (settingsModal && !settingsModal.classList.contains('hidden'))) {
                return;
            }

            if (typeof controlPanelFocusIndex !== 'undefined' && controlPanelFocusIndex >= 0) {
                return;
            }

            e.preventDefault();
            titleScreen.onclick();
        }
    });

    startParticleGenerator();
}

let musicInterval;
let musicVolume = 0.08;
let currentMusicType = 'default';

const musicThemes = {
    default: [392.00, 329.63, 261.63, 196.00, 261.63, 329.63, 392.00, 523.25, 493.88, 392.00, 246.94, 196.00, 246.94, 392.00, 493.88, 587.33],
    danger: [329.63, 293.66, 261.63, 246.94, 261.63, 293.66, 329.63, 349.23, 329.63, 293.66, 277.18, 261.63, 246.94, 261.63, 293.66, 329.63],
    romantic: [523.25, 587.33, 659.25, 698.46, 783.99, 698.46, 659.25, 587.33, 523.25, 493.88, 440.00, 493.88],
    mysterious: [293.66, 329.63, 349.23, 293.66, 261.63, 293.66, 329.63, 261.63, 246.94, 220.00, 246.94, 293.66]
};

function playMusic(type = 'default') {
    if (musicInterval && currentMusicType === type) return;

    if (musicInterval) {
        stopMusic();
        setTimeout(() => startMusicTheme(type), 1000);
    } else {
        startMusicTheme(type);
    }
}

function startMusicTheme(type) {
    currentMusicType = type;
    musicVolume = (typeof masterVolume !== 'undefined' ? masterVolume : 0.8) * 0.08;

    const notes = musicThemes[type] || musicThemes.default;
    let noteIndex = 0;

    musicInterval = setInterval(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type === 'romantic' ? 'sine' : 'triangle';
        osc.frequency.value = notes[noteIndex];

        gain.gain.setValueAtTime(musicVolume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);

        noteIndex = (noteIndex + 1) % notes.length;
    }, type === 'danger' ? 300 : type === 'romantic' ? 500 : 400);
}

function stopMusic() {
    if (!musicInterval) return;

    const fadeSteps = 20;
    const fadeInterval = 50;
    let currentStep = 0;

    const fadeOut = setInterval(() => {
        currentStep++;
        musicVolume = 0.08 * (1 - currentStep / fadeSteps);

        if (currentStep >= fadeSteps) {
            clearInterval(fadeOut);
            clearInterval(musicInterval);
            musicInterval = null;
            musicVolume = 0.08;
        }
    }, fadeInterval);
}

let ambienceSource = null;
let ambienceGain = null;
let currentAmbienceType = null;
let randomSoundTimeout = null;

function playAmbience(type) {
    if (currentAmbienceType === type) return;
    stopAmbience();
    currentAmbienceType = type;

    if (!type || type === 'none') return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds buffer
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    ambienceSource = audioCtx.createBufferSource();
    ambienceSource.buffer = buffer;
    ambienceSource.loop = true;

    ambienceGain = audioCtx.createGain();

    // Default base volume
    ambienceGain.gain.setValueAtTime(0.05, audioCtx.currentTime);

    const filter = audioCtx.createBiquadFilter();

    if (type === 'forest') {
        // Softer wind (Pink noise approx)
        filter.type = 'lowpass';
        filter.frequency.value = 300; // Lower cutoff for softer sound
        filter.Q.value = 0.5;

        // Gentle modulation
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; // Very slow cycle
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.03;
        lfo.connect(lfoGain);
        lfoGain.connect(ambienceGain.gain);
        lfo.start();
    } else if (type === 'cave') {
        // Rumble + Reverb simulation
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 3;
        ambienceGain.gain.value = 0.15;
    } else if (type === 'water') {
        // River/Water flow (Refined: Smoother, less static)
        filter.type = 'lowpass';
        filter.frequency.value = 600; // Lower cutoff to reduce hiss
        filter.Q.value = 0.3; // Softer resonance

        const highpass = audioCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 100; // Remove mud

        filter.connect(highpass);
        highpass.connect(ambienceGain);
        ambienceSource.connect(filter);
        ambienceGain.connect(audioCtx.destination);
        ambienceSource.start();
        scheduleRandomSound(type);
        return;
    }

    ambienceSource.connect(filter);
    filter.connect(ambienceGain);
    ambienceGain.connect(audioCtx.destination);

    ambienceSource.start();
    scheduleRandomSound(type);
}

function stopAmbience() {
    if (ambienceSource) {
        try {
            ambienceSource.stop();
            ambienceSource.disconnect();
        } catch (e) { }
        ambienceSource = null;
    }
    if (ambienceGain) {
        ambienceGain.disconnect();
        ambienceGain = null;
    }
    if (randomSoundTimeout) {
        clearTimeout(randomSoundTimeout);
        randomSoundTimeout = null;
    }
    currentAmbienceType = null;
}

function scheduleRandomSound(type) {
    // Much more frequent: 2-7 seconds
    const delay = (Math.random() * 5000) + 2000;
    randomSoundTimeout = setTimeout(() => {
        playRandomSound(type);
        scheduleRandomSound(type);
    }, delay);
}

function startParticleGenerator() {
    const symbols = ['♥', '★', '✦', '♦', '●'];
    const colors = ['#FFC0CB', '#FFB6C1', '#FF69B4', '#FF1493', '#DB7093', '#FFE4E1'];

    const createParticle = () => {
        if (titleScreen && titleScreen.classList.contains('hidden')) return;

        const particle = document.createElement('div');
        particle.classList.add('particle');

        particle.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        particle.style.color = colors[Math.floor(Math.random() * colors.length)];

        const movementType = Math.floor(Math.random() * 3);

        let leftPos;
        if (Math.random() < 0.5) {
            leftPos = Math.random() * 25;
        } else {
            leftPos = 75 + Math.random() * 25;
        }
        particle.style.left = `${leftPos}%`;
        particle.style.top = `${20 + Math.random() * 80}%`;

        const size = 8 + Math.random() * 16;
        particle.style.fontSize = `${size}px`;

        const opacity = 0.3 + Math.random() * 0.7;
        particle.style.opacity = opacity;

        const duration = 4 + Math.random() * 4;
        particle.style.animationDuration = `${duration}s`;

        if (movementType === 0) {
            particle.style.animationName = 'float-up';
        } else if (movementType === 1) {
            particle.style.animationName = 'float-diagonal';
        } else {
            particle.style.animationName = 'float-spiral';
        }

        const rotation = Math.random() * 360;
        particle.style.transform = `rotate(${rotation}deg)`;

        titleScreen.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, duration * 1000);
    };

    let burstCount = 0;
    const burstInterval = setInterval(() => {
        createParticle();
        burstCount++;
        if (burstCount >= 150) {
            clearInterval(burstInterval);
            setInterval(createParticle, 100);
        }
    }, 20);
}

const modalOverlay = document.getElementById('modal-overlay');
const modalText = document.getElementById('modal-text');
const modalCloseBtn = document.getElementById('modal-close-btn');
const gameOverText = document.getElementById('game-over-text');

function showModal(message) {
    modalText.innerText = message;
    modalOverlay.classList.add('show');
}

if (modalCloseBtn) {
    modalCloseBtn.onclick = () => {
        playClickSound();
        modalOverlay.classList.remove('show');
    };
}

let currentSceneId = 'start';
let noButtonMoves = 0;

const scenes = {
    start: {
        text: "Welcome to a Valentine's Adventure! Are you ready to begin?",
        imageClass: "scene-start",
        choices: [
            { text: "Start Game", action: () => showScene('forest') }
        ]
    },
    forest: {
        text: "You find yourself in a pixelated forest. The air is sweet. You see a path leading to a glowing light, but also a dark thicket to your right.",
        imageClass: "scene-forest",
        choices: [
            { text: "Follow the path", action: () => showScene('gatePath') },
            { text: "Enter Dark Thicket", action: () => showScene('deepWoods') },
            { text: "Just wait here", action: () => showScene('wait') }
        ]
    },
    gatePath: {
        text: "The path flows gently. Suddenly, it splits.",
        imageClass: "scene-sign",
        choices: [
            { text: "Go Left", action: () => showScene('cliff') },
            { text: "Go Right", action: () => showScene('riddle') }
        ]
    },
    cliff: {
        text: "You stand at the edge of a high cliff. The view is amazing... but dangerous.",
        imageClass: "scene-cliff",
        choices: [
            { text: "Look down", action: () => showScene('cliffFall') },
            { text: "Search for cave", action: () => showScene('cave') },
            { text: "Go back", action: () => showScene('gatePath') }
        ]
    },
    cliffFall: {
        text: "You lean too far to see the bottom... your foot slips! AHHHHH!",
        imageClass: "scene-cliff-fall",
        choices: [
            { text: "Try Again", action: () => showScene('start') }
        ],
        isGameOver: true
    },
    deepWoods: {
        text: "The trees are thick here. It's getting dark. You hear a growl nearby.",
        imageClass: "scene-deep-woods",
        choices: [
            { text: "Run back!", action: () => showScene('forest') },
            { text: "Investigate Growl", action: () => showScene('bearEncounter') },
            { text: "Listen for water", action: () => showScene('river') }
        ]
    },
    bearEncounter: {
        text: "A WILD PIXEL BEAR APPEARS! It looks hungry... for love? Or maybe just hungry.",
        imageClass: "scene-bear",
        choices: [
            { text: "Hug the Bear", action: () => showScene('bearEnd') },
            { text: "Run Away!", action: () => showScene('forest') },
            { text: "Play Dead", action: () => showScene('bearSniff') }
        ]
    },
    bearEnd: {
        text: "BAD IDEA! The bear hugs you back... a little too hard.",
        imageClass: "scene-bear-end",
        choices: [
            { text: "Try Again", action: () => showScene('start') }
        ],
        isGameOver: true
    },
    lostInForest: {
        text: "You wander in circles. The pixel trees all look the same. You are lost forever... waiting for a sequel.",
        imageClass: "scene-lost",
        choices: [
            { text: "Try Again", action: () => showScene('start') }
        ],
        isGameOver: true
    },
    riddle: {
        text: "You reach a cozy gate. A sign reads: 'I have no voice, but I can tell you a story. I have no hands, but I can open a door. What am I?'",
        imageClass: "scene-riddle",
        choices: [
            { text: "A Book", action: () => showScene('lake') },
            { text: "A Key", action: () => showScene('gateLocked') },
            { text: "The Wind", action: () => showScene('gateLocked') }
        ]
    },
    lake: {
        text: "The gate opens! You find yourself in a hidden meadow. A crystal clear lake lies before you, reflecting the stars.",
        imageClass: "scene-proposal",
        choices: [
            { text: "Look up at the sky", action: () => showScene('sky') }
        ]
    },
    sky: {
        text: "You gaze up at the vast night sky. It's breathtaking.",
        imageClass: "scene-sky",
        choices: [
            { text: "Lower your gaze", action: () => showScene('proposal') }
        ]
    },
    proposal: {
        text: "You look back at the lake. A question hangs in the air: Will you be my Valentine?",
        imageClass: "scene-proposal",
        choices: [
            { text: "YES!", action: () => showScene('success') },
            { text: "No", action: () => { }, id: "no-btn" }
        ]
    },
    success: {
        text: "YAY! Happy Valentine's Day! <3",
        imageClass: "scene-success",
        choices: [
            { text: "Play Again", action: () => showScene('start') }
        ]
    },
    wait: {
        text: "You decide to just stand there. And wait. A squirrel approaches you with an acorn.",
        imageClass: "scene-squirrel",
        choices: [
            { text: "Take Acorn", action: () => showScene('squirrelFriend') },
            { text: "Ignore Squirrel", action: () => showScene('forest') }
        ]
    },
    squirrelFriend: {
        text: "The squirrel accepts you as one of its own. You are now the Squirrel King. Who needs a Valentine when you have nuts?",
        imageClass: "scene-acorn",
        choices: [
            { text: "Play Again", action: () => showScene('start') }
        ],
        isGameOver: true
    },
    river: {
        text: "You follow the sound of water and find a rushing river. It looks cold.",
        imageClass: "scene-river",
        choices: [
            { text: "Swim across", action: () => showScene('frozen') },
            { text: "Build a raft", action: () => showScene('raft') },
            { text: "Go back", action: () => showScene('deepWoods') }
        ]
    },
    frozen: {
        text: "The water is freezing! You turn into a pixelated ice cube. mistakes were made.",
        imageClass: "scene-frozen",
        choices: [
            { text: "Try Again", action: () => showScene('start') }
        ],
        isGameOver: true
    },
    raft: {
        text: "You try to build a raft from twigs. It sinks immediately. You get wet socks. The worst fate imaginable.",
        imageClass: "scene-raft",
        choices: [
            { text: "Go home to dry socks", action: () => showScene('start') }
        ],
        isGameOver: true
    },
    cave: {
        text: "You find a dark cave entrance near the cliff. It smells like... chocolate?",
        imageClass: "scene-cave",
        choices: [
            { text: "Enter Cave", action: () => showScene('caveTreasure') },
            { text: "Yell 'Hello?'", action: () => showScene('caveBat') },
            { text: "Leave", action: () => showScene('cliff') }
        ]
    },
    caveTreasure: {
        text: "You find a hidden stash of Valentine's chocolates! You eat them all. Happy Valentine's Day to you!",
        imageClass: "scene-cave-treasure",
        choices: [
            { text: "Play Again", action: () => showScene('start') }
        ],
        isGameOver: true
    },
    caveBat: {
        text: "A swarm of bats flies out! You run all the way back to the start in panic!",
        imageClass: "scene-cave-bats",
        choices: [
            { text: "Catch breath", action: () => showScene('start') }
        ],
        isGameOver: true
    },
    bearSniff: {
        text: "The bear sniffs your hair. It seems to like your shampoo.",
        imageClass: "scene-bear",
        choices: [
            { text: "Pet the bear", action: () => showScene('bearFriend') },
            { text: "Run now!", action: () => showScene('forest') }
        ]
    },
    bearFriend: {
        text: "The bear is lonely too! You become best friends and ride into the night. Best Valentine ever.",
        imageClass: "scene-bear-riding",
        choices: [
            { text: "Play Again", action: () => showScene('start') }
        ],
        isGameOver: true
    },
    gateLocked: {
        text: "The gate stays shut. A voice whispers: 'Try again, traveler.'",
        imageClass: "scene-riddle",
        choices: [
            { text: "Try Again", action: () => showScene('riddle') }
        ]
    },
    secretNo: {
        text: "Why are you trying so hard to say NO? Do you hate happiness? Or are you just testing the developer?",
        imageClass: "scene-proposal",
        choices: [
            { text: "I'm sorry, YES!", action: () => showScene('success') },
            { text: "I'll never surrender!", action: () => showScene('gameCrash') }
        ]
    },
    gameCrash: {
        text: "ERROR 404: LOVE NOT FOUND. SYSTEM OVERLOAD. BYE.",
        imageClass: "scene-start",
        choices: [
            { text: "Reboot System", action: () => location.reload() }
        ],
        isGameOver: true
    }
};

let typewriterTimeout;

function resetGame() {
    stopMusic();
    stopAmbience();
    currentSceneId = 'start';
    noButtonMoves = 0;

    if (titleScreen) titleScreen.classList.remove('hidden');
    if (dialogueBox) {
        dialogueBox.style.display = 'none';
        dialogueBox.classList.add('dialogue-hidden');
    }
    if (gameOverText) gameOverText.classList.add('hidden');
    if (sceneImage) {
        sceneImage.className = '';
        sceneImage.classList.remove('fade-out');
    }
    if (choicesContainer) {
        choicesContainer.innerHTML = '';
        choicesContainer.style.display = 'none';
    }

    startParticleGenerator();
}

function showScene(sceneId) {
    if (sceneId === 'start') {
        stopMusic();
        stopAmbience();
        if (titleScreen) titleScreen.classList.remove('hidden');
        if (dialogueBox) dialogueBox.style.display = 'none';
        if (gameOverText) gameOverText.classList.add('hidden');

        if (sceneImage) {
            sceneImage.className = '';
            sceneImage.classList.remove('fade-out');
        }

        currentSceneId = 'start';
        return;
    } else {
        if (titleScreen) titleScreen.classList.add('hidden');
        if (dialogueBox) dialogueBox.style.display = 'flex';
    }

    const scene = scenes[sceneId];
    if (!scene) return;

    currentSceneId = sceneId;

    if (sceneId !== 'proposal' && sceneId !== 'secretNo') {
        noButtonMoves = 0;
    }

    if (scene.isGameOver) {
        if (gameOverText) gameOverText.classList.remove('hidden');
        if (typeof unlockEnding === 'function') {
            unlockEnding(sceneId);
        }
    } else {
        if (gameOverText) gameOverText.classList.add('hidden');
    }

    if (sceneId !== 'start' && typeof saveGame === 'function') {
        saveGame(sceneId);
    }

    const existingRunaway = document.getElementById('no-btn');
    if (existingRunaway && existingRunaway.parentNode === gameContainer) {
        existingRunaway.remove();
    }

    const dangerScenes = ['bearEnd', 'cliffFall', 'cliff', 'caveBat'];
    const romanticScenes = ['proposal', 'success', 'lake'];
    const mysteriousScenes = ['cave', 'caveTreasure', 'deepWoods', 'river'];

    if (dangerScenes.includes(sceneId)) {
        playMusic('danger');
    } else if (romanticScenes.includes(sceneId)) {
        playMusic('romantic');
    } else if (mysteriousScenes.includes(sceneId)) {
        playMusic('mysterious');
    } else if (sceneId !== 'start') {
        playMusic('default');
    }

    // Ambience Logic
    if (['cave', 'caveTreasure', 'caveBat'].includes(sceneId)) {
        playAmbience('cave');
    } else if (['river', 'lake', 'raft', 'frozen'].includes(sceneId)) {
        playAmbience('water');
    } else if (['forest', 'deepWoods', 'bearSniff', 'bearFriend', 'gatePath', 'riddle', 'squirrelFriend', 'wait'].includes(sceneId)) {
        playAmbience('forest');
    } else {
        stopAmbience();
    }

    // Creature Sounds Logic
    if (['bearEncounter', 'bearSniff', 'bearEnd', 'bearFriend'].includes(sceneId)) {
        setTimeout(() => playCreatureSound('bear'), 500);
    } else if (['wait', 'squirrelFriend'].includes(sceneId)) {
        setTimeout(() => playCreatureSound('squirrel'), 500);
    }

    sceneImage.classList.add('fade-out');

    if (dialogueBox) dialogueBox.classList.add('dialogue-hidden');

    // Clear previous choices
    if (choicesContainer) {
        choicesContainer.innerHTML = '';
        choicesContainer.style.display = 'none';

        // Reset navigation state
        selectedChoiceIndex = 0;
        controlPanelFocusIndex = -1;
        keyboardEnabled = false;
        hasUsedArrowKeys = false;
        disableKeyboardNav();
    }

    setTimeout(() => {
        if (sceneImage) {
            sceneImage.className = scene.imageClass || '';
            sceneImage.classList.remove('fade-out');
        }

        if (dialogueBox) {
            dialogueBox.classList.remove('dialogue-hidden');

            // Typewriter effect
            dialogueText.innerHTML = '';

            // Add cursor element
            const cursor = document.createElement('span');
            cursor.className = 'cursor';
            cursor.innerHTML = '&#9608;'; // Block cursor

            let charIndex = 0;
            const fullText = scene.text;
            let isTyping = true;

            // Click to complete text
            const completeTextHandler = (e) => {
                // Ignore clicks on control panel
                if (e.target.closest('#controls-panel') || e.target.closest('.modal')) return;

                if (isTyping) {
                    isTyping = false;
                    clearTimeout(typewriterTimeout);
                    dialogueText.innerHTML = fullText;
                    cursor.remove(); // Remove cursor when done

                    showChoices(scene);
                    gameContainer.onclick = null;
                }
            };

            gameContainer.onclick = completeTextHandler;

            function typeWriterStep() {
                if (!isTyping) return;

                if (charIndex < fullText.length) {
                    dialogueText.innerHTML = fullText.substring(0, charIndex + 1);
                    dialogueText.appendChild(cursor);

                    playTypeSound();

                    charIndex++;
                    typewriterTimeout = setTimeout(typeWriterStep, 30);
                } else {
                    isTyping = false;
                    cursor.remove();
                    showChoices(scene);
                    gameContainer.onclick = null;
                }
            }

            setTimeout(typeWriterStep, 300);
        }
    }, 500);
}

function playCreatureSound(type) {
    if (!audioCtx || audioCtx.state === 'suspended') return;

    if (type === 'bear') {
        // Bear Growl: Sawtooth with AM
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const amOsc = audioCtx.createOscillator();
        const amGain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 1.5);

        // AM for "roughness"
        amOsc.type = 'sine';
        amOsc.frequency.value = 15;
        amGain.gain.value = 0.5;

        amOsc.connect(amGain);
        amGain.connect(gain.gain);

        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        amOsc.start();
        osc.stop(audioCtx.currentTime + 1.5);
        amOsc.stop(audioCtx.currentTime + 1.5);

    } else if (type === 'squirrel') {
        // Squirrel Chatter: FM Synthesis
        const carrier = audioCtx.createOscillator();
        const modulator = audioCtx.createOscillator();
        const modGain = audioCtx.createGain();
        const mainGain = audioCtx.createGain();

        carrier.type = 'triangle';
        carrier.frequency.value = 2500;

        modulator.type = 'square';
        modulator.frequency.value = 12;

        modGain.gain.value = 500;

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        carrier.connect(mainGain);
        mainGain.connect(audioCtx.destination);

        mainGain.gain.setValueAtTime(0, audioCtx.currentTime);
        mainGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
        mainGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);

        carrier.start();
        modulator.start();
        carrier.stop(audioCtx.currentTime + 0.5);
        modulator.stop(audioCtx.currentTime + 0.5);

        setTimeout(() => {
            // Repeat for chatter effect
            if (Math.random() > 0.3) playCreatureSound('squirrel');
        }, 150);
    }
}

function playRandomSound(type) {
    if (!audioCtx || audioCtx.state === 'suspended') return;

    if (type === 'forest') {
        const isOwl = Math.random() > 0.6;

        if (isOwl) {
            // Owl Hoot (Distant)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.2);

            filter.type = 'lowpass';
            filter.frequency.value = 800; // Distant muffling

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);

            setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                const filter2 = audioCtx.createBiquadFilter();

                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(600, audioCtx.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.2);

                filter2.type = 'lowpass';
                filter2.frequency.value = 800;

                gain2.gain.setValueAtTime(0, audioCtx.currentTime);
                gain2.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.1);
                gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

                osc2.connect(filter2);
                filter2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.5);
            }, 400);
        } else {
            // Bird Chirp (Distant)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(2000, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(2500, audioCtx.currentTime + 0.1);

            filter.type = 'lowpass';
            filter.frequency.value = 1500;

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        }

    } else if (type === 'cave') {
        // Bat Colony (Burst of chirps)
        const chirpCount = Math.floor(Math.random() * 3) + 2; // 2-4 bats

        for (let i = 0; i < chirpCount; i++) {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                const freq = 10000 + (Math.random() * 2000);
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(freq / 2, audioCtx.currentTime + 0.05);

                gain.gain.setValueAtTime(0, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.08);

                const filter = audioCtx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 3000;

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.1);
            }, i * (50 + Math.random() * 50));
        }

    } else if (type === 'water') {
        // Fish Splash 2.0 (Bloop + Splash)
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        oscGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);

        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
    }
}

function showChoices(scene) {
    choicesContainer.style.display = 'flex';
    scene.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerText = choice.text;
        btn.classList.add('choice-btn');
        if (choice.id) {
            btn.id = choice.id;
        }

        if (choice.id === 'no-btn') {
            btn.onmouseover = (e) => moveButton(e.target);
            btn.onclick = (e) => moveButton(e.target);
            btn.ontouchstart = (e) => { e.preventDefault(); moveButton(e.target); };
        } else {
            btn.onclick = () => {
                playClickSound();
                choice.action();
            };
        }

        choicesContainer.appendChild(btn);
    });

    if (typeof enableKeyboardNav === 'function') {
        enableKeyboardNav();
    }
}

function moveButton(btn) {
    playTypeSound();

    noButtonMoves++;
    if (noButtonMoves >= 4) {
        btn.innerText = 'Why are you trying so hard?';
    }

    if (btn.parentNode !== gameContainer) {
        gameContainer.appendChild(btn);
    }

    btn.style.position = 'absolute';
    btn.style.zIndex = "1000";

    const containerRect = gameContainer.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    const padding = 20;

    const maxX = containerRect.width - btnRect.width - padding;
    const maxY = containerRect.height - btnRect.height - padding;

    const newX = Math.random() * Math.max(0, maxX);
    const newY = Math.random() * Math.max(0, maxY);

    btn.style.left = `${Math.max(padding, newX)}px`;
    btn.style.top = `${Math.max(padding, newY)}px`;

}

showScene('start');
