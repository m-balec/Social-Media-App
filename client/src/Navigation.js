import React, { useState, createRef, useEffect } from 'react';
import './App.css';
import HomePage from './HomePage';
import CreatePage from './CreatePage';
import AccountPage from './AccountPage';
import SearchPage from './SearchPage';

// Component representing a single user-created post
function Navigation(props) {

    const [page, setPage] = useState(<HomePage username={props.username} />);
    const [activePage, setActivePage] = useState('Home');

    const handleChangePage = (e) => {
        if (e.target.id === 'Home') setPage(<HomePage username={props.username} />);
        if (e.target.id === 'Search') setPage(<SearchPage username={props.username} />);
        if (e.target.id === 'Create') setPage(<CreatePage username={props.username} causeRerender={props.causeRerender} />);
        if (e.target.id === 'Account') setPage(<AccountPage myUsername={props.username} causeRerender={props.causeRerender} />);

        setActivePage(e.target.id);
    }

    // Function to display tabs, determining which tab is currently active
    const displayTabs = () => {

        // Setting variables for both possible css styles
        let normalCss = 'nav-tab';
        let activeCss = `${normalCss} active`;

        // Creating JSX for each 'tab'
        let home = <div className={normalCss} id='Home' onClick={handleChangePage}>Home</div>;
        let search = <div className={normalCss} id='Search' onClick={handleChangePage}>Search</div>;
        let create = <div className={normalCss} id='Create' onClick={handleChangePage}>Create</div>;
        let account = <div className={normalCss} id='Account' onClick={handleChangePage}>Account</div>;

        // Changing JSX if the tab is active or not
        if (activePage === 'Home') home = <div className={activeCss} id='Home' onClick={handleChangePage}>Home</div>;
        if (activePage === 'Search') search = <div className={activeCss} id='Search' onClick={handleChangePage}>Search</div>;
        if (activePage === 'Create') create = <div className={activeCss} id='Create' onClick={handleChangePage}>Create</div>;
        if (activePage === 'Account') account = <div className={activeCss} id='Account' onClick={handleChangePage}>Account</div>;

        // Array to hold all tabs
        let tabs = [
            home,
            search,
            create,
            account
        ]

        return (
            <div className='navigation'>
                {tabs}
            </div>
        );
    }

    return (
        <div className='hub'>
            {displayTabs()}
            <div>
                {page}
            </div>
        </div>
    );
}


export default Navigation;
