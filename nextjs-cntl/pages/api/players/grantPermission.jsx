import axios from "axios";
import { getToken } from "../../../services/auth";
import { getDefaultHeaders } from "../../../services/util";

export default async (req, res) => {
  const token = await getToken({ req });
  const headers = getDefaultHeaders(token);
  const params = {
    method: req.method,
    url: `${process.env.API_BASE_URL}/secure/grantPermission`,
    headers: headers,
    data: req.body,
  };

  debugger
  return axios(params)
    .then((response) => {
      // console.log("success", response.data);
      if(req.callback) {
        req.callback(req.body);
        req.callback = undefined;
      }
      
      res.status(200);
      res.json(response.data);
      return res.end();
    })
    .catch((err) => {
      console.log("err", err);
      res.status(err.response.status);
      res.json(err.response.data);
      return res.end();
    });
};