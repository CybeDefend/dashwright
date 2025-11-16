import { useState, useEffect, useRef } from "react";
import {
  Users,
  Mail,
  UserPlus,
  XCircle,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  Ban,
} from "lucide-react";
import { invitationService } from "../services/invitationService";
import {
  Invitation,
  InvitationWithUrl,
  CreateInvitationDto,
  RoleType,
  InvitationStatus,
} from "../types";
import { format } from "date-fns";
import ConfirmModal from "../components/ConfirmModal";

export default function OrganizationPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createdInvitation, setCreatedInvitation] =
    useState<InvitationWithUrl | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "revoke" | "delete";
    invitationId: string;
    email: string;
  }>({ isOpen: false, type: "revoke", invitationId: "", email: "" });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      loadInvitations();
    }
  }, []);

  const loadInvitations = async () => {
    try {
      const data = await invitationService.getAll();
      setInvitations(data);
    } catch (error) {
      console.error("Failed to load invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string, email: string) => {
    setConfirmModal({ isOpen: true, type: "revoke", invitationId: id, email });
  };

  const handleDelete = async (id: string, email: string) => {
    setConfirmModal({ isOpen: true, type: "delete", invitationId: id, email });
  };

  const confirmAction = async () => {
    try {
      if (confirmModal.type === "revoke") {
        await invitationService.revoke(confirmModal.invitationId);
      } else {
        await invitationService.delete(confirmModal.invitationId);
      }
      await loadInvitations();
    } catch (error) {
      console.error(`Failed to ${confirmModal.type} invitation:`, error);
    }
  };

  const getStatusIcon = (status: InvitationStatus) => {
    switch (status) {
      case InvitationStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case InvitationStatus.ACCEPTED:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case InvitationStatus.EXPIRED:
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case InvitationStatus.REVOKED:
        return <Ban className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case InvitationStatus.PENDING:
        return "bg-yellow-100 text-yellow-700";
      case InvitationStatus.ACCEPTED:
        return "bg-green-100 text-green-700";
      case InvitationStatus.EXPIRED:
        return "bg-gray-100 text-gray-600";
      case InvitationStatus.REVOKED:
        return "bg-red-100 text-red-700";
    }
  };

  const getRoleColor = (role: RoleType) => {
    switch (role) {
      case RoleType.ADMIN:
        return "bg-purple-100 text-purple-700";
      case RoleType.MAINTAINER:
        return "bg-blue-100 text-blue-700";
      case RoleType.VIEWER:
        return "bg-gray-100 text-gray-600";
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
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Organization
          </h1>
          <p className="text-gray-600">Manage team members and invitations</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Invite Member
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button className="px-4 py-2 text-indigo-600 border-b-2 border-indigo-600 font-medium">
            Invitations
          </button>
        </div>
      </div>

      {/* Invitations List */}
      <div className="card">
        {invitations.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No invitations yet</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Invite your first team member
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation, index) => (
              <div
                key={invitation.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invitation.email}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getRoleColor(
                          invitation.role
                        )}`}
                      >
                        {invitation.role}
                      </span>
                      <span
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(
                          invitation.status
                        )}`}
                      >
                        {getStatusIcon(invitation.status)}
                        {invitation.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Sent{" "}
                        {format(new Date(invitation.createdAt), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Expires{" "}
                        {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                      </div>
                      {invitation.invitedBy && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          by {invitation.invitedBy.fullName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {invitation.status === InvitationStatus.PENDING && (
                      <button
                        onClick={() =>
                          handleRevoke(invitation.id, invitation.email)
                        }
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Revoke invitation"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleDelete(invitation.id, invitation.email)
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete invitation"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onCreated={(invitation) => {
            setCreatedInvitation(invitation);
            setShowInviteModal(false);
            loadInvitations();
          }}
        />
      )}

      {/* Created Invitation Modal */}
      {createdInvitation && (
        <InvitationCreatedModal
          invitation={createdInvitation}
          onClose={() => setCreatedInvitation(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmAction}
        title={
          confirmModal.type === "revoke"
            ? "Revoke Invitation?"
            : "Delete Invitation?"
        }
        message={
          confirmModal.type === "revoke"
            ? `Are you sure you want to revoke the invitation for "${confirmModal.email}"? They will no longer be able to use this link.`
            : `Are you sure you want to permanently delete the invitation for "${confirmModal.email}"? This action cannot be undone.`
        }
        confirmText={confirmModal.type === "revoke" ? "Revoke" : "Delete"}
        type={confirmModal.type === "revoke" ? "warning" : "danger"}
      />
    </div>
  );
}

function InviteMemberModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (invitation: InvitationWithUrl) => void;
}) {
  const [formData, setFormData] = useState<CreateInvitationDto>({
    email: "",
    role: RoleType.VIEWER,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const invitation = await invitationService.create(formData);
      onCreated(invitation);
    } catch (error: any) {
      console.error("Failed to create invitation:", error);
      alert(error.response?.data?.message || "Failed to create invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Invite Team Member
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john.doe@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as RoleType })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value={RoleType.VIEWER}>Viewer - Read-only access</option>
              <option value={RoleType.MAINTAINER}>
                Maintainer - Can manage test runs
              </option>
              <option value={RoleType.ADMIN}>Admin - Full access</option>
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700 text-sm">
              You will receive an invitation link to share with this person.
            </p>
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
              {loading ? "Creating..." : "Create Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvitationCreatedModal({
  invitation,
  onClose,
}: {
  invitation: InvitationWithUrl;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(invitation.invitationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Invitation Created!
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm mb-2">
            ✓ Invitation created for <strong>{invitation.email}</strong>
          </p>
          <p className="text-blue-700 text-sm">
            Share the link below with them to create their account.
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">
              Invitation Link:
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
          <code className="text-indigo-600 text-sm font-mono break-all block">
            {invitation.invitationUrl}
          </code>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          This invitation will expire on{" "}
          {format(new Date(invitation.expiresAt), "MMMM d, yyyy")}.
        </p>
        <div className="flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
