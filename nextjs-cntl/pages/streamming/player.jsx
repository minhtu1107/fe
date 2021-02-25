import React, { useState, useEffect } from 'react';
import Head from 'next/head'
import { getSessionFromContext } from '../../services/auth';
import { redirectTo } from '../../services/util';
import ControlPopup from '../../components/stream/ControlPopup';
import Select from 'react-select';

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

  const [permission, setPermission] = useState(false);
  const [userList, setUserList] = useState([]);

  const options = [
    { value: '1', label: 'Chocolate' },
    { value: '2', label: 'Strawberry' },
    { value: '3', label: 'Vanilla' }
  ]
  
  const handleChange = (selected) => {
    console.log(`Option selected:`, selected);
  }

  useEffect(() => {
    setConnectedCallback(updateConnectedUser);
  }, []);

  const updateConnectedUser = (users) => {
    console.log("updateConnectedUser");
	  setUserList(users);
  }

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
          role={props.user.role}
          userList={userList}
        />  
        <div id="userName" className="user-name" >{props.user.email}</div>
        <div className="permission-list">
          <Select instanceId='permission' options={options} isClearable={true} onChange={handleChange}/>
        </div>
      </div>

    </div>
  );
}

export default Player;