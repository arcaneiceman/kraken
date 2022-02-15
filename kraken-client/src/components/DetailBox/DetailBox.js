import React from 'react';
import PropTypes from 'prop-types';

import classes from './DetailBox.module.css'

const DetailBox = (props) => {
    // Extract Values
    const boxValue = props.boxValue;
    const boxText = props.boxText;

    // Render Components
    return (
        <div className={classes.content}>
            <div className={classes.boxValue}>{boxValue}</div>
            <div className={classes.boxText}>{boxText}</div>
        </div>
    );
}

DetailBox.propTypes = {
    boxValue : PropTypes.string.isRequired,
    boxText : PropTypes.string.isRequired
}

export default DetailBox;