/* =========================================================
   MATH MAGIC FOR KIDS — app.js  (ES Module, Firebase v10)
   =========================================================
   ⚙️  SETUP: Replace the firebaseConfig below with YOUR
      project's config from Firebase Console.
      See: https://console.firebase.google.com
   ========================================================= */

import { initializeApp }           from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
         createUserWithEmailAndPassword, signInWithEmailAndPassword,
         updateProfile, signOut }  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ── 🔧 YOUR FIREBASE CONFIG — paste your values here ──────
const firebaseConfig = {
  apiKey:            "PASTE_YOUR_API_KEY",
  authDomain:        "PASTE_YOUR_AUTH_DOMAIN",
  projectId:         "PASTE_YOUR_PROJECT_ID",
  storageBucket:     "PASTE_YOUR_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
  appId:             "PASTE_YOUR_APP_ID",
};
// ──────────────────────────────────────────────────────────

// Detect if Firebase has been configured
const FIREBASE_CONFIGURED = !firebaseConfig.apiKey.includes('PASTE_');

let app, auth, googleProvider;

if (FIREBASE_CONFIGURED) {
  app            = initializeApp(firebaseConfig);
  auth           = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

/* =========================================================
   STATE
   ========================================================= */
const state = {
  op:         'add',
  difficulty: 'easy',
  questions:  [],
  current:    0,
  score:      0,
  answered:   false,
  user:       null,
  
  // Listen & Type state
  activity:     'math', // 'math' or 'listen'
  storyType:    'history',
  storyLevel:   'beginner',
  storyLength:  'short',
  repeatInterval: 2000,
  voices:       [],
  selectedVoice: null,
  synthPreset:  'standard',
  synthVolume:  80,
  synthPitch:   100,
  storyText:    '',
  storyChars:   [],
  typedIndex:   0,
  dictationMistakes: 0,
  dictationCompleted: false,
  
  // Sentence-by-sentence tracking
  activeSentenceIndex: 0,
  dictationSentences: [],
  currentSentenceText: '',
};

/* =========================================================
   DIFFICULTY CONFIG
   ========================================================= */
const DIFF = {
  easy:   { max: 10, mulMax: 5,  divMax: 5  },
  medium: { max: 20, mulMax: 10, divMax: 10 },
  hard:   { max: 50, mulMax: 12, divMax: 12 },
};

const TOTAL_QUESTIONS = 10;

/* =========================================================
   FEEDBACK MESSAGES
   ========================================================= */
const CORRECT_MSGS = ['🎉 Correct!', '⭐ Amazing!', '🏆 You got it!', '🌟 Brilliant!', '🎊 Awesome!', '🦄 Super!', '🔥 On fire!'];
const WRONG_MSGS   = ['😅 Try again!', '❌ Almost!', '🤔 Not quite!', '💪 Keep going!'];

/* =========================================================
   DOM REFS
   ========================================================= */
const screens = {
  login:  document.getElementById('screen-login'),
  home:   document.getElementById('screen-home'),
  quiz:   document.getElementById('screen-quiz'),
  result: document.getElementById('screen-result'),
  listen: document.getElementById('screen-listen-type'),
};

const els = {
  // Login
  tabSignin:       document.getElementById('tab-signin'),
  tabSignup:       document.getElementById('tab-signup'),
  panelSignin:     document.getElementById('panel-signin'),
  panelSignup:     document.getElementById('panel-signup'),
  authBanner:      document.getElementById('auth-banner'),
  formSignin:      document.getElementById('form-signin'),
  formSignup:      document.getElementById('form-signup'),
  signinEmail:     document.getElementById('signin-email'),
  signinPassword:  document.getElementById('signin-password'),
  signupName:      document.getElementById('signup-name'),
  signupEmail:     document.getElementById('signup-email'),
  signupPassword:  document.getElementById('signup-password'),
  btnSignin:       document.getElementById('btn-signin'),
  btnSignup:       document.getElementById('btn-signup'),
  btnGoogleSignin: document.getElementById('btn-google-signin'),
  btnGoogleSignup: document.getElementById('btn-google-signup'),
  toggleSigninPw:  document.getElementById('toggle-signin-pw'),
  toggleSignupPw:  document.getElementById('toggle-signup-pw'),
  configWarning:   document.getElementById('config-warning'),
  configHelpLink:  document.getElementById('config-help-link'),
  btnGuest:        document.getElementById('btn-guest'),

  // Home
  userAvatar:      document.getElementById('user-avatar'),
  userName:        document.getElementById('user-name'),
  btnLogout:       document.getElementById('btn-logout'),
  modeCards:       document.querySelectorAll('.mode-card'),
  diffBtns:        document.querySelectorAll('.diff-btn'),
  startBtn:        document.getElementById('btn-start'),

  // Activity Switcher
  tabActMath:      document.getElementById('tab-act-math'),
  tabActListen:    document.getElementById('tab-act-listen'),
  paneMath:        document.getElementById('pane-math'),
  paneListen:      document.getElementById('pane-listen-type'),

  // Listen and Type Setup
  storyCards:      document.querySelectorAll('.story-card'),
  levelBtns:       document.querySelectorAll('#listen-level-buttons .level-btn'),
  lengthBtns:      document.querySelectorAll('#listen-length-buttons .level-btn'),
  repeatBtns:      document.querySelectorAll('#listen-repeat-buttons .level-btn'),
  voiceSelect:     document.getElementById('voice-select'),
  voiceTestBtn:    document.getElementById('btn-voice-test'),
  presetBtns:      document.querySelectorAll('.preset-btn'),
  sliderSynthVol:  document.getElementById('slider-synth-vol'),
  sliderSynthPitch:document.getElementById('slider-synth-pitch'),
  valSynthVol:     document.getElementById('val-synth-vol'),
  valSynthPitch:   document.getElementById('val-synth-pitch'),
  synthTestInput:  document.getElementById('synth-test-input'),
  startListenBtn:  document.getElementById('btn-start-listen'),

  // Quiz
  backHomeBtn:     document.getElementById('btn-back-home'),
  progressFill:    document.getElementById('progress-fill'),
  progressLbl:     document.getElementById('progress-label'),
  scoreVal:        document.getElementById('score-val'),
  opBadge:         document.getElementById('op-badge'),
  questionText:    document.getElementById('question-text'),
  questionHint:    document.getElementById('question-hint'),
  questionCard:    document.getElementById('question-card'),
  answerGrid:      document.getElementById('answer-grid'),
  feedbackArea:    document.getElementById('feedback-area'),

  // Listen and Type Quiz Screen
  backHomeListen:  document.getElementById('btn-back-home-listen'),
  listenProgressFill: document.getElementById('listen-progress-fill'),
  listenProgressLbl:  document.getElementById('listen-progress-label'),
  listenMistakesVal:  document.getElementById('listen-mistakes-val'),
  btnPlayStory:    document.getElementById('btn-play-story'),
  btnPlaySentence: document.getElementById('btn-play-sentence'),
  btnPlayWord:     document.getElementById('btn-play-word'),
  voiceWave:       document.getElementById('voice-wave'),
  mascotSpeech:    document.getElementById('mascot-speech'),
  mascotCard:      document.getElementById('mascot-card'),
  typingDisplay:   document.getElementById('typing-display'),
  hiddenTyper:     document.getElementById('hidden-typer'),
  btnRefocusTyper: document.getElementById('btn-refocus-typer'),

  // Result
  resultTrophy:    document.getElementById('result-trophy'),
  resultTitle:     document.getElementById('result-title'),
  resultSub:       document.getElementById('result-subtitle'),
  resultScoreNum:  document.getElementById('result-score-num'),
  resultScoreDen:  document.getElementById('result-score-den'),
  starsRow:        document.getElementById('stars-row'),
  playAgainBtn:    document.getElementById('btn-play-again'),
  goHomeBtn:       document.getElementById('btn-go-home'),
  confettiCanvas:  document.getElementById('confetti-canvas'),
};


/* =========================================================
   LISTEN & TYPE — DATABASE & SETTINGS
   ========================================================= */

const STORIES = {
  history: {
    beginner: [
      [
        "A bad fox saw sweet grapes.",
        "The grapes hung high up.",
        "He ran and jumped high.",
        "But he could not reach.",
        "He said the grapes are sour."
      ],
      [
        "A huge lion fell fast asleep.",
        "A tiny mouse ran on him.",
        "The lion woke up in anger.",
        "The mouse said do not eat me.",
        "The kind lion let him go free."
      ],
      [
        "A slow ant wanted some water.",
        "She fell into the deep river.",
        "A kind dove saw her fall.",
        "He threw a leaf to save her.",
        "The ant crawled safe to land."
      ],
      [
        "A young prince had a black horse.",
        "He loved to ride in the sun.",
        "They crossed a slow green creek.",
        "They found a secret old cave.",
        "Inside was a tiny gold bell."
      ],
      [
        "Long ago people built stone homes.",
        "They had simple tools of wood.",
        "They made fire with two stones.",
        "They drew animals on cave walls.",
        "Life was quiet in those days."
      ],
      [
        "Ancient people made the first wheel.",
        "They used logs of heavy wood.",
        "It made pulling carts very easy.",
        "They could travel to new lands.",
        "This changed our world forever."
      ]
    ],
    intermediate: [
      [
        "A thirsty crow flew all day looking for water.",
        "At last she saw a deep glass pitcher in a garden.",
        "The water was too low for her beak to reach.",
        "She cleverly dropped small pebbles into the pitcher.",
        "The water rose to the top and she drank happily."
      ],
      [
        "The Great Wall of China is a massive stone structure.",
        "It was built long ago to protect the grand empire.",
        "Thousands of workers carried heavy bricks up high hills.",
        "It stretches for miles across green mountains and plains.",
        "Today people visit from all over to see its beauty."
      ],
      [
        "Legend says King Arthur was a very brave young boy.",
        "A magical golden sword was stuck in a large stone.",
        "Only the true future king could pull the sword out.",
        "Many strong knights tried but could not move it at all.",
        "Arthur pulled it out easily and became a great ruler."
      ],
      [
        "Ancient Roman soldiers built thousands of wide stone roads.",
        "These sturdy roads connected all the cities of the empire.",
        "Merchants drove wooden carts loaded with olive oil and wheat.",
        "The empire became very rich because trade was so simple.",
        "Some of these stone roads are still standing strong today."
      ],
      [
        "Bold explorers sailed across stormy seas on wooden ships.",
        "They used the stars at night to guide their direction.",
        "Brave sailors climbed the tall masts to watch for land.",
        "They wrote down everything they saw in dry paper journals.",
        "They discovered beautiful new islands with thick green trees."
      ],
      [
        "The Greeks built a giant wooden horse as a secret gift.",
        "They left it outside the high walls of Troy at night.",
        "The soldiers of Troy pulled the large horse inside the gate.",
        "Brave Greek fighters were hiding quietly inside the hollow wood.",
        "They came out at midnight and won the famous war easily."
      ]
    ],
    advanced: [
      [
        "The legendary Library of Alexandria was the ancient world's center of learning.",
        "Scholars traveled thousands of miles to study its collection of scroll manuscripts.",
        "It held unique wisdom regarding math, astronomy, and classical philosophy.",
        "Tragically, a series of fires destroyed the majestic marble structure entirely.",
        "Though lost to history, its brilliant intellectual legacy inspires us today."
      ],
      [
        "Brave merchants organized massive camel caravans to travel the famous Silk Road.",
        "They crossed hazardous mountain ranges and arid deserts to exchange goods.",
        "They transported precious colorful silks, valuable gold, and exotic aromatic spices.",
        "This ancient network fostered deep cultural communication between distinct nations.",
        "New inventions and revolutionary ideas traveled rapidly across these vast continents."
      ],
      [
        "In classical Athens, wise philosophers sat beneath the shade of olive trees.",
        "They debated complex concepts of justice, truth, and democratic governance.",
        "Inquisitive young students listened intently to their eloquent and logical arguments.",
        "The magnificent white marble Parthenon stood proudly against the azure sky.",
        "This intellectual atmosphere laid the foundation for modern scientific exploration."
      ],
      [
        "The Renaissance was a magnificent golden age of artistic and scientific revival.",
        "Brilliant painters like Leonardo da Vinci created breathtaking masterpieces.",
        "They studied human anatomy and advanced engineering to perfect their works.",
        "Wealthy patrons generously funded grand libraries, cathedrals, and laboratories.",
        "This creative explosion permanently transformed European culture and thought."
      ],
      [
        "Ancient navigators possessed an extraordinary understanding of the night sky.",
        "They mapped complex stellar constellations to steer their wooden vessels.",
        "They recognized how the ocean currents and seasonal winds moved globally.",
        "Without modern compasses, they discovered remote archipelagos across deep waters.",
        "Their immense courage expanded the geographic horizons of ancient humanity."
      ],
      [
        "The ancient Olympic Games were held to honor the Greek gods.",
        "A sacred truce was declared so all city-states could travel safely.",
        "Brave athletes competed in chariot racing, running, and heavy wrestling.",
        "Winners received simple olive leaf crowns as a sign of supreme glory.",
        "This historic athletic festival celebrated human physical excellence and peaceful unity."
      ]
    ]
  },
  emotion: {
    beginner: [
      [
        "Two good friends sat in class.",
        "They shared a box of red wax crayons.",
        "They drew a big yellow sun.",
        "It is good to share your things.",
        "They smiled and played all day."
      ],
      [
        "A soft puppy wanted to play.",
        "He wagged his short white tail.",
        "He jumped on the warm green rug.",
        "He licked the happy baby's nose.",
        "The baby laughed with pure joy."
      ],
      [
        "A mother bird had a cozy nest.",
        "Three baby birds sat inside.",
        "They had small soft gray feathers.",
        "The mother brought them a worm.",
        "They sang a sweet little song."
      ],
      [
        "A boy dropped his heavy books.",
        "A kind girl helped him pick them up.",
        "The boy said thank you very much.",
        "They walked to class together.",
        "Helping a friend feels so warm."
      ],
      [
        "Grandma sat in her old wooden chair.",
        "She gave me a very warm hug.",
        "She told a funny story book tale.",
        "We drank warm milk and ate cake.",
        "I love to visit her quiet home."
      ],
      [
        "An old oak tree stood by a well.",
        "It gave cool shade from the sun.",
        "Children loved to swing on its branch.",
        "A sleepy cat napped under its leaves.",
        "The tree was a kind green friend."
      ]
    ],
    intermediate: [
      [
        "A new student arrived at our school on Monday morning.",
        "She sat alone at a wooden table during lunch time.",
        "A friendly boy walked over and sat down beside her.",
        "He shared his delicious strawberry cupcakes with a wide smile.",
        "They talked about their pets and became instant best friends."
      ],
      [
        "Two brothers had a silly argument over a green toy.",
        "They both felt sad and walked to separate dark corners.",
        "After a few quiet minutes, they decided to take turns.",
        "They apologized to each other and began to play happily.",
        "They learned that sharing is much better than fighting."
      ],
      [
        "The neighborhood families gathered to clean the local park.",
        "Children picked up dry leaves while parents planted roses.",
        "They painted the old wooden benches a bright sky blue.",
        "Everyone worked hard together under the warm autumn sun.",
        "By evening, the park looked absolutely beautiful and clean."
      ],
      [
        "A little boy found a small bird with a hurt wing.",
        "He gently placed the soft bird inside a shoebox.",
        "He fed it fresh water and tiny bread crumbs daily.",
        "Soon the bird became strong enough to fly high again.",
        "The boy smiled as he watched his flying friend soar."
      ],
      [
        "A girl wrote a beautiful thank-you note to her teacher.",
        "She expressed how much she enjoyed learning math and reading.",
        "She decorated the card with colorful flower sticker pictures.",
        "The teacher read the card and smiled with happy tears.",
        "A simple kind gesture can bring so much pure happiness."
      ],
      [
        "An old man lived in a small house near the forest.",
        "He always kept a wooden birdfeeder filled with seeds.",
        "Dozens of colorful birds visited his yard every single day.",
        "He loved to sit by the window and listen to them sing.",
        "Their sweet music filled his quiet home with warm peace."
      ]
    ],
    advanced: [
      [
        "The classic fable of the Wind and the Sun teaches a lesson.",
        "They competed to see who could make a traveler remove his coat.",
        "The fierce Wind blew with howling strength but the man held tighter.",
        "The gentle Sun shone down with warm and comforting golden light.",
        "The man removed his coat quickly, proving gentleness beats force."
      ],
      [
        "A selfish giant built a high wall around his beautiful garden.",
        "Because he was unkind, eternal winter stayed inside his empty yard.",
        "One morning, children crept through a small hole in the wall.",
        "Suddenly, trees blossomed with pink flowers and sweet birds sang.",
        "The giant's cold heart melted instantly as he welcomed the children."
      ],
      [
        "A luxurious star-child believed he was superior to everyone else.",
        "He acted cruelly toward the poor and needy of the kingdom.",
        "As a result of his vanity, his handsome face became ugly.",
        "He wandered the world for years, performing difficult acts of mercy.",
        "His physical beauty returned only when his heart became truly humble."
      ],
      [
        "A simple toy rabbit dreamed of becoming Real through deep love.",
        "His threads became worn and his velvet fur grew very shabby.",
        "He comforted a sick little boy through long and feverish nights.",
        "When the boy recovered, the nursery magic finally came alive.",
        "A gentle fairy transformed the devoted toy into a living wild rabbit."
      ],
      [
        "A majestic statue of the Happy Prince stood high above the city.",
        "Though decorated with gold leaf and sapphires, he wept for the poor.",
        "A loyal little swallow offered to carry his precious gems away.",
        "They distributed the wealth to starving families and cold children.",
        "Though no longer golden, the statue's lead heart was pure love."
      ],
      [
        "Two creative pen pals exchanged handwritten letters for forty years.",
        "They described their lives, their dreams, and their changing families.",
        "They sent delicate pressed wildflowers and old photographic prints.",
        "Though living on opposite sides of the ocean, they shared everything.",
        "Their enduring correspondence proved that true friendship has no boundaries."
      ]
    ]
  },
  thrill: {
    beginner: [
      [
        "A white ghost lived in a tall clock.",
        "He was very small and very friendly.",
        "He wore a sheet that smelled of soap.",
        "He loved to eat sweet lemon drops.",
        "He was a happy little night ghost."
      ],
      [
        "A cute black cat sat on a wall.",
        "His green eyes shone in the dark.",
        "He saw a tiny gray toy mouse.",
        "He ran and leaped with a soft pop.",
        "The cat caught his favorite toy."
      ],
      [
        "Sam lost his bright green sock.",
        "He looked in the big toy box.",
        "He heard a tiny squeak in there.",
        "It was just his puppy chewing it.",
        "They both had a fun tug game."
      ],
      [
        "An old wooden clock sat on the desk.",
        "It started to tick back in time.",
        "The hands spun fast like a top.",
        "It was a funny little magic clock.",
        "Then it stopped and rang a bell."
      ],
      [
        "The bedroom was dark and quiet.",
        "I saw a big shadow on the wall.",
        "I turned on my small night light.",
        "It was just my fuzzy teddy bear.",
        "I laughed and went back to sleep."
      ],
      [
        "We found an old trunk in the room.",
        "It had a heavy lock of iron.",
        "We opened it with a key click.",
        "Inside were bright neon stickers.",
        "They glowed green in the dark."
      ]
    ],
    intermediate: [
      [
        "A brave boy heard a mysterious tapping sound in the attic.",
        "He slowly climbed the creaky wooden stairs with a flashlight.",
        "The dusty floorboards groaned under his careful, quiet footsteps.",
        "He peeked behind an old trunk and saw a small gray owl.",
        "The owl blinked its large yellow eyes and flew out the window."
      ],
      [
        "A secret door was hidden behind the heavy library bookshelf.",
        "One rainy afternoon, Clara pulled a dusty red leather book.",
        "Suddenly, the entire shelf swung open with a low rumble.",
        "Inside was a tiny dry room with a small wooden table.",
        "A sparkling brass key sat quietly on a velvet cushion."
      ],
      [
        "An old map was rolled tightly inside a glass bottle.",
        "Two children found it buried deep in the beach sand.",
        "The yellow paper showed a drawing of a secret island.",
        "An orange X marked the spot near three tall palm trees.",
        "They kept the map safe to plan their next adventure."
      ],
      [
        "The ancient lighthouse stood tall on the stormy rocky cliff.",
        "Its giant glass lamp had been dark for fifty years.",
        "One windy night, a fisherman saw it flash three times.",
        "He rowed his boat closer and climbed the slippery steps.",
        "He found a warm fire burning and a cup of tea."
      ],
      [
        "Max noticed strange fresh footprints in the white winter snow.",
        "The prints led from the garden into the dark forest.",
        "He followed the path carefully, wearing his thick wool coat.",
        "The footprints stopped abruptly beneath a giant pine tree.",
        "Looking up, he saw a beautiful white fox smiling down."
      ],
      [
        "A heavy grandfather clock stood in the dim dusty hallway.",
        "It had not ticked or chimed for a whole decade.",
        "Suddenly, it began to tick-tock with a deep rich sound.",
        "At exactly noon, it chimed twelve times very slowly.",
        "The family gathered around in surprise at the sweet music."
      ]
    ],
    advanced: [
      [
        "The classic legend of Sleepy Hollow describes a quiet valley.",
        "A superstitious schoolmaster named Ichabod Crane lived there.",
        "He rode his old horse home through the dark, misty forest.",
        "Suddenly, a towering figure on a black horse appeared nearby.",
        "The shadowy rider carried what appeared to be a glowing pumpkin."
      ],
      [
        "A mysterious Victorian greenhouse was situated on the high hill.",
        "At midnight, all the exotic azure orchids opened their petals.",
        "They produced a whispery, melodious harmony that echoed softly.",
        "A young girl discovered a concealed stone latch under the moss.",
        "The latch unlocked a hidden spiral staircase leading deep underground."
      ],
      [
        "A complex botanical hedge maze surrounded the ancient stone manor.",
        "The leafy green pathways shifted silently under the full moon.",
        "Intricate animal statues appeared to track travelers with their eyes.",
        "In the exact center stood a sundial made of black marble.",
        "Pressing the center button opened a gate to a glowing courtyard."
      ],
      [
        "An ornate oil painting in the library changed every century.",
        "The painted traveler walked down a different path each night.",
        "He pointed his index finger toward a loose brick in the wall.",
        "When Arthur pressed the designated stone, a secret door opened.",
        "Inside lay a collection of glittering instruments and ancient maps."
      ],
      [
        "Sailors frequently spoke of a phantom ship that sailed the mist.",
        "The vessel had glowing white sails that caught no real wind.",
        "It glided silently across the dark water without making a sound.",
        "It appeared only during severe autumn storms to warn other captains.",
        "Once the storm subsided, the glowing ship vanished into thin air."
      ],
      [
        "The private gothic library contained thousands of levitating volumes.",
        "Books bound in gold and velvet floated gently through the air.",
        "They opened themselves to reveal ancient formulas and magical maps.",
        "A soft violet light illuminated the high arched stained-glass windows.",
        "The atmosphere was filled with the sweet scent of old parchment."
      ]
    ]
  },
  dinosaurs: {
    beginner: [
      [
        "A baby T-Rex wanted to be loud.",
        "He stood up on a flat gray rock.",
        "He took a very deep breath in.",
        "He let out a tiny, soft squeak.",
        "His mother gave a big happy roar."
      ],
      [
        "The green dinosaur had a long neck.",
        "She ate sweet leaves from a tree.",
        "She was taller than the school wall.",
        "She walked slowly through the grass.",
        "She was a very kind leaf eater."
      ],
      [
        "A round dinosaur egg lay in sand.",
        "The warm sun shone down on it.",
        "We heard a tiny crack in the shell.",
        "A baby came out with bright eyes.",
        "It was a happy day in the wild."
      ],
      [
        "A big blue dinosaur found some mud.",
        "He loved to splash and play in it.",
        "The cool mud went on his back.",
        "He roared a very happy dinosaur roar.",
        "He looked like a big muddy hill."
      ],
      [
        "A fast little dinosaur ran in the sun.",
        "He raced a green bug in the grass.",
        "He had small feet and a long tail.",
        "He won the race with a big jump.",
        "He ran back to his mother's side."
      ],
      [
        "A sharp-horn dinosaur felt very sleepy.",
        "He found a dry cave near the river.",
        "He curled up on the soft leaves.",
        "The stars came out in the sky.",
        "He slept safe all through the night."
      ]
    ],
    intermediate: [
      [
        "The Triceratops was a strong plant-eating dinosaur.",
        "She had three sharp horns on her large bony head.",
        "A tough frill protected her neck from hungry predators.",
        "She used her beak to cut tough green ferns easily.",
        "She lived in a peaceful herd to keep safe."
      ],
      [
        "Fossil footprints are preserved in hard stone today.",
        "Dinosaurs stepped in deep sticky mud long ago.",
        "The sun dried the mud before rain could wash it.",
        "Over millions of years, the mud turned into rock.",
        "Scientists study these stone prints to learn about them."
      ],
      [
        "The Stegosaurus had bright orange plates on his back.",
        "These hard plates helped control his body temperature.",
        "He had a heavy tail with four sharp spikes at the end.",
        "He swung his spiky tail to defend against enemies.",
        "He walked slowly on four short and sturdy legs."
      ],
      [
        "Giant flying reptiles called Pterosaurs soared in the sky.",
        "They had large leathery wings made of thin skin.",
        "They glided on warm air currents above the blue ocean.",
        "They dived down to catch silver fish with their beaks.",
        "They rested safely on the edges of high rocky cliffs."
      ],
      [
        "In eighteen twenty-two, a woman found a giant tooth.",
        "She noticed it sparkling in a pile of road gravel.",
        "Her husband realized it belonged to an unknown creature.",
        "They named this first dinosaur the vegetarian Iguanodon.",
        "This amazing discovery started the science of paleontology."
      ],
      [
        "The Ankylosaurus was like a living armored tank.",
        "Hard bony plates covered his entire wide back.",
        "He had a heavy club of bone at the tail end.",
        "He could swing the club to knock down predators.",
        "Even the fiercest meat-eaters stayed away from him."
      ]
    ],
    advanced: [
      [
        "The Cretaceous period featured a highly diverse prehistoric ecosystem.",
        "Lush flowering plants and massive coniferous forests covered the land.",
        "Giant herbivorous herds migrated constantly to find fresh vegetation.",
        "Ferocious theropods patrolled the edges of these vast plains.",
        "This dynamic biological balance existed for millions of years."
      ],
      [
        "The prevailing scientific consensus details a catastrophic asteroid impact.",
        "A massive celestial rock collided near the Yucatan Peninsula.",
        "The violent impact released immense dust clouds into the atmosphere.",
        "This blocked critical sunlight, causing a severe drop in temperature.",
        "Consequently, the global food chain collapsed, ending the dinosaurs' reign."
      ],
      [
        "Paleontologists perform meticulous analyses of fossilized dinosaur teeth.",
        "By studying microscopic wear patterns, they determine prehistoric diets.",
        "Sharp serrated teeth indicate carnivorous hunting and tearing behavior.",
        "Broad flat teeth suggest extensive grinding of fibrous prehistoric plants.",
        "These fossilized structures reveal complex food webs of ancient eras."
      ],
      [
        "Modern scientific discoveries confirm a profound link to avian species.",
        "Many small theropod dinosaurs possessed complex primitive feather structures.",
        "Fossilized skeletons reveal skeletal designs nearly identical to modern birds.",
        "Consequently, scientists classify modern birds as living feathered dinosaurs.",
        "This revolutionary concept permanently altered our view of prehistoric life."
      ],
      [
        "The ancient shallow seas teemed with extraordinary marine reptiles.",
        "Immense Plesiosaurs swam using four massive paddles like wings.",
        "They patrolled deep waters, preying on ancient ammonites and fish.",
        "Coexisting with them were giant sharks with razor-sharp teeth.",
        "These aquatic predators ruled the prehistoric oceans with absolute dominance."
      ],
      [
        "The carbonization process creates delicate fossilized plant leaves.",
        "Leaves were buried rapidly beneath layers of oxygen-deprived sediment.",
        "Over immense time, heat and pressure expelled all liquid elements.",
        "Only a thin, detailed film of carbon outline remained on the rock.",
        "These exquisite plant fossils reconstruct ancient tropical forest climates."
      ]
    ]
  }
};

const MASCOT_HAPPY_MSGS = [
  "You're doing awesome! Keep typing! ⭐",
  "Wow! Perfect spelling! You are a superstar! 🌟",
  "Excellent! The words are dancing with joy! 💃",
  "Keep going! Your typing is magic! 🚀",
  "Fantastic job! I love hearing those clicky sounds! 🎹"
];

const MASCOT_MISTAKE_MSGS = [
  "Oops! Let's check that letter! 🧙‍♂️",
  "Almost! Try another key! You can do it! 💪",
  "Not quite! Look closely at the highlighted word! 🔍",
  "Spelling is magic, mistakes just help us learn! Try again! ✨"
];

/* =========================================================
   WEB AUDIO API — TYPING SOUND SYNTHESIZER
   ========================================================= */

let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSynthClick(type = 'standard') {
  try {
    initAudio();
    if (!audioCtx) return;
    
    const vol = state.synthVolume / 100;
    const pitch = state.synthPitch / 100;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    let startFreq = 440;
    let endFreq = 600;
    let duration = 0.05;
    
    if (type === 'standard') {
      // Short crisp click
      osc.type = 'triangle';
      startFreq = 800 * pitch;
      endFreq = 120 * pitch;
      duration = 0.04;
      
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      
      gain.gain.setValueAtTime(vol * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } 
    else if (type === 'bubble') {
      // Upward sine sweep (water pop)
      osc.type = 'sine';
      startFreq = 380 * pitch;
      endFreq = 950 * pitch;
      duration = 0.06;
      
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      
      gain.gain.setValueAtTime(vol * 0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } 
    else if (type === 'arcade') {
      // Retro arcade blip (square wave sweep)
      osc.type = 'square';
      startFreq = 580 * pitch;
      endFreq = 260 * pitch;
      duration = 0.06;
      
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.setValueAtTime(endFreq, now + 0.035);
      
      gain.gain.setValueAtTime(vol * 0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } 
    else if (type === 'mechanical') {
      // Double tactile click
      osc.type = 'triangle';
      startFreq = 160 * pitch;
      endFreq = 60 * pitch;
      duration = 0.07;
      
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      
      // High transient double sweep
      const keyReleaseOsc = audioCtx.createOscillator();
      const keyReleaseGain = audioCtx.createGain();
      keyReleaseOsc.type = 'sine';
      keyReleaseOsc.frequency.setValueAtTime(1400 * pitch, now);
      keyReleaseOsc.connect(keyReleaseGain);
      keyReleaseGain.connect(audioCtx.destination);
      
      keyReleaseGain.gain.setValueAtTime(vol * 0.28, now);
      keyReleaseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
      
      keyReleaseOsc.start(now);
      keyReleaseOsc.stop(now + 0.015);
      
      gain.gain.setValueAtTime(vol * 0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } 
    else if (type === 'bell') {
      // Resonating tiny bell chime
      osc.type = 'sine';
      startFreq = 1100 * pitch;
      duration = 0.22;
      
      osc.frequency.setValueAtTime(startFreq, now);
      
      const overtoneOsc = audioCtx.createOscillator();
      const overtoneGain = audioCtx.createGain();
      overtoneOsc.type = 'sine';
      overtoneOsc.frequency.setValueAtTime(2200 * pitch, now);
      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(audioCtx.destination);
      
      overtoneGain.gain.setValueAtTime(vol * 0.2, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      
      overtoneOsc.start(now);
      overtoneOsc.stop(now + 0.15);
      
      gain.gain.setValueAtTime(vol * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }
    else if (type === 'mistake') {
      // Buzz error sound
      osc.type = 'sawtooth';
      startFreq = 140;
      endFreq = 90;
      duration = 0.15;
      
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.linearRampToValueAtTime(endFreq, now + duration);
      
      gain.gain.setValueAtTime(vol * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }
    else if (type === 'spacebar') {
      // Pop space sweep
      osc.type = 'sine';
      startFreq = 220 * pitch;
      endFreq = 480 * pitch;
      duration = 0.08;
      
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      
      gain.gain.setValueAtTime(vol * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }
    
    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch (err) {
    console.warn('Audio synth failed, browser context pending click gesture.', err);
  }
}

/* =========================================================
   WEB SPEECH API — NARRATOR VOICE MANAGER
   ========================================================= */

let selectedVoiceObj = null;

/* ─── Voice Quality Scorer ───────────────────────────────────────────────────
   Ranks voices from most human-sounding → most robotic so we can auto-pick
   the best one available on this device/browser.
   ─────────────────────────────────────────────────────────────────────────── */
function _voiceQualityScore(voice) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = 0;

  // 🏆 Tier 1 — Neural / Enhanced TTS (Apple + Google WaveNet)
  // These sound virtually indistinguishable from a real human.
  if (name.includes('enhanced'))              score += 120; // macOS Enhanced voices
  if (name.includes('premium'))               score += 110;
  if (name.includes('wavenet'))               score += 100; // Google WaveNet
  if (name.includes('neural'))                score += 100;
  if (name.includes('natural'))               score += 90;

  // 🥈 Tier 2 — High-quality named system voices
  // Google US/UK English online voices are quite clear
  if (name.includes('google') && (lang.includes('en-us') || lang.includes('en-gb'))) score += 70;
  // Apple standard named voices (still very good on macOS/iOS)
  if (name.includes('samantha'))              score += 60; // macOS classic – very clear
  if (name.includes('serena'))                score += 55;
  if (name.includes('karen'))                 score += 55;
  if (name.includes('moira'))                 score += 50;
  if (name.includes('tessa'))                 score += 50;
  if (name.includes('fiona'))                 score += 50;
  if (name.includes('hazel'))                 score += 50;
  if (name.includes('victoria'))              score += 45;
  // Microsoft voices (Edge/Windows)
  if (name.includes('aria'))                  score += 65;
  if (name.includes('jenny'))                 score += 65;
  if (name.includes('guy'))                   score += 55;
  if (name.includes('zira'))                  score += 50;
  if (name.includes('susan'))                 score += 45;

  // 🥉 Tier 3 — Language/locale preference
  if (lang.includes('en-us'))                 score += 20;
  if (lang.includes('en-gb'))                 score += 18;
  if (lang.includes('en-au') || lang.includes('en-nz')) score += 10;
  if (lang.startsWith('en'))                  score += 5;

  // Small bonus for non-local (online) voices — usually higher quality
  if (!voice.localService)                    score += 15;

  return score;
}

function loadVoices() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();

  // Step 1: keep only English voices
  const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));

  // Step 2: sort by quality score — best first
  const ranked = englishVoices.sort((a, b) => _voiceQualityScore(b) - _voiceQualityScore(a));

  // Step 3: show up to 6 top voices in the picker
  state.voices = ranked.slice(0, 6);

  // Fallback: if no English voice found at all, show every available voice
  if (state.voices.length === 0) {
    state.voices = voices.slice(0, 5);
  }

  if (!els.voiceSelect) return;

  els.voiceSelect.innerHTML = '';
  if (state.voices.length === 0) {
    els.voiceSelect.innerHTML = '<option value="">🗣️ Use Browser Default Voice</option>';
    return;
  }

  state.voices.forEach((voice, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    const name = voice.name;
    const nameLower = name.toLowerCase();

    // Build quality badge so the user knows which voice is best
    let qualityBadge = '';
    if (nameLower.includes('enhanced') || nameLower.includes('premium') ||
        nameLower.includes('wavenet') || nameLower.includes('neural')) {
      qualityBadge = ' ✨ Most Natural';
    } else if (nameLower.includes('google') || nameLower.includes('aria') ||
               nameLower.includes('jenny') || nameLower.includes('samantha') ||
               nameLower.includes('serena') || nameLower.includes('karen')) {
      qualityBadge = ' 👍 Clear';
    }

    // Clean up vendor prefixes for readability
    let friendlyName = name
      .replace(/microsoft /gi, '')
      .replace(/google /gi, '')
      .replace(/apple /gi, '')
      .trim();

    opt.textContent = `🗣️ ${friendlyName}${qualityBadge}`;

    // Auto-select the best voice on first load
    if (index === 0 && !selectedVoiceObj) {
      opt.selected = true;
      selectedVoiceObj = voice;
      state.selectedVoice = 0;
    }

    els.voiceSelect.appendChild(opt);
  });

  // Safety: ensure something is always selected
  if (!selectedVoiceObj && state.voices.length > 0) {
    selectedVoiceObj = state.voices[0];
    state.selectedVoice = 0;
  }
}

// Handle voice load asynchronicity (browsers load voices async)
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.addEventListener('voiceschanged', loadVoices);
  loadVoices();
}

function speakText(text, rate = 1.0, callback = null) {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel(); // Stop any active speech

  const utterance = new SpeechSynthesisUtterance(text);

  // Apply the currently selected voice
  if (selectedVoiceObj) utterance.voice = selectedVoiceObj;

  // ── Natural-sounding speech parameters ──────────────────────────────────
  // pitch = 1.0 is the true neutral for the voice — raising it makes it robotic.
  // volume = 1   gives full, clear audio (was implicitly 1 but now explicit).
  // rate is controlled per-level for kids, already passed in.
  utterance.pitch  = 1.0;  // true neutral — no artificial squeakiness
  utterance.volume = 1.0;  // full, clear narration volume
  utterance.rate   = rate; // already tuned per story level (0.72 – 1.0)

  utterance.onstart = () => els.voiceWave.classList.add('speaking');

  utterance.onend = () => {
    els.voiceWave.classList.remove('speaking');
    if (callback) callback();
  };

  utterance.onerror = () => {
    els.voiceWave.classList.remove('speaking');
    if (callback) callback();
  };

  speechSynthesis.speak(utterance);
}

/* =========================================================
   AUTO-REPEAT ENGINE
   Repeats the current sentence every 2 seconds while TTS is
   idle, so kids can listen as many times as they need.
   ========================================================= */
let _autoRepeatTimer = null;

function startAutoRepeat() {
  clearAutoRepeat();
  // Speak the line immediately
  speakText(state.currentSentenceText, getDictationSpeechRate());
  
  // If repeat interval is Off (0), do not start repeat loop
  if (state.repeatInterval === 0) return;
  
  _autoRepeatTimer = setInterval(() => {
    if (!state.dictationCompleted &&
        typeof speechSynthesis !== 'undefined' &&
        !speechSynthesis.speaking) {
      speakText(state.currentSentenceText, getDictationSpeechRate());
    }
  }, state.repeatInterval);
}

function clearAutoRepeat() {
  if (_autoRepeatTimer !== null) {
    clearInterval(_autoRepeatTimer);
    _autoRepeatTimer = null;
  }
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
  }
}

/* =========================================================
   LISTEN & TYPE — SETUP & SYNTH PANEL EVENT HANDLERS
   ========================================================= */

// Story Selection Cards
els.storyCards.forEach(card => {
  card.addEventListener('click', () => {
    els.storyCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    state.storyType = card.dataset.story;
    playSynthClick('bubble');
  });
});

// Level Buttons
els.levelBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    els.levelBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.storyLevel = btn.dataset.level;
    playSynthClick('arcade');
  });
});

