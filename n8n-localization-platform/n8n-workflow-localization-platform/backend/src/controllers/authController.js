const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * JWTトークン生成
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  return { accessToken, refreshToken };
};

/**
 * ユーザー登録
 */
const register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // ユーザー作成
    const user = await User.create({
      email,
      username,
      password
    });

    // トークン生成
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ログイン
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ユーザー検索
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // パスワード検証
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 最終ログイン更新
    await user.update({ lastLogin: new Date() });

    // トークン生成
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * トークンリフレッシュ
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // トークン検証
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // ユーザー存在確認
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // 新しいトークン生成
    const tokens = generateTokens(user.id);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    next(error);
  }
};

/**
 * ログアウト
 */
const logout = async (req, res, next) => {
  try {
    // クライアント側でトークンを削除することで対応
    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

/**
 * プロフィール取得
 */
const getProfile = async (req, res, next) => {
  try {
    res.json({
      user: req.user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * プロフィール更新
 */
const updateProfile = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (username) {
      await req.user.update({ username });
    }

    res.json({
      message: 'Profile updated successfully',
      user: req.user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile
};