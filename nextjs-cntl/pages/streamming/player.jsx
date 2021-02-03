import React, { useState, useEffect } from 'react';
import Head from 'next/head'
import { getSessionFromContext } from '../../services/auth';
import { redirectTo } from '../../services/util';
import ControlPopup from '../../components/stream/ControlPopup';

export async function getServerSideProps(context) {
  const user = await getSessionFromContext(context);
  if (!user) {
    redirectTo(context, '/auth/signin');
  }

  // console.log("home  " + JSON.stringify(user));

  return {
    props: {
      user,
    }
  };
}

const Player = (props) => {

  useEffect(() => {
    console.log("aaaaaaaaa");
    load();
    setEmail(props.user.email);
  }, []);

  return (
    <div>
      <Head>
        <link type="text/css" rel="stylesheet" href="/player.css" />
      </Head>

      <div id="playerUI">
        <div id="player"></div>
        <ControlPopup
          role={props.user.role}>
        </ControlPopup>
        <div id="userName" className="user-name" >{props.user.email}</div>
      </div>

    </div>
  );
}

export default Player;