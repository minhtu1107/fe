import Router from 'next/router';
import { useEffect } from 'react';
import { getCsrfToken } from 'next-auth/client';
import { logout } from '../../services/user';
import { useSession } from 'next-auth/client';
import { destroyCookie } from 'nookies';

const signout = () => {

  useEffect(() => {
    const signOut = async () => {
      // const csrfToken = await getCsrfToken();
      // await logout({ csrfToken });

      await logout();
      destroyCookie(null, "session_token", { path: '/' });
      
      Router.push('/auth/signin');
    };

    signOut();
  });

  return null;
};

export async function getStaticProps() {
  return {
    props: {}
  };
};

export default signout;