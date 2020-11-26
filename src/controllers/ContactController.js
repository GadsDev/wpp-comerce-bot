const Sessions = require("../services/session");

exports.getAll = async (req, res) => {
  const {
    sessionName,
    isSave = false
  } = req.query

  const sessionValue = await Sessions.contactList(sessionName, isSave);

  res.send(sessionValue);
};