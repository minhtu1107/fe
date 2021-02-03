const {getPlayers} = require( '../../../services/players.jsx');

export default async (req, res) => {

  let emailObj = Array.from(getPlayers().values()).map(val => { return val.email; });

  res.status(200);
  res.json(emailObj);
  return res.end();
};