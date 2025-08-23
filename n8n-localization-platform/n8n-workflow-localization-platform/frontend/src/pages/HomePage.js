import React, { useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CloudUpload,
  Translate,
  Package,
  Search,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getPopularPackages } from '../store/packageSlice';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { popularPackages, loading } = useSelector((state) => state.package);

  useEffect(() => {
    dispatch(getPopularPackages({ limit: 6 }));
  }, [dispatch]);

  const features = [
    {
      icon: <CloudUpload color="primary" />,
      title: 'ワークフローアップロード',
      description: 'n8nワークフローファイルを簡単にアップロードして解析',
    },
    {
      icon: <Translate color="primary" />,
      title: '高精度翻訳',
      description: 'Google TranslateやDeepL APIによる高品質な日本語翻訳',
    },
    {
      icon: <Package color="primary" />,
      title: 'パッケージ管理',
      description: '翻訳済みワークフローのパッケージ化と配布',
    },
    {
      icon: <Search color="primary" />,
      title: '高度な検索',
      description: 'カテゴリやタグによる効率的なワークフロー検索',
    },
  ];

  const benefits = [
    '日本語ユーザーのn8n活用促進',
    '業務自動化の敷居低下',
    '翻訳済みワークフローの共有',
    '企業のDX推進支援',
  ];

  return (
    <Container maxWidth="lg">
      {/* ヒーローセクション */}
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          n8n Workflow
          <br />
          Localization Platform
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
          n8nワークフローを日本語に翻訳し、<br />
          より効率的な業務自動化を実現
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <>
              <Button
                variant="contained"
                size="large"
                startIcon={<CloudUpload />}
                onClick={() => navigate('/workflows')}
              >
                ワークフローをアップロード
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Search />}
                onClick={() => navigate('/packages')}
              >
                パッケージを探す
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
              >
                無料で始める
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
              >
                ログイン
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* 主要機能 */}
      <Box sx={{ py: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          主要機能
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ビジネス価値 */}
      <Box sx={{ py: 8 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              なぜ選ばれるのか
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              日本語ユーザーのn8n活用を促進し、業務自動化の敷居を下げます。
              翻訳済みワークフローの共有により、コミュニティ全体の価値向上に貢献します。
            </Typography>
            <List>
              {benefits.map((benefit, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={benefit} />
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                翻訳品質
              </Typography>
              <Typography variant="h2" color="primary" sx={{ fontWeight: 700 }}>
                80%+
              </Typography>
              <Typography variant="body2" color="text.secondary">
                人手レビュー込みの翻訳精度
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* 人気パッケージ */}
      <Box sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            人気のワークフロー
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/packages')}>
            すべて見る
          </Button>
        </Box>
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Grid container spacing={3}>
            {popularPackages.map((pkg) => (
              <Grid item xs={12} sm={6} md={4} key={pkg.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {pkg.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {pkg.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption">
                        {pkg.downloadCount} ダウンロード
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => navigate(`/packages/${pkg.id}`)}
                      >
                        詳細
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* CTA セクション */}
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Paper sx={{ p: 6, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h4" gutterBottom>
            今すぐ始めよう
          </Typography>
          <Typography variant="h6" paragraph sx={{ opacity: 0.9 }}>
            ワークフローの翻訳・ローカライゼーションを体験してください
          </Typography>
          {!isAuthenticated && (
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
              onClick={() => navigate('/register')}
            >
              無料アカウント作成
            </Button>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;