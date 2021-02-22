import { useEffect, useState, useRef } from 'react';
import { redirectTo } from '../../services/util';
import { getSessionFromContext } from '../../services/auth';
import { getAllUsers, removeUser, addUser } from '../../services/user';
import Select from 'react-select';

export async function getServerSideProps(context) {
  const user = await getSessionFromContext(context);
  if (!user) {
    redirectTo(context, '/auth/signin');
  }

  const userList = await getAllUsers().then(res => { console.log(res.data); return res.data });

  return {
    props: {
      user,
      userList
    }
  };
}

export default function admin(props) {

  const [userList, setUserList] = useState(props.userList);
  const [newUser, setNewUser] = useState({id:0, email:"", password:"", role:""});

  const handleRoleChange = (selected) => {
    console.log(`Option selected:`, selected);
    setNewUser({
      ...newUser,
      role: selected.value
    })
  }

  const handleAddUserInfo = (e) => {
    let {name,value} = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    })
  }

  const getUsers = () => {
    getAllUsers().then(res => { setUserList(res.data) });
  }

  const addAUser = () => {
    addUser(newUser).then(res => {
      console.log(res.data);
      getUsers();
    });
  }

  const removeAUser = (id) => {
    removeUser(id).then(res => {
      console.log(res.data);
      getUsers();
    });
  }

  const renderUsers = () => {
    return (
      userList.length > 0 ? userList.map(u => (
        <div className='user-container' key={u.id}>
          <div className='user-header'>
            <div>Id</div>
            <div className='user-header-id'>{u.id}</div>
          </div>
          <div className='user-detail'>
            <div>
              <div>Email</div>
              <div className='email-background'>{u.email}</div>
            </div>
            <div className='user-status'>
              <div>Status</div>
              <div className='status-background'>2</div>
            </div>
            <div className='remove-btn'>
              <button className="c-btn" onClick={() => removeAUser(u.id)}>{"Remove"}</button>
            </div>
          </div>
          <style jsx>{`
            .user-container {
              border: 1px solid black;
              margin-left: 50px;
              margin-right: 50px;
              margin-bottom: 50px;
            }

            .user-header {
              display: flex;
              flex-direction: row;
              background-color: darkgrey;
              padding: 10px;
            }

            .user-header-id {
              margin-left: 2px;
              color: white;
              background-color: darkblue;
              width: 50px;
              text-align: center;
            }

            .user-detail {
              display: flex;
              flex-direction: row;
              padding: 10px;
              align-items: center;
            }

            .email-background {
              background-color: #ededed;
              width: 250px;
              padding: 5px;
            }

            .user-status {
              margin-left: 20px;
            }

            .status-background {
              background-color: #ededed;
              width: 100px;
              padding: 5px;
            }

            .remove-btn {
              margin-left: 20px;
              flex-grow: 1;
              display: flex;
              justify-content: flex-end;
            }
        `}
        </style>
        </div>
      )) : (<div>
        No user
      </div>)
    )
  }

  const options = [
    { value: '1', label: 'Admin' },
    { value: '2', label: 'Editor' },
    { value: '3', label: 'Viewer' }
  ]

  return (
    <div>
      <div className='add-new-container'>
        <div className='email-space'>
          <input
            type="text"
            name="email"
            className="c-textField"
            placeholder={"Enter email"}
            onChange={handleAddUserInfo}
          />
        </div>
        <div className='space'></div>
        <div className='email-space'>
          <input 
            type="password"
            name="password" 
            className="c-textField" 
            placeholder={"Enter password"} 
            onChange={handleAddUserInfo}
            />
        </div>
        <div className='space'></div>
        <div className='role-space'>
          <Select instanceId='role' options={options} isClearable={true} onChange={handleRoleChange} />
        </div>
        <div className='space'></div>
        <div className='role-space'>
          <button className="c-btn" onClick={addAUser}>{"Add"}</button>
        </div>
      </div>
      {renderUsers()}

      <style jsx>{`
        .add-new-container {
          width: 50%;
          display: flex;
          flex-direction: row;
          margin: 50px;
        }

        .email-space {
          flex: 3;
        }

        .role-space {
          flex: 1.5;
        }

        .space {
          flex: 0.25;
        }        
      `}</style>
    </div>
  );
}
