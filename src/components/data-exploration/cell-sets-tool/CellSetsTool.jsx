import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { Alert, Button, Empty, Skeleton, Space, Tabs, Typography } from 'antd';

import { BlockOutlined, MergeCellsOutlined, SplitCellsOutlined } from '@ant-design/icons';

import { animateScroll, Element } from 'react-scroll';
import HierarchicalTree from '../hierarchical-tree/HierarchicalTree';
import {
  createCellSet,
  deleteCellSet,
  loadCellSets,
  unhideAllCellSets,
  updateCellSetHierarchy,
  updateCellSetProperty,
  updateCellSetSelected,
} from '../../../redux/actions/cellSets';
import { loadGeneExpression } from '../../../redux/actions/genes';
import composeTree from '../../../utils/composeTree';
import { isBrowser } from '../../../utils/environment';
import endUserMessages from '../../../utils/endUserMessages';
import PlatformError from '../../PlatformError';
import CellSetOperation from './CellSetOperation';
import { complement, intersection, union } from '../../../utils/cellSetOperations';

const { Text } = Typography;

const { TabPane } = Tabs;

const generateFilteredCellIndices = (geneExpressions) => {
  // Determine filtered cells from gene expression data. This is currently
  // the only way to determine whether a cell is filtered.
  const [arbitraryGeneExpression] = Object.values(geneExpressions);
  const expressionValues = arbitraryGeneExpression?.rawExpression.expression ?? [];
  return new Set(_.filter(
    _.range(expressionValues.length),
    (i) => expressionValues[i] === null
    )
  );
};

