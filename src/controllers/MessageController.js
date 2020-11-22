const Sessions = require("../services/session");

exports.send = async (req, res) => {
  var result = await Sessions.sendText(
    req.body.sessionName,
    req.body.number,
    req.body.text
  );

  res.json(result);
}