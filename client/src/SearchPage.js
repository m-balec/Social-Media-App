import React, { useState, createRef, useEffect } from 'react';
import './App.css';
import AccountPage from './AccountPage';

// Component representing a single user-created post
function SearchPage(props) {

    const [search, setSearch] = useState('');
    const [prevSearch, setPrevSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const searchRef = createRef();
    const publicAddress = process.env.REACT_APP_SERVER_ORIGIN_FE || 'https://www.thoughtcentral.ca:4001';

    const [searchView, setSearchView] = useState({
        mediaType: null,
        searchText: null
    });

    // Function to set state of search each time a new character is added/removed by the user
    const editSearchTerm = (e) => {
        setSearch(e.target.value);
    }

    const handleSearchFetch = async (callback) => {
        let params = {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search: `${search}` }),
            method: "POST",
            mode: 'cors'
        }
      
        let res = await fetch(`${publicAddress}/user/search`, params);
      
        if (res.ok) {
            let result = await res.json();
      
            // calling callback so result can be accessed right away
            if (callback) callback(result);
        } else {
            // If the query does not return any usernames similar to the search criteria
            if (callback) callback([]);
        }
    }

    useEffect(() => {
        // Ensuring that component checks to see if it needs to re execute a search-fetch
            if (search === '') {
                if (prevSearch !== '') {
                    setPrevSearch('');
                    setSearchResults([]);
                }
            } else {
                if (search !== prevSearch) {
                    handleSearchFetch((result) => {
                        if (searchResults !== result) setSearchResults(result);
                        // Setting previous to the value we just searched for to ensure we don't do it over and over again
                        setPrevSearch(search);
                    });
                }
            }

    }, [handleSearchFetch, search, searchResults, prevSearch]);

    // Function executed when clicking to view a searched-users profile
    const viewMedia = (e) => {
        setSearchView({
            mediaType: 'user',
            searchText: e.target.id
        });
    }

    // Function to display results of search query input into the search bar
    const displaySearchResults = () => {
        let resultList = [];
        if (searchResults.length > 0) {
            searchResults.forEach((res) => {
                resultList.push(<div className='search-result' id={res.username} onClick={viewMedia}>{res.username}</div>)
            })
        } else {
            return <div className='no-result-found'>No results found</div>
        }
        return resultList;
    }


    return (
        <div className='page'>
            <div className='search-content'>
                <div className='search-controls'>
                    <input ref={searchRef} className='search-bar' type='text' placeholder='Search' onChange={editSearchTerm} />
                </div>
                <div className='search-results'>
                    {displaySearchResults()}
                    {searchView.searchText ? <AccountPage username={props.username} search={searchView.searchText}/> : <div></div>}
                </div>
            </div>
        </div>
    );
}


export default SearchPage;
