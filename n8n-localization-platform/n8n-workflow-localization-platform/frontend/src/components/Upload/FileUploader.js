import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  Delete,
  CheckCircle,
  Error,
} from '@mui/icons-material';

const FileUploader = ({
  onFileUpload,
  loading = false,
  error = null,
  uploadProgress = 0,
  acceptedFiles = [],
  onRemoveFile = () => {},
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
}) => {
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map(file => 
          file.errors.map(error => error.message).join(', ')
        );
        console.error('File rejection errors:', errors);
        return;
      }

      if (acceptedFiles.length > 0) {
        onFileUpload(multiple ? acceptedFiles : acceptedFiles[0]);
      }
    },
    [onFileUpload, multiple]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
    },
    maxSize,
    multiple,
    disabled: loading,
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* ドロップゾーン */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          border: `2px dashed ${isDragActive ? 'primary.main' : 'grey.300'}`,
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        
        <CloudUpload 
          sx={{ 
            fontSize: 48, 
            color: isDragActive ? 'primary.main' : 'grey.400',
            mb: 2 
          }} 
        />
        
        {loading ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              アップロード中...
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ mt: 2, mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {uploadProgress}% 完了
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? 'ファイルをここにドロップしてください'
                : 'n8nワークフローファイルをアップロード'}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              JSONファイルをドラッグ&ドロップするか、クリックして選択してください
            </Typography>
            <Button variant="contained" component="span" disabled={loading}>
              ファイルを選択
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              最大ファイルサイズ: {formatFileSize(maxSize)}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* エラー表示 */}
      {error && (
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Error />
            <Typography variant="body2">
              {error}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* アップロード済みファイル一覧 */}
      {acceptedFiles.length > 0 && (
        <Paper sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            アップロード済みファイル
          </Typography>
          <List>
            {acceptedFiles.map((file, index) => (
              <ListItem
                key={`${file.name}-${index}`}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => onRemoveFile(index)}
                    disabled={loading}
                  >
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  {file.status === 'success' ? (
                    <CheckCircle color="success" />
                  ) : file.status === 'error' ? (
                    <Error color="error" />
                  ) : (
                    <InsertDriveFile />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={`${formatFileSize(file.size)} • ${file.status || 'アップロード完了'}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default FileUploader;