// Length Buttons
els.lengthBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    els.lengthBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.storyLength = btn.dataset.length;
    playSynthClick('arcade');
  });
});

// Repeat Interval Buttons
els.repeatBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    els.repeatBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.repeatInterval = Number(btn.dataset.repeat);
    playSynthClick('arcade');
  });
});

// Voice Select Dropdown
els.voiceSelect?.addEventListener('change', (e) => {
  const index = Number(e.target.value);
  if (state.voices[index]) {
    selectedVoiceObj = state.voices[index];
    state.selectedVoice = index;
  }
});

// Test Voice Button
els.voiceTestBtn?.addEventListener('click', () => {
  speakText("Let's type a story together!", 1.0);
});

// Keyboard Preset Selectors
els.presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    els.presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.synthPreset = btn.dataset.preset;
    playSynthClick(state.synthPreset);
  });
});

// Volume & Pitch Sliders
els.sliderSynthVol?.addEventListener('input', (e) => {
  state.synthVolume = Number(e.target.value);
  els.valSynthVol.textContent = `${state.synthVolume}%`;
});

els.sliderSynthPitch?.addEventListener('input', (e) => {
  state.synthPitch = Number(e.target.value);
  let pitchLabel = 'Normal';
  if (state.synthPitch < 80)  pitchLabel = 'Low 🔉';
  if (state.synthPitch > 120) pitchLabel = 'High 🔊';
  els.valSynthPitch.textContent = pitchLabel;
});

