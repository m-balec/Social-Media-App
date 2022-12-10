import React, { useState, createRef, useEffect } from 'react';
import './App.css';
import Navigation from './Navigation';

function App() {
  const [accountInfo, setAccountInfo] = useState({ username: '' });

  const pageStates = ['signup', 'login'];
  const [page, setPage] = useState(pageStates[0]);

  const [forceRerender, setForceRerender] = useState(0);

  const usernameRef = createRef();
  const passwordRef = createRef();
  const confirmPasswordRef = createRef();
  const publicAddress = process.env.REACT_APP_SERVER_ORIGIN_FE || 'https://www.thoughtcentral.ca:4001';

  const causeRerender = () => {
    setForceRerender(forceRerender + 1);
    setAccountInfo({ username: '' });
  }

  useEffect(() => {
    //Checking for existing session cookie
    if (document.cookie.match(/^(.*;)?\s*session_cookie\s*=\s*[^;]+(.*)?$/)) {
      // Get the account info of the username attached to the cookie
      handleSessionFetch((result) => {
        setAccountInfo(result);
      });
    }
  }, []);

  useEffect(() => {
    // This forces rerenders when needed
  }, [forceRerender]);


  // Quick walkthrough of how to best use the app
  const walkthrough = () => 
  <ul className='guide'>
    <b>Features:</b>
    <li className='guide-item'>1. Create an account</li>
    <li className='guide-item'>2. Search/follow other users (try searching "masonb")</li>
    <li className='guide-item'>3. Create a post of your own in the Create tab</li>
    <li className='guide-item'>Remember, you can always delete your account</li>
  </ul>

  // JSX to display when user is logging in
  const loginPage = () =>
  <div className='page'>
    <div className='content'>
      <h1>Login</h1>
      <div className='login-page-input'>
          <input type='text' className='input-bar-login' placeholder='Username' ref={usernameRef} />
          <input type='password' className='input-bar-login' placeholder='Password' ref={passwordRef} />
          <button onClick={handleLogin} className='login-button'>Login</button>
          <button onClick={changePage} className='login-button'>Create New Account</button>
      </div>
      {walkthrough()}
    </div>
  </div>;

  // JSX to display when user is creating an account
  const signupPage = () =>
  <div className='page'>
    <div className='content'>
      <h1>Sign Up</h1>
      <div className='login-page-input'>
          <h3 className='credential-info'>Please ensure username and password are 6-16 characters long</h3>
          <input type='text' className='input-bar-login' placeholder='Username' ref={usernameRef} />
          <input type='password' className='input-bar-login' placeholder='Password' ref={passwordRef} />
          <input type='password' className='input-bar-login' placeholder='Confirm Password' ref={confirmPasswordRef} />
          <button onClick={handleCreateAccount} className='login-button'>Create Account</button>
          <button onClick={changePage} className='login-button'>Login with existing account</button>
      </div>
      
    </div>
  </div>;


  // Function to change the state of page from 'login' to 'signup'
  const changePage = () => {
    page === pageStates[0] ? setPage(pageStates[1]) : setPage(pageStates[0]);
  }

  const handleCreateAccount = async () => {

    let username = usernameRef.current.value;
    let password = passwordRef.current.value;
    let passwordConfirm = confirmPasswordRef.current.value;

    // Ending function if any fields are emtpy, or if the password and passwordConfirm fields do not match
    if (!username || !password || !passwordConfirm) {
      alert('please fill all fields');
      return;
    }
    if (password !== passwordConfirm) {
      alert('please ensure password and passwordConfirm match');
      return;
    }
    if (username.length < 6 || username.length > 16 || password.length < 6 || password.length >= 16) {
      alert('please ensure username and password are 6-16 characters long.');
      return;
    }

    // Parameters for fetch request
    let params = {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
      method: "POST",
      mode: 'cors'
    }

    let res = await fetch(`${publicAddress}/user/create`, params);

    if (res.ok) {
      alert('Account created. You may now login.')
    }
    if (res.status === 409) {
      alert('Username already taken');
    }

  }

  // Function to handle login button press
  const handleLogin = () => {

    // Save username and password values
    let username = usernameRef.current.value;
    let password = passwordRef.current.value;

    // End function if either field is empty
    if (!username || !password) {
      alert('please fill in all fields');
      return;
    }

    // Calling async function to handle login fetch
    handleLoginFetch(username, password);

  }

  // Async function to handle requesting the login fetch to backend
  const handleLoginFetch = async (username, password) => {
    // Parameters object for our fetch request
    let params = {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        password: password
      }),
      method: "POST",
      mode: 'cors'
    }

    // Await response from fetch request and save response to res constant
    let res = await fetch(`${publicAddress}/user/login`, params);

    // If the status is OK, proceed with parsing the response
    if (res.ok) {
      // save json response to result constant
      let result = await res.json();
      setAccountInfo(result);
      return result;
    } else {
      alert('Incorrect username or password.');
    }
  }

  const handleSessionFetch = async(callback) => {
    // Parameters object for our fetch request
    let params = {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: "POST",
      mode: 'cors'
    }

    // Await response from fetch request and save response to res constant
    let res = await fetch(`${publicAddress}/user/session/get`, params);

    // If the status is OK, proceed with parsing the response
    if (res.ok) {
      // save json response to result constant
      let result = await res.json();
      //setAccountInfo(result);
      //return result;
      if (callback) callback(result);
    } else {
      alert('Error.');
    }
  }

  // Checking for existing session cookie
  if (accountInfo.username.length > 0) {
    return <Navigation username={accountInfo.username} causeRerender={causeRerender} />;
  } else {
    if (page === 'signup') {
      return signupPage();
    } else if (page === 'login') {
      return loginPage();
    }
  }
  //return loginPage();
}

export default App;