const CellSetsTool = (props) => {
  const { experimentId, width, height } = props;

  const dispatch = useDispatch();

  const cellSets = useSelector((state) => state.cellSets);
  const notifications = useSelector((state) => state.notifications);

  const genes = useSelector(
    (state) => state.genes,
  );

  const filteredCells = useRef(new Set());

  const [activeTab, setActiveTab] = useState('cellSets');

  useEffect(() => {
    if (filteredCells.current.size) return;

    filteredCells.current = generateFilteredCellIndices(genes.expression.data);
  }, [genes.expression.data]);

  useEffect(() => {
    // load the expression data for an arbitrary gene so that we can determine
    // which cells are filtered
    const [gene] = Object.keys(genes.properties.data);
    if (Object.is(gene, undefined)) return;

    dispatch(loadGeneExpression(experimentId, [gene], 'CellSetsTool'));
  }, [genes.properties.data])

  const {
    loading, error, properties, hierarchy, selected: allSelected, hidden,
  } = cellSets;
  const FOCUS_TYPE = 'cellSets';

  useEffect(() => {
    if (isBrowser) {
      dispatch(loadCellSets(experimentId));
    }
  }, []);

  useEffect(() => {
    if (
      notifications
      && notifications.message
      && notifications.message.message === endUserMessages.NEW_CLUSTER_CREATED
    ) {
      animateScroll.scrollTo(height, {
        containerId: 'cell-set-tool-container',
      });
    }
  }, [notifications]);

  const onNodeUpdate = (key, data) => {
    dispatch(updateCellSetProperty(experimentId, key, data));
  };

  const onNodeDelete = (key) => {
    dispatch(deleteCellSet(experimentId, key));
  };

  const onHierarchyUpdate = (newHierarchy) => {
    dispatch(updateCellSetHierarchy(experimentId, newHierarchy));
  };

  const onCheck = (keys) => {
    dispatch(updateCellSetSelected(experimentId, keys, activeTab));
  };

  /**
   * Renders the content inside the tool. Can be a skeleton during loading
   * or a hierarchical tree listing all cell sets.
   */
  const renderContent = () => {
    if (loading) return <Skeleton active />;

    if (error) {
      return (
        <PlatformError
          error={error}
          onClick={() => dispatch(loadCellSets(experimentId))}
        />
      );
    }
    const selected = allSelected[activeTab];
    const selectedCells = union(selected, properties);

    const numSelectedUnfiltered = new Set([...selectedCells]
      .filter((cellIndex) => !filteredCells.current.has(cellIndex)));
    const numSelected = numSelectedUnfiltered.size;

    let operations = null;
    if (numSelected) {
      operations = (
        <Space>
          <CellSetOperation
            icon={<MergeCellsOutlined />}
            onCreate={(name, color) => {
              dispatch(createCellSet(experimentId, name, color, union(selected, properties)));
            }}
            helpTitle='Create new cell set by combining selected sets'
          />
          <CellSetOperation
            icon={<BlockOutlined />}
            onCreate={(name, color) => {
              dispatch(
                createCellSet(experimentId, name, color, intersection(selected, properties)),
              );
            }}
            helpTitle='Create new cell set from intersection of selected sets'
          />
          <CellSetOperation
            icon={<SplitCellsOutlined />}
            onCreate={(name, color) => {
              dispatch(createCellSet(experimentId, name, color, complement(selected, properties)));
            }}
            helpTitle='Create new cell set from the complement of the selected sets'
          />
          <Text type='primary' id='selectedCellSets'>
            {`${numSelected} cell${numSelected === 1 ? '' : 's'} selected`}
            {activeTab === 'metadataCategorical'}
          </Text>
        </Space>
      );
    }

    const cellSetTreeData = composeTree(hierarchy, properties, 'cellSets');
    const metadataTreeData = composeTree(hierarchy, properties, 'metadataCategorical');

    return (
      <>
        {hidden.size > 0 ? (
          <Alert
            message={`${hidden.size} cell set${hidden.size > 1 ? 's are' : ' is'} currently hidden.`}
            type='warning'
            action={<Button type='link' size='small' onClick={() => dispatch(unhideAllCellSets(experimentId))}>Unhide all</Button>}
          />
        ) : (<></>)}

        <Tabs
          size='small'
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          tabBarExtraContent={operations}
        >
          <TabPane tab='Cell sets' key='cellSets'>
            <HierarchicalTree
              treeData={cellSetTreeData}
              onCheck={onCheck}
              store={FOCUS_TYPE}
              experimentId={experimentId}
              onNodeUpdate={onNodeUpdate}
              onNodeDelete={onNodeDelete}
              onHierarchyUpdate={onHierarchyUpdate}
              defaultExpandAll
              showHideButton
              defaultCheckedKeys={selected}
            />
          </TabPane>
          <TabPane tab='Metadata' key='metadataCategorical'>
            {metadataTreeData?.length > 0 ? (
              <HierarchicalTree
                treeData={metadataTreeData}
                onCheck={onCheck}
                store={FOCUS_TYPE}
                experimentId={experimentId}
                onNodeUpdate={onNodeUpdate}
                onNodeDelete={onNodeDelete}
                onHierarchyUpdate={onHierarchyUpdate}
                defaultExpandAll
                showHideButton
                defaultCheckedKeys={selected}
              />
            )
              : (
                <Empty description={(
                  <>
                    <Text type='primary'>You don&apos;t have any metadata added yet.</Text>
                    <Text type='secondary'>Metadata is an experimental feature for certain pre-processed or multi-sample data sets.</Text>
                  </>
                )}
                />
              )}
          </TabPane>

        </Tabs>
      </>
    );
  };

  return (
    <Element
      className='element'
      id='cell-set-tool-container'
      style={{
        position: 'relative',
        height: `${height - 40}px`,
        width: `${width - 8}px`,
        overflow: 'scroll',
        paddingLeft: '5px',
        paddingRight: '5px',
      }}
    >
      <Space direction='vertical' style={{ width: '100%' }}>
        {renderContent()}
      </Space>
    </Element>
  );
};

CellSetsTool.defaultProps = {};

CellSetsTool.propTypes = {
  experimentId: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default CellSetsTool;
export { generateFilteredCellIndices };
