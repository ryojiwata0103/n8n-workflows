import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Button,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormControlLabel,
  Switch,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const SearchFilter = ({
  onSearch,
  onFilterChange,
  categories = [],
  tags = [],
  initialFilters = {},
  showAdvanced = true,
  placeholder = '検索キーワードを入力...',
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState(initialFilters.q || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const [selectedTags, setSelectedTags] = useState(initialFilters.tags || []);
  const [sortBy, setSortBy] = useState(initialFilters.sort || 'created');
  const [downloadRange, setDownloadRange] = useState(initialFilters.downloadRange || [0, 1000]);
  const [ratingRange, setRatingRange] = useState(initialFilters.ratingRange || [0, 5]);
  const [onlyWithTranslations, setOnlyWithTranslations] = useState(initialFilters.onlyWithTranslations || false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const sortOptions = [
    { value: 'created', label: '作成日時（新しい順）' },
    { value: 'updated', label: '更新日時（新しい順）' },
    { value: 'downloads', label: 'ダウンロード数（多い順）' },
    { value: 'rating', label: '評価（高い順）' },
  ];

  // フィルター変更時の処理
  useEffect(() => {
    const filters = {
      q: searchQuery,
      category: selectedCategory,
      tags: selectedTags,
      sort: sortBy,
      downloadRange,
      ratingRange,
      onlyWithTranslations,
    };
    
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [
    searchQuery,
    selectedCategory,
    selectedTags,
    sortBy,
    downloadRange,
    ratingRange,
    onlyWithTranslations,
    onFilterChange,
  ]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (onSearch) {
      onSearch({
        q: searchQuery,
        category: selectedCategory,
        tags: selectedTags,
        sort: sortBy,
        downloadRange,
        ratingRange,
        onlyWithTranslations,
      });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTags([]);
    setSortBy('created');
    setDownloadRange([0, 1000]);
    setRatingRange([0, 5]);
    setOnlyWithTranslations(false);
  };

  const getTagName = (tagValue) => {
    return tagValue;
  };

  const hasActiveFilters = 
    searchQuery ||
    selectedCategory ||
    selectedTags.length > 0 ||
    sortBy !== 'created' ||
    downloadRange[0] !== 0 ||
    downloadRange[1] !== 1000 ||
    ratingRange[0] !== 0 ||
    ratingRange[1] !== 5 ||
    onlyWithTranslations;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <form onSubmit={handleSearch}>
        {/* 基本検索 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{ minWidth: 100 }}
          >
            検索
          </Button>
        </Box>

        {/* 基本フィルター */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="カテゴリ"
              >
                <MenuItem value="">すべてのカテゴリ</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>並び順</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="並び順"
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>タグ</InputLabel>
              <Select
                multiple
                value={selectedTags}
                onChange={(e) => setSelectedTags(e.target.value)}
                input={<OutlinedInput label="タグ" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={getTagName(value)} size="small" />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {tags.map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
              {showAdvanced && (
                <IconButton
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  color={advancedOpen ? 'primary' : 'default'}
                >
                  <FilterList />
                </IconButton>
              )}
              {hasActiveFilters && (
                <IconButton onClick={handleClearFilters} color="secondary">
                  <Clear />
                </IconButton>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* 詳細フィルター */}
        {showAdvanced && (
          <Accordion expanded={advancedOpen} onChange={() => setAdvancedOpen(!advancedOpen)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>詳細フィルター</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>ダウンロード数</Typography>
                  <Slider
                    value={downloadRange}
                    onChange={(e, newValue) => setDownloadRange(newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000}
                    step={10}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 500, label: '500' },
                      { value: 1000, label: '1000+' },
                    ]}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>評価</Typography>
                  <Slider
                    value={ratingRange}
                    onChange={(e, newValue) => setRatingRange(newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={5}
                    step={0.5}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 2.5, label: '2.5' },
                      { value: 5, label: '5' },
                    ]}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={onlyWithTranslations}
                        onChange={(e) => setOnlyWithTranslations(e.target.checked)}
                      />
                    }
                    label="翻訳済みワークフローのみ表示"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* アクティブフィルター表示 */}
        {hasActiveFilters && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1 }}>
              アクティブフィルター:
            </Typography>
            {searchQuery && (
              <Chip
                label={`キーワード: "${searchQuery}"`}
                size="small"
                onDelete={() => setSearchQuery('')}
              />
            )}
            {selectedCategory && (
              <Chip
                label={`カテゴリ: ${categories.find(c => c.id === selectedCategory)?.name}`}
                size="small"
                onDelete={() => setSelectedCategory('')}
              />
            )}
            {selectedTags.map((tag) => (
              <Chip
                key={tag}
                label={`タグ: ${getTagName(tag)}`}
                size="small"
                onDelete={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
              />
            ))}
            {sortBy !== 'created' && (
              <Chip
                label={`並び順: ${sortOptions.find(o => o.value === sortBy)?.label}`}
                size="small"
                onDelete={() => setSortBy('created')}
              />
            )}
          </Box>
        )}
      </form>
    </Paper>
  );
};

export default SearchFilter;