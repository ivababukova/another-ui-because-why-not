/* eslint-disable no-param-reassign */

import _ from 'lodash';
import {
  GENES_PROPERTIES_LOADING,
  GENES_PROPERTIES_LOADED_PAGINATED, GENES_PROPERTIES_ERROR,
} from '../../actionTypes/genes';

import { fetchCachedWork } from '../../../utils/cacheRequest';

const TIMEOUT_SECONDS = 30;

const loadPaginatedGeneProperties = (
  experimentId, properties, componentUuid, tableState,
) => async (dispatch, getState) => {
  const { loading } = getState().genes.properties;

  if (_.intersection(loading, properties).length > 0) {
    return null;
  }

  dispatch({
    type: GENES_PROPERTIES_LOADING,
    payload: { properties, componentUuid },
  });

  const orderBy = tableState.sorter.field;
  const orderDirection = tableState.sorter.order;
  const currentPage = tableState.pagination.current;
  const currentPageSize = tableState.pagination.pageSize;

  const body = {
    name: 'ListGenes',
    selectFields: ['gene_names', ...properties],
    orderBy,
    orderDirection: (orderDirection === 'ascend') ? 'ASC' : 'DESC',
    offset: ((currentPage - 1) * currentPageSize),
    limit: currentPageSize,
  };

  if (tableState.geneNamesFilter) {
    body.geneNamesFilter = tableState.geneNamesFilter;
  }

  try {
    const res = await fetchCachedWork(experimentId, TIMEOUT_SECONDS, body);

    const { rows, total } = JSON.parse(res[0].body);
    const loadedProperties = {};

    rows.forEach((row) => {
      const { gene_names: geneName, ...rest } = row;

      loadedProperties[geneName] = rest;
    });

    dispatch({
      type: GENES_PROPERTIES_LOADED_PAGINATED,
      payload: {
        experimentId,
        properties,
        data: loadedProperties,
        total,
        componentUuid,
      },
    });
  } catch (error) {
    dispatch({
      type: GENES_PROPERTIES_ERROR,
      payload: {
        experimentId,
        componentUuid,
        properties,
        error: 'Couldn\'t load the gene list.',
        debug: error,
      },
    });
  }
};


export default loadPaginatedGeneProperties;