// Live sound tester input
els.synthTestInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
  if (e.key === ' ') {
    playSynthClick('spacebar');
  } else {
    playSynthClick(state.synthPreset);
  }
});

/* =========================================================
   LISTEN & TYPE — CORE GAMEPLAY CONTROLLER
   ========================================================= */

function getDictationSpeechRate() {
  // Map level to speed
  const rateMap = { 'beginner': 0.76, 'intermediate': 0.88, 'advanced': 1.0 };
  return rateMap[state.storyLevel] || 0.98;
}

function startListenTypeGame() {
  state.dictationMistakes = 0;
  state.typedIndex = 0;
  state.activeSentenceIndex = 0;
  state.dictationCompleted = false;
  
  els.listenMistakesVal.textContent = '0';
  els.listenProgressFill.style.width = '0%';
  els.listenProgressLbl.textContent = '0% Done';
  
  // Decide target line count based on selected length
  let numSentences = 5;
  if (state.storyLength === 'short') {
    numSentences = rand(5, 10);
  } else if (state.storyLength === 'medium') {
    numSentences = rand(10, 20);
  } else if (state.storyLength === 'long') {
    numSentences = rand(20, 50);
  }
  
  // Retrieve the paragraphs pool based on chosen theme and difficulty level
  const pool = STORIES[state.storyType][state.storyLevel];
  const shuffledPool = shuffle(pool);
  
  let selectedSentences = [];
  // Since each paragraph has exactly 5 sentences, 6 paragraphs = 30 sentences.
  // If the requested count is larger than 30 (up to 50), we can loop through the shuffled pool again to gather enough sentences.
  while (selectedSentences.length < numSentences) {
    const roundShuffled = shuffle(pool);
    for (let i = 0; i < roundShuffled.length; i++) {
      selectedSentences = selectedSentences.concat(roundShuffled[i]);
      if (selectedSentences.length >= numSentences) {
        break;
      }
    }
  }
  
  // Slice to exactly the requested number of sentences
  selectedSentences = selectedSentences.slice(0, numSentences);
  
  state.dictationSentences = selectedSentences;
  state.storyText = selectedSentences.join(' ');
  state.currentSentenceText = state.dictationSentences[0];
  state.storyChars = state.currentSentenceText.split('');
  
  setMascotMessage("Listen to the first line and type it! 🗣️", 'happy');
  showScreen('listen');

  // Render character layout (only displays the active sentence)
  updateTypingDisplay();

  // Focus hidden typing catcher
  setTimeout(() => {
    els.hiddenTyper.focus();
    updateTyperFocusBtn(true);
  }, 100);

  // Speak the first sentence and start the 2-second auto-repeat loop
  setTimeout(() => startAutoRepeat(), 450);
}

