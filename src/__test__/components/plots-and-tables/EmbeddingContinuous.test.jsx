import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import preloadAll from 'jest-next-dynamic';
import thunk from 'redux-thunk';
import _ from 'lodash';
import { Vega } from 'react-vega';

import { generateSpec } from '../../../utils/plotSpecs/generateEmbeddingContinuousSpec';
import { initialPlotConfigStates } from '../../../redux/reducers/componentConfig/initialState';

const mockStore = configureMockStore([thunk]);
const cellSets = {
  properties: {
    'cluster-a': {
      name: 'cluster a',
      key: 'cluster-a',
      cellIds: [0, 1, 2, 3, 4, 5],
      color: '#00FF00',
    },
    'cluster-b': {
      name: 'cluster b',
      key: 'cluster-b',
      cellIds: [6, 7, 8, 9, 10],
      color: '#FF0000',
    },
    'sample-a': {
      name: 'sample a',
      key: 'sample-a',
      cellIds: [0, 2, 7, 8],
      color: '#00FF00',
    },
    'sample-b': {
      name: 'sample b',
      key: 'sample-b',
      cellIds: [1, 3, 4, 6, 7, 8, 5],
      color: '#FF0000',
    },
    louvain: {
      name: 'Louvain clusters',
      key: 'louvain',
      type: 'cellSets',
      cellIds: [],
      rootNode: true,
    },
    scratchpad: {
      name: 'Custom selections',
      key: 'scratchpad',
      type: 'cellSets',
      cellIds: [],
      rootNode: true,
    },
    sample: {
      name: 'Samples',
      key: 'sample',
      type: 'metadataCategorical',
      cellIds: [],
      rootNode: true,
    },
  },
  hierarchy: [
    {
      key: 'louvain',
      children: [{ key: 'cluster-a' }, { key: 'cluster-b' }],
    },
    {
      key: 'sample',
      children: [{ key: 'sample-a' }, { key: 'sample-b' }],
    },
    {
      key: 'scratchpad',
      children: [],
    },
  ],
};
const { properties } = cellSets;
const data = [
  [-1.2343500852584839, -0.6240003705024719],
  [18.337648391723633, -4.259221076965332],
  [12.77301025390625, 9.594305038452148],
  [12.23039436340332, 8.78237533569336],
  [11.743823051452637, 14.542245864868164],
  [14.73792839050293, -6.2992401123046875],
  [18.160137176513672, -5.003548622131348],
  [-0.6337113976478577, -4.029159069061279],
  [-0.44386163353919983, -3.227933883666992],
  [7.28579044342041, 13.526543617248535],
  [14.973455429077148, 11.745992660522461],
  [18, 10],
];
const config = initialPlotConfigStates.embeddingContinuous;
const expression = [0.844880940781665, 0, 0, 0, 0, 0, 1, 2, 1.0892605007475098, 0.9444651009182008, 0, 0, 0.9955310761799436, 0, 0];

const initialState = {
  cellSets,
  embeddings: {
    umap: {
      data,
    },
  },
  genes: {
    expression: {
      data: {
        CST3: {
          expression,
        },
      },
    },
  },
};
const store = mockStore(initialState);
let component;

const filterSamples = () => {
  if (config.selectedSample === 'All') {
    return data;
  }
  const cellIds = Array.from(properties[config.selectedSample].cellIds);
  const filteredData = data.filter((id) => cellIds.includes(data.indexOf(id)));
  return filteredData;
};
const generateVegaData = () => ({
  expression,
  embedding: _.cloneDeep(filterSamples()),
});

const testPlot = () => mount(
  <Provider store={store}>
    <Vega
      spec={generateSpec(config)}
      data={generateVegaData()}
      renderer='canvas'
    />
  </Provider>,
);

describe('Embedding continuous plot ', () => {
  beforeAll(async () => {
    await preloadAll();
  });
  afterEach(() => {
    component.unmount();
  });

  configure({ adapter: new Adapter() });

  it('Embedding continuous loads', () => {
    component = testPlot();
    const vegaAvailable = component.find(Vega);
    expect(vegaAvailable.length).toEqual(1);
  });

  it('Embedding continuous loads filtered', () => {
    component = testPlot();
    config.selectedSample = 'sample-b';
    const vegaAvailable = component.find(Vega);
    expect(vegaAvailable.length).toEqual(1);
  });
});