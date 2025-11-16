import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Key,
  Copy,
  Check,
  Trash2,
  XCircle,
  Calendar,
  Clock,
} from "lucide-react";
import { apiKeyService } from "../services/apiKeyService";
import { ApiKey, ApiKeyWithSecret, CreateApiKeyDto } from "../types";
import { format } from "date-fns";
import ConfirmModal from "../components/ConfirmModal";
import { useAuthStore, canManage } from "../store/auth.store";

export default function ApiKeysPage() {
  const { user } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyWithSecret | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "revoke" | "delete";
    keyId: string;
    keyName: string;
  }>({ isOpen: false, type: "revoke", keyId: "", keyName: "" });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      loadApiKeys();
    }
  }, []);

  const loadApiKeys = async () => {
    try {
      const keys = await apiKeyService.getAll();
      setApiKeys(keys);
    } catch (error) {
      console.error("Failed to load API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    setConfirmModal({ isOpen: true, type: "revoke", keyId: id, keyName: name });
  };

  const handleDelete = async (id: string, name: string) => {
    setConfirmModal({ isOpen: true, type: "delete", keyId: id, keyName: name });
  };

  const confirmAction = async () => {
    try {
      if (confirmModal.type === "revoke") {
        await apiKeyService.revoke(confirmModal.keyId);
      } else {
        await apiKeyService.delete(confirmModal.keyId);
      }
      await loadApiKeys();
    } catch (error) {
      console.error(`Failed to ${confirmModal.type} API key:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">API Keys</h1>
          <p className="text-gray-600">
            Manage API keys for programmatic access to Dashwright
          </p>
        </div>
        {canManage(user) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create API Key
          </button>
        )}
      </div>

      {/* API Keys List */}
      <div className="card">
        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No API keys yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create your first API key
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key, index) => (
              <div
                key={key.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {key.name}
                      </h3>
                      {!key.isActive && (
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                          Revoked
                        </span>
                      )}
                    </div>
                    {key.description && (
                      <p className="text-gray-600 text-sm mb-3 ml-8">
                        {key.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 ml-8">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Created {format(new Date(key.createdAt), "MMM d, yyyy")}
                      </div>
                      {key.lastUsedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Last used{" "}
                          {format(new Date(key.lastUsedAt), "MMM d, yyyy")}
                        </div>
                      )}
                      {key.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Expires{" "}
                          {format(new Date(key.expiresAt), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                  {canManage(user) && (
                    <div className="flex items-center gap-2">
                      {key.isActive && (
                        <button
                          onClick={() => handleRevoke(key.id, key.name)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Revoke API key"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(key.id, key.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete API key"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateApiKeyModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(key) => {
            setCreatedKey(key);
            setShowCreateModal(false);
            loadApiKeys();
          }}
        />
      )}

      {/* Created Key Modal */}
      {createdKey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              API Key Created!
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm mb-2">
                ⚠️ <strong>Important:</strong> This is the only time you'll see
                this key!
              </p>
              <p className="text-yellow-700 text-sm">
                Make sure to copy it now and store it securely. You won't be
                able to see it again.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">
                  Your API Key:
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <code className="text-green-600 text-sm font-mono break-all block">
                {createdKey.key}
              </code>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setCreatedKey(null)}
                className="btn-primary"
              >
                I've Saved My Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmAction}
        title={
          confirmModal.type === "revoke" ? "Revoke API Key?" : "Delete API Key?"
        }
        message={
          confirmModal.type === "revoke"
            ? `Are you sure you want to revoke "${confirmModal.keyName}"? It will no longer work and cannot be reactivated.`
            : `Are you sure you want to permanently delete "${confirmModal.keyName}"? This action cannot be undone.`
        }
        confirmText={confirmModal.type === "revoke" ? "Revoke" : "Delete"}
        type={confirmModal.type === "revoke" ? "warning" : "danger"}
      />
    </div>
  );
}

function CreateApiKeyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (key: ApiKeyWithSecret) => void;
}) {
  const [formData, setFormData] = useState<CreateApiKeyDto>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const key = await apiKeyService.create(formData);
      onCreated(key);
    } catch (error) {
      console.error("Failed to create API key:", error);
      alert("Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Create API Key
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Production API Key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Used for CI/CD pipeline..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create API Key"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
