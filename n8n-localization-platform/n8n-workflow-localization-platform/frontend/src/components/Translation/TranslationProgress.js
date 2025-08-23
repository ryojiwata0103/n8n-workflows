import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  CloudUpload,
  Translate,
  CheckCircle,
  Error,
  Refresh,
} from '@mui/icons-material';

const TranslationProgress = ({
  translationStatus,
  onRetry,
  onComplete,
  showSteps = true,
  compact = false,
}) => {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const steps = [
    {
      label: 'ワークフロー解析',
      description: 'n8nワークフローファイルから翻訳対象テキストを抽出しています',
      icon: <CloudUpload />,
    },
    {
      label: '翻訳実行',
      description: '抽出されたテキストを選択した翻訳エンジンで処理しています',
      icon: <Translate />,
    },
    {
      label: '品質評価',
      description: '翻訳結果の品質を自動評価しています',
      icon: <CheckCircle />,
    },
    {
      label: '統合・完了',
      description: '翻訳結果をワークフローに統合して完成させています',
      icon: <CheckCircle />,
    },
  ];

  // 進捗計算
  useEffect(() => {
    if (!translationStatus) return;

    const { status, estimatedTime, startTime } = translationStatus;
    
    if (status === 'processing') {
      const elapsed = Date.now() - new Date(startTime).getTime();
      const estimated = estimatedTime * 1000; // 秒をミリ秒に変換
      const calculatedProgress = Math.min((elapsed / estimated) * 100, 95);
      setProgress(calculatedProgress);
      
      // 残り時間計算
      const remaining = Math.max(0, estimated - elapsed);
      setTimeRemaining(remaining);
    } else if (status === 'completed') {
      setProgress(100);
      setTimeRemaining(0);
    } else if (status === 'failed') {
      setProgress(0);
      setTimeRemaining(null);
    }
  }, [translationStatus]);

  // 現在のステップを決定
  const getCurrentStep = () => {
    if (!translationStatus) return -1;
    
    switch (translationStatus.status) {
      case 'processing':
        if (progress < 25) return 0;
        if (progress < 75) return 1;
        if (progress < 95) return 2;
        return 3;
      case 'completed':
        return 4;
      case 'failed':
        return -1;
      default:
        return 0;
    }
  };

  const formatTime = (ms) => {
    if (!ms) return '';
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}分${remainingSeconds}秒` : `${remainingSeconds}秒`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'processing': return '処理中';
      case 'completed': return '完了';
      case 'failed': return 'エラー';
      default: return '待機中';
    }
  };

  if (compact) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">翻訳進捗</Typography>
            <Chip
              label={getStatusText(translationStatus?.status)}
              color={getStatusColor(translationStatus?.status)}
              size="small"
            />
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={progress}
            sx={{ mb: 1 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}% 完了
            </Typography>
            {timeRemaining && (
              <Typography variant="body2" color="text.secondary">
                残り約 {formatTime(timeRemaining)}
              </Typography>
            )}
          </Box>
          
          {translationStatus?.status === 'failed' && onRetry && (
            <Button
              startIcon={<Refresh />}
              onClick={onRetry}
              size="small"
              sx={{ mt: 1 }}
            >
              再試行
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        翻訳進捗
      </Typography>

      {/* 全体進捗 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2">
            全体進捗: {Math.round(progress)}%
          </Typography>
          <Chip
            label={getStatusText(translationStatus?.status)}
            color={getStatusColor(translationStatus?.status)}
            size="small"
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
        />
        
        {timeRemaining && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            残り時間: 約 {formatTime(timeRemaining)}
          </Typography>
        )}
      </Box>

      {/* 詳細情報 */}
      {translationStatus && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              翻訳エンジン
            </Typography>
            <Typography variant="body1">
              {translationStatus.translationEngine === 'google' ? 'Google Translate' : 'DeepL'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              対象言語
            </Typography>
            <Typography variant="body1">
              {translationStatus.targetLanguage === 'ja' ? '日本語' : translationStatus.targetLanguage}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              推定処理時間
            </Typography>
            <Typography variant="body1">
              {translationStatus.estimatedTime}秒
            </Typography>
          </Grid>
        </Grid>
      )}

      {/* ステップ詳細 */}
      {showSteps && (
        <Stepper activeStep={getCurrentStep()} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                icon={
                  getCurrentStep() > index ? (
                    <CheckCircle color="success" />
                  ) : getCurrentStep() === index ? (
                    step.icon
                  ) : (
                    step.icon
                  )
                }
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      )}

      {/* エラー状態 */}
      {translationStatus?.status === 'failed' && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Error color="error" />
            <Typography variant="subtitle2" color="error">
              翻訳処理でエラーが発生しました
            </Typography>
          </Box>
          <Typography variant="body2" color="error">
            {translationStatus.error || '不明なエラーが発生しました。再試行してください。'}
          </Typography>
          {onRetry && (
            <Button
              variant="contained"
              color="error"
              startIcon={<Refresh />}
              onClick={onRetry}
              sx={{ mt: 2 }}
            >
              再試行
            </Button>
          )}
        </Box>
      )}

      {/* 完了状態 */}
      {translationStatus?.status === 'completed' && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="subtitle2" color="success.dark">
              翻訳が完了しました
            </Typography>
          </Box>
          <Typography variant="body2" color="success.dark">
            翻訳済みワークフローをダウンロードするか、パッケージを作成できます。
          </Typography>
          {onComplete && (
            <Button
              variant="contained"
              color="success"
              onClick={onComplete}
              sx={{ mt: 2 }}
            >
              次へ進む
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default TranslationProgress;