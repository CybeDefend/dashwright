import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/api";
import { useAuthStore } from "../store/auth.store";
import { Shield, Users, Server, CheckCircle } from "lucide-react";

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
    fullName: "",
    registrationEnabled: true,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    setError("");

    if (step === 1) {
      if (!formData.username || !formData.email || !formData.fullName) {
        setError("Please fill in all fields");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.password || !formData.confirmPassword) {
        setError("Please fill in all fields");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      // Create admin account
      const registerResponse = await apiClient.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        fullName: formData.fullName,
      });

      // Set registration setting
      await apiClient.post(
        "/admin/settings/registration-enabled",
        {
          enabled: formData.registrationEnabled,
        },
        {
          headers: {
            Authorization: `Bearer ${registerResponse.data.accessToken}`,
          },
        }
      );

      // Login the user
      login(
        registerResponse.data.accessToken,
        registerResponse.data.refreshToken,
        registerResponse.data.user
      );

      // Navigate to dashboard
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="card-glass w-full max-w-2xl animate-slide-up relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl mb-6 shadow-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-3">
            Welcome to Dashwright
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Platform Setup & Configuration
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10 gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 mx-1 transition-all ${
                    step > s ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="alert alert-error animate-slide-down mb-6">
            <svg
              className="w-5 h-5 inline mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Step 1: Admin Account Info */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-indigo-900 mb-1">
                    Create Administrator Account
                  </h3>
                  <p className="text-sm text-indigo-700">
                    This will be the main administrator account with full access
                    to the platform.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="input"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="admin@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                className="input"
                placeholder="My Company"
                required
              />
            </div>

            <button onClick={handleNext} className="btn-primary w-full mt-6">
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Password */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">
                    Secure Your Account
                  </h3>
                  <p className="text-sm text-orange-700">
                    Choose a strong password with at least 8 characters.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="Re-enter your password"
                required
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleBack} className="btn-secondary flex-1">
                Back
              </button>
              <button onClick={handleNext} className="btn-primary flex-1">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Platform Configuration */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Server className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-purple-900 mb-1">
                    Platform Configuration
                  </h3>
                  <p className="text-sm text-purple-700">
                    Configure initial platform settings. You can change these
                    later.
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Toggle */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    User Registration
                  </h4>
                  <p className="text-sm text-gray-600">
                    Allow new users to create accounts on this platform. You can
                    manage this later in the admin panel.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      registrationEnabled: !formData.registrationEnabled,
                    })
                  }
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0 ${
                    formData.registrationEnabled
                      ? "bg-green-600"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      formData.registrationEnabled
                        ? "translate-x-7"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <CheckCircle
                  className={`w-4 h-4 ${
                    formData.registrationEnabled
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    formData.registrationEnabled
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {formData.registrationEnabled
                    ? "Registration is enabled"
                    : "Registration is disabled"}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h4 className="font-semibold text-blue-900 mb-3">
                Setup Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Full Name:</span>
                  <span className="font-medium text-blue-900">
                    {formData.fullName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Username:</span>
                  <span className="font-medium text-blue-900">
                    {formData.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Email:</span>
                  <span className="font-medium text-blue-900">
                    {formData.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Organization:</span>
                  <span className="font-medium text-blue-900">
                    {formData.organizationName || "Not set"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleBack} className="btn-secondary flex-1">
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Setting up...
                  </span>
                ) : (
                  "Complete Setup"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500 font-medium">
            © 2025 CybeDefend • Licensed under Apache 2.0
          </p>
        </div>
      </div>
    </div>
  );
}
