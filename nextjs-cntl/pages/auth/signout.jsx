import Router from 'next/router';
import { useEffect } from 'react';
import { logout } from '../../services/user';
import { destroyCookie } from 'nookies';

const signout = () => {

  useEffect(() => {
    const signOut = async () => {

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