function updateTypingDisplay() {
  els.typingDisplay.innerHTML = '';
  
  state.storyChars.forEach((char, idx) => {
    const span = document.createElement('span');
    span.textContent = char;
    
    if (idx < state.typedIndex) {
      span.className = 'char-correct';
    } else if (idx === state.typedIndex) {
      span.className = 'char-cursor';
    } else {
      span.className = 'char-default';
    }
    
    els.typingDisplay.appendChild(span);
  });
  
  // Progress computation across all sentences in the story
  let previousLengthSum = 0;
  for (let i = 0; i < state.activeSentenceIndex; i++) {
    previousLengthSum += state.dictationSentences[i].length;
  }
  const totalTyped = previousLengthSum + state.typedIndex;
  const totalStoryLength = state.storyText.length;
  const progressPct = Math.round((totalTyped / totalStoryLength) * 100);
  
  els.listenProgressFill.style.width = `${progressPct}%`;
  els.listenProgressLbl.textContent = `${progressPct}% Done`;
}

function setMascotMessage(msg, type = 'happy') {
  els.mascotSpeech.textContent = msg;
  if (type === 'mistake') {
    els.mascotCard.classList.add('flash-mistake');
    setTimeout(() => {
      els.mascotCard.classList.remove('flash-mistake');
    }, 450);
  }
}

