import React, { useState, useEffect } from 'react';
import './App.css';
import Post from './Post';


function HomePage(props) {

    const publicAddress = process.env.REACT_APP_SERVER_ORIGIN_FE || 'https://www.thoughtcentral.ca:4001';
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);


    // Async function to get all posts and the users who posted them
  const handlePostFetch = async (callback) => {
    let params = {
      headers: { 'Content-Type': 'application/json' },
      method: "POST",
      body: JSON.stringify({
        where: { username: props.username},
        feed: true
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

  useEffect(() => {

    // Fetch to get posts
    handlePostFetch((result) => {
      let newPostsArray = posts;
      for (let i = 0; i < result.length; i++) {
        newPostsArray.push(result[i]);
      }
        setPosts(newPostsArray);
    });

  }, [page]);

  // Function to convert array of post-object into <Post/> components
  const convertPosts = (posts) => {

    // Empty array to hold all new <Post/> components
    let postList = [];

    if (posts.length === 0) return <div>No Posts, try following someone!</div>

    // Creating a <Post/> component for each post
    posts.forEach((post) => {
      postList.push(<Post author={post.user_name} date={post.post_date} text={post.post_text} editable={false} />);
    });

    return postList;
  }

  // Function to trigger loading of more posts
  const loadMorePosts = () => {
    setPage(page + 1);
  }


  return (
    // Home page to be displayed if user is logged in
    <div className='page'>
      <h2>Welcome Back, {props.username}!</h2>
      <hr />
      <div className='post-list'>
        <h3>My Feed</h3>
        <div>{convertPosts(posts)}</div>
        <p className='load-more-posts' onClick={loadMorePosts}>Load more posts</p>
      </div>
    </div>
  );
}

export default HomePage;
