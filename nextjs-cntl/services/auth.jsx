import { getSession } from 'next-auth/client';
import { setCookie, parseCookies, destroyCookie } from 'nookies';

// const conf = require('../config/const.json');

const isAdmin = async (context) => {
  const session = await getSessionFromContext(context);
  if (!session || session.role !== "conf.role.admin") {
    return false;
  }
  return true;
};

const getSessionFromContext = async (context) => {
  const session = parseCookies(context);
  console.log("ssssssss " + JSON.stringify(session));
  if (!session.session_token) {
    return null;
  }
  return session.session_token;
}

const getToken = async ({ req }) => {
  // const jwt = require('next-auth/jwt');
  // const secret = process.env.SECRET;
  // const secureCookie = (process.env.NODE_ENV === 'production');
  // const session = await jwt.getToken({ req, secret, secureCookie });

  const session = await getSessionFromContext({ req });
  if (!session.session_token) {
    return null;
  }

  return session.session_token.access_token;
};

const setUserCookie = (context, key, data) => {
  const options = {
    maxAge: 24 * 60 * 60,
    path: '/',
  };
  setCookie(context, key, JSON.stringify(data), options);
}

export {
  isAdmin,
  getSessionFromContext,
  getToken,
  setUserCookie,
};