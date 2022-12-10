import React, { useState, createRef, useEffect } from 'react';
import './App.css';

// Component representing a single user-created post
function CreatePage(props) {

    const textRef = createRef();
    const publicAddress = process.env.REACT_APP_SERVER_ORIGIN_FE || 'https://www.thoughtcentral.ca:4001';

    const handlePostCreateFetch = async (callback) => {

      // Cancelling post if there is no text, or if length exceeds 256 characters
      if (textRef.current.value === '') {
        alert('You cannot create an empty post.');
        return;
      }
      if (textRef.current.value.length > 255) {
        alert('Posts cannot exceed 255 characters.');
        return;
      }

      // Parameters object for our fetch request
      let params = {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: props.username,
          postText: textRef.current.value
        }),
        method: "POST",
        mode: 'cors'
      }
    
      // Await response from fetch request and save response to res constant
      let res = await fetch(`${publicAddress}/post/create`, params);
        
      // If the status is OK, proceed with parsing the response
      if (res.ok) {
        // save json response to result constant
        let result = await res.json();
        if (callback) callback(result);
      }
      if (res.status === 401) {
        alert('Session has expired. Please re-login.');
        props.causeRerender();
      }
    }

    // Function to call fetch function with a callback
    const handlePostButtonClick = () => {
      handlePostCreateFetch((result) => {
        // If result was posted, empty the text area
        if (result.affectedRows > 0) {
          textRef.current.value = '';
          alert('Post created.')
        }
      });
    }

    return (
        <div className='page'>
            <div className='create-post-content'>
                <textarea className='new-post-input' ref={textRef} type='text' placeholder='Content' cols='40' rows='10'></textarea><br />
                <button className='account-button' onClick={handlePostButtonClick}>Create Post</button>
            </div>
        </div>
    );
}


export default CreatePage;
