const reply = (MSG, index) => {
  if (index) {
    return
  } else {
    let msgPool = MESSAGES[MSG];
    return msgPool[Math.floor(Math.random() * msgPool.length)];
  }
};

const MESSAGES = {
  LOGIN_NEEDED: [
    "K tomu potřebuju, aby ses přihlásil do studijní agendy (STAG) 🙂 👇",
    "Abych věděl, kdo jsi, přihlaš se mi tu do STAGu, prosím 😜"
  ],
  HELP: [
    "Seznam dostupných příkazů 🙂",
    "Koukni na to, co umím ✌️"
  ]
};

module.exports = reply;
