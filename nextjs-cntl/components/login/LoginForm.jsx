import React, { useState } from 'react';
import Router from 'next/router';
import Link from 'next/link';
import { getCsrfToken, getSession } from 'next-auth/client'
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import { loginCallback, login } from '../../services/user';
import { setUserCookie } from '../../services/auth';
import {validateInput} from'../../services/util'
// const conf = require('../../config/const.json');
// const lang = require('../../locale/lang.json')

const LoginForm = () => {
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  const [errLogin, setErrLogin] = useState('');

  const [userLogin, setUserLogin] = useState({email: "", password: ""});
  const [errInputField, setErrInputField] = useState({email: "", password: ""});

  //Handle input change
  const handleOnChange = (e) => {
    let {name,value} = e.target;
    setUserLogin({
      ...userLogin,
      [name]: value
    })

    setErrInputField({
      ...errInputField,
      [name]: validateInput(name, value)
    })
  }

  const handleOnSubmit = async (e) => {
    e.preventDefault();

    // const csrfToken = await getCsrfToken();

    let email = userLogin.email;
    let password = userLogin.password;

    let errEmail = await validateInput("email", userLogin.email);
    let errPassword = await validateInput("password", userLogin.password);
    await setErrInputField({email: errEmail, password: errPassword});

    if(errEmail === "" && errPassword === "") {
      /*loginCallback({ email, password, csrfToken })
        .then((response) => {
          getSession().then((session) => {
            if (!session) {
              setErrLogin("lang.login.un_authentication");
            } else {
              // if (session.role === "conf.role.admin") {
              //   Router.push('/admin/dashboard');
              // } else {
              //   Router.push('/');
              // }
              if(session.id===1) {
                Router.push('/admin');
              } else {
                Router.push('/streamming/player');
              }
            }
          })
        })
        .catch(err => {
          console.log(err);
        })*/
      loginCallback({ email, password })
        .then((response) => {
          if(response.data.id && response.data.email && response.data.access_token && response.data.role) {
            let session = {
              id: response.data.id,
              email: response.data.email,
              access_token: response.data.access_token,
              role: response.data.role
            }

            setUserCookie(null, "session_token", session);

            if(session.id===1) {
              Router.push('/admin');
            } else {
              Router.push('/streamming/player');
            }
          } else {
            setErrLogin("lang.login.un_authentication");
          }
          
          
        })
        .catch(err => {
          console.log(err);
        })
    }
  }

  return (
    <div className="p-login">
      {/* <div className="p-login__logo">
        <div><img src="/images/logo_login.png" alt="" width="357"/></div>
      </div> */}
      <div className="p-login__form">
        <form className="form" onSubmit={handleOnSubmit}>
          <AccountCircleIcon id="form-logo"></AccountCircleIcon>
          <div className="form-group">
            <input 
              type="text"
              name="email" 
              className="c-textField" 
              placeholder={"Enter e-mail address"} 
              onChange={handleOnChange}/>

            {errInputField.email &&
            <p className="c-errMsg">{errInputField.email}</p>
            }
          </div>

          <div className="form-group">
            <input 
              type="password"
              name="password" 
              className="c-textField" 
              placeholder={"Enter password"} 
              onChange={handleOnChange}/>

            {errInputField.password &&
            <p className="c-errMsg">{errInputField.password}</p>
            }
          </div>

          {errLogin &&
          <div className="form-error">
            <p>{errLogin}</p>
          </div>
          }

          <div className="form-action">
            <button className="c-btn" type="submit">{"Log-in"}</button>
          </div>

          {/* <div className="form-notice">
            <Link href="/auth/forgot-password">
              <a className="c-link">{"lang.login.text_forgot_password"}</a>
            </Link>
          </div> */}
        </form>
      </div>
    </div>
  );
}

export default LoginForm;