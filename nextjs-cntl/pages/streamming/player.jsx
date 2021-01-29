import React, { useState, useEffect } from 'react';
import Head from 'next/head'
import Router from 'next/router';
import { getSessionFromContext } from '../../services/auth';
import { redirectTo } from '../../services/util';
import {hello, helloSecure} from '../../services/user'

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

const Player = () => {

  let [text, setText] = useState('aaa aaa');
  
  const helloP = () => {
    hello({})
      .then(response => {
        setText(response.data);
      })
      .catch(err => {
        console.log("err");
      });    
  }

  const helloS = () => {
    helloSecure({})
      .then(response => {
        setText(response.data);
      })
      .catch(err => {
        console.log("err");
      });    
  }

  useEffect(() => {
    console.log("aaaaaaaaa");
    load();
  }, []);

  const logout = () => {
	  disconnect();
	  Router.push('/auth/signout');
  }

  return (
    <div>
      <Head>
        <link type="text/css" rel="stylesheet" href="/player.css" />
        <script src="/socket.io/socket.io.js"></script>
        {/* <script type="text/javascript" src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
        <script type="text/javascript" src="/scripts/webRtcPlayer.js"></script>
        <script type="text/javascript" src="/scripts/app.js"></script> */}
      </Head>
      <button onClick={helloP}>hello</button>
      <button onClick={helloS}>helloSecure</button>
      <div>{text}</div>
      <div id="playerUI">
        <div id="player"></div>
        <div id="overlay" className="overlay">
          <div id="overlayButton">+</div>
          <div id="overlaySettings">
            <div id="KickOthers">
              <div className="settings-text">Kick all other players</div>
              <label className="btn-overlay">
                <input type="button" id="kick-other-players-button" className="overlay-button btn-flat" value="Kick" />
              </label>
            </div>
            <div id="FillWindow">
              <div className="settings-text">Enlarge Display to Fill Window</div>
              <label className="tgl-switch">
                <input type="checkbox" id="enlarge-display-to-fill-window-tgl" className="tgl tgl-flat" defaultChecked />
                <div className="tgl-slider"></div>
              </label>
            </div>
            <div id="QualityControlOwnership">
              <div className="settings-text">Quality control ownership</div>
              <label className="tgl-switch">
                <input type="checkbox" id="quality-control-ownership-tgl" className="tgl tgl-flat" />
                <div className="tgl-slider"></div>
              </label>
            </div>
            <div id="statsSetting">
              <div className="settings-text">Show Stats</div>
              <label className="tgl-switch">
                <input type="checkbox" id="show-stats-tgl" className="tgl tgl-flat" />
                <div className="tgl-slider"></div>
              </label>
              <div id="statsContainer">
                <div id="stats"></div>
              </div>
            </div>
            <div id="Logout">
              <div className="settings-text">Logout</div>
              <label className="btn-overlay">
                {/* <input type="button" id="logout" className="overlay-button btn-flat" value="-" /> */}
                <button onClick={logout}>-</button>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;