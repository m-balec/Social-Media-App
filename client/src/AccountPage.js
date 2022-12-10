import React, { useState, createRef, useEffect } from 'react';
import './App.css';
import Post from './Post';

// Component representing a single user-created post
function AccountPage(props) {

    const publicAddress = process.env.REACT_APP_SERVER_ORIGIN_FE || 'https://www.thoughtcentral.ca:4001';
    const [posts, setPosts] = useState([]);
    const [friends, setFriends] = useState({ followers: [], followed: [] });
    const [isFollowing, setIsFollowing] = useState(false);

    const changePasswordRef = createRef();
    const oldPasswordRef = createRef();
    const newPasswordRef = createRef();
    const confirmNewPasswordRef = createRef();

    const searchUsername = props.search || props.myUsername;

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Async function to get all posts and the users who posted them
  const handlePostFetch = async (callback) => {
    let params = {
      headers: { 'Content-Type': 'application/json' },
      method: "POST",
      body: JSON.stringify({
        where: { username: searchUsername},
        feed: false
      }),
      mode: 'cors'
    }

    let res = await fetch(`${publicAddress}/post/get?page=${page}&limit=${limit}`, params);

    if (res.ok) {
      let result = await res.json();

      // calling callback so result can be accessed right away
      if (callback) callback(result);
    }
  }

  // Function to handle fetch of followers
  const handleFollowersFetch = async (callback) => {
    let params = {
      headers: { 'Content-Type': 'application/json' },
      method: "POST",
      body: JSON.stringify({ username: searchUsername }),
      mode: 'cors'
    }

    let res = await fetch(`${publicAddress}/user/friendList`, params);

    if (res.ok) {
      let result = await res.json();

      // calling callback so result can be accessed right away
      if (callback) callback(result);
    }
  }

  useEffect(() => {
    handlePostFetch((result) => {

      // Ensuring posts will only cause a rerender if they need to
      if (posts.length !== page * limit) {
        // loop through each new post in the results and .push it to the existing array of posts
        let newPostsArray = posts;
        for (let i = 0; i < result.length; i++) {
          newPostsArray.push(result[i]);
        }
          setPosts(newPostsArray);
      }
    });
    
    handleFollowersFetch((result) => {
      if (friends !== result) {
        setFriends({
          followers: JSON.parse(result.followers),
          followed: JSON.parse(result.followed)
        });

        // If current users username is in the list of the searched-for users followers, blank out 'follow' button
        JSON.parse(result.followers).includes(props.username) ? setIsFollowing(true) : setIsFollowing(false);
      }
    });
  }, [page, limit]);

  useEffect(() => {
    handlePostFetch((result) => {
      // loop through each new post in the results and .push it to the existing array of posts
      let newPostsArray = [];
      for (let i = 0; i < result.length; i++) {
        newPostsArray.push(result[i]);
      }
        setPosts(newPostsArray);
    });

    handleFollowersFetch((result) => {
      if (friends !== result) {
        setFriends({
          followers: JSON.parse(result.followers),
          followed: JSON.parse(result.followed)
        });

        // If current users username is in the list of the searched-for users followers, blank out 'follow' button
        JSON.parse(result.followers).includes(props.username) ? setIsFollowing(true) : setIsFollowing(false);
      }
    });

  }, [searchUsername]);

  // Function to convert array of post-object into <Post/> components
  const convertPosts = (posts) => {

    // Empty array to hold all new <Post/> components
    let postList = [];

    if (posts.length === 0 && props.search) return <div>User does not have any posts.</div>
    if (posts.length === 0) return <div>No Posts yet, try creating one!</div>

    // Creating a <Post/> component for each post
    if (!props.search) {
      posts.forEach((post) => {
        postList.push(<Post author={post.user_name} date={post.post_date} text={post.post_text} postId={post.post_id} editable={true} />);
      });
    } else {
      posts.forEach((post) => {
        postList.push(<Post author={post.user_name} date={post.post_date} text={post.post_text} editable={false}/>);
      });
    }

    return postList;
  }

  // Function to toggle drop down input-fields for changing username / password
  const hidePasswordChange = () => {
    changePasswordRef.current.style.display === 'block' ? changePasswordRef.current.style.display ='none' : changePasswordRef.current.style.display ='block';
  }

  // Function to handle checking to see if current password is correct
  const checkPassword = async (username, password, callback) => {
    // Parameters object for our fetch request
    let params = {
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
      if (callback) callback(result);
    } else {
      alert('Incorrect old password.');
    }
  }

  // Function to actually make the request to change the password
  const updatePassword = async (username, password, callback) => {
    // Parameters object for our fetch request
    let params = {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updateField: 'password',
        newFieldValue: password,
        username: username
      }),
      method: "POST",
      mode: 'cors'
    }

    // Await response from fetch request and save response to res constant
    let res = await fetch(`${publicAddress}/user/update`, params);

    // If the status is OK, proceed with parsing the response
    if (res.ok) {
      // save json response to result constant
      let result = await res.json();
      if (callback) callback(result);
    }
  }

  // Function to handle "Change Password" button click
  const handleChangePasswordButtonClick = () => {
    let oldPass = oldPasswordRef.current.value;
    let newPass = newPasswordRef.current.value;
    let confirmNewPass = confirmNewPasswordRef.current.value;

    // Adding frontend input validation
    if (!oldPass || !newPass || !confirmNewPass) {
      alert('Please fill in all fields.');
      return;
    }

    if (newPass.length < 6 || newPass.length > 16 || newPass !== confirmNewPass) {
      alert('Please ensure new password is 6-16 characters long.');
      return;
    }

    // Validate password by using same endpoint as I do for login
    checkPassword(searchUsername, oldPass, (passwordResult) => {
      if (passwordResult.username) {
        updatePassword(searchUsername, newPass, (updateResult) => {
          if (updateResult.affectedRows) {
            alert('Password successfully changed.');
          }
        });
      }
    });
  }

  // Function to handle following user
  const handleFollowRequest = async (callback) => {

    // Parameters object for our fetch request
    let params = {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: props.username,
        wantsToFollow: props.search
      }),
      method: "POST",
      mode: 'cors'
    }

    // Await response from fetch request and save response to res constant
    let res = await fetch(`${publicAddress}/user/friendList/follow`, params);

    // If the status is OK, proceed with parsing the response
    if (res.ok) {
      // Alert user of successful action
      alert('Followed');

      // Blank out follow button
      setIsFollowing(true);
    }
    if (res.status === 401) {
      alert('Session expired, please re-sign in');
    }
  }

  // Function to handle unfollowing user
  const handleUnfollowRequest = async (callback) => {

    // Parameters object for our fetch request
    let params = {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: props.username,
        wantsToFollow: props.search
      }),
      method: "POST",
      mode: 'cors'
    }

    // Await response from fetch request and save response to res constant
    let res = await fetch(`${publicAddress}/user/friendList/unfollow`, params);

    // If the status is OK, proceed with parsing the response
    if (res.ok) {
      // Alert user of successful action
      alert('Unfollowed');

      // Blank out follow button
      setIsFollowing(false);
    }
    if (res.status === 401) {
      alert('Session expired, please re-sign in');
    }
  }

  const handleLogout = async () => {
    // Parameters object for our fetch request
    let params = {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: "POST",
      mode: 'cors'
    }

    let res = await fetch(`${publicAddress}/user/logout`, params);

    props.causeRerender();
  }

  const handleAccountDelete = async () => {
    // Parameters object for our fetch request
    let params = {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: props.myUsername }),
      method: "POST",
      mode: 'cors'
    }

    let res = await fetch(`${publicAddress}/user/delete`, params);

    // If the status is OK, proceed with parsing the response
    if (res.ok) {
      alert('Account deleted');
      props.causeRerender();
    }
    if (res.status === 401) {
      alert('Session expired, please re-sign in');
      props.causeRerender();
    }
  }

  // Function to decide which account controls to display
  // Account owner (viewing own page in Account tab) -- change password, delete account
  // Not Account owner (viewing page in Search tab) -- follow, unfollow
  const displayAccountControls = () => {
    if (!props.search) {
      return (
        <div className='account-controls'>
          <div className='drop-down-toggle' onClick={hidePasswordChange}><div className='triangle'></div>Change Password</div>
          <div ref={changePasswordRef} className='hidden-by-dafault'>
            <input className='input-bar' ref={oldPasswordRef} type='password' placeholder='Old Password'/>
            <input className='input-bar' ref={newPasswordRef} type='password' placeholder='New Password'/>
            <input className='input-bar' ref={confirmNewPasswordRef} type='password' placeholder='Confirm New Password'/>
            <button className='account-button' onClick={handleChangePasswordButtonClick}>Change Password</button>
          </div>
          <button className='account-button' onClick={handleLogout}>Logout</button>
          <button className='account-button' onClick={handleAccountDelete}>Delete Account</button>
        </div>
      );
    } else {
      return (
        <div>
          {isFollowing ? <button onClick={handleUnfollowRequest}>Unfollow</button> : <button onClick={handleFollowRequest}>Follow</button>}
        </div>
      )
    }
  }

  // Function to trigger more posts to load
  const loadMorePosts = () => {
    setPage(page + 1);
  }


  return (
    <div className='page'>
      <div className='account-content'>
        <h2 className='account-username'>Username: {searchUsername}</h2>
        {displayAccountControls()}
        <hr />
        <div>Followers: {friends.followers.length}</div>
        <div>Following: {friends.followed.length}</div>
        <div className='post-list'>
          <h3>Posts</h3>
          <div>{convertPosts(posts)}</div>
          <p className='load-more-posts' onClick={loadMorePosts}>Load more posts</p>
        </div>
      </div>
    </div>
  );
}


export default AccountPage;
