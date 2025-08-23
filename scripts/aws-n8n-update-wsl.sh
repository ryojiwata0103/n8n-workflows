#!/bin/bash
# AWS本番環境n8nアップデートスクリプト（WSL用）

set -e

# AWS接続情報
AWS_HOST="18.180.186.231"
AWS_USER="ubuntu"
# SSH鍵をローカルにコピーする必要がある場合のパス
SSH_KEY="$HOME/.ssh/n8n-it-opt-key.pem"

echo "🚀 AWS本番環境n8nアップデート開始"
echo "📅 実行日時: $(date)"
echo "🌐 対象サーバー: $AWS_HOST"

# SSH鍵の存在確認とセットアップ指示
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH鍵が見つかりません: $SSH_KEY"
    echo "📋 SSH鍵セットアップ手順:"
    echo "1. Windows側からSSH鍵をWSLにコピー:"
    echo "   cp /mnt/c/Users/渡辺諒二/.ssh/n8n-it-opt-key.pem ~/.ssh/"
    echo "2. 適切な権限設定:"
    echo "   chmod 600 ~/.ssh/n8n-it-opt-key.pem"
    echo "3. 再度このスクリプトを実行"
    exit 1
fi

# SSH鍵の権限確認
chmod 600 "$SSH_KEY" 2>/dev/null

# 1. SSH接続テスト
echo "🔍 SSH接続テスト..."
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$AWS_USER@$AWS_HOST" "echo 'SSH接続成功'" 2>/dev/null; then
    echo "✅ SSH接続確認完了"
else
    echo "❌ SSH接続に失敗しました"
    echo "📋 トラブルシューティング:"
    echo "- セキュリティグループで22番ポートが開放されているか確認"
    echo "- SSH鍵ファイルの権限が600に設定されているか確認"
    echo "- EC2インスタンスが起動状態か確認"
    exit 1
fi

# 2. 現在の状況確認
echo "📊 現在のn8n環境確認..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_HOST" << 'REMOTE_COMMANDS'
    echo "🐳 Docker状況確認:"
    sudo docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" 2>/dev/null || echo "Dockerが起動していません"
    
    echo -e "\n📊 現在のn8nバージョン:"
    sudo docker exec n8n n8n --version 2>/dev/null || echo "n8nコンテナが起動していません"
    
    echo -e "\n💾 ディスク使用量:"
    df -h / | head -2
    
    echo -e "\n🔍 n8n関連ファイル確認:"
    ls -la | grep -E "(docker|n8n|\.env)" || echo "関連ファイルが見つかりません"
REMOTE_COMMANDS

echo -e "\n⚠️  本番環境アップデートを実行しますか？"
echo "📋 この操作により以下が実行されます:"
echo "   - 現在のn8nデータの完全バックアップ"
echo "   - 最新版n8nへのアップデート"
echo "   - サービス再起動とヘルスチェック"
echo ""
echo "継続するには 'yes' を入力してください:"
read -r confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ アップデートがキャンセルされました"
    exit 0
fi

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
    if sudo docker volume ls | grep -q n8n_data; then
        sudo docker run --rm -v n8n_data:/data -v /home/ubuntu/n8n-backups:/backup alpine tar czf /backup/${BACKUP_FILE}_n8n_data.tar.gz -C /data .
        echo "✅ n8nデータバックアップ完了"
    else
        echo "⚠️ n8nデータボリュームが見つかりません"
    fi
    
    # PostgreSQLバックアップ（存在する場合）
    if sudo docker ps --format '{{.Names}}' | grep -q postgres; then
        echo "📊 PostgreSQLバックアップ..."
        POSTGRES_CONTAINER=$(sudo docker ps --format '{{.Names}}' | grep postgres | head -1)
        sudo docker exec $POSTGRES_CONTAINER pg_dump -U postgres -d n8n > "/home/ubuntu/n8n-backups/${BACKUP_FILE}_postgres.sql" 2>/dev/null || echo "PostgreSQLバックアップをスキップ"
    fi
    
    # 設定ファイルバックアップ
    for file in docker-compose.yml .env; do
        if [ -f "$file" ]; then
            cp "$file" "/home/ubuntu/n8n-backups/${BACKUP_FILE}_${file}"
        fi
    done
    
    echo "✅ バックアップ完了"
    echo "📦 バックアップファイル:"
    ls -la /home/ubuntu/n8n-backups/${BACKUP_FILE}_* 2>/dev/null || echo "バックアップファイルなし"
REMOTE_BACKUP

# 4. アップデート実行
echo "⬆️ n8nアップデート実行..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$AWS_USER@$AWS_HOST" << 'REMOTE_UPDATE'
    echo "📥 最新n8nイメージをプル..."
    sudo docker pull n8nio/n8n:latest
    
    echo "🔄 現在のn8nコンテナ停止..."
    if sudo docker ps --format '{{.Names}}' | grep -q "^n8n$"; then
        sudo docker stop n8n
        sudo docker rm n8n
    fi
    
    # Docker Composeまたは直接起動でアップデート
    if [ -f docker-compose.yml ]; then
        echo "🐳 Docker Composeでアップデート..."
        
        # docker-compose.ymlを最新設定に更新
        sudo sed -i '/^version:/d' docker-compose.yml 2>/dev/null || true
        
        # 環境変数追加（存在しない場合）
        if ! grep -q "N8N_RUNNERS_ENABLED" docker-compose.yml; then
            sudo sed -i '/GENERIC_TIMEZONE/a\      - N8N_DEFAULT_LOCALE=ja\n      - N8N_RUNNERS_ENABLED=true\n      - DB_SQLITE_POOL_SIZE=10' docker-compose.yml
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
        echo "🔧 ロールバック手順:"
        echo "   1. 最新のバックアップファイルを確認"
        echo "   2. 以前のDockerイメージでコンテナ再起動"
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
    
    echo -e "\n📋 最新ログ（10行）:"
    sudo docker logs n8n --tail 10
    
    echo -e "\n🌐 外部アクセステスト:"
    curl -I http://localhost:5678 2>/dev/null | head -1 || echo "HTTP応答なし"
REMOTE_CHECK

echo ""
echo "🎉 AWS本番環境n8nアップデート完了"
echo "🌐 Web UI: http://$AWS_HOST:5678"
echo "✅ 管理者は念のため以下を確認してください:"
echo "   - Webブラウザでの動作確認"
echo "   - 既存ワークフローの動作確認"  
echo "   - 重要なワークフローのテスト実行"
echo ""
echo "📚 アップデート情報:"
echo "   - バックアップ保存先: /home/ubuntu/n8n-backups/"
echo "   - 新機能: Task Runners有効化、日本語対応"
echo "   - パフォーマンス: SQLite接続プール最適化"