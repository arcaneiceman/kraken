import React from 'react';
import PropTypes from 'prop-types';

import classes from './SectionHeading.module.css';

const SectionHeading = (props) => {
    const heading = props.heading;
    return (<h2 className={classes.content}>{heading}</h2>);
}

SectionHeading.propTypes = {
    heading : PropTypes.string.isRequired
}

export default SectionHeading;