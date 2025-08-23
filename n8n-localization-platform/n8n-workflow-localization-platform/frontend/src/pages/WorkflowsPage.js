import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  CloudUpload,
  Translate,
  Download,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  uploadWorkflow,
  getWorkflows,
  deleteWorkflow,
  clearError,
} from '../store/workflowSlice';
import { executeTranslation } from '../store/translationSlice';
import DataTable from '../components/Common/DataTable';
import FileUploader from '../components/Upload/FileUploader';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const WorkflowsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  const {
    workflows,
    pagination,
    loading,
    uploading,
    error,
  } = useSelector((state) => state.workflow);

  useEffect(() => {
    dispatch(getWorkflows({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleFileUpload = async (file) => {
    try {
      await dispatch(uploadWorkflow(file)).unwrap();
      toast.success('ワークフローのアップロードが完了しました');
      setUploadDialogOpen(false);
      dispatch(getWorkflows({ page: 1, limit: 20 }));
    } catch (error) {
      toast.error(`アップロードに失敗しました: ${error}`);
    }
  };

  const handlePageChange = (newPage) => {
    dispatch(getWorkflows({ page: newPage, limit: pagination.limit }));
  };

  const handleRowsPerPageChange = (newLimit) => {
    dispatch(getWorkflows({ page: 1, limit: newLimit }));
  };

  const handleTranslate = (workflowId) => {
    navigate(`/workflows/${workflowId}`);
  };

  const handleView = (workflowId) => {
    navigate(`/workflows/${workflowId}`);
  };

  const handleDelete = (workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    setSelectedWorkflow(workflow);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedWorkflow) {
      try {
        await dispatch(deleteWorkflow(selectedWorkflow.id)).unwrap();
        toast.success('ワークフローを削除しました');
        setDeleteDialogOpen(false);
        setSelectedWorkflow(null);
      } catch (error) {
        toast.error(`削除に失敗しました: ${error}`);
      }
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      uploaded: { label: 'アップロード済み', color: 'default' },
      analyzing: { label: '解析中', color: 'info' },
      analyzed: { label: '解析完了', color: 'success' },
      translating: { label: '翻訳中', color: 'warning' },
      translated: { label: '翻訳完了', color: 'success' },
      failed: { label: 'エラー', color: 'error' },
    };
    return statusMap[status] || { label: status, color: 'default' };
  };

  const columns = [
    {
      id: 'originalFilename',
      label: 'ファイル名',
      minWidth: 200,
      sortable: true,
    },
    {
      id: 'status',
      label: 'ステータス',
      minWidth: 120,
      type: 'chip',
      chipColor: (value) => getStatusChip(value).color,
      render: (value) => getStatusChip(value).label,
    },
    {
      id: 'metadata.nodeCount',
      label: 'ノード数',
      minWidth: 80,
      align: 'right',
      type: 'number',
      render: (value, column, row) => row.metadata?.nodeCount || 0,
    },
    {
      id: 'translations',
      label: '翻訳',
      minWidth: 80,
      align: 'center',
      render: (value) => value?.length || 0,
    },
    {
      id: 'fileSize',
      label: 'サイズ',
      minWidth: 100,
      align: 'right',
      render: (value) => {
        if (!value) return '-';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        let size = value;
        let sizeIndex = 0;
        while (size >= 1024 && sizeIndex < sizes.length - 1) {
          size /= 1024;
          sizeIndex++;
        }
        return `${size.toFixed(1)} ${sizes[sizeIndex]}`;
      },
    },
    {
      id: 'createdAt',
      label: '作成日時',
      minWidth: 160,
      type: 'datetime',
      sortable: true,
    },
  ];

  const actions = [
    {
      label: '詳細',
      icon: <Visibility />,
      onClick: handleView,
    },
    {
      label: '翻訳',
      icon: <Translate />,
      onClick: handleTranslate,
    },
    {
      label: '削除',
      icon: <Delete />,
      onClick: handleDelete,
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          ワークフロー管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => setUploadDialogOpen(true)}
        >
          ワークフローをアップロード
        </Button>
      </Box>

      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {workflows.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総ワークフロー数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {workflows.filter(w => w.status === 'analyzed' || w.status === 'translated').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                解析済み
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {workflows.reduce((sum, w) => sum + (w.translations?.length || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                翻訳数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {workflows.filter(w => w.package).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                パッケージ化済み
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* データテーブル */}
      <DataTable
        columns={columns}
        data={workflows}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onRowClick={(row) => navigate(`/workflows/${row.id}`)}
        actions={actions}
        loading={loading}
        error={error}
        emptyMessage="ワークフローがありません。上のボタンからアップロードしてください。"
      />

      {/* アップロードダイアログ */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>ワークフローアップロード</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FileUploader
              onFileUpload={handleFileUpload}
              loading={uploading}
              error={error}
              maxSize={10 * 1024 * 1024}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>ワークフローの削除</DialogTitle>
        <DialogContent>
          <Typography>
            以下のワークフローを削除してもよろしいですか？
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
            {selectedWorkflow?.originalFilename}
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WorkflowsPage;