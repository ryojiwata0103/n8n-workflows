/**
 * n8n Workflow Parser Service
 * n8nワークフローファイルを解析し、翻訳対象テキストを抽出する
 */

class N8nParser {
  constructor() {
    // 翻訳対象となるフィールドのパス定義（2025年拡張版）
    this.translatableFields = [
      // 基本フィールド
      'name', 'displayName', 'description', 'placeholder', 'notice',
      'hint', 'tooltip', 'label', 'subtitle', 'notes',
      
      // AI・LangChain関連（重要度高）
      'systemMessage', 'userMessage', 'promptTemplate', 'instructions',
      'prompt', 'message', 'content', 'text', 'template',
      
      // UI・メッセージ関連
      'errorMessage', 'successMessage', 'warningMessage', 'confirmMessage',
      'infoMessage', 'helpText', 'statusText',
      
      // 条件・設定説明
      'conditionDescription', 'ruleDescription', 'stepDescription',
      'comment', 'annotation', 'remarks',
      
      // Webhook・HTTP関連
      'responseMessage', 'requestDescription', 'headerDescription',
      
      // データ処理関連
      'fieldDescription', 'columnDescription', 'valueDescription',
      'mappingDescription', 'transformDescription',
      
      // ワークフロー固有
      'summary', 'reason', 'explanation', 'note', 'memo',
      'title', 'subject', 'topic', 'caption'
    ];

    // 除外するノードタイプ（システム予約語など）
    this.excludedNodeTypes = [
      'n8n-nodes-base.start',
      'n8n-nodes-base.noOp'
    ];
  }

  /**
   * ワークフローファイルを解析
   * @param {Object} workflowJson - n8nワークフローJSONオブジェクト
   * @returns {Object} 解析結果
   */
  parse(workflowJson) {
    try {
      const extractedTexts = [];
      const metadata = {
        nodeCount: 0,
        connectionCount: 0,
        version: workflowJson.meta?.version || 'unknown',
        instanceId: workflowJson.meta?.instanceId
      };

      // ワークフロー名と説明の抽出
      if (workflowJson.name) {
        extractedTexts.push({
          id: 'workflow_name',
          path: 'name',
          original: workflowJson.name,
          context: 'workflow',
          type: 'name'
        });
      }

      // ノード情報の解析
      if (workflowJson.nodes && Array.isArray(workflowJson.nodes)) {
        metadata.nodeCount = workflowJson.nodes.length;
        
        workflowJson.nodes.forEach((node, nodeIndex) => {
          this.extractNodeTexts(node, nodeIndex, extractedTexts);
        });
      }

      // コネクション数のカウント
      if (workflowJson.connections) {
        metadata.connectionCount = Object.keys(workflowJson.connections).length;
      }

      // 設定情報の抽出
      if (workflowJson.settings) {
        this.extractSettingsTexts(workflowJson.settings, extractedTexts);
      }

      return {
        success: true,
        extractedTexts,
        metadata,
        originalStructure: this.getWorkflowStructure(workflowJson)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        extractedTexts: [],
        metadata: {}
      };
    }
  }

  /**
   * ノードからテキストを抽出
   */
  extractNodeTexts(node, nodeIndex, extractedTexts) {
    // ノード名
    if (node.name) {
      extractedTexts.push({
        id: `node_${nodeIndex}_name`,
        path: `nodes[${nodeIndex}].name`,
        original: node.name,
        context: 'node',
        nodeType: node.type,
        type: 'name'
      });
    }

    // ノートの抽出
    if (node.notes) {
      extractedTexts.push({
        id: `node_${nodeIndex}_notes`,
        path: `nodes[${nodeIndex}].notes`,
        original: node.notes,
        context: 'node',
        nodeType: node.type,
        type: 'notes'
      });
    }

    // パラメータの解析
    if (node.parameters) {
      this.extractParameterTexts(
        node.parameters,
        `nodes[${nodeIndex}].parameters`,
        extractedTexts,
        node.type
      );
    }
  }

