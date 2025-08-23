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
  Paper,
} from '@mui/material';
import {
  Download,
  Refresh,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
  getTranslation,
  clearCurrentTranslation,
} from '../store/translationSlice';
import translationService from '../services/translationService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import TranslationProgress from '../components/Translation/TranslationProgress';

const TranslationPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentTranslation, loading, error } = useSelector((state) => state.translation);

  useEffect(() => {
    if (id) {
      dispatch(getTranslation(id));
    }

    return () => {
      dispatch(clearCurrentTranslation());
    };
  }, [id, dispatch]);

  const handleDownload = async () => {
    try {
      const response = await translationService.downloadTranslatedWorkflow(id);
      
      // ブラウザでファイルダウンロード
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `translated_${currentTranslation.workflow?.originalFilename || 'workflow.json'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('翻訳済みワークフローをダウンロードしました');
    } catch (error) {
      toast.error('ダウンロードに失敗しました');
    }
  };

  const getLanguageName = (code) => {
    const languageMap = {
      ja: '日本語',
      en: '英語',
      zh: '中国語',
      ko: '韓国語',
      es: 'スペイン語',
      fr: 'フランス語',
      de: 'ドイツ語',
    };
    return languageMap[code] || code;
  };

  const getEngineName = (engine) => {
    return engine === 'google' ? 'Google Translate' : 'DeepL';
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending: 'default',
      processing: 'info',
      completed: 'success',
      failed: 'error',
    };
    return statusMap[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: '待機中',
      processing: '処理中',
      completed: '完了',
      failed: 'エラー',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="翻訳情報を読み込み中..." />
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

  if (!currentTranslation) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <ErrorMessage error="翻訳情報が見つかりません" />
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
              翻訳結果
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {currentTranslation.workflow?.originalFilename}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={getStatusLabel(currentTranslation.status)}
                color={getStatusColor(currentTranslation.status)}
                size="small"
              />
              <Chip
                label={`${getLanguageName(currentTranslation.targetLanguage)} (${getEngineName(currentTranslation.translationEngine)})`}
                color="primary"
                size="small"
              />
            </Box>
          </div>
          
          {currentTranslation.status === 'completed' && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownload}
            >
              ダウンロード
            </Button>
          )}
        </Box>
      </Grid>

      <Grid container spacing={3}>
        {/* メインコンテンツ */}
        <Grid item xs={12} md={8}>
          {/* 翻訳進捗・結果 */}
          {currentTranslation.status === 'processing' ? (
            <TranslationProgress
              translationStatus={currentTranslation}
              onComplete={() => {
                dispatch(getTranslation(id));
              }}
            />
          ) : currentTranslation.status === 'completed' ? (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CheckCircle color="success" />
                  <Typography variant="h6" color="success.dark">
                    翻訳が完了しました
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  ワークフローの翻訳処理が正常に完了しました。
                  翻訳済みファイルをダウンロードするか、パッケージとして公開することができます。
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={handleDownload}
                  >
                    翻訳済みファイルをダウンロード
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/workflows/${currentTranslation.workflowId}`)}
                  >
                    ワークフロー詳細へ
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : currentTranslation.status === 'failed' ? (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Error color="error" />
                  <Typography variant="h6" color="error">
                    翻訳処理でエラーが発生しました
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  {currentTranslation.errorMessage || '不明なエラーが発生しました。'}
                </Typography>
                
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Refresh />}
                  onClick={() => navigate(`/workflows/${currentTranslation.workflowId}`)}
                >
                  再試行
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  翻訳待機中
                </Typography>
                <Typography variant="body1">
                  この翻訳処理は待機中です。しばらくお待ちください。
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* 翻訳テキスト一覧 */}
          {currentTranslation.translatedTexts && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  翻訳結果サンプル
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {currentTranslation.translatedTexts.slice(0, 5).map((text, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        元テキスト ({text.context})
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {text.original}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        翻訳結果
                      </Typography>
                      <Typography variant="body1" color="primary">
                        {text.translated}
                      </Typography>
                      {text.qualityScore && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            品質スコア:
                          </Typography>
                          <Chip
                            label={`${text.qualityScore}%`}
                            size="small"
                            color={text.qualityScore >= 80 ? 'success' : 
                                   text.qualityScore >= 60 ? 'warning' : 'error'}
                          />
                        </Box>
                      )}
                    </Paper>
                  ))}
                  {currentTranslation.translatedTexts.length > 5 && (
                    <Typography variant="body2" color="text.secondary" align="center">
                      他 {currentTranslation.translatedTexts.length - 5} 件の翻訳結果があります
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* サイドバー */}
        <Grid item xs={12} md={4}>
          {/* 翻訳情報 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                翻訳情報
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    翻訳先言語
                  </Typography>
                  <Typography variant="body1">
                    {getLanguageName(currentTranslation.targetLanguage)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    翻訳エンジン
                  </Typography>
                  <Typography variant="body1">
                    {getEngineName(currentTranslation.translationEngine)}
                  </Typography>
                </Box>

                {currentTranslation.qualityScore && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      平均品質スコア
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" color="primary">
                        {currentTranslation.qualityScore}%
                      </Typography>
                      <Chip
                        label={
                          currentTranslation.qualityScore >= 80 ? '高品質' :
                          currentTranslation.qualityScore >= 60 ? '標準' : '要改善'
                        }
                        size="small"
                        color={
                          currentTranslation.qualityScore >= 80 ? 'success' :
                          currentTranslation.qualityScore >= 60 ? 'warning' : 'error'
                        }
                      />
                    </Box>
                  </Box>
                )}

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    開始日時
                  </Typography>
                  <Typography variant="body1">
                    {new Date(currentTranslation.createdAt).toLocaleString('ja-JP')}
                  </Typography>
                </Box>

                {currentTranslation.completedAt && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      完了日時
                    </Typography>
                    <Typography variant="body1">
                      {new Date(currentTranslation.completedAt).toLocaleString('ja-JP')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* ワークフロー情報 */}
          {currentTranslation.workflow && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  元ワークフロー
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      ファイル名
                    </Typography>
                    <Typography variant="body1">
                      {currentTranslation.workflow.originalFilename}
                    </Typography>
                  </Box>
                  
                  {currentTranslation.workflow.extractedTexts && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        翻訳対象テキスト数
                      </Typography>
                      <Typography variant="h5" color="info.main">
                        {currentTranslation.workflow.extractedTexts.length}
                      </Typography>
                    </Box>
                  )}

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate(`/workflows/${currentTranslation.workflowId}`)}
                  >
                    ワークフロー詳細へ
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default TranslationPage;