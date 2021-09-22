import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Space, Button,
} from 'antd';
import DownloadData from './DownloadData';
import LaunchAnalysisButton from './LaunchAnalysisButton';
import FileUploadModal from './FileUploadModal';
import { processUpload } from '../../utils/upload/processUpload';

const ProjectMenu = () => {
  const dispatch = useDispatch();
  const samples = useSelector((state) => state.samples);
  const activeProjectUuid = useSelector((state) => state.projects.meta.activeProjectUuid);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const uploadFiles = (filesList, sampleType) => {
    processUpload(filesList, sampleType, samples, activeProjectUuid, dispatch);
    setUploadModalVisible(false);
  };

  return (
    <>
      <Space>
        <Button
          onClick={() => setUploadModalVisible(true)}
        >
          Add samples
        </Button>
        <DownloadData />
        <LaunchAnalysisButton />
      </Space>
      {uploadModalVisible ? (
        <FileUploadModal
          onUpload={uploadFiles}
          onCancel={() => setUploadModalVisible(false)}
        />
      ) : <></>}
    </>
  );
};
export default ProjectMenu;
