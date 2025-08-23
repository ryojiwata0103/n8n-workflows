FROM node:18-alpine as build

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# アプリケーションファイルをコピー
COPY . .

# ビルド
RUN npm run build

# 本番用イメージ
FROM nginx:alpine

# ビルド成果物をnginxの公開ディレクトリにコピー
COPY --from=build /app/build /usr/share/nginx/html

# Nginxの設定ファイルをコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]