const
  moment = require("moment"),
  { isWoman } = require("vokativ");

moment.locale("cs"); // cs datetime locales

const TITLES = [
  { title: "prof.", masculine: "profesor", feminine: "profesorka"},
  { title: "doc.", masculine: "docent", feminine: "docentka"},
  { title: "MUDr.", masculine: "doktor medicíny", feminine: "doktorka medicíny"},
  { title: "MVDr.", masculine: "doktor veterinární medicíny", feminine: "doktorka veterinární medicíny"},
  { title: "MDDr.", masculine: "doktor zubního lékařství", feminine: "doktorka zubního lékařství"},
  { title: "PharmDr.", masculine: "doktor farmacie", feminine: "doktorka farmacie"},
  { title: "JUDr.", masculine: "doktor práv", feminine: "doktorka práv"},
  { title: "PhDr.", masculine: "doktor filozofie", feminine: "doktorka filozofie"},
  { title: "RNDr.", masculine: "doktor přírodních věd", feminine: "doktorka přírodních věd"},
  { title: "ThDr.", masculine: "doktor teologie", feminine: "doktorka teologie"},
  { title: "Ph.D.", masculine: "doktor", feminine: "doktorka"},
  { title: "Th.D.", masculine: "doktor teologie", feminine: "doktorka teologie"},
  { title: "Ing.", masculine: "inženýr", feminine: "inženýrka"},
  { title: "Ing. arch.", masculine: "inženýr architekt", feminine: "inženýrka architektka"},
  { title: "Mgr.", masculine: "magistr", feminine: "magistra"},
  { title: "PhMr.", masculine: "magistr farmacie", feminine: "magistra farmacie"},
  { title: "MgA.", masculine: "magistr umění", feminine: "magistra umění"},
  { title: "Bc.", masculine: "bakalář", feminine: "bakalářka"},
  { title: "BcA.", masculine: "bakalářk umění", feminine: "bakalářka umění"},
  { title: "DiS.", masculine: "diplomovaný specialista", feminine: "diplomovaná specialistka"}
];

const getTeacherTitlesAbbr = teacher => {
  let before = teacher.titulPred ? teacher.titulPred.split(" ") : [];
  let after = teacher.titulZa ? teacher.titulZa.split(" ") : [];
  return [...before, ...after];
};

const getTeacherAddressing = teacher => {
  let titlesAbbr = getTeacherTitlesAbbr(teacher);
  let gender = isWoman(teacher.jmeno) ? "feminine" : "masculine";
  if (titlesAbbr.length > 0) {
    for (let i = 0; i < TITLES.length; i++) {
      if (titlesAbbr.includes(TITLES[i].title)) {
        return TITLES[i][gender];
      }
    }
  }

  return gender === "feminine" ? "paní" : "pan";
};

const WEEKDAYS_PREFIX = [
  "v pondělí",
  "v úterý",
  "ve středu",
  "ve čtvrtek",
  "v pátek",
  "v sobotu",
  "v neděli"
];

const formatDate = (dateObj, withWeekday = true) => {
  if (!dateObj) {
    return "dnes";
  }
  let today = moment().startOf("day");
  let daysDiff = dateObj.diff(today, "days");
  if (daysDiff === 0) {
    return "dnes";
  } else if (daysDiff === 1) {
    return "zítra";
  } else if (daysDiff === -1) {
    return "včera";
  } else {
    let formattedDate = dateObj.format("D.M.");
    if (withWeekday) {
      formattedDate = `${WEEKDAYS_PREFIX[dateObj.isoWeekday() - 1]} ${formattedDate}`;
    }
    return formattedDate;
  }
};

const formatReply = (message, params) => {
  let formatted = message;
  for (const key in params) {
    let placeholder = new RegExp("\\{" + key + "\\}", "gi");
    let substitute = params[key];
    formatted = formatted.replace(placeholder, substitute);
  }
  return formatted;
};

const reply = (msgPool, params) => {
  let message = msgPool[Math.floor(Math.random() * msgPool.length)];
  if (params) {
    message = formatReply(message, params);
  }
  return message;
};

module.exports = {
  reply,
  formatDate,
  getTeacherAddressing
};
