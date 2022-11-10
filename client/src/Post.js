import React, {useEffect, useState} from 'react';
import './App.css';

// Component representing a single user-created post
function Post(props) {

    const [isDeleted, setIsDeleted] = useState(false);
    const publicAddress = process.env.REACT_APP_SERVER_ORIGIN_FE || `https://www.thoughtcentral.ca:4001`;

    const handleDeleteFetch = async () => {
        // Setting request parameters
        let params = {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: "POST",
          body: JSON.stringify({ postId: props.postId}),
          mode: 'cors'
        }

        // Awaiting response from backend
        let res = await fetch(`${publicAddress}/post/delete`, params);
    
        // Remove post from screen and alert user if post has been deleted
        if (res.ok) {
            setIsDeleted(true);
            alert('Post deleted.');
        }
        if (res.status === 401) {
            alert('Session has expired. Please re-login.');
        }
    }

    // function to return Date object in a well-formatted, east to read string
    const formatDate = (unformatted) => {
        let date = new Date(unformatted);
        let ampm = 'am';
        let hours = date.getHours();
        let minutes = date.getMinutes();

        if (hours > 12) {
            hours -= 12;
            ampm = 'pm';
        }

        let day = date.getDate();
        let month = date.getMonth();
        let year = date.getFullYear();

        return `${day}/${month}/${year} ${hours}:${minutes}${ampm}`;
    }

    if (!isDeleted) return (
        <div className='post'>
            <div className='info'>
                <div className='post-author'>{props.author}</div>
                <div className='post-time'>{formatDate(props.date)}</div>
            </div>
            <div className='post-content'>
                {props.text}
            </div>
            {props.editable ? <div className='post-delete' onClick={handleDeleteFetch}>delete</div> : <div></div>}
        </div>
    );
}


export default Post;
