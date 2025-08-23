#!/bin/bash
# AWS本番環境n8nアップデートスクリプト（自動実行版）

set -e

# AWS接続情報
AWS_HOST="18.180.186.231"
AWS_USER="ubuntu"
SSH_KEY="$HOME/.ssh/n8n-it-opt-key.pem"

echo "🚀 AWS本番環境n8nアップデート開始"
echo "📅 実行日時: $(date)"
echo "🌐 対象サーバー: $AWS_HOST"

# 1. SSH接続テスト
echo "🔍 SSH接続テスト..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$AWS_USER@$AWS_HOST" "echo 'SSH接続成功'"
echo "✅ SSH接続確認完了"

# 2. 現在の状況確認
echo "📊 現在のn8n環境確認..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_HOST" << 'REMOTE_COMMANDS'
    echo "現在のn8nバージョン:"
    sudo docker exec n8n n8n --version 2>/dev/null || echo "n8nコンテナが起動していません"
    
    echo -e "\nコンテナ状況:"
    sudo docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
REMOTE_COMMANDS

# 3. バックアップ実行
echo "💾 本番環境バックアップ実行..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_HOST" << 'REMOTE_BACKUP'
    # バックアップディレクトリ作成
    mkdir -p /home/ubuntu/n8n-backups
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="n8n_prod_backup_${TIMESTAMP}"
    
    echo "🔄 本番環境バックアップ開始: ${TIMESTAMP}"
    
    # n8nデータバックアップ
    echo "📁 n8nデータディレクトリバックアップ..."
    sudo docker run --rm -v n8n_data:/data -v /home/ubuntu/n8n-backups:/backup alpine tar czf /backup/${BACKUP_FILE}_n8n_data.tar.gz -C /data . 2>/dev/null
    
    if [ -f "/home/ubuntu/n8n-backups/${BACKUP_FILE}_n8n_data.tar.gz" ]; then
        echo "✅ n8nデータバックアップ完了"
    else
        echo "❌ n8nデータバックアップ失敗"
        exit 1
    fi
    
    # PostgreSQLバックアップ（存在する場合）
    if sudo docker ps --format '{{.Names}}' | grep -q postgres; then
        echo "📊 PostgreSQLバックアップ..."
        POSTGRES_CONTAINER=$(sudo docker ps --format '{{.Names}}' | grep postgres | head -1)
        sudo docker exec $POSTGRES_CONTAINER pg_dump -U postgres -d n8n > "/home/ubuntu/n8n-backups/${BACKUP_FILE}_postgres.sql" 2>/dev/null
    fi
    
    # 設定ファイルバックアップ
    cd n8n-project 2>/dev/null || cd /home/ubuntu
    for file in docker-compose.yml .env; do
        if [ -f "$file" ]; then
            cp "$file" "/home/ubuntu/n8n-backups/${BACKUP_FILE}_${file}"
        fi
    done
    
    echo "✅ バックアップ完了"
    ls -la /home/ubuntu/n8n-backups/${BACKUP_FILE}_*
REMOTE_BACKUP

# 4. アップデート実行
echo "⬆️ n8nアップデート実行..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_HOST" << 'REMOTE_UPDATE'
    echo "📥 最新n8nイメージをプル..."
    sudo docker pull n8nio/n8n:latest
    
    echo "🔄 現在のn8nコンテナ停止..."
    sudo docker stop n8n
    sudo docker rm n8n
    
    # Docker Composeまたは直接起動でアップデート
    cd n8n-project 2>/dev/null || cd /home/ubuntu
    
    if [ -f docker-compose.yml ]; then
        echo "🐳 Docker Composeでアップデート..."
        
        # docker-compose.ymlを最新設定に更新
        sed -i '/^version:/d' docker-compose.yml 2>/dev/null || true
        
        # 環境変数追加（存在しない場合）
        if ! grep -q "N8N_RUNNERS_ENABLED" docker-compose.yml; then
            sed -i '/GENERIC_TIMEZONE/a\      - N8N_DEFAULT_LOCALE=ja\n      - N8N_RUNNERS_ENABLED=true\n      - DB_SQLITE_POOL_SIZE=10' docker-compose.yml
        fi
        
        sudo docker-compose up -d n8n
    else
        echo "🚀 Docker直接起動でアップデート..."
        # 新しい推奨設定でn8n起動
        sudo docker run -d \
            --name n8n \
            --restart unless-stopped \
            -p 5678:5678 \
            -e N8N_BASIC_AUTH_ACTIVE=true \
            -e N8N_BASIC_AUTH_USER=admin \
            -e N8N_BASIC_AUTH_PASSWORD=password123 \
            -e N8N_HOST=0.0.0.0 \
            -e N8N_PORT=5678 \
            -e N8N_PROTOCOL=http \
            -e GENERIC_TIMEZONE=Asia/Tokyo \
            -e N8N_DEFAULT_LOCALE=ja \
            -e N8N_RUNNERS_ENABLED=true \
            -e DB_SQLITE_POOL_SIZE=10 \
            -v n8n_data:/home/node/.n8n \
            n8nio/n8n:latest
    fi
    
    echo "✅ n8nコンテナ起動完了"
REMOTE_UPDATE

# 5. ヘルスチェック
echo "🏥 本番環境ヘルスチェック..."
sleep 30

# ヘルスチェックループ
for i in {1..15}; do
    echo "⏳ ヘルスチェック試行 $i/15..."
    if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_HOST" "curl -sf http://localhost:5678 >/dev/null 2>&1"; then
        echo "✅ n8nサービス正常起動確認"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ ヘルスチェック失敗"
        exit 1
    fi
    sleep 10
done

# 6. アップデート後の状況確認
echo "📊 アップデート後の状況確認..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_HOST" << 'REMOTE_CHECK'
    echo "🎯 新しいn8nバージョン:"
    sudo docker exec n8n n8n --version
    
    echo -e "\n🐳 コンテナ状況:"
    sudo docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    
    echo -e "\n📋 最新ログ（5行）:"
    sudo docker logs n8n --tail 5
REMOTE_CHECK

echo ""
echo "🎉 AWS本番環境n8nアップデート完了"
echo "🌐 Web UI: http://$AWS_HOST:5678"
echo "✅ アップデート成功 - 運用再開可能"