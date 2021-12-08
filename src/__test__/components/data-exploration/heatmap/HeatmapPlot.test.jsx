import _ from 'lodash';
import React from 'react';
import '__test__/test-utils/setupTests';

import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { seekFromAPI } from 'utils/work/seekWorkResponse';

import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import markerGenesData2 from '__test__/data/marker_genes_2.json';
import markerGenesData5 from '__test__/data/marker_genes_5.json';

import { makeStore } from 'redux/store';

import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';

// eslint-disable-next-line import/no-named-as-default
import HeatmapPlot from 'components/data-exploration/heatmap/HeatmapPlot';

import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { loadBackendStatus } from 'redux/actions/backendStatus';

import fake from '__test__/test-utils/constants';

const experimentId = fake.EXPERIMENT_ID;

const cellSetsData = require('__test__/data/cell_sets.json');
const geneExpressionData = require('__test__/data/gene_expression.json');

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  seekFromAPI: jest.fn(),
  seekFromS3: () => Promise.resolve(null),
}));

// // Worker responses are fetched from S3, so these endpoints are added to fetchMock
// // the URL for the endpoints are generated by the functions passed to mockETag above
const mockWorkerResponses = {
  '5-marker-genes': markerGenesData5,
  '2-marker-genes': markerGenesData2,
  '37727d37c0a8201d0138c3620278d4e0': markerGenesData5,
};

let storeState = null;
describe('HeatmapPlot', () => {
  beforeEach(async () => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify(cellSetsData));
    storeState = makeStore();

    seekFromAPI.mockClear();
    seekFromAPI.mockImplementation(
      (a, b, c, requested) => { console.log('requestedDebug', requested); return Promise.resolve(_.cloneDeep(mockWorkerResponses[requested])); },
    );

    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId, fake.PROJECT_ID)));

    storeState.dispatch(loadProcessingSettings(experimentId));
    storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Renders an empty component when there are no selected genes', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <HeatmapPlot
            experimentId={experimentId}
            width={50}
            height={50}
          />
        </Provider>,
      );
    });
  });
});