function highlightMistake() {
  const activeNode = els.typingDisplay.children[state.typedIndex];
  if (activeNode) {
    activeNode.className = 'char-mistake char-cursor';
    setTimeout(() => {
      if (activeNode && state.typedIndex === Array.from(els.typingDisplay.children).indexOf(activeNode)) {
        activeNode.className = 'char-cursor';
      }
    }, 300);
  }
}

function flashMascotMistake(typedChar, targetChar) {
  let friendlyTyped = typedChar === ' ' ? 'Spacebar' : `'${typedChar}'`;
  let friendlyTarget = targetChar === ' ' ? 'Spacebar' : `'${targetChar}'`;
  
  const msg = `You pressed ${friendlyTyped}, but it should be ${friendlyTarget}! Try again! 💪`;
  setMascotMessage(msg, 'mistake');
  
  // Speak mistake mention softly (if not speaking currently)
  if (typeof speechSynthesis !== 'undefined' && !speechSynthesis.speaking) {
    const utterance = new SpeechSynthesisUtterance("Check spelling!");
    utterance.rate = 1.3;
    utterance.volume = 0.5;
    speechSynthesis.speak(utterance);
  }
}

function speakNextWord() {
  // Find current active word boundaries within the active sentence
  const textLeft = state.currentSentenceText.slice(state.typedIndex);
  const nextWord = textLeft.trim().split(' ')[0];
  if (nextWord) {
    speakText(nextWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""), getDictationSpeechRate() * 1.05);
  }
}

