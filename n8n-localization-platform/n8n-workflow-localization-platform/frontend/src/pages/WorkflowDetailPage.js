import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Translate,
  Download,
  Package,
  Visibility,
  Info,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  getWorkflow,
  getWorkflowAnalysis,
  clearCurrentWorkflow,
} from '../store/workflowSlice';
import {
  executeTranslation,
  getSupportedLanguages,
  clearCurrentTranslation,
} from '../store/translationSlice';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import TranslationProgress from '../components/Translation/TranslationProgress';

const WorkflowDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [translateDialogOpen, setTranslateDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ja');
  const [selectedEngine, setSelectedEngine] = useState('google');

  const { currentWorkflow, analysis, loading } = useSelector((state) => state.workflow);
  const { 
    supportedLanguages, 
    executing, 
    executionStatus,
    error: translationError 
  } = useSelector((state) => state.translation);

  useEffect(() => {
    if (id) {
      dispatch(getWorkflow(id));
      dispatch(getWorkflowAnalysis(id));
      dispatch(getSupportedLanguages());
    }
    
    return () => {
      dispatch(clearCurrentWorkflow());
      dispatch(clearCurrentTranslation());
    };
  }, [id, dispatch]);

  const handleTranslate = async () => {
    try {
      await dispatch(executeTranslation({
        workflowId: id,
        targetLanguage: selectedLanguage,
        translationEngine: selectedEngine,
      })).unwrap();
      
      setTranslateDialogOpen(false);
      toast.success('翻訳処理を開始しました');
    } catch (error) {
      toast.error(`翻訳開始に失敗しました: ${error}`);
    }
  };

  const handleDownload = () => {
    // 元のワークフローをダウンロード
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(currentWorkflow.fileContent, null, 2)], {
      type: 'application/json',
    });
    element.href = URL.createObjectURL(file);
    element.download = currentWorkflow.originalFilename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCreatePackage = () => {
    // パッケージ作成画面へ遷移（未実装）
    toast.info('パッケージ作成機能は準備中です');
  };

  const getStatusColor = (status) => {
    const statusMap = {
      uploaded: 'default',
      analyzing: 'info',
      analyzed: 'success',
      translating: 'warning',
      translated: 'success',
      failed: 'error',
    };
    return statusMap[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      uploaded: 'アップロード済み',
      analyzing: '解析中',
      analyzed: '解析完了',
      translating: '翻訳中',
      translated: '翻訳完了',
      failed: 'エラー',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="ワークフローを読み込み中..." />
      </Container>
    );
  }

  if (!currentWorkflow) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <ErrorMessage error="ワークフローが見つかりません" />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <div>
            <Typography variant="h4" component="h1" gutterBottom>
              {currentWorkflow.originalFilename}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label={getStatusLabel(currentWorkflow.status)}
                color={getStatusColor(currentWorkflow.status)}
                size="small"
              />
              {currentWorkflow.translations?.length > 0 && (
                <Chip
                  label={`${currentWorkflow.translations.length}件の翻訳`}
                  color="info"
                  size="small"
                />
              )}
            </Box>
          </div>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownload}
            >
              ダウンロード
            </Button>
            <Button
              variant="contained"
              startIcon={<Translate />}
              onClick={() => setTranslateDialogOpen(true)}
              disabled={currentWorkflow.status !== 'analyzed'}
            >
              翻訳
            </Button>
            {currentWorkflow.translations?.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<Package />}
                onClick={handleCreatePackage}
              >
                パッケージ作成
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* 基本情報 */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    ファイル名
                  </Typography>
                  <Typography variant="body1">
                    {currentWorkflow.originalFilename}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    ファイルサイズ
                  </Typography>
                  <Typography variant="body1">
                    {(currentWorkflow.fileSize / 1024).toFixed(1)} KB
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    ステータス
                  </Typography>
                  <Typography variant="body1">
                    {getStatusLabel(currentWorkflow.status)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    アップロード日時
                  </Typography>
                  <Typography variant="body1">
                    {new Date(currentWorkflow.createdAt).toLocaleString('ja-JP')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 解析結果 */}
          {analysis && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  解析結果
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {analysis.summary?.nodeCount || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ノード数
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {analysis.summary?.totalTexts || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        翻訳対象テキスト
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {analysis.summary?.connectionCount || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        接続数
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* 翻訳進捗 */}
          {executionStatus && (
            <TranslationProgress
              translationStatus={executionStatus}
              onComplete={() => {
                // 翻訳完了後の処理
                dispatch(getWorkflow(id));
                toast.success('翻訳が完了しました！');
              }}
              onRetry={() => {
                // 翻訳再試行
                handleTranslate();
              }}
            />
          )}

          {/* 翻訳対象テキスト一覧 */}
          {analysis?.extractedTexts && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  翻訳対象テキスト
                </Typography>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {analysis.extractedTexts.slice(0, 10).map((text, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemText
                          primary={text.original}
                          secondary={`${text.context} - ${text.type}`}
                        />
                      </ListItem>
                      {index < Math.min(analysis.extractedTexts.length, 10) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {analysis.extractedTexts.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={`他 ${analysis.extractedTexts.length - 10} 件...`}
                        sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* サイドバー */}
        <Grid item xs={12} md={4}>
          {/* 翻訳履歴 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                翻訳履歴
              </Typography>
              {currentWorkflow.translations?.length > 0 ? (
                <List>
                  {currentWorkflow.translations.map((translation) => (
                    <ListItem key={translation.id}>
                      <ListItemText
                        primary={`${translation.targetLanguage === 'ja' ? '日本語' : translation.targetLanguage} (${translation.translationEngine})`}
                        secondary={`品質スコア: ${translation.qualityScore || 'N/A'} - ${new Date(translation.createdAt).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  まだ翻訳されていません
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* パッケージ情報 */}
          {currentWorkflow.package && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  パッケージ情報
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {currentWorkflow.package.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {currentWorkflow.package.description}
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Visibility />}
                  onClick={() => navigate(`/packages/${currentWorkflow.package.id}`)}
                >
                  パッケージを表示
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* 翻訳ダイアログ */}
      <Dialog open={translateDialogOpen} onClose={() => setTranslateDialogOpen(false)}>
        <DialogTitle>ワークフロー翻訳</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 300 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>翻訳先言語</InputLabel>
              <Select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                label="翻訳先言語"
              >
                {supportedLanguages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>翻訳エンジン</InputLabel>
              <Select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                label="翻訳エンジン"
              >
                <MenuItem value="google">Google Translate</MenuItem>
                <MenuItem value="deepl">DeepL</MenuItem>
              </Select>
            </FormControl>

            {analysis && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.dark">
                  <Info sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                  {analysis.summary?.totalTexts || 0}個のテキストが翻訳対象です。
                  推定処理時間: 約{Math.ceil((analysis.summary?.totalTexts || 0) / 10)}秒
                </Typography>
              </Box>
            )}

            {translationError && (
              <ErrorMessage error={translationError} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTranslateDialogOpen(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={handleTranslate} 
            variant="contained"
            disabled={executing}
          >
            {executing ? '処理中...' : '翻訳開始'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WorkflowDetailPage;