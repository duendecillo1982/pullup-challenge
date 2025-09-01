// Vervang deze config door die van jouw Firebase project
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOeEhI5JSfWRKecQrrLtPGrElTMbR41mY",
  authDomain: "pull-up-challenge.firebaseapp.com",
  databaseURL: "https://pull-up-challenge-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pull-up-challenge",
  storageBucket: "pull-up-challenge.firebasestorage.app",
  messagingSenderId: "695125025201",
  appId: "1:695125025201:web:3403500f63488e94175d90"
};

// Firebase initialisatie
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

db.ref('/').once('value').then(snapshot => {
  console.log('Firebase DB snapshot:', snapshot.val());
}).catch(err => {
  console.error('Firebase error:', err);
});

// Elementen ophalen
const form = document.getElementById('pullUpForm');
const nameInput = document.getElementById('nameInput');
const pullUpsInput = document.getElementById('pullUpsInput');
const messageEl = document.getElementById('message');
const leaderboardEl = document.getElementById('leaderboard');
const statsEl = document.getElementById('stats');

// Data structuur deelnemers in database: 
// deelnemers: { key (lowercase naam): { name, totalPullUps, sets } }

// Formulierverwerking
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const pullUps = parseInt(pullUpsInput.value);

  if (!name) {
    showMessage('Voer een naam in!', true);
    nameInput.focus();
    return;
  }
  if (isNaN(pullUps) || pullUps < 1) {
    showMessage('Voer een geldig aantal pull-ups in (minimaal 1)!', true);
    pullUpsInput.focus();
    return;
  }

  addEntry(name, pullUps);
  nameInput.value = '';
  pullUpsInput.value = '';
  nameInput.focus();
  showMessage('Set toegevoegd!', false);
});

// Functie om entry aan Firebase toe te voegen
function addEntry(name, pullUps) {
  const key = name.toLowerCase();

  // Ophalen huidige data voor deze deelnemer
  db.ref('deelnemers/' + key).get().then(snapshot => {
    const existing = snapshot.val();

    if (existing) {
      const nieuweTotaal = existing.totalPullUps + pullUps;
      const nieuweSets = existing.sets + 1;

      db.ref('deelnemers/' + key).set({
        name: name,
        totalPullUps: nieuweTotaal,
        sets: nieuweSets
      });
    } else {
      db.ref('deelnemers/' + key).set({
        name: name,
        totalPullUps: pullUps,
        sets: 1
      });
    }
  });
}

// Live leaderboard tonen
function updateLeaderboard(data) {
  leaderboardEl.innerHTML = '';

  if (!data) {
    statsEl.textContent = 'Geen deelnemers.';
    return;
  }

  // Convert object naar array
  const deelnemersArray = Object.values(data);

  // Sorteren op totaal aantal pull-ups (desc)
  deelnemersArray.sort((a, b) => b.totalPullUps - a.totalPullUps);

  // Totaal stats
  const totaalPullUps = deelnemersArray.reduce((sum, d) => sum + d.totalPullUps, 0);
  statsEl.textContent = `Aantal deelnemers: ${deelnemersArray.length} | Totaal pull-ups: ${totaalPullUps}`;

  deelnemersArray.forEach((deelnemer, index) => {
    const div = document.createElement('div');
    div.classList.add('leaderboard-entry');

    // Kleurcodering top 3
    if (index === 0) div.classList.add('rank-gold');
    else if (index === 1) div.classList.add('rank-silver');
    else if (index === 2) div.classList.add('rank-bronze');

    div.innerHTML = `
      <span class="rank">${index + 1}</span>
      <span class="name">${deelnemer.name}</span>
      <span class="total">${deelnemer.totalPullUps} pull-ups</span>
      <span class="sets">${deelnemer.sets} set${deelnemer.sets > 1 ? 's' : ''}</span>
    `;
    leaderboardEl.appendChild(div);
  });
}

// Bericht weergeven
function showMessage(text, isError) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? 'red' : 'green';

  setTimeout(() => {
    messageEl.textContent = '';
  }, 3000);
}

// Luister realtime naar database veranderingen
db.ref('deelnemers').on('value', (snapshot) => {
  const data = snapshot.val();
  updateLeaderboard(data);

});


