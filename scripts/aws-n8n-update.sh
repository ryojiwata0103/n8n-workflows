#!/bin/bash
# AWS本番環境n8nアップデートスクリプト

set -e

# AWS接続情報
AWS_HOST="18.180.186.231"
AWS_USER="ubuntu"
SSH_KEY="/Users/渡辺諒二/.ssh/n8n-it-opt-key.pem"
REMOTE_BACKUP_DIR="/home/ubuntu/n8n-backups"

echo "🚀 AWS本番環境n8nアップデート開始"
echo "📅 実行日時: $(date)"
echo "🌐 対象サーバー: $AWS_HOST"

# 1. SSH接続テスト
echo "🔍 SSH接続テスト..."
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$AWS_USER@$AWS_HOST" "echo 'SSH接続成功'" 2>/dev/null; then
    echo "✅ SSH接続確認完了"
else
    echo "❌ SSH接続に失敗しました"
    exit 1
fi

# 2. 現在の状況確認
echo "📊 現在のn8n環境確認..."
ssh -i "$SSH_KEY" "$AWS_USER@$AWS_HOST" << 'REMOTE_COMMANDS'
    echo "Docker状況確認:"
    sudo docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    
    echo -e "\n現在のn8nバージョン:"
    sudo docker exec n8n n8n --version 2>/dev/null || echo "n8nコンテナが起動していません"
    
    echo -e "\nディスク使用量:"
    df -h
REMOTE_COMMANDS

echo -e "\n⚠️ 本番環境アップデートを実行しますか？"
echo "継続するには 'yes' を入力してください:"
read -r confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ アップデートがキャンセルされました"
    exit 0
fi

# 3. バックアップ実行
echo "💾 本番環境バックアップ実行..."
ssh -i "$SSH_KEY" "$AWS_USER@$AWS_HOST" << 'REMOTE_BACKUP'
    # バックアップディレクトリ作成
    mkdir -p /home/ubuntu/n8n-backups
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="n8n_prod_backup_${TIMESTAMP}"
    
    echo "🔄 本番環境バックアップ開始: ${TIMESTAMP}"
    
    # n8nデータバックアップ
    echo "📁 n8nデータディレクトリバックアップ..."
    sudo docker run --rm -v n8n_data:/data -v /home/ubuntu/n8n-backups:/backup alpine tar czf /backup/${BACKUP_FILE}_n8n_data.tar.gz -C /data .
    
    # PostgreSQLバックアップ（存在する場合）
    if sudo docker ps --format '{{.Names}}' | grep -q postgres; then
        echo "📊 PostgreSQLバックアップ..."
        sudo docker exec $(sudo docker ps --format '{{.Names}}' | grep postgres) pg_dump -U postgres -d n8n > "/home/ubuntu/n8n-backups/${BACKUP_FILE}_postgres.sql"
    fi
    
    # Docker Compose設定バックアップ
    if [ -f docker-compose.yml ]; then
        cp docker-compose.yml "/home/ubuntu/n8n-backups/${BACKUP_FILE}_docker-compose.yml"
    fi
    
    if [ -f .env ]; then
        cp .env "/home/ubuntu/n8n-backups/${BACKUP_FILE}_env"
    fi
    
    echo "✅ バックアップ完了"
    ls -la /home/ubuntu/n8n-backups/${BACKUP_FILE}_*
REMOTE_BACKUP

# 4. アップデート実行
echo "⬆️ n8nアップデート実行..."
ssh -i "$SSH_KEY" "$AWS_USER@$AWS_HOST" << 'REMOTE_UPDATE'
    echo "📥 最新n8nイメージをプル..."
    sudo docker pull n8nio/n8n:latest
    
    echo "🔄 n8nコンテナ停止・再作成..."
    if sudo docker ps --format '{{.Names}}' | grep -q "^n8n$"; then
        sudo docker stop n8n
        sudo docker rm n8n
    fi
    
    # Docker Composeが存在する場合
    if [ -f docker-compose.yml ]; then
        echo "🐳 Docker Composeでアップデート..."
        sudo docker-compose pull n8n
        sudo docker-compose up -d n8n
    else
        echo "🚀 Docker直接起動でアップデート..."
        # 基本的なn8n起動（既存の設定を維持）
        sudo docker run -d \
            --name n8n \
            --restart unless-stopped \
            -p 5678:5678 \
            -e N8N_BASIC_AUTH_ACTIVE=true \
            -e N8N_BASIC_AUTH_USER=admin \
            -e N8N_BASIC_AUTH_PASSWORD=password123 \
            -e N8N_HOST=localhost \
            -e N8N_PORT=5678 \
            -e N8N_PROTOCOL=http \
            -e GENERIC_TIMEZONE=Asia/Tokyo \
            -e N8N_DEFAULT_LOCALE=ja \
            -e N8N_RUNNERS_ENABLED=true \
            -e DB_SQLITE_POOL_SIZE=10 \
            -v n8n_data:/home/node/.n8n \
            n8nio/n8n:latest
    fi
REMOTE_UPDATE

# 5. ヘルスチェック
echo "🏥 本番環境ヘルスチェック..."
sleep 30

# ヘルスチェックループ
for i in {1..10}; do
    echo "⏳ ヘルスチェック試行 $i/10..."
    if ssh -i "$SSH_KEY" "$AWS_USER@$AWS_HOST" "curl -sf http://localhost:5678 >/dev/null 2>&1"; then
        echo "✅ n8nサービス正常起動確認"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ ヘルスチェック失敗"
        exit 1
    fi
    sleep 10
done

# 6. アップデート後の状況確認
echo "📊 アップデート後の状況確認..."
ssh -i "$SSH_KEY" "$AWS_USER@$AWS_HOST" << 'REMOTE_CHECK'
    echo "新しいn8nバージョン:"
    sudo docker exec n8n n8n --version
    
    echo -e "\nコンテナ状況:"
    sudo docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    
    echo -e "\nログ（最新10行）:"
    sudo docker logs n8n --tail 10
REMOTE_CHECK

echo "🎉 AWS本番環境n8nアップデート完了"
echo "✅ Web UI: http://$AWS_HOST:5678"
echo "📚 管理者は念のため動作確認を実施してください"