const
  dice = require("dice-coefficient"),
  moment = require("moment");

moment.locale("cs");

const IS_NUMERIC = /^\d+$/;

const MONTHS = [
  {
    expr: "Leden",
    getNorm: 1
  },
  {
    expr: "Únor",
    getNorm: 2
  },
  {
    expr: "Březen",
    getNorm: 3
  },
  {
    expr: "Duben",
    getNorm: 4
  },
  {
    expr: "Květen",
    getNorm: 5
  },
  {
    expr: "Červen",
    getNorm: 6
  },
  {
    expr: "Červenec",
    getNorm: 7
  },
  {
    expr: "Srpen",
    getNorm: 8
  },
  {
    expr: "Září",
    getNorm: 9
  },
  {
    expr: "Říjen",
    getNorm: 10
  },
  {
    expr: "Listopad",
    getNorm: 11
  },
  {
    expr: "Prosinec",
    getNorm: 12
  }
];

const TEMPORAL_ABS_EXPRS = [
  {
    exprs: ["dnes", "dnešní"],
    getNorm: () => moment()
  },
  {
    exprs: ["zítra", "zítřejší"],
    getNorm: () => moment().add(1, "day")
  },
  {
    exprs: ["pozítří"],
    getNorm: () => moment().add(2, "day")
  },
  {
    exprs: ["včera", "včerejší"],
    getNorm: () => moment().subtract(1, "day")
  },
  {
    exprs: ["předevčířem", "předvčera"],
    getNorm: () => moment().subtract(2, "day")
  },
  {
    exprs: ["pondělí"],
    getNorm: () => moment().startOf("week")
  },
  {
    exprs: ["úterý"],
    getNorm: () => moment().startOf("week").add(1, "day")
  },
  {
    exprs: ["středa"],
    getNorm: () => moment().startOf("week").add(2, "day")
  },
  {
    exprs: ["čtvrtek"],
    getNorm: () => moment().startOf("week").add(3, "day")
  },
  {
    exprs: ["pátek"],
    getNorm: () => moment().startOf("week").add(4, "day")
  },
  {
    exprs: ["sobota"],
    getNorm: () => moment().startOf("week").add(5, "day")
  },
  {
    exprs: ["neděle"],
    getNorm: () => moment().startOf("week").add(6, "day")
  }
];

const TEMPORAL_REL_EXPRS = [
  {
    exprs: ["příští", "další", "budoucí", "následující"],
    getNorm: date => date.add(1, "week")
  },
  {
    exprs: ["minulý", "předchozí", "předešlý", "předcházející"],
    getNorm: date => date.subtract(1, "week")
  }
];

const MONTH_POS = new Set("NN");
const DAY_POS = new Set("NN", "Db");

const SIMILARITY_THRESHOLD = 0.4;

exports.normalizeTime = (entities, tags) => {
  if (!entities.day && !entities.month) {
    let filteredTags = tags.filter(t => t[1] === "NN" && t[2][0] !== "_");
    let scores = TEMPORAL_ABS_EXPRS.flatMap((t, iTemp) => {
      return t.exprs.flatMap(expr => {
        return tags.map((t, iToken) => ({
          score: dice(expr, t[0]),
          iTemp: iTemp
        }));
      });
    });

    let result = scores.reduce((max, cur) => {
      return cur.score > max.score ? cur : max;
    }, scores[0]);

    if (result >= SIMILARITY_THRESHOLD) {
      let date = TEMPORAL_ABS_EXPRS[result.iTemp].getNorm();

      if (date.isBefore(moment())) {
        date = date.add(1, "week");
      }

      entities.day = date.format("D");
      entities.month = date.format("M");

    }

  } else if (!IS_NUMERIC.test(entities.month)) {
    let similarity = MONTHS.map(m => dice(m.expr, entities.month));
    let mostSimilar = similarity.indexOf(Math.max(...similarity));
    entities.month = MONTHS[mostSimilar].getNorm;
  }
}
