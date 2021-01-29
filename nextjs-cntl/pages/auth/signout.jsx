import Router from 'next/router';
import { useEffect } from 'react';
import { getCsrfToken } from 'next-auth/client';
import { logout } from '../../services/user';
import { useSession } from 'next-auth/client';

const signout = () => {
  const [session, loading] = useSession();

  useEffect(() => {
    const signOut = async () => {
      const csrfToken = await getCsrfToken();
      await logout({ csrfToken });
      Router.push('/auth/signin');
    };

    signOut();
  }, [session]);

  if (typeof window === 'undefined' && loading) {
    return null;
  }

  return null;
};

export async function getStaticProps() {
  return {
    props: {}
  };
};

export default signout;