function completeDictation() {
  state.dictationCompleted = true;
  clearAutoRepeat(); // Stop the repeat loop — story is done!
  // Small delay so the final keyclick sound plays before the voice starts
  setTimeout(() => {
    speakText("Fabulous spelling! You completed the story!", 1.0, () => {
      showResult();
    });
  }, 300);
}

/* =========================================================
   LISTEN & TYPE — UNIFIED INPUT ENGINE (MOBILE & DESKTOP)
   ========================================================= */

function updateTyperFocusBtn(focused) {
  if (focused) {
    els.btnRefocusTyper.classList.add('focused');
    els.btnRefocusTyper.textContent = '✨ Keyboard Ready! Sparkle Type! ✨';
  } else {
    els.btnRefocusTyper.classList.remove('focused');
    els.btnRefocusTyper.textContent = '👉 Tap here to open Keyboard 👈';
  }
}

// Click anywhere on typing box focuses the hidden input
els.typingDisplay.addEventListener('click', () => {
  els.hiddenTyper.focus();
  updateTyperFocusBtn(true);
});

els.btnRefocusTyper?.addEventListener('click', () => {
  els.hiddenTyper.focus();
  updateTyperFocusBtn(true);
});

els.hiddenTyper.addEventListener('focus', () => updateTyperFocusBtn(true));
els.hiddenTyper.addEventListener('blur', () => updateTyperFocusBtn(false));

// Monitor desktop key presses
els.hiddenTyper.addEventListener('keydown', (e) => {
  if (state.dictationCompleted) return;
  
  // Filter navigation/editing keys
  if (e.key.length > 1) {
    if (e.key === 'Spacebar' || e.key === ' ') {
      e.preventDefault();
      handleCharInput(' ');
    }
    return;
  }
  
  e.preventDefault();
  handleCharInput(e.key);
});

// Monitor mobile virtual keyboard inputs (input event acts as typing bridge)
els.hiddenTyper.addEventListener('input', (e) => {
  if (state.dictationCompleted) return;
  const inputChar = e.data || e.target.value.slice(-1);
  e.target.value = ''; // Reset input buffer
  if (inputChar) {
    handleCharInput(inputChar);
  }
});

function handleCharInput(char) {
  if (state.dictationCompleted) return;
  
  const target = state.currentSentenceText[state.typedIndex];
  if (!target) return;
  
  if (char === target) {
    // Correct!
    if (char === ' ') {
      playSynthClick('spacebar');
    } else {
      playSynthClick(state.synthPreset);
    }
    
    state.typedIndex++;
    updateTypingDisplay();
    
    // Choose mascot message
    if (state.typedIndex % 10 === 0) {
      setMascotMessage(pick(MASCOT_HAPPY_MSGS), 'happy');
    }
    
    if (state.typedIndex >= state.currentSentenceText.length) {
      // Completed the active sentence!
      if (state.activeSentenceIndex < state.dictationSentences.length - 1) {
        // Go to next sentence!
        state.activeSentenceIndex++;
        state.currentSentenceText = state.dictationSentences[state.activeSentenceIndex];
        state.storyChars = state.currentSentenceText.split('');
        state.typedIndex = 0;
        
        setMascotMessage("Wonderful spelling! Here is the next line! 🗣️", 'happy');
        updateTypingDisplay();

        // Start auto-repeat loop for the new sentence
        setTimeout(() => startAutoRepeat(), 600);
      } else {
        // No more sentences — dictation is fully completed!
        completeDictation();
      }
    }
  } else {
    // Incorrect character typed
    playSynthClick('mistake');
    state.dictationMistakes++;
    els.listenMistakesVal.textContent = state.dictationMistakes;
    
    flashMascotMistake(char, target);
    highlightMistake();
  }
}

// Gameplay controls
els.btnPlayStory?.addEventListener('click', () => {
  speakText(state.storyText, getDictationSpeechRate());
});

els.btnPlaySentence?.addEventListener('click', () => {
  speakText(state.currentSentenceText, getDictationSpeechRate());
});

els.btnPlayWord?.addEventListener('click', () => {
  // Find current word within active sentence
  const textLeft = state.currentSentenceText.slice(state.typedIndex);
  const nextWord = textLeft.trim().split(' ')[0] || '';
  if (nextWord) {
    speakText(nextWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""), getDictationSpeechRate());
  } else {
    speakText("Next letter", 1.2);
  }
});

// Setup Start Listen Button
els.startListenBtn?.addEventListener('click', () => {
  startListenTypeGame();
});

// Home back listener
els.backHomeListen?.addEventListener('click', () => {
  clearAutoRepeat(); // Stop auto-repeat and TTS when leaving the game
  showScreen('home');
});


/* =========================================================
   SCREEN NAVIGATION
   ========================================================= */
function showScreen(name) {
  Object.values(screens).forEach(s => {
    s.classList.remove('active');
    s.style.display = '';
  });
  const target = screens[name];
  target.classList.add('active');
  target.style.display = 'flex';
}

/* =========================================================
   PARTICLES
   ========================================================= */
