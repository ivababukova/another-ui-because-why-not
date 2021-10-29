/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { screen, render } from '@testing-library/react';

import { Provider } from 'react-redux';

import { act } from 'react-dom/test-utils';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import '__test__/test-utils/mockWorkerBackend';

import DotPlot from 'components/plots/DotPlot';

import createComponentFactory from '__test__/test-utils/componentFactory';
import { makeStore } from 'redux/store';
import { loadCellSets } from 'redux/actions/cellSets';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

import endUserMessages from 'utils/endUserMessages';

import _ from 'lodash';
import mockAPI, {
  generateDefaultMockAPIResponses,
  statusResponse,
} from '__test__/test-utils/mockAPI';

import fake from '__test__/test-utils/constants';

enableFetchMocks();

const defaultProps = {
  config: initialPlotConfigStates.dotPlot,
};

const dotPlotFactory = createComponentFactory(DotPlot, defaultProps);

const plotUuid = 'dotPlotMain';

const customAPIResponses = {
  [`/plots-tables/${plotUuid}`]: () => statusResponse(404, 'Not found'),
};

const mockAPIResponses = _.merge(
  generateDefaultMockAPIResponses(fake.EXPERIMENT_ID),
  customAPIResponses,
);

let storeState = null;

describe('DotPlot', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    storeState = makeStore();
  });

  it('Shows a loader screen if cell sets is not loaded / still loading', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {dotPlotFactory()}
        </Provider>,
      );
    });

    expect(screen.getByText("We're getting your data...")).toBeInTheDocument();
  });

  it('Renders a plot', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {dotPlotFactory()}
        </Provider>,
      );
    });

    // Load cell sets for the plot
    await act(async () => {
      storeState.dispatch(loadCellSets(fake.EXPERIMENT_ID));
    });

    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();
  });

  it('Shows an error if there is an error while loading cellSets', async () => {
    const errorResponse = {
      ...mockAPIResponses,
      [`experiments/${fake.EXPERIMENT_ID}/cellSets`]: () => statusResponse(500, 'Some random error'),
    };

    fetchMock.mockIf(/.*/, mockAPI(errorResponse));

    await act(async () => {
      render(
        <Provider store={storeState}>
          {dotPlotFactory()}
        </Provider>,
      );
    });

    // Load cell sets for the plot and get error
    await act(async () => {
      storeState.dispatch(loadCellSets(fake.EXPERIMENT_ID));
    });

    // No plot should be rendered
    expect(screen.queryByRole('graphics-document', { name: 'Vega visualization' })).toBeNull();

    // Error message should be shown
    expect(screen.getByText(endUserMessages.ERROR_FETCHING_CELL_SETS)).toBeInTheDocument();
  });
});