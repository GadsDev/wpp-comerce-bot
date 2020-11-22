exports.send = (req, res) => {
  const {
    text,
  } = req.body;

  return res.status(200).json(`Send message: ${text}`);
}