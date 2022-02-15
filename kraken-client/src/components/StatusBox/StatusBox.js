import React from 'react';
import PropTypes from 'prop-types';

import classes from './StatusBox.module.css'

const StatusBox = (props) => {
    const online = (
        <div className={classes.content}>
            <div className={classes.onlineStatusBullet} />
            <span className={classes.onlineStatusText}>ONLINE</span>
        </div>
    )
    const offline = (
        <div className={classes.content}>
            <div className={classes.offlineStatusBullet} />
            <span className={classes.offlineStatusText}>OFFLINE</span>
        </div>
    );

    switch(props.status){
        case ('ONLINE'):
            return online;
        case ('OFFLINE'):
            return offline;
        default:
            return ( 'N/A');
    }
}

StatusBox.propTypes = {
    status : PropTypes.oneOf(['ONLINE', 'OFFLINE'])
}

export default StatusBox;
