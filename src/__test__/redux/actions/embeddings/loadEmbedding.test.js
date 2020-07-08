import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import loadEmbedding from '../../../../redux/actions/embeddings/loadEmbedding';
import { initialEmbeddingState } from '../../../../redux/reducers/embeddingsReducer/initialState';
import { EMBEDDINGS_LOADING, EMBEDDINGS_LOADED, EMBEDDINGS_ERROR } from '../../../../redux/actionTypes/embeddings';

import sendWork from '../../../../utils/sendWork';

jest.mock('localforage');

jest.mock('../../../../utils/sendWork', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn(),
}));

const mockStore = configureStore([thunk]);

describe('loadEmbedding action', () => {
  const experimentId = '1234';
  const embeddingType = '4567';

  it('Does not dispatch on already loaded embedding', async () => {
    const store = mockStore(
      {
        embeddings:
          { [embeddingType]: { ...initialEmbeddingState, loading: false } },
      },
    );

    await store.dispatch(loadEmbedding(experimentId, embeddingType));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on a loading embedding', async () => {
    const store = mockStore(
      {
        embeddings:
          { [embeddingType]: { ...initialEmbeddingState, loading: true } },
      },
    );

    await store.dispatch(loadEmbedding(experimentId, embeddingType));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches on a previously unseen embedding', async () => {
    sendWork.mockImplementation(() => {
      // We are resolving with two identical results, because in the transition period
      // the worker will return both types of results. TODO: reduce this to just one
      // result when the initial version of the UI is pushed.

      const resolveWith = {
        results:
          [
            { body: JSON.stringify([[1, 2], [3, 4]]) },
            { body: JSON.stringify([[1, 2], [3, 4]]) },
          ],
      };

      return new Promise((resolve) => resolve(resolveWith));
    });

    const store = mockStore(
      {
        embeddings: {},
      },
    );

    await store.dispatch(loadEmbedding(experimentId, embeddingType));

    // We should have been dispatched two events.
    expect(store.getActions().length).toEqual(2);

    // The first action should have been a loading.
    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchObject(
      { type: EMBEDDINGS_LOADING, payload: { experimentId, embeddingType } },
    );

    // The first action should have been an appropriately constructed loaded action.
    const secondAction = store.getActions()[1];
    expect(secondAction).toMatchObject(
      { type: EMBEDDINGS_LOADED, payload: { experimentId, embeddingType, data: [[1, 2], [3, 4]] } },
    );
  });

  it('Dispatches on a previous error condition', async () => {
    sendWork.mockImplementation(() => {
      // We are resolving with two identical results, because in the transition period
      // the worker will return both types of results. TODO: reduce this to just one
      // result when the initial version of the UI is pushed.

      const resolveWith = {
        results:
          [
            { body: JSON.stringify([[1, 2], [3, 4]]) },
            { body: JSON.stringify([[1, 2], [3, 4]]) },
          ],
      };

      return new Promise((resolve) => resolve(resolveWith));
    });

    const store = mockStore(
      {
        embeddings:
          { [embeddingType]: { ...initialEmbeddingState, error: true, loading: false } },
      },
    );

    await store.dispatch(loadEmbedding(experimentId, embeddingType));

    // We should have been dispatched two events.
    expect(store.getActions().length).toEqual(2);

    // The first action should have been a loading.
    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchObject(
      { type: EMBEDDINGS_LOADING, payload: { experimentId, embeddingType } },
    );

    // The first action should have been an appropriately constructed loaded action.
    const secondAction = store.getActions()[1];
    expect(secondAction).toMatchObject(
      { type: EMBEDDINGS_LOADED, payload: { experimentId, embeddingType, data: [[1, 2], [3, 4]] } },
    );
  });

  it('Dispatches error action on unsuccessful loading', async () => {
    const store = mockStore(
      {
        embeddings:
          {},
      },
    );

    sendWork.mockImplementation(() => new Promise((resolve, reject) => reject(new Error('random error!'))));

    await store.dispatch(loadEmbedding(experimentId, embeddingType));

    // We should have been dispatched two events.
    expect(store.getActions().length).toEqual(2);

    // The first action should have been a loading.
    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchObject(
      { type: EMBEDDINGS_LOADING, payload: { embeddingType, experimentId } },
    );

    // The first action should have been an error condition.
    const secondAction = store.getActions()[1];
    expect(secondAction).toMatchObject(
      { type: EMBEDDINGS_ERROR },
    );
  });
});
