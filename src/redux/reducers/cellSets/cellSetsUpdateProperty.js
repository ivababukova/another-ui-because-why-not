/* eslint-disable no-param-reassign */
import _ from 'lodash';
import produce from 'immer';

import initialState from 'redux/reducers/cellSets/initialState';

const cellSetsUpdateProperty = produce((draft, action) => {
  const { cellSetKey, dataUpdated } = action.payload;

  _.merge(draft.properties[cellSetKey], dataUpdated);
}, initialState);

export default cellSetsUpdateProperty;
