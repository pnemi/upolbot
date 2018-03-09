"use strict";

const
env = require("./env");

const AUTH_URL = env.SERVER_URL + "/authorize";
const HELP_URL = env.SERVER_URL + "/help";
const UPSEARCH_URL = "https://search.inf.upol.cz/";
const UPSEARCH_LOGO = UPSEARCH_URL + "static/images/upol-search-logo-chatbot.png";

exports.formatWelcome = message => {
  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type": "button",
        "text": message ||
        "Zde se můžeš přihlásit do studijní agendy (STAG) a prohlédnout si, na co se mě můžeš zeptat. Tyto možnosti jsou také dostupné v levém dolním menu označené symbolem \u2630 😎",
        "buttons":[
        {
          "type":"account_link",
          "url": AUTH_URL
        },
        {
          "type":"web_url",
          "url": HELP_URL,
          "title": "Dostupné příkazy",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
          "fallback_url": HELP_URL
        }
        ]
      }
    }
  };
};

exports.formatHelp = message => {
  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type": "button",
        "text": message,
        "buttons":[
        {
          "type":"web_url",
          "url": HELP_URL,
          "title": "Prohlédnout",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
          "fallback_url": HELP_URL
        }
        ]
      }
    }
  };
};

exports.formatGIF = props => {
  return {
    "attachment":{
      "type":"image",
      "payload":{
        "url": props.fixed_height_downsampled_url,
        "is_reusable": true
      }
    }
  };
};

exports.formatUPSearch = message => {
  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type": "generic",
        "elements":[
          {
            "title": "UPSearch",
            "subtitle":"První univerzitní fulltextový vyhledávač",
            "image_url": UPSEARCH_LOGO,
            "default_action": {
              "type": "web_url",
              "url": UPSEARCH_URL,
              "webview_height_ratio": "full",
              "messenger_extensions": true
            },
            "buttons":[
              {
                "type":"web_url",
                "url": UPSEARCH_URL,
                "title": "Otevřít",
                "webview_height_ratio": "full",
                "messenger_extensions": true
              }
            ]
          }
        ]
      }
    }
  };
};

exports.formatLogin = message => {
  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type": "button",
        "text": message,
        "buttons":[
          {
            "type":"account_link",
            "url": AUTH_URL
          }
        ]
      }
    }
  };
};

exports.formatLogout = message => {
  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type": "button",
        "text": message,
        "buttons":[
          {
            "type":"account_unlink"
          }
        ]
      }
    }
  };
};

exports.formatThesis = (props) => {

  let theses = [];

  props.forEach(thesis => {
    let element = {
      "title": thesis.temaHlavni,
      "subtitle": thesis.typPrace.capitalize() + " práce"
    };
    let buttons = [];

    if (thesis.downloadURL) {
      buttons.push({
        "type": "web_url",
        "title": "Text práce",
        "url": thesis.downloadURL
      });
    }

    if (thesis.posudekVedouciDownloadURL) {
      buttons.push({
        "type": "web_url",
        "title": "Posudek vedoucího",
        "url": thesis.posudekVedouciDownloadURL
      });
    }

    if (thesis.posudekOponentDownloadURL) {
      buttons.push({
        "type": "web_url",
        "title": "Posudek oponenta",
        "url": thesis.posudekOponentDownloadURL
      });
    }

    if (buttons.length > 0) {
      element.buttons = buttons;
    }

    theses.push(element);

  });

  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements": theses
      }
    }
  };
};

exports.formatStudentSchedule = props => {

  let events = [];

  props.forEach(event => {
    events.push({
      "title": event.hodinaSkutOd.value + " až " + event.hodinaSkutDo.value +
               " – " + event.nazev,
      "subtitle": event.typAkce +
                  " je v " + event.budova + " " + event.mistnost +
                  " s " + event.ucitel.prijmeni
    });
  });

  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements": events
      }
    }
  };

};

exports.formatTeacherSchedule = props => {

  let events = [];

  props.forEach(event => {
    events.push({
      "title": event.hodinaSkutOd.value + " až " + event.hodinaSkutDo.value +
               " – " + event.nazev,
      "subtitle": event.typAkce +
                  " je v " + event.budova + " " + event.mistnost
    });
  });

  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements": events
      }
    }
  };

};

const STUDY_TYPE = {
  "Doktorský": "doktorského",
  "Magisterský": "magisterského",
  "Bakalářský": "bakalářského",
  "Navazující": "navazujícího"
}

exports.formatStudents = props => {

  let students = props.map((s, i) => {
    return {
      "title": s[0],
      "subtitle": `${s[1]}. ročník ${STUDY_TYPE[s[2]]} studia`,
      "buttons":[
        {
          "type":"postback",
          "title":"Zvolit",
          "payload": i
        }
      ]
    };
  });

  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements": students
      }
    }
  };
};

exports.formatTeachers = props => {

  let teachers = props.map((t, i) => {
    let titulPred = t.titulPred ? t.titulPred + " " : "";
    let titulZa = t.titulZa ? " " + t.titulZa : "";
    let katedra = t.katedra ? " z pracoviště " + t.katedra : "";
    return {
      "title": `${titulPred}${t.jmeno} ${t.prijmeni}${titulZa}${katedra}`,
      "buttons":[
        {
          "type":"postback",
          "title":"Zvolit",
          "payload": i
        }
      ]
    };
  });

  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements": teachers
      }
    }
  };
};

exports.formatExamsDates = (props, enrolled) => {

  let title = (
    enrolled ?
    "Odhlásit se" :
    "Zapsat na termín"
  );

  let dates = [];

  for (let term in props) {
    let t = props[term];
    let item = {
      "title": term,
      "buttons":[
        {
          "type": "postback",
          "title": title,
          "payload": term
        }
      ]
    };
    if (enrolled) {
      let time = t[0].casOd.split(":").slice(0, 2).join(":");
      let date = t[0].datum.value;
      item.subtitle = `Zapsán na ${date} v ${time}`;
    }
    dates.push(item);
  }

  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements": dates
      }
    }
  };
};

exports.formatExamDates = props => {

  let dates = props.map((d, i) => {
    let time = d.casOd.split(":").slice(0, 2).join(":");
    let date = d.datum.value.split(".").slice(0, 2).join(".") + ".";
    return {
      "content_type": "text",
      "title": `${date} v ${time}`,
      "payload": i
    };
  });

  return {
    "text": "Vyber si termín",
    "quick_replies": dates
  }
};




exports.formatSubject = props => {

  let completion;
  if (props.typZkousky === "Zkouška" && props.maZapocetPredZk === "NE") {
    completion = "pouze zkouškou";
  } else if (props.typZkousky === "Zápočet" && props.maZapocetPredZk === "NE") {
    completion = "pouze zápočtem";
  } else if (props.typZkousky === "Zkouška" && props.maZapocetPredZk === "ANO") {
    completion = "zkouškou i zápočtem";
  } else if (props.typZkousky === "Kolokvium") {
    completion = "kolokviem";
  }

  return {
    "text": "Předmět " + props.nazev +
            " je unkončen " + completion +
            " za " + props.kreditu + " kreditů 😏"
  };
};
