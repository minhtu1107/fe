import { useEffect, useState, useRef } from 'react';
import { getSessionFromContext } from '../../services/auth';
import { getAllUsers } from '../../services/user';
import Select from 'react-select';

export async function getServerSideProps(context) {
  const user = await getSessionFromContext(context);
  // if (!user) {
  //   redirectTo(context, '/auth/signin');
  // }

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

  const getUsers = () => {
    getAllUsers().then(res => { console.log(res.data); setUserList(res.data) });
  }

  const addUser = () => {

  }

  const removeUser = () => {

  }

  const renderUsers = () => {
    return (
      userList.length > 0 ? userList.map(u => (
        <div style={{ border: '1px solid black', marginLeft: '50px', marginRight: '50px', marginBottom: '50px'}} key={u.id}>
          <div style={{
            display: 'flex', flexDirection: 'row',
            backgroundColor: 'darkgrey', padding: '10px'
          }}>
            <div style={{}}>Id</div>
            <div style={{ marginLeft: '2px', color: 'white', backgroundColor: 'darkblue', width: '50px', textAlign: 'center' }}>{u.id}</div>
          </div>
          <div style={{
            display: 'flex', flexDirection: 'row',
            padding: '10px', alignItems: 'center'
          }}>
            <div>
              <div style={{}}>Email</div>
              <div style={{ backgroundColor: '#ededed', width: '250px', padding: '5px' }}>{u.email}</div>
            </div>
            <div style={{ marginLeft: '20px' }}>
              <div style={{}}>Status</div>
              <div style={{ backgroundColor: '#ededed', width: '100px', padding: '5px' }}>2</div>
            </div>
            <div style={{
              marginLeft: '20px', flexGrow: 1,
              display: 'flex', justifyContent: 'flex-end'
            }}>
              <button className="c-btn" onClick={removeUser}>{"Remove"}</button>
            </div>
          </div>
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

  const handleChange = (selected) => {
    console.log(`Option selected:`, selected);
  }

  return (
    <div>
      <div style={{ width: '50%', display: 'flex', flexDirection: 'row', margin: '50px' }}>
        <div style={{ flex: 3 }}>
          <input
            type="text"
            name="email"
            className="c-textField"
            placeholder={"Enter email"}
          />
        </div>
        <div style={{ flex: 0.25 }}></div>
        <div style={{ flex: 1.5 }}>
          <Select instanceId='role' options={options} isClearable={true} onChange={handleChange}/>
        </div>
        <div style={{ flex: 0.25 }}></div>
        <div style={{ flex: 1 }}>
          <button className="c-btn" onClick={addUser}>{"Add"}</button>
        </div>
      </div>
      {renderUsers()}
    </div>
  );
}
