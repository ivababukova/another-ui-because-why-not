import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { loadEmbedding } from 'redux/actions/embedding';
import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';

import {
  EMBEDDINGS_ERROR,
  EMBEDDINGS_LOADING,
} from 'redux/actionTypes/embeddings';

import { seekFromS3 } from 'utils/work/seekWorkResponse';

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true, // this property makes it work
  dispatchWorkRequest: jest.fn(() => true),
  seekFromS3: jest.fn(),
}));

const mockStore = configureStore([thunk]);
const embeddingType = 'umap';

const initialExperimentState = generateExperimentSettingsMock([]);

const initialPipelineState = {
  startDate: null,
  endDate: null,
  status: null,
  completedSteps: [],
};

describe('loadEmbedding action', () => {
  const experimentId = '1234';

  const experimentSettings = {
    ...initialExperimentState,
  };

  const backendStatus = {
    [experimentId]: {
      status: {
        pipeline: {
          ...initialPipelineState,
          startDate: '2021-01-01T01:01:01.000Z',
        },
      },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => Promise.resolve([[1, 2], [3, 4]]));
  });

  it('Dispatches if not loaded', async () => {
    const store = mockStore(
      {
        backendStatus,
        experimentSettings,
        embeddings: {},
      },
    );

    store.dispatch(loadEmbedding(experimentId));
    expect(store.getActions().length).toEqual(1);
  });

  it('Does not dispatch if embedding is already loaded', async () => {
    const store = mockStore(
      {
        backendStatus,
        experimentSettings,
        embeddings:
        {
          [embeddingType]: {
            ...initialEmbeddingState,
            loading: false,
            data: [
              [1, 2],
              [3, 4],
            ],
          },
        },
      },
    );

    store.dispatch(loadEmbedding(experimentId, embeddingType));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on a loading embedding', async () => {
    const store = mockStore(
      {
        backendStatus,
        experimentSettings,
        embeddings:
          { [embeddingType]: { ...initialEmbeddingState, loading: true } },
      },
    );

    store.dispatch(loadEmbedding(experimentId, embeddingType));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches on a previously unseen embedding', async () => {
    const store = mockStore(
      {
        backendStatus,
        networkResources: {
          environment: 'testing',
        },
        embeddings: {},
        experimentSettings,
      },
    );

    await store.dispatch(loadEmbedding(experimentId, embeddingType));

    // We should have been dispatched two events.
    expect(store.getActions().length).toEqual(2);

    // The first action should have been a loading.
    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();

    // The first action should have been an appropriately constructed loaded action.
    const secondAction = store.getActions()[1];
    expect(secondAction).toMatchSnapshot();
  });

  it('Dispatches on a previous error condition', async () => {
    const store = mockStore(
      {
        backendStatus,
        networkResources: {
          environment: 'testing',
        },
        embeddings:
          { [embeddingType]: { ...initialEmbeddingState, error: true, loading: false } },
        experimentSettings,
      },
    );

    await store.dispatch(loadEmbedding(experimentId, embeddingType));

    // We should have been dispatched two events.
    expect(store.getActions().length).toEqual(2);

    // The first action should have been a loading.
    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();

    // The first action should have been an appropriately constructed loaded action.
    const secondAction = store.getActions()[1];
    expect(secondAction).toMatchSnapshot();
  });

  it('Dispatches error action on unsuccessful loading', async () => {
    const store = mockStore(
      {
        backendStatus,
        networkResources: {
          environment: 'testing',
        },
        embeddings: {},
        experimentSettings,
      },
    );

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => { throw new Error('random error!'); });

    await store.dispatch(loadEmbedding(experimentId, embeddingType));

    // We should have been dispatched two events.
    expect(store.getActions().length).toEqual(2);

    // The first action should have been a loading.
    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();

    // The first action should have been an error condition.
    const secondAction = store.getActions()[1];
    expect(secondAction).toMatchSnapshot();
  });

  it('Does not return anything while waiting for config data to load', async () => {
    const store = mockStore(
      {
        backendStatus,
        networkResources: {
          environment: 'testing',
        },
        embeddings: {},
        experimentSettings: {
          ...experimentSettings,
          processing: {},
        },
      },
    );

    await store.dispatch(loadEmbedding(experimentId, embeddingType));

    // There should be no dispatch.
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches error if pipeline has not been run', async () => {
    const store = mockStore(
      {
        backendStatus: {
          ...backendStatus,
          1234: {
            ...backendStatus['1234'],
            status: {},
          },
        },
        networkResources: {
          environment: 'testing',
        },
        embeddings: {},
        experimentSettings: {
          ...experimentSettings,
        },
      },
    );

    await store.dispatch(loadEmbedding(experimentId, embeddingType));

    const [first, second] = store.getActions();
    expect(first.type).toBe(EMBEDDINGS_LOADING);
    expect(second.type).toBe(EMBEDDINGS_ERROR);
  });

  it('Dispatches on if forceReload is set to true', async () => {
    const store = mockStore(
      {
        networkResources: {
          environment: 'testing',
        },
        backendStatus,
        embeddings:
          { [embeddingType]: { ...initialEmbeddingState, error: false, loading: false } },
        experimentSettings,
      },
    );

    await store.dispatch(loadEmbedding(experimentId, embeddingType, true));

    // We should have been dispatched two events.
    expect(store.getActions().length).toEqual(2);

    // The first action should have been a loading.
    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();

    // The first action should have been an appropriately constructed loaded action.
    const secondAction = store.getActions()[1];
    expect(secondAction).toMatchSnapshot();
  });
});
