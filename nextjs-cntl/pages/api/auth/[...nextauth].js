import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import { login } from '../../../services/user';

const options = {
  site: process.env.NEXTAUTH_URL,
  basePath: '/api/auth',
  secret: process.env.SECRET,
  session: {
    jwt: true,
    maxAge: 60 * 60
  },
  useSecureCookies: false,
  providers: [
    Providers.Credentials({
      authorize: async (credentials) => {
        const { email, password } = credentials;
        try {
          var param = {};
          param["username"] = email;
          param["password"] = password;
          param["grant_type"] = "password";
          // console.log("param " + JSON.stringify(param));
          const response = await login(param);
          if (!response.data.access_token) {
            return Promise.reject(new Error("Invalid email or password"));
          }
          console.log(response.data);
          return Promise.resolve(response.data);
        } catch (error) {
          console.log('error');
          console.log(error);
          return Promise.reject(new Error("Invalid email or password"));
        }
      }
    })
  ],
  jwt: {
    secret: process.env.SECRET,
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    session: async (session, user) => {
      // console.log("session  " + JSON.stringify(user));
      session = {
        id: user.id,
        email: user.email,
        token: user.access_token
      }
      return Promise.resolve(session);
    },
    jwt: async (token, user, account, profile) => {
      if (user) {
        // console.log("jwt  " + JSON.stringify(user));
        // console.log("jwt  account " + JSON.stringify(account));
        // console.log("jwt  profile " + JSON.stringify(profile));
        token = {
          id: user.id,
          email: user.email,
          token: user.access_token
        }
      }
      return Promise.resolve(token);
    }
  },

  debug: false
};

export default (req, res) => NextAuth(req, res, options);