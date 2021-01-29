import { getSession } from 'next-auth/client';
// const conf = require('../config/const.json');

const isAdmin = async (context) => {
  const session = await getSession(context);
  if (!session || session.role !== "conf.role.admin") {
    return false;
  }
  return true;
};

const getSessionFromContext = async (context) => {
  const session = await getSession(context);
  if (!session) {
    return null;
  }
  return session;
}

const getToken = async ({ req }) => {
  const jwt = require('next-auth/jwt');
  const secret = process.env.SECRET;
  const secureCookie = (process.env.NODE_ENV === 'production');
  const session = await jwt.getToken({ req, secret, secureCookie });

  return session.token;
};

export {
  isAdmin,
  getSessionFromContext,
  getToken,
};