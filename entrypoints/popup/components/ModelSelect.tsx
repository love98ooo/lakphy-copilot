import { useEffect, useState } from "react";
import { debounce } from "../../../utils/debounce";
import "./ModelSelect.css";

interface Model {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  apiKey: string;
  provider: "openrouter" | "openai";
  baseURL?: string;
}

export function ModelSelect({ value, onChange, apiKey, provider, baseURL }: ModelSelectProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);

  // 获取模型列表
  const fetchModels = async () => {
    if (!apiKey) {
      setError("请先设置 API 密钥");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      let data;

      if (provider === "openrouter") {
        response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        data = await response.json();
        if (!response.ok) throw new Error("获取模型列表失败");
        setModels(data.data || []);
        setFilteredModels(data.data || []);
      } else {
        response = await fetch(`${baseURL || "https://api.openai.com/v1"}/models`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        data = await response.json();
        if (!response.ok) throw new Error("获取模型列表失败");

        // 转换 OpenAI 模型数据格式以匹配我们的接口
        const formattedModels = data.data
          .map((model: any) => ({
            id: model.id,
            name: model.id.split("-").map((word: string) =>
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(" "),
            description: model?.description || "",
            context_length: model?.context_length || 4096,
            pricing: {
              prompt: model?.pricing?.prompt || "",
              completion: model?.pricing?.completion || ""
            }
          }));

        setModels(formattedModels);
        setFilteredModels(formattedModels);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchModels();
  }, [apiKey, provider, baseURL]);

  // 搜索过滤
  const filterModels = debounce((term: string) => {
    const filtered = models.filter(
      (model) =>
        model.id.toLowerCase().includes(term.toLowerCase()) ||
        model.name.toLowerCase().includes(term.toLowerCase()) ||
        model.description.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredModels(filtered);
  }, 300);

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterModels(term);
  };

  // 处理搜索框点击
  const handleSearchFocus = () => {
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
      searchBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 处理模型选择
  const handleModelSelect = (modelId: string) => {
    onChange(modelId);
    // 可选：选择后清空搜索
    setSearchTerm("");
    setFilteredModels(models);
  };

  // 当提供商改变时，清空模型列表和错误状态
  useEffect(() => {
    setModels([]);
    setFilteredModels([]);
    setError(null);
    setSearchTerm("");
  }, [provider]);

  return (
    <div className="model-select">
      {value && (
        <div className="selected-model">
          {(() => {
            const selectedModel = models.find(m => m.id === value);
            if (selectedModel) {
              return (
                <div className="model-item selected">
                  <div className="model-header">
                    <span className="model-name">{selectedModel.name}</span>
                    <span className="model-id">{selectedModel.id}</span>
                  </div>
                  <div className="model-description">{selectedModel.description}</div>
                  <div className="model-pricing">
                    <small>
                      输入: {selectedModel.pricing.prompt} /
                      输出: {selectedModel.pricing.completion}
                    </small>
                  </div>
                </div>
              );
            } else if (loading) {
              return (
                <div className="model-item selected loading-model">
                  <div className="model-header">
                    <span className="model-id">{value}</span>
                  </div>
                  <div className="model-description">
                    加载模型信息中...
                  </div>
                </div>
              );
            } else {
              return (
                <div className="model-item selected loading-model">
                  <div className="model-header">
                    <span className="model-id">{value}</span>
                  </div>
                  <div className="model-description">
                    无法加载模型信息
                  </div>
                </div>
              );
            }
          })()}
        </div>
      )}

      <div className="search-box">
        <input
          type="text"
          placeholder="搜索模型..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          className="search-input"
        />
      </div>

      {loading && <div className="loading">加载中...</div>}
      {error && <div className="error">{error}</div>}

      <div className="models-list">
        {filteredModels
          .filter(model => model.id !== value) // 不显示已选中的模型
          .map((model) => (
          <div
            key={model.id}
            className={`model-item ${value === model.id ? "selected" : ""}`}
            onClick={() => handleModelSelect(model.id)}
          >
            <div className="model-header">
              <span className="model-name">{model.name}</span>
              <span className="model-id">{model.id}</span>
            </div>
            <div className="model-description">{model.description}</div>
            <div className="model-pricing">
              <small>
                输入: {model.pricing.prompt} / 输出: {model.pricing.completion}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}