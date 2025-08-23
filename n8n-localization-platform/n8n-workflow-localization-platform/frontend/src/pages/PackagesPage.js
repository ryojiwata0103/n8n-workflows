import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Rating,
  Avatar,
} from '@mui/material';
import {
  Download,
  Visibility,
  Star,
  Person,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  searchPackages,
  getCategories,
  downloadPackage,
  clearError,
  setSearchParams,
} from '../store/packageSlice';
import SearchFilter from '../components/Search/SearchFilter';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const PackagesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchFilters, setSearchFilters] = useState({});

  const {
    searchResults,
    searchPagination,
    categories,
    loading,
    downloading,
    error,
  } = useSelector((state) => state.package);

  useEffect(() => {
    dispatch(getCategories());
    dispatch(searchPackages({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSearch = (filters) => {
    setSearchFilters(filters);
    dispatch(setSearchParams(filters));
    dispatch(searchPackages({ ...filters, page: 1, limit: 20 }));
  };

  const handleFilterChange = (filters) => {
    setSearchFilters(filters);
    dispatch(setSearchParams(filters));
  };

  const handlePageChange = (newPage) => {
    dispatch(searchPackages({ ...searchFilters, page: newPage, limit: searchPagination.limit }));
  };

  const handleDownload = async (packageId, packageTitle) => {
    try {
      const result = await dispatch(downloadPackage(packageId)).unwrap();
      
      // ブラウザでファイルダウンロード
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${packageTitle}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('パッケージをダウンロードしました');
    } catch (error) {
      toast.error(`ダウンロードに失敗しました: ${error}`);
    }
  };

  const handleView = (packageId) => {
    navigate(`/packages/${packageId}`);
  };

  const formatDownloadCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // 人気のタグを取得（検索結果から）
  const getPopularTags = () => {
    const tagCounts = {};
    searchResults.forEach(pkg => {
      pkg.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([tag]) => tag);
  };

  if (loading && searchResults.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LoadingSpinner message="パッケージを検索中..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ワークフローパッケージ
        </Typography>
        <Typography variant="body1" color="text.secondary">
          翻訳済みn8nワークフローを検索・ダウンロード
        </Typography>
      </Box>

      {/* 検索フィルター */}
      <SearchFilter
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        categories={categories}
        tags={getPopularTags()}
        initialFilters={searchFilters}
        placeholder="パッケージ名、説明で検索..."
      />

      {/* エラー表示 */}
      {error && <ErrorMessage error={error} />}

      {/* 検索結果 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">
          検索結果: {searchPagination.total}件
          {searchFilters.q && (
            <Typography component="span" variant="body2" color="text.secondary">
              {' '}「{searchFilters.q}」の検索結果
            </Typography>
          )}
        </Typography>
      </Box>

      {loading ? (
        <LoadingSpinner />
      ) : searchResults.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            該当するパッケージが見つかりません
          </Typography>
          <Typography variant="body2" color="text.secondary">
            検索条件を変更して再度お試しください
          </Typography>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {searchResults.map((pkg) => (
              <Grid item xs={12} sm={6} md={4} key={pkg.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3" noWrap>
                        {pkg.title}
                      </Typography>
                      <Chip
                        label={getCategoryName(pkg.category)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {pkg.description}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                        <Person />
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {pkg.user?.username}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {pkg.tags?.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {pkg.tags?.length > 3 && (
                        <Chip
                          label={`+${pkg.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Download sx={{ fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDownloadCount(pkg.downloadCount)}
                        </Typography>
                      </Box>
                      {pkg.rating && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Rating value={pkg.rating} readOnly size="small" />
                          <Typography variant="body2" color="text.secondary">
                            {pkg.rating.toFixed(1)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {pkg.workflow?.metadata && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        ノード数: {pkg.workflow.metadata.nodeCount}
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleView(pkg.id)}
                    >
                      詳細
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownload(pkg.id, pkg.title)}
                      disabled={downloading}
                    >
                      ダウンロード
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* ページネーション */}
          {searchPagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  disabled={searchPagination.page === 1}
                  onClick={() => handlePageChange(searchPagination.page - 1)}
                >
                  前のページ
                </Button>
                <Typography sx={{ alignSelf: 'center', mx: 2 }}>
                  {searchPagination.page} / {searchPagination.pages}
                </Typography>
                <Button
                  disabled={searchPagination.page === searchPagination.pages}
                  onClick={() => handlePageChange(searchPagination.page + 1)}
                >
                  次のページ
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default PackagesPage;