  /**
   * パラメータから翻訳可能なテキストを再帰的に抽出
   */
  extractParameterTexts(params, basePath, extractedTexts, nodeType, depth = 0) {
    // 深さ制限（無限ループ防止）
    if (depth > 10) return;

    Object.entries(params).forEach(([key, value]) => {
      const currentPath = `${basePath}.${key}`;

      if (typeof value === 'string' && value.trim()) {
        // 翻訳対象フィールドかチェック
        if (this.isTranslatableField(key)) {
          extractedTexts.push({
            id: `text_${extractedTexts.length}`,
            path: currentPath,
            original: value,
            context: 'parameter',
            nodeType: nodeType,
            type: key
          });
        }
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          // 配列の処理
          value.forEach((item, index) => {
            if (typeof item === 'object') {
              this.extractParameterTexts(
                item,
                `${currentPath}[${index}]`,
                extractedTexts,
                nodeType,
                depth + 1
              );
            } else if (typeof item === 'string' && this.isTranslatableField(key)) {
              extractedTexts.push({
                id: `text_${extractedTexts.length}`,
                path: `${currentPath}[${index}]`,
                original: item,
                context: 'parameter',
                nodeType: nodeType,
                type: key
              });
            }
          });
        } else {
          // オブジェクトの再帰処理
          this.extractParameterTexts(
            value,
            currentPath,
            extractedTexts,
            nodeType,
            depth + 1
          );
        }
      }
    });
  }

  /**
   * 設定から翻訳可能なテキストを抽出
   */
  extractSettingsTexts(settings, extractedTexts) {
    if (settings.executionOrder) {
      extractedTexts.push({
        id: 'settings_executionOrder',
        path: 'settings.executionOrder',
        original: settings.executionOrder,
        context: 'settings',
        type: 'executionOrder'
      });
    }

    // その他の設定フィールド
    Object.entries(settings).forEach(([key, value]) => {
      if (typeof value === 'string' && this.isTranslatableField(key)) {
        extractedTexts.push({
          id: `settings_${key}`,
          path: `settings.${key}`,
          original: value,
          context: 'settings',
          type: key
        });
      }
    });
  }

  /**
   * フィールドが翻訳対象かチェック
   */
  isTranslatableField(fieldName) {
    return this.translatableFields.some(field => 
      fieldName.toLowerCase().includes(field.toLowerCase())
    );
  }

  /**
   * ワークフロー構造を取得（翻訳結果統合用）
   */
  getWorkflowStructure(workflowJson) {
    return {
      name: workflowJson.name,
      nodes: workflowJson.nodes?.map(node => ({
        name: node.name,
        type: node.type,
        position: node.position,
        parameters: node.parameters
      })),
      connections: workflowJson.connections,
      settings: workflowJson.settings,
      meta: workflowJson.meta
    };
  }

  /**
   * 翻訳結果をワークフローに統合
   */
  integrate(originalWorkflow, translatedTexts) {
    const workflow = JSON.parse(JSON.stringify(originalWorkflow));
    
    translatedTexts.forEach(({ path, translated }) => {
      if (!translated) return;
      
      try {
        // パスを解析して値を設定
        const keys = path.split(/[\.\[\]]/).filter(k => k);
        let current = workflow;
        
        for (let i = 0; i < keys.length - 1; i++) {
          const key = isNaN(keys[i]) ? keys[i] : parseInt(keys[i]);
          if (!current[key]) {
            current[key] = isNaN(keys[i + 1]) ? {} : [];
          }
          current = current[key];
        }
        
        const lastKey = isNaN(keys[keys.length - 1]) 
          ? keys[keys.length - 1] 
          : parseInt(keys[keys.length - 1]);
        current[lastKey] = translated;
      } catch (error) {
        console.error(`Failed to integrate translation at path ${path}:`, error);
      }
    });

    // メタデータに翻訳情報を追加
    if (!workflow.meta) workflow.meta = {};
    workflow.meta.translated = true;
    workflow.meta.translationDate = new Date().toISOString();
    workflow.meta.translationPlatform = 'n8n-workflow-localization';

    return workflow;
  }
}

module.exports = new N8nParser();