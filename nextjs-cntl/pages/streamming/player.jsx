import React, { useState, useEffect } from 'react';
import Head from 'next/head'
import Router from 'next/router';
import { getSessionFromContext } from '../../services/auth';
import { redirectTo } from '../../services/util';
import ControlPopup from '../../components/stream/ControlPopup';
import Select from 'react-select';
import { grantPermission } from '../../services/user';

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

  const options = [
    { value: '1', label: 'Chocolate' },
    { value: '2', label: 'Strawberry' },
    { value: '3', label: 'Vanilla' }
  ]

  const [permission, setPermission] = useState(false);
  const [userList, setUserList] = useState([]);
  const [permissionList, setPermissionList] = useState(options);
  
  const handleChange = (selected) => {
    console.log(`Option selected:`, selected);
    var emails = [props.user.email];
    if(selected!=null && selected!=undefined) {
      emails.push(selected.label);
    }

    grantPermission(emails)
      .then(res => {
        // console.log(`Option selected: res `, JSON.stringify(res));
      });
  }

  useEffect(() => {
    setConnectedCallback(updateConnectedUser);
    setIsAdminCallback(isAdmin);
  }, []);

  const updateConnectedUser = (users) => {
    console.log("updateConnectedUser");
	  setUserList(users);
    if(users.length>0) {
      let temp = users.map( (val, idx) => {
        return {value:idx, label:val};
      });
      setPermissionList(temp);
    }
  }

  const isAdmin = () => {
    console.log("isAdmin");
	  return (props.user.role === 'ROLE_ADMIN');
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
        {
          (props.user.role === 'ROLE_ADMIN') ? (
            <div className="permission-list">
              <button className="c-btn" onClick={() => { Router.push('/admin'); }}>{"Admin"}</button>
              <div className="permission-list-select">
                <Select instanceId='permission' options={permissionList} isClearable={true} onChange={handleChange} />
              </div>
            </div>
          ) : ''
        }
        {/* <div id="stats" style={{
          top:'10%',
          position:'absolute',
          zIndex:'100'
        }}>FPS</div> */}

        <div id="statsContainer" style={{
          top:'10%',
          position:'absolute',
          zIndex:'100'}}
          >
          <div id="stats"></div>
        </div>
      </div>

    </div>
  );
}

export default Player;