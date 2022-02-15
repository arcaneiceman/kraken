import React from 'react';
import PropTypes from 'prop-types';
import Octicon, { ChevronLeft, ChevronRight } from '@githubprimer/octicons-react'

import classes from './Pagination.module.css';

const Pagination = (props) => {
    const nextOnClick = props.nextOnClick;
    const prevOnClick = props.prevOnClick;
    const currentPage = props.currentPage;
    const totalPages = props.totalPages;

    return (
        <div className={classes.content}>
            <button className={classes.button} onClick={prevOnClick}>
                <Octicon icon={ChevronLeft} on/>
            </button>
            <span className={classes.pageNumbers}>{currentPage} {' / '} {totalPages}</span>
            <button className={classes.button} onClick={nextOnClick}>
                <Octicon icon={ChevronRight} />
            </button>
        </div>
    );
}

Pagination.propTypes = {
    nextOnClick: PropTypes.func.isRequired,
    prevOnClick: PropTypes.func.isRequired,
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired
}

export default Pagination;