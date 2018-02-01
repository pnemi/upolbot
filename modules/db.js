const
  pg = require("pg"),
  env = require("./env"),
  crypt = require("./crypt"),
  client = new pg.Client(env.DB_URL);

const queries = {
  insertStudent: "INSERT INTO students (fb_psid, stag_username, stag_password, stag_number) " +
                 "SELECT $1, $2, $3, $4 " +
                 "WHERE NOT EXISTS (SELECT 1 FROM students WHERE fb_psid=$1)",
  existsStudentByPSID: "SELECT EXISTS(SELECT 1 FROM students WHERE fb_psid=$1)",
  selectStudentWithAuthByPSID: "SELECT * FROM students " +
                               "WHERE fb_psid=$1 LIMIT 1",
  selectStudentByPSID: "SELECT (fb_psid, stag_username, stag_number) " +
                       "FROM students " +
                       "WHERE fb_psid=$1 LIMIT 1",
  deleteStudentByPSID: "DELETE FROM students WHERE fb_psid=$1"
}


client.connect(error => {
  if (error) {
    console.log("Database error: Unable to connect");
    throw error;
  }
});

exports.STUDENT_NOT_FOUND = "1";

exports.insertStudent = (fb_psid, stag_username, stag_password, stag_number) => {
  return new Promise((resolve, reject) => {
    client.query({
      text: queries.insertStudent,
      values: [fb_psid, stag_username, crypt.encrypt(stag_password), stag_number]
    }, (error, result) => {
      if (error) {
        console.log("Error insertStudent query: ", error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

exports.existsStudentByPSID = (fb_psid) => {
  return new Promise((resolve, reject) => {
    client.query({
      text: queries.existsStudentByPSID,
      values: [fb_psid]
    }, (error, result) => {
      if (error) {
        console.log("Error existsStudentByPSID query: ", error);
        reject(error);
      } else {
        resolve(result.rows[0].exists);
      }
    });
  });
};

exports.selectStudentWithAuthByPSID = (fb_psid) => {
  return new Promise((resolve, reject) => {
    client.query({
      text: queries.selectStudentWithAuthByPSID,
      values: [fb_psid]
    }, (error, result) => {
      if (error) {
        console.log("Error selectStudentWithAuthByPSID query: ", error);
        reject(error);
      } else if (result.rowCount === 0) {
        resolve(exports.STUDENT_NOT_FOUND);
      } else {
        result.rows[0].stag_password = crypt.decrypt(result.rows[0].stag_password);
        resolve(result.rows[0]);
      }
    });
  });
};

exports.selectStudentByPSID = (fb_psid) => {
  return new Promise((resolve, reject) => {
    client.query({
      text: queries.selectStudentByPSID,
      values: [fb_psid]
    }, (error, result) => {
      if (error) {
        console.log("Error selectStudentByPSID query: ", error);
        reject(error);
      } else if (result.rowCount === 0) {
        resolve(exports.STUDENT_NOT_FOUND);
      } else {
        resolve(result.rows[0]);
      }
    });
  });
};

exports.deleteStudentByPSID = (fb_psid) => {
  return new Promise((resolve, reject) => {
    client.query({
      text: queries.deleteStudentByPSID,
      values: [fb_psid]
    }, (error, result) => {
      if (error) {
        console.log("Error deleteStudentByPSID query: ", error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};