(function spawnParticles() {
  const container = document.getElementById('particles');
  const colors = [
    'hsl(148,72%,50%)', 'hsl(31,95%,55%)', 'hsl(271,78%,58%)',
    'hsl(340,85%,58%)', 'hsl(47,100%,60%)', 'hsl(192,85%,55%)',
  ];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = rand(8, 28);
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${rand(0,100)}%;
      bottom:${rand(-20,0)}%;
      background:${pick(colors)};
      animation-duration:${rand(12,22)}s;
      animation-delay:-${rand(0,18)}s;
      filter:blur(${rand(0,2)}px);
    `;
    container.appendChild(p);
  }
})();

/* =========================================================
   UTILITY
   ========================================================= */
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr)      { return arr[rand(0, arr.length - 1)]; }
function shuffle(arr)   { return [...arr].sort(() => Math.random() - .5); }

/* =========================================================
   FIREBASE AUTH — AUTH STATE OBSERVER
   ========================================================= */
if (FIREBASE_CONFIGURED) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in — go to home
      setCurrentUser(user);
      showScreen('home');
    } else {
      // No user — show login
      showScreen('login');
    }
  });
} else {
  // Firebase not configured — show warning and stay on login
  showScreen('login');
  els.configWarning.hidden = false;
}

function setCurrentUser(user) {
  state.user = user;
  const name   = user.displayName || user.email?.split('@')[0] || 'Player';
  const avatar = user.photoURL;

  els.userName.textContent = `👋 ${name}`;
  if (avatar) {
    els.userAvatar.src = avatar;
    els.userAvatar.style.display = '';
  } else {
    // Generate a colored initials avatar
    els.userAvatar.src = generateInitialsAvatar(name);
    els.userAvatar.style.display = '';
  }
}

function generateInitialsAvatar(name) {
  const initials = name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  const colors = ['#e040fb','#00bcd4','#ff7043','#66bb6a','#42a5f5','#ffa726'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34">
    <rect width="34" height="34" rx="17" fill="${bg}"/>
    <text x="17" y="22" text-anchor="middle" fill="white"
      font-family="Nunito,sans-serif" font-size="14" font-weight="900">${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

/* =========================================================
   AUTH UI — TABS
   ========================================================= */
els.tabSignin.addEventListener('click', () => switchTab('signin'));
els.tabSignup.addEventListener('click', () => switchTab('signup'));

function switchTab(tab) {
  const isSignin = tab === 'signin';
  els.tabSignin.classList.toggle('active', isSignin);
  els.tabSignup.classList.toggle('active', !isSignin);
  els.tabSignin.setAttribute('aria-selected', isSignin);
  els.tabSignup.setAttribute('aria-selected', !isSignin);
  els.panelSignin.classList.toggle('active', isSignin);
  els.panelSignup.classList.toggle('active', !isSignin);
  els.panelSignin.hidden = !isSignin;
  els.panelSignup.hidden = isSignin;
  clearBanner();
}

/* =========================================================
   AUTH UI — BANNER
   ========================================================= */
function showBanner(msg, type = 'error') {
  els.authBanner.textContent = msg;
  els.authBanner.className = `auth-banner ${type}`;
  els.authBanner.hidden = false;
}
function clearBanner() {
  els.authBanner.hidden = true;
  els.authBanner.textContent = '';
}

/* =========================================================
   AUTH UI — PASSWORD TOGGLE
   ========================================================= */
els.toggleSigninPw.addEventListener('click', () => togglePassword(els.signinPassword, els.toggleSigninPw));
els.toggleSignupPw.addEventListener('click', () => togglePassword(els.signupPassword, els.toggleSignupPw));

function togglePassword(input, btn) {
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁️';
  btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}

/* =========================================================
   AUTH UI — LOADING STATE
   ========================================================= */
function setLoading(btn, loading) {
  const text    = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.btn-spinner');
  btn.disabled  = loading;
  if (text)    text.hidden    = loading;
  if (spinner) spinner.hidden = !loading;
}

/* =========================================================
   AUTH — CONFIG HELP LINK
   ========================================================= */
els.configHelpLink?.addEventListener('click', (e) => {
  e.preventDefault();
  showBanner(
    '📖 Open firebase-setup.md in your project folder for step-by-step instructions.',
    'success'
  );
});

/* =========================================================
   AUTH — GUEST LOGIN
   ========================================================= */
els.btnGuest.addEventListener('click', () => {
  // Create a temporary guest profile stored only in memory
  state.user = { displayName: 'Guest', photoURL: null, email: null };
  els.userName.textContent = '👋 Guest';
  els.userAvatar.src = generateInitialsAvatar('Guest');
  els.userAvatar.style.display = '';
  showScreen('home');
});

/* =========================================================
   AUTH — SIGN IN (Email)
   ========================================================= */
els.formSignin.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearBanner();

  if (!FIREBASE_CONFIGURED) {
    showBanner('⚙️ Firebase is not configured yet. Please add your config keys to app.js.');
    return;
  }

  const email    = els.signinEmail.value.trim();
  const password = els.signinPassword.value;

  if (!email || !password) {
    showBanner('Please fill in all fields.');
    return;
  }

  setLoading(els.btnSignin, true);
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle navigation
  } catch (err) {
    showBanner(friendlyError(err.code));
  } finally {
    setLoading(els.btnSignin, false);
  }
});

/* =========================================================
   AUTH — SIGN UP (Email)
   ========================================================= */
els.formSignup.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearBanner();

  if (!FIREBASE_CONFIGURED) {
    showBanner('⚙️ Firebase is not configured yet. Please add your config keys to app.js.');
    return;
  }

  const name     = els.signupName.value.trim();
  const email    = els.signupEmail.value.trim();
  const password = els.signupPassword.value;

  if (!name || !email || !password) {
    showBanner('Please fill in all fields.');
    return;
  }
  if (password.length < 6) {
    showBanner('Password must be at least 6 characters.');
    return;
  }

  setLoading(els.btnSignup, true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // onAuthStateChanged will handle navigation
  } catch (err) {
    showBanner(friendlyError(err.code));
  } finally {
    setLoading(els.btnSignup, false);
  }
});

/* =========================================================
   AUTH — GOOGLE SIGN IN/UP
   ========================================================= */
async function handleGoogleAuth() {
  clearBanner();
  if (!FIREBASE_CONFIGURED) {
    showBanner('⚙️ Firebase is not configured yet. Please add your config keys to app.js.');
    return;
  }
  try {
    await signInWithPopup(auth, googleProvider);
    // onAuthStateChanged handles navigation
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showBanner(friendlyError(err.code));
    }
  }
}

els.btnGoogleSignin.addEventListener('click', handleGoogleAuth);
els.btnGoogleSignup.addEventListener('click', handleGoogleAuth);

/* =========================================================
   AUTH — SIGN OUT
   ========================================================= */
els.btnLogout.addEventListener('click', async () => {
  if (!FIREBASE_CONFIGURED) {
    showScreen('login');
    return;
  }
  try {
    await signOut(auth);
    // onAuthStateChanged will show login screen
  } catch (err) {
    console.error('Sign out error', err);
  }
});

/* =========================================================
   FRIENDLY FIREBASE ERROR MESSAGES
   ========================================================= */
function friendlyError(code) {
  const map = {
    'auth/user-not-found':           '❌ No account found with that email.',
    'auth/wrong-password':           '❌ Wrong password. Try again!',
    'auth/invalid-credential':       '❌ Email or password is incorrect.',
    'auth/email-already-in-use':     '📧 That email is already registered. Try signing in.',
    'auth/weak-password':            '🔑 Password is too weak (min 6 characters).',
    'auth/invalid-email':            '📧 Please enter a valid email address.',
    'auth/too-many-requests':        '⏳ Too many attempts. Please wait and try again.',
    'auth/network-request-failed':   '🌐 Network error. Check your connection.',
    'auth/popup-blocked':            '🚫 Popup was blocked. Allow popups and try again.',
  };
  return map[code] || `❌ Something went wrong (${code}). Please try again.`;
}

/* =========================================================
   ACTIVITY SWITCHER (Math Magic vs. Listen & Type)
   ========================================================= */
els.tabActMath.addEventListener('click', () => {
  state.activity = 'math';
  els.tabActMath.classList.add('active');
  els.tabActMath.setAttribute('aria-selected', 'true');
  els.tabActListen.classList.remove('active');
  els.tabActListen.setAttribute('aria-selected', 'false');
  els.paneMath.classList.add('active');
  els.paneMath.hidden = false;
  els.paneListen.classList.remove('active');
  els.paneListen.hidden = true;
  playSynthClick('arcade');
});

els.tabActListen.addEventListener('click', () => {
  state.activity = 'listen';
  els.tabActListen.classList.add('active');
  els.tabActListen.setAttribute('aria-selected', 'true');
  els.tabActMath.classList.remove('active');
  els.tabActMath.setAttribute('aria-selected', 'false');
  els.paneListen.classList.add('active');
  els.paneListen.hidden = false;
  els.paneMath.classList.remove('active');
  els.paneMath.hidden = true;
  playSynthClick('bubble');
  
  // Make sure voices are loaded
  loadVoices();
});

/* =========================================================
   MODE SELECTION
   ========================================================= */
els.modeCards.forEach(card => {
  card.addEventListener('click', () => {
    els.modeCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.op = card.dataset.op;
  });
});

// Default selection
document.getElementById('btn-addition').classList.add('selected');

/* =========================================================
   DIFFICULTY SELECTION
   ========================================================= */
els.diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    els.diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.difficulty = btn.dataset.diff;
  });
});

/* =========================================================
   QUESTION GENERATION
   ========================================================= */
function chooseOp() {
  if (state.op !== 'mix') return state.op;
  return pick(['add', 'sub', 'mul', 'div']);
}

function generateQuestion() {
  const diff = DIFF[state.difficulty];
  const op   = chooseOp();
  let a, b, answer, text, badge, hint;

  if (op === 'add') {
    a = rand(0, diff.max);
    b = rand(0, diff.max);
    answer = a + b;
    text   = `${a} + ${b} = ?`;
    badge  = '+';
    hint   = '';
  } else if (op === 'sub') {
    a = rand(0, diff.max);
    b = rand(0, a);  // always non-negative
    answer = a - b;
    text   = `${a} − ${b} = ?`;
    badge  = '−';
    hint   = '';
  } else if (op === 'mul') {
    a = rand(1, diff.mulMax);
    b = rand(1, diff.mulMax);
    answer = a * b;
    text   = `${a} × ${b} = ?`;
    badge  = '×';
    hint   = `${a} groups of ${b}`;
  } else {
    // Division: always generates clean whole-number answers
    b = rand(1, diff.divMax);            // divisor (never 0)
    answer = rand(1, diff.divMax);       // quotient
    a = b * answer;                      // dividend (always divisible)
    text   = `${a} ÷ ${b} = ?`;
    badge  = '÷';
    hint   = `${a} split into ${b} groups`;
  }

  // Generate 3 unique wrong choices
  const wrongSet = new Set();
  while (wrongSet.size < 3) {
    const spread = Math.max(4, Math.ceil(answer * .4));
    const wrong  = answer + rand(-spread, spread);
    if (wrong !== answer && wrong >= 0) wrongSet.add(wrong);
  }

  const choices = shuffle([answer, ...wrongSet]);
  return { text, answer, choices, badge, hint };
}

function buildQuestions() {
  state.questions = Array.from({ length: TOTAL_QUESTIONS }, generateQuestion);
}

/* =========================================================
   RENDER QUESTION
   ========================================================= */
function renderQuestion() {
  const q = state.questions[state.current];
  state.answered = false;

  // Progress
  const pct = (state.current / TOTAL_QUESTIONS) * 100;
  els.progressFill.style.width = pct + '%';
  els.progressFill.setAttribute('aria-valuenow', state.current);
  els.progressLbl.textContent = `${state.current + 1} / ${TOTAL_QUESTIONS}`;

  // Bounce animation
  els.questionCard.classList.remove('bounce');
  void els.questionCard.offsetWidth;
  els.questionCard.classList.add('bounce');

  els.opBadge.textContent      = q.badge;
  els.questionText.textContent = q.text;
  els.questionHint.textContent = q.hint || '';
  els.feedbackArea.innerHTML   = '';

  // Answer buttons
  els.answerGrid.innerHTML = '';
  q.choices.forEach((val, idx) => {
    const btn = document.createElement('button');
    btn.classList.add('answer-btn');
    btn.textContent = val;
    btn.id = `answer-btn-${idx}`;
    btn.setAttribute('aria-label', `Answer: ${val}`);
    btn.addEventListener('click', () => handleAnswer(btn, val, q.answer));
    els.answerGrid.appendChild(btn);
  });
}

/* =========================================================
   HANDLE ANSWER
   ========================================================= */
function handleAnswer(btn, chosen, correct) {
  if (state.answered) return;
  state.answered = true;

  els.answerGrid.querySelectorAll('.answer-btn').forEach(b => (b.disabled = true));

  const isCorrect = chosen === correct;

  if (isCorrect) {
    btn.classList.add('correct');
    state.score++;
    els.scoreVal.textContent = state.score;
    els.scoreVal.animate(
      [{ transform: 'scale(1.6)', color: 'hsl(47,100%,70%)' }, { transform: 'scale(1)', color: '' }],
      { duration: 400, easing: 'cubic-bezier(.34,1.56,.64,1)' }
    );
    showFeedback(pick(CORRECT_MSGS), 'correct');
  } else {
    btn.classList.add('wrong');
    // Highlight correct answer
    els.answerGrid.querySelectorAll('.answer-btn').forEach(b => {
      if (Number(b.textContent) === correct) b.classList.add('correct');
    });
    showFeedback(`${pick(WRONG_MSGS)} Answer: ${correct}`, 'wrong');
  }

  setTimeout(() => {
    state.current++;
    if (state.current < TOTAL_QUESTIONS) {
      renderQuestion();
    } else {
      showResult();
    }
  }, 1400);
}

function showFeedback(msg, type) {
  els.feedbackArea.innerHTML = `<div class="feedback-msg ${type}">${msg}</div>`;
}

/* =========================================================
   START GAME
   ========================================================= */
els.startBtn.addEventListener('click', startGame);

function startGame() {
  state.current = 0;
  state.score   = 0;
  els.scoreVal.textContent = '0';
  buildQuestions();
  showScreen('quiz');
  renderQuestion();
}

els.backHomeBtn.addEventListener('click', () => showScreen('home'));

/* =========================================================
   RESULT SCREEN
   ========================================================= */
function showResult() {
  showScreen('result');

  let trophy, title, subtitle, scoreText, denText, stars, showConfettiFlag;

  if (state.activity === 'math') {
    const score = state.score;
    const total = TOTAL_QUESTIONS;
    const pct   = score / total;
    
    if (pct === 1)       { trophy = '🏆'; title = 'PERFECT!';   subtitle = 'You got every single one right! Amazing!'; }
    else if (pct >= .8)  { trophy = '🥇'; title = 'Excellent!'; subtitle = "You're a math superstar! 🌟"; }
    else if (pct >= .6)  { trophy = '🥈'; title = 'Great job!'; subtitle = "Keep practicing and you'll be perfect!"; }
    else if (pct >= .4)  { trophy = '🥉'; title = 'Good try!';  subtitle = 'Practice makes perfect! 💪'; }
    else                 { trophy = '💡'; title = 'Keep going!'; subtitle = 'Every mistake helps you learn! Try again!'; }
    
    scoreText = score;
    denText = `/ ${total}`;
    stars = pct === 1 ? 3 : pct >= .7 ? 2 : pct >= .4 ? 1 : 0;
    showConfettiFlag = pct >= .6;
  } else {
    // Listen & Type
    const total = state.storyText.length;
    const mistakes = state.dictationMistakes;
    const accuracy = Math.max(0, Math.round(((total - mistakes) / total) * 100));

    if (mistakes === 0)      { trophy = '🏆'; title = 'PERFECT!';   subtitle = 'Superb spelling skill! You got 100% correct!'; }
    else if (mistakes === 1) { trophy = '🥇'; title = 'Spelling Master!'; subtitle = 'Splendid spelling, only one tiny mistake!'; }
    else if (mistakes <= 4)  { trophy = '🥈'; title = 'Great Effort!'; subtitle = 'You are getting super good at this! Keep it up!'; }
    else if (mistakes <= 9)  { trophy = '🥉'; title = 'Keep Learning!'; subtitle = 'Spelling takes practice! You are doing awesome!'; }
    else                     { trophy = '💡'; title = 'Let\'s practice!'; subtitle = 'Every spelling mistake makes us stronger spelling wizards!'; }

    scoreText = accuracy;
    denText = '% Correct';
    
    stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : mistakes <= 5 ? 1 : 0;
    showConfettiFlag = mistakes <= 4;
  }

  els.resultTrophy.textContent   = trophy;
  els.resultTitle.textContent    = title;
  els.resultSub.textContent      = subtitle;
  els.resultScoreNum.textContent = scoreText;
  els.resultScoreDen.textContent = denText;

  els.starsRow.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const s = document.createElement('span');
    s.classList.add('star-item');
    s.style.animationDelay = `${0.9 + i * .15}s`;
    s.textContent = i < stars ? '⭐' : '☆';
    els.starsRow.appendChild(s);
  }

  if (showConfettiFlag) launchConfetti();
}

els.playAgainBtn.addEventListener('click', () => {
  if (state.activity === 'math') {
    startGame();
  } else {
    startListenTypeGame();
  }
});
els.goHomeBtn.addEventListener('click', () => showScreen('home'));

/* =========================================================
   CONFETTI
   ========================================================= */
function launchConfetti() {
  const canvas = els.confettiCanvas;
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = [
    'hsl(47,100%,65%)', 'hsl(148,72%,55%)', 'hsl(271,78%,65%)',
    'hsl(340,85%,65%)', 'hsl(192,85%,65%)', 'hsl(31,95%,65%)',
  ];

  const pieces = Array.from({ length: 130 }, () => ({
    x:          Math.random() * canvas.width,
    y:          Math.random() * -canvas.height,
    w:          rand(8, 18),
    h:          rand(4, 10),
    color:      pick(COLORS),
    rot:        Math.random() * Math.PI * 2,
    speed:      rand(3, 7),
    rotSpeed:   (Math.random() - .5) * .2,
    wobble:     Math.random() * .08,
    wobblePhase: Math.random() * Math.PI * 2,
  }));

  let frame = 0;
  let rafId;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y   += p.speed;
      p.x   += Math.sin(p.wobblePhase + frame * p.wobble) * 1.5;
      p.rot += p.rotSpeed;
      if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 300) { rafId = requestAnimationFrame(draw); }
    else             { ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  if (rafId) cancelAnimationFrame(rafId);
  draw();
}

window.addEventListener('resize', () => {
  els.confettiCanvas.width  = window.innerWidth;
  els.confettiCanvas.height = window.innerHeight;
});
