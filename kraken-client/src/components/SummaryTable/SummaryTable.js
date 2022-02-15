import React from 'react';
import PropTypes from 'prop-types';
import Table from 'react-bootstrap/Table';

import classes from './SummaryTable.module.css'

const SummaryTable = (props) => {
    return (
        <Table className={classes.content} striped hover size="sm">
            <thead className={classes.tableHeaderRow}>
                <tr>
                    {props.tableHeadings}
                </tr>
            </thead>
            <tbody>{props.tableItems}</tbody>
        </Table>
    );
}

SummaryTable.propTypes = {
    tableHeadings: PropTypes.arrayOf(PropTypes.element),
    tableItems: PropTypes.arrayOf(PropTypes.element)
}

export default SummaryTable;