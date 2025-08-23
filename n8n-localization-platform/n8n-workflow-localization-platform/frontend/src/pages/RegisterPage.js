import React, { useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { register as registerUser, clearError } from '../store/authSlice';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const RegisterPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const password = watch('password');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = async (data) => {
    try {
      await dispatch(registerUser(data)).unwrap();
      navigate('/');
    } catch (err) {
      // エラーはRedux stateで管理
    }
  };

  const features = [
    'ワークフローの高精度翻訳',
    '翻訳済みワークフローの管理',
    'パッケージ作成・公開機能',
    '無制限のワークフロー処理',
  ];

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <LoadingSpinner message="アカウント作成中..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', gap: 4, minHeight: '80vh' }}>
        {/* 左側：登録フォーム */}
        <Box sx={{ flex: 1 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                アカウント作成
              </Typography>
              <Typography variant="body2" color="text.secondary">
                無料でn8nワークフローの翻訳を始めよう
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                fullWidth
                label="ユーザー名"
                margin="normal"
                {...register('username', {
                  required: 'ユーザー名を入力してください',
                  minLength: {
                    value: 3,
                    message: 'ユーザー名は3文字以上で入力してください',
                  },
                  maxLength: {
                    value: 50,
                    message: 'ユーザー名は50文字以下で入力してください',
                  },
                })}
                error={!!errors.username}
                helperText={errors.username?.message}
                autoComplete="username"
                autoFocus
              />

              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                margin="normal"
                {...register('email', {
                  required: 'メールアドレスを入力してください',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '正しいメールアドレス形式で入力してください',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                autoComplete="email"
              />

              <TextField
                fullWidth
                label="パスワード"
                type="password"
                margin="normal"
                {...register('password', {
                  required: 'パスワードを入力してください',
                  minLength: {
                    value: 8,
                    message: 'パスワードは8文字以上で入力してください',
                  },
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                autoComplete="new-password"
              />

              <TextField
                fullWidth
                label="パスワード（確認）"
                type="password"
                margin="normal"
                {...register('confirmPassword', {
                  required: 'パスワードを再入力してください',
                  validate: (value) =>
                    value === password || 'パスワードが一致しません',
                })}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? 'アカウント作成中...' : 'アカウント作成'}
              </Button>
            </form>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                既にアカウントをお持ちの方は{' '}
                <Link component={RouterLink} to="/login">
                  こちらからログイン
                </Link>
              </Typography>
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Link component={RouterLink} to="/" variant="body2">
                ← ホームに戻る
              </Link>
            </Box>
          </Paper>
        </Box>

        {/* 右側：機能紹介 */}
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
          <Paper elevation={1} sx={{ p: 4, bgcolor: 'primary.light', color: 'white', height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              プラットフォームの特徴
            </Typography>
            <Typography variant="body2" paragraph sx={{ opacity: 0.9 }}>
              n8n Workflow Localization Platformで、
              効率的なワークフロー翻訳・管理を体験してください。
            </Typography>
            
            <List>
              {features.map((feature, index) => (
                <ListItem key={index} sx={{ py: 1 }}>
                  <ListItemIcon>
                    <CheckCircle sx={{ color: 'white' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={feature}
                    primaryTypographyProps={{
                      color: 'white',
                      variant: 'body2'
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                完全無料
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                すべての機能を無料でご利用いただけます。
                アカウント作成も簡単で、すぐに翻訳を開始できます。
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;