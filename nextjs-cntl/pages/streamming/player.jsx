import React, { useState, useEffect } from 'react';
import Head from 'next/head'
import { getSessionFromContext } from '../../services/auth';
import { redirectTo } from '../../services/util';
import {hello, helloSecure} from '../../services/user';
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

  let [text, setText] = useState('aaa aaa');
  
  // const helloP = () => {
  //   hello({})
  //     .then(response => {
  //       setText(response.data);
  //     })
  //     .catch(err => {
  //       console.log("err");
  //     });    
  // }

  // const helloS = () => {
  //   helloSecure({})
  //     .then(response => {
  //       setText(response.data);
  //     })
  //     .catch(err => {
  //       console.log("err");
  //     });    
  // }

  useEffect(() => {
    console.log("aaaaaaaaa");
    load();
  }, []);

  return (
    <div>
      <Head>
        <link type="text/css" rel="stylesheet" href="/player.css" />
      </Head>
      {/* <button onClick={helloP}>{props.user.email}</button>
      <button onClick={helloS}>helloSecure</button>
      <div>{text}</div> */}
      <div id="playerUI">
        <div id="player"></div>
        <ControlPopup></ControlPopup>
      </div>
    </div>
  );
}

export default Player;