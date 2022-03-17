import React from 'react';
import PropTypes from 'prop-types';
import postErrorToSlack from 'utils/postErrorToSlack';
import { connect } from 'react-redux';
import Error from 'pages/_error';

// Implementation of https://reactjs.org/docs/error-boundaries.html
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Act on the error inside this function
    if (process.env.NODE_ENV !== 'production') return;
    const { reduxDump } = this.props;
    postErrorToSlack(error, errorInfo, reduxDump);
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) return <Error />;

    return children;
  }
}

function mapStateToProps(state) {
  return {
    reduxDump: state,
  };
}

ErrorBoundary.propTypes = {
  reduxDump: PropTypes.object,
  children: PropTypes.node.isRequired,
};

ErrorBoundary.defaultProps = {
  reduxDump: {},
};

export default connect(mapStateToProps)(ErrorBoundary);