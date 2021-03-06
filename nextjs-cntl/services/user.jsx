import axios from 'axios';
import qs from 'qs';
import { getDefaultHeaders, getUrl } from './util';

const loginCallback = (params) => {
  const url = getUrl('auth/callback/credentials');
  return axios.post(url, params);
}

const login = (params) => {
  const url = getUrl('oauth/token');
  // console.log("request login  " + url);
  return axios.post(url, qs.stringify(params), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization' : "Basic " + Buffer.from("cntl:secret").toString('base64'),
    }
  });
}

const logout = (params) => {
  const url = getUrl('auth/signout');
  return axios.post(url, params);
}

const hello = (params) => {
  const url = getUrl('hello');
  console.log("request hello  " + url);
  return axios.get(url);
}

const helloSecure = (params) => {
  const url = getUrl('secure/hello');
  console.log("request hello  " + url);
  return axios.get(url);
}

const getPlayersList = (params) => {
  const url = getUrl('players/list');
  console.log("request players/list  " + url);
  return axios.get(url);
}

const getAllUsers = (page) => {
  const url = getUrl('getAllUsers');
  console.log("request getUserList/list  " + url);
  return axios.get(url, {params:{page:page}});
}

const removeUser = (userId) => {
  const url = getUrl('removeUser');
  console.log("removeUser  " + url);
  return axios.delete(url, {params:{id:userId}});
}

const addUser = (params) => {
  const url = getUrl('addUser');
  return axios.put(url, params);
}

const grantPermission = (params) => {
  const url = getUrl('players/grantPermission');
  console.log("secure/grantPermission client  " + url);
  return axios.post(url, params);
}

export {
  loginCallback,
  login,
  logout,
  hello,
  helloSecure,
  getPlayersList,
  getAllUsers,
  removeUser,
  addUser,
  grantPermission,
};