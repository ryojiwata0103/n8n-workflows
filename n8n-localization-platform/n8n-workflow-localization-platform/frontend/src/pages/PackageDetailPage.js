import React, { useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Rating,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Download,
  Person,
  Schedule,
  Visibility,
  Star,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  getPackage,
  downloadPackage,
  clearCurrentPackage,
} from '../store/packageSlice';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const PackageDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { currentPackage, downloading, loading, error } = useSelector((state) => state.package);

  useEffect(() => {
    if (id) {
      dispatch(getPackage(id));
    }

    return () => {
      dispatch(clearCurrentPackage());
    };
  }, [id, dispatch]);

  const handleDownload = async () => {
    try {
      const result = await dispatch(downloadPackage(id)).unwrap();
      
      // ブラウザでファイルダウンロード
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentPackage.title}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('パッケージをダウンロードしました');
    } catch (error) {
      toast.error(`ダウンロードに失敗しました: ${error}`);
    }
  };

  const formatDownloadCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="パッケージを読み込み中..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <ErrorMessage error={error} />
      </Container>
    );
  }

  if (!currentPackage) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <ErrorMessage error="パッケージが見つかりません" />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <div>
            <Typography variant="h4" component="h1" gutterBottom>
              {currentPackage.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  <Person />
                </Avatar>
                <Typography variant="body1">
                  {currentPackage.user?.username}
                </Typography>
              </Box>
              <Chip
                label={currentPackage.category}
                color="primary"
                variant="outlined"
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Download sx={{ fontSize: 16 }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDownloadCount(currentPackage.downloadCount)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {currentPackage.tags?.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </div>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<Download />}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'ダウンロード中...' : 'ダウンロード'}
          </Button>
        </Box>

        {currentPackage.rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating value={currentPackage.rating} readOnly />
            <Typography variant="body1">
              {currentPackage.rating.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              (評価)
            </Typography>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* メインコンテンツ */}
        <Grid item xs={12} md={8}>
          {/* 説明 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                説明
              </Typography>
              <Typography variant="body1" paragraph>
                {currentPackage.description || 'このパッケージには説明がありません。'}
              </Typography>
            </CardContent>
          </Card>

          {/* ワークフロー詳細 */}
          {currentPackage.workflow && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ワークフロー詳細
                </Typography>
                <Grid container spacing={2}>
                  {currentPackage.workflow.metadata?.nodeCount && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        ノード数
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {currentPackage.workflow.metadata.nodeCount}
                      </Typography>
                    </Grid>
                  )}
                  {currentPackage.workflow.metadata?.connectionCount && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        接続数
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {currentPackage.workflow.metadata.connectionCount}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* 翻訳情報 */}
          {currentPackage.workflow?.translations && currentPackage.workflow.translations.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  翻訳情報
                </Typography>
                <List>
                  {currentPackage.workflow.translations.map((translation, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${translation.targetLanguage === 'ja' ? '日本語' : translation.targetLanguage}翻訳`}
                        secondary={`品質スコア: ${translation.qualityScore}%`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* サイドバー */}
        <Grid item xs={12} md={4}>
          {/* 基本情報 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    バージョン
                  </Typography>
                  <Typography variant="body1">
                    {currentPackage.version || '1.0.0'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    公開設定
                  </Typography>
                  <Chip
                    label={currentPackage.visibility === 'public' ? '公開' : 'プライベート'}
                    color={currentPackage.visibility === 'public' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    作成日時
                  </Typography>
                  <Typography variant="body1">
                    {new Date(currentPackage.createdAt).toLocaleDateString('ja-JP')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    更新日時
                  </Typography>
                  <Typography variant="body1">
                    {new Date(currentPackage.updatedAt).toLocaleDateString('ja-JP')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* 統計情報 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                統計情報
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    ダウンロード数
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatDownloadCount(currentPackage.downloadCount)}
                  </Typography>
                </Box>

                {currentPackage.rating && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      評価
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star sx={{ color: 'warning.main', fontSize: 20 }} />
                      <Typography variant="h6">
                        {currentPackage.rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* アクション */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                アクション
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Download />}
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  ダウンロード
                </Button>
                
                {/* 今後実装予定の機能 */}
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Star />}
                  disabled
                >
                  評価する（準備中）
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PackageDetailPage;