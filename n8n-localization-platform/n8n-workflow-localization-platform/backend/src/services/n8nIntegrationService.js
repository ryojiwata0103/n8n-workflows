/**
 * n8n Integration Service
 * n8nインスタンスとの連携機能を提供
 */

const axios = require('axios');

class N8nIntegrationService {
  constructor() {
    this.baseURL = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY;
    this.username = process.env.N8N_USERNAME;
    this.password = process.env.N8N_PASSWORD;
    this.mockMode = process.env.N8N_MOCK_MODE === 'true';
    
    // axios インスタンス作成
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // APIキーまたは認証設定
    this.setupAuthentication();
  }

  /**
   * 認証設定
   */
  setupAuthentication() {
    if (this.apiKey) {
      // n8n Public API認証（メイン）
      this.client.defaults.headers.common['X-N8N-API-KEY'] = this.apiKey;
      // その他のパターンも併用
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.apiKey}`;
      this.client.defaults.headers.common['n8n-api-key'] = this.apiKey;
      // Accept header設定
      this.client.defaults.headers.common['Accept'] = 'application/json';
    } else if (this.username && this.password) {
      // 基本認証
      this.client.defaults.auth = {
        username: this.username,
        password: this.password
      };
    }
    
    // 共通ヘッダー設定
    this.client.defaults.headers.common['User-Agent'] = 'n8n-workflow-localization-platform/1.0';
  }

  /**
   * n8n接続テスト
   */
  async testConnection() {
    if (this.mockMode) {
      return {
        success: true,
        message: 'n8n接続成功（モックモード）',
        workflowCount: 3,
        n8nVersion: 'Mock 1.0.0',
        endpoint: '/api/v1/workflows',
        authMethod: 'Mock API Key',
        mock: true
      };
    }

    try {
      // 複数のエンドポイントを試行
      let response;
      let endpoint;
      
      try {
        // n8n Public APIエンドポイント（優先）
        endpoint = '/api/v1/workflows';
        response = await this.client.get(endpoint);
      } catch (firstError) {
        console.log('Public API failed:', firstError.response?.status, firstError.response?.data);
        try {
          // 従来のRESTエンドポイント
          endpoint = '/rest/workflows';
          response = await this.client.get(endpoint);
        } catch (secondError) {
          console.log('REST API failed:', secondError.response?.status, secondError.response?.data);
          // 旧APIエンドポイント
          endpoint = '/api/workflows';
          response = await this.client.get(endpoint);
        }
      }
      
      return {
        success: true,
        message: 'n8n接続成功',
        workflowCount: Array.isArray(response.data) ? response.data.length : (response.data?.data?.length || 0),
        n8nVersion: response.headers['x-n8n-version'] || 'Unknown',
        endpoint: endpoint,
        authMethod: this.apiKey ? 'API Key' : 'Basic Auth'
      };
    } catch (error) {
      console.error('n8n connection test failed:', error.message);
      console.error('Full error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          headers: error.config?.headers
        }
      });
      return {
        success: false,
        message: `n8n接続失敗: ${error.message}`,
        error: this.formatError(error),
        debug: {
          baseURL: this.baseURL,
          hasApiKey: !!this.apiKey,
          authHeaders: this.client.defaults.headers.common
        }
      };
    }
  }

  /**
   * ワークフローをn8nにインポート
   * @param {Object} workflowData - インポートするワークフローデータ
   * @param {String} workflowName - ワークフロー名
   * @param {Object} options - インポートオプション
   */
  async importWorkflow(workflowData, workflowName, options = {}) {
    if (this.mockMode) {
      // モックモードでは成功結果をシミュレート
      const mockWorkflowId = 'mock_' + Date.now();
      return {
        success: true,
        message: 'ワークフローのインポートが完了しました（モックモード）',
        workflowId: mockWorkflowId,
        workflowName: workflowName,
        n8nUrl: `${this.baseURL}/workflow/${mockWorkflowId}`,
        mock: true
      };
    }

    try {
      // ワークフローデータの前処理
      const processedWorkflow = this.preprocessWorkflowData(workflowData, workflowName, options);
      
      // n8nにワークフローを作成（複数エンドポイント対応）
      let response;
      try {
        response = await this.client.post('/api/v1/workflows', processedWorkflow);
      } catch (firstError) {
        try {
          response = await this.client.post('/rest/workflows', processedWorkflow);
        } catch (secondError) {
          response = await this.client.post('/api/workflows', processedWorkflow);
        }
      }
      
      if (response.status === 200 || response.status === 201) {
        return {
          success: true,
          message: 'ワークフローのインポートが完了しました',
          workflowId: response.data.id,
          workflowName: response.data.name,
          n8nUrl: `${this.baseURL}/workflow/${response.data.id}`
        };
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error('Workflow import failed:', error);
      return {
        success: false,
        message: `ワークフローインポート失敗: ${error.message}`,
        error: this.formatError(error)
      };
    }
  }

  /**
   * ワークフローデータの前処理
   */
  preprocessWorkflowData(workflowData, workflowName, options) {
    // n8n用のワークフロー構造に変換
    const processedWorkflow = {
      name: workflowName || workflowData.name,
      nodes: workflowData.nodes || [],
      connections: workflowData.connections || {},
      active: options.activate || false,
      settings: {
        ...workflowData.settings,
        executionOrder: workflowData.settings?.executionOrder || 'v1'
      },
      tags: this.processTags(workflowData.tags, options),
      meta: {
        ...workflowData.meta,
        imported: true,
        importedAt: new Date().toISOString(),
        importedFrom: 'n8n-workflow-localization-platform',
        originalLanguage: options.originalLanguage || 'en',
        translatedLanguage: options.translatedLanguage || 'ja'
      }
    };

    // ノードIDの重複チェックと修正
    processedWorkflow.nodes = this.ensureUniqueNodeIds(processedWorkflow.nodes);
    
    return processedWorkflow;
  }

  /**
   * タグの処理
   */
  processTags(tags, options) {
    let processedTags = Array.isArray(tags) ? [...tags] : [];
    
    // 翻訳関連タグを追加
    if (options.translatedLanguage) {
      processedTags.push(`translated-${options.translatedLanguage}`);
    }
    
    processedTags.push('imported-from-localization-platform');
    
    return processedTags;
  }

  /**
   * ノードIDの一意性を保証
   */
  ensureUniqueNodeIds(nodes) {
    const usedIds = new Set();
    
    return nodes.map(node => {
      let nodeId = node.id;
      let counter = 1;
      
      // IDが重複している場合は新しいIDを生成
      while (usedIds.has(nodeId)) {
        nodeId = `${node.id}_${counter}`;
        counter++;
      }
      
      usedIds.add(nodeId);
      
      return {
        ...node,
        id: nodeId
      };
    });
  }

  /**
   * n8nから既存ワークフロー一覧取得
   */
  async getWorkflows(options = {}) {
    if (this.mockMode) {
      // モックデータを返す
      const mockWorkflows = [
        {
          id: 'mock_workflow_1',
          name: 'Sample Email Workflow',
          active: true,
          tags: [],
          createdAt: '2025-08-14T08:00:00.000Z',
          updatedAt: '2025-08-14T08:00:00.000Z'
        },
        {
          id: 'mock_workflow_2',
          name: 'Data Processing Pipeline',
          active: false,
          tags: ['automation'],
          createdAt: '2025-08-14T08:00:00.000Z',
          updatedAt: '2025-08-14T08:00:00.000Z'
        }
      ];

      return {
        success: true,
        workflows: mockWorkflows,
        total: mockWorkflows.length,
        mock: true
      };
    }

    try {
      const params = {
        limit: options.limit || 50,
        offset: options.offset || 0
      };
      
      // 複数エンドポイント対応
      let response;
      try {
        response = await this.client.get('/api/v1/workflows', { params });
      } catch (firstError) {
        try {
          response = await this.client.get('/rest/workflows', { params });
        } catch (secondError) {
          response = await this.client.get('/api/workflows', { params });
        }
      }
      
      return {
        success: true,
        workflows: response.data.map(workflow => ({
          id: workflow.id,
          name: workflow.name,
          active: workflow.active,
          tags: workflow.tags,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt
        })),
        total: response.data.length
      };
    } catch (error) {
      console.error('Failed to get workflows from n8n:', error);
      return {
        success: false,
        message: `ワークフロー取得失敗: ${error.message}`,
        error: this.formatError(error)
      };
    }
  }

  /**
   * ワークフロー名の重複チェック
   */
  async checkWorkflowNameExists(name) {
    try {
      const result = await this.getWorkflows();
      if (!result.success) return { exists: false };
      
      const exists = result.workflows.some(workflow => 
        workflow.name.toLowerCase() === name.toLowerCase()
      );
      
      return { exists, suggestions: exists ? this.generateNameSuggestions(name) : [] };
    } catch (error) {
      console.error('Failed to check workflow name:', error);
      return { exists: false, error: error.message };
    }
  }

  /**
   * 名前の提案生成
   */
  generateNameSuggestions(baseName) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return [
      `${baseName} (imported)`,
      `${baseName} (translated)`,
      `${baseName} - ${timestamp}`,
      `${baseName} v2`,
      `${baseName} - Copy`
    ];
  }

  /**
   * n8nの健全性チェック
   */
  async healthCheck() {
    if (this.mockMode) {
      return {
        success: true,
        status: 'ok',
        message: 'n8n is healthy (Mock Mode)',
        mock: true
      };
    }

    try {
      const response = await this.client.get('/healthz');
      return {
        success: true,
        status: response.data.status || 'ok',
        message: 'n8n is healthy'
      };
    } catch (error) {
      // /healthz エンドポイントが存在しない場合は、ワークフロー取得で代用
      try {
        await this.client.get('/rest/workflows?limit=1');
        return {
          success: true,
          status: 'ok',
          message: 'n8n is accessible'
        };
      } catch (fallbackError) {
        return {
          success: false,
          status: 'error',
          message: `n8n health check failed: ${fallbackError.message}`
        };
      }
    }
  }

  /**
   * エラーフォーマット
   */
  formatError(error) {
    if (error.response) {
      // n8n APIからのエラーレスポンス
      return {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        message: error.response.data?.message || error.message
      };
    } else if (error.request) {
      // リクエストは送信されたが、レスポンスがない
      return {
        type: 'network_error',
        message: 'n8nサーバーへの接続に失敗しました。n8nが起動していることを確認してください。'
      };
    } else {
      // その他のエラー
      return {
        type: 'unknown_error',
        message: error.message
      };
    }
  }

  /**
   * 設定情報取得
   */
  getConfiguration() {
    return {
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey,
      hasBasicAuth: !!(this.username && this.password),
      authMethod: this.apiKey ? 'API Key' : (this.username ? 'Basic Auth' : 'None')
    };
  }
}

module.exports = new N8nIntegrationService();