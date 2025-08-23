import React, { useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Avatar,
  Chip,
  Paper,
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  CloudUpload,
  Translate,
  Package,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { updateProfile } from '../store/authSlice';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (user) {
      setValue('username', user.username);
      setValue('email', user.email);
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    try {
      await dispatch(updateProfile(data)).unwrap();
      toast.success('プロフィールを更新しました');
    } catch (error) {
      toast.error(`更新に失敗しました: ${error}`);
    }
  };

  const getRoleName = (role) => {
    const roleMap = {
      user: 'ユーザー',
      translator: '翻訳者',
      admin: '管理者',
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      user: 'default',
      translator: 'primary',
      admin: 'error',
    };
    return colorMap[role] || 'default';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="プロフィールを読み込み中..." />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6">ユーザー情報が見つかりません</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        プロフィール
      </Typography>

      <Grid container spacing={3}>
        {/* プロフィール情報 */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>
                  <Person sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {user.username}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    {user.email}
                  </Typography>
                  <Chip
                    label={getRoleName(user.role)}
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                </Box>
              </Box>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ユーザー名"
                      {...register('username', {
                        required: 'ユーザー名を入力してください',
                        minLength: {
                          value: 3,
                          message: 'ユーザー名は3文字以上で入力してください',
                        },
                      })}
                      error={!!errors.username}
                      helperText={errors.username?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="メールアドレス"
                      type="email"
                      disabled
                      {...register('email')}
                      helperText="メールアドレスは変更できません"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={loading}
                  >
                    更新
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>

          {/* アカウント情報 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                アカウント情報
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    登録日時
                  </Typography>
                  <Typography variant="body1">
                    {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    最終ログイン
                  </Typography>
                  <Typography variant="body1">
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString('ja-JP')
                      : '未記録'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    ロール
                  </Typography>
                  <Typography variant="body1">
                    {getRoleName(user.role)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    ステータス
                  </Typography>
                  <Chip
                    label={user.isActive ? 'アクティブ' : '無効'}
                    color={user.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 統計・活動情報 */}
        <Grid item xs={12} md={4}>
          {/* 統計カード */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  アップロード済みワークフロー
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Translate sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  翻訳完了数
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Package sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  公開パッケージ数
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* お知らせ・ヒント */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                使い方のヒント
              </Typography>
              <Typography variant="body2" paragraph>
                🎯 <strong>ワークフローアップロード</strong><br />
                n8nのJSONファイルをドラッグ&ドロップで簡単アップロード
              </Typography>
              <Typography variant="body2" paragraph>
                🔄 <strong>高精度翻訳</strong><br />
                Google TranslateとDeepLから翻訳エンジンを選択可能
              </Typography>
              <Typography variant="body2" paragraph>
                📦 <strong>パッケージ公開</strong><br />
                翻訳済みワークフローをコミュニティで共有
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;