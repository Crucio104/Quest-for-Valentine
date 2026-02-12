const gameContainer = document.getElementById('game-container');
const sceneImage = document.getElementById('scene-image');
const dialogueText = document.getElementById('dialogue-text');
const choicesContainer = document.getElementById('choices-container');

const titleScreen = document.getElementById('title-screen');
const startBtn = document.getElementById('start-btn');
const dialogueBox = document.getElementById('dialogue-box');

if (titleScreen) {
    titleScreen.onclick = () => {
        if (currentSceneId === 'start') {
            showScene('forest');
        }
    };
    startParticleGenerator();
}

function startParticleGenerator() {
    const symbols = ['♥', '★', '✦'];
    const colors = ['#FFC0CB', '#FFB6C1', '#FF69B4', '#FF1493', '#DB7093'];

    const createParticle = () => {
        if (titleScreen && titleScreen.classList.contains('hidden')) return;

        const particle = document.createElement('div');
        particle.classList.add('particle');

        particle.innerText = symbols[Math.floor(Math.random() * symbols.length)];

        particle.style.color = colors[Math.floor(Math.random() * colors.length)];

        let leftPos;
        if (Math.random() < 0.5) {
            leftPos = Math.random() * 25;
        } else {
            leftPos = 75 + Math.random() * 25;
        }
        particle.style.left = `${leftPos}%`;

        particle.style.top = `${20 + Math.random() * 80}%`;

        const size = 10 + Math.random() * 10;
        particle.style.fontSize = `${size}px`;

        const duration = 5 + Math.random() * 3;
        particle.style.animationDuration = `${duration}s`;

        titleScreen.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, duration * 1000);
    };

    let burstCount = 0;
    const burstInterval = setInterval(() => {
        createParticle();
        burstCount++;
        if (burstCount >= 60) {
            clearInterval(burstInterval);
            setInterval(createParticle, 100);
        }
    }, 50);
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
        modalOverlay.classList.remove('show');
    };
}

let currentSceneId = 'start';

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
        text: "The bear is lonely too! You become best friends and ride into the sunset. Best Valentine ever.",
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
    }
};

let typewriterTimeout;

function showScene(sceneId) {
    if (sceneId === 'start') {
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
    if (scene.isGameOver) {
        if (gameOverText) gameOverText.classList.remove('hidden');
    } else {
        if (gameOverText) gameOverText.classList.add('hidden');
    }

    const existingRunaway = document.getElementById('no-btn');
    if (existingRunaway && existingRunaway.parentNode === gameContainer) {
        existingRunaway.remove();
    }

    sceneImage.classList.add('fade-out');

    if (dialogueBox) dialogueBox.classList.add('dialogue-hidden');

    setTimeout(() => {
        if (typewriterTimeout) clearTimeout(typewriterTimeout);

        sceneImage.className = '';
        sceneImage.classList.add(scene.imageClass);

        dialogueText.innerHTML = '';

        choicesContainer.innerHTML = '';
        choicesContainer.style.display = 'none';

        setTimeout(() => {
            sceneImage.classList.remove('fade-out');
            if (dialogueBox) dialogueBox.classList.remove('dialogue-hidden');
        }, 50);


        let fullText = scene.text;
        let isTyping = true;
        let charIndex = 0;

        const completeTextHandler = () => {
            if (isTyping) {
                isTyping = false;
                if (typewriterTimeout) clearTimeout(typewriterTimeout);
                dialogueText.innerHTML = fullText;
                showChoices(scene);
                gameContainer.onclick = null;
            }
        };

        gameContainer.onclick = completeTextHandler;

        function typeWriterStep() {
            if (!isTyping) return;

            if (charIndex < fullText.length) {
                dialogueText.innerHTML += fullText.charAt(charIndex);
                charIndex++;
                typewriterTimeout = setTimeout(typeWriterStep, 30);
            } else {
                isTyping = false;
                showChoices(scene);
                gameContainer.onclick = null;
            }
        }

        setTimeout(typeWriterStep, 300);

    }, 500);
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
            setTimeout(() => {
                btn.onmouseover = (e) => moveButton(e.target);
                btn.onclick = (e) => moveButton(e.target);
                btn.ontouchstart = (e) => { e.preventDefault(); moveButton(e.target); };
            }, 500);
        } else {
            btn.onclick = choice.action;
        }

        choicesContainer.appendChild(btn);
    });
}

function moveButton(btn) {
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
