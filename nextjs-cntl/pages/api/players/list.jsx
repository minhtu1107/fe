
export default async (req, res) => {

  try {
    let emailObj = Array.from(req.players.values()).map(val => { return val.email; });
    res.status(200);
    res.json(emailObj);
    return res.end();
  } catch (e) {
    res.status(500);
    res.json("No players list");
    return res.end();
  }
};