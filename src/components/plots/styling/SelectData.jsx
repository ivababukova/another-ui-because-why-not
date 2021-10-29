import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import {
  Form,
  Select,
  Skeleton,
} from 'antd';

import composeTree from 'utils/composeTree';
import InlineError from 'components/InlineError';

const { Option, OptGroup } = Select;

const SelectData = (props) => {
  const {
    onUpdate, config, cellSets, axisName,
  } = props;

  const {
    loading: cellSetsLoading, error: cellSetsError, hierarchy, properties,
  } = cellSets;

  const getDefaultCellSetNotIn = (rootNodeKey) => {
    const fallBackRootNodesKeys = ['sample', 'louvain'];

    const fallbackRootNodeKey = fallBackRootNodesKeys.filter((val) => val !== rootNodeKey)[0];
    const fallBackCellSetId = _.find(
      hierarchy,
      (rootNode) => rootNode.key === fallbackRootNodeKey,
    ).children[0].key;

    return `${fallbackRootNodeKey}/${fallBackCellSetId}`;
  };

  const handleChangeRootNode = (value) => {
    const rootNodeKey = config.selectedPoints.split('/')[0];
    if (rootNodeKey === value) {
      // This is to avoid having an invalid state like
      // selectedCellSet: 'louvain' and selectedPoints: 'louvain/louvain-0'
      const fallBackCellSetKey = getDefaultCellSetNotIn(value);
      onUpdate({ selectedCellSet: value, selectedPoints: fallBackCellSetKey });

      return;
    }

    onUpdate({ selectedCellSet: value });
  };
  const handleChangePoints = (value) => {
    onUpdate({ selectedPoints: value });
  };

  const tree = composeTree(hierarchy, properties);

  const renderChildren = (rootNodeKey, children) => {
    if (!children || children.length === 0) { return (<></>); }

    const shouldDisable = (key) => key.startsWith(`${config.selectedCellSet}/`);
    return children.map(({ key, name }) => {
      const uniqueKey = `${rootNodeKey}/${key}`;
      return (
        <Option value={uniqueKey} key={uniqueKey} disabled={shouldDisable(uniqueKey)}>
          {name}
        </Option>
      );
    });
  };

  if (cellSetsLoading) {
    return <Skeleton.Input style={{ width: 200 }} active />;
  }

  if (cellSetsError) {
    return <InlineError message='Error loading cell set' actionable />;
  }

  return (
    <>
      <div>
        {`Select the Cell sets or Metadata that cells are grouped by (determines the ${axisName}-axis)`}
        :
      </div>
      <Form.Item>
        <Select
          defaultValue={config.selectedCellSet}
          style={{ width: 200 }}
          onChange={(value) => {
            handleChangeRootNode(value);
          }}
        >
          {
            tree.map(({ key, name }) => (
              <Option key={key}>
                {name}
              </Option>
            ))
          }
        </Select>
      </Form.Item>
      <div>
        Select the Cell sets or Metadata to be shown as points:
      </div>
      <Form.Item>
        <Select
          value={config.selectedPoints}
          style={{ width: 200 }}
          onChange={(value) => {
            handleChangePoints(value);
          }}
        >
          <Option key='All'>All</Option>
          {
            tree.map(({ key, children }) => (
              <OptGroup label={properties[key]?.name} key={key}>
                {renderChildren(key, [...children])}
              </OptGroup>
            ))
          }
        </Select>
      </Form.Item>
    </>
  );
};

SelectData.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  cellSets: PropTypes.object.isRequired,
  axisName: PropTypes.oneOf(['x', 'y']),
};

SelectData.defaultProps = {
  axisName: 'y',
};

export default SelectData;