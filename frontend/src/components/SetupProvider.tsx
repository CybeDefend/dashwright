import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../services/api";

export default function SetupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkSetupStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await apiClient.get("/auth/setup-status");

      // If setup is needed and not already on setup page, redirect
      if (response.data.needsSetup && location.pathname !== "/setup") {
        navigate("/setup", { replace: true });
      }
      // If setup is complete and on setup page, redirect to login
      else if (!response.data.needsSetup && location.pathname === "/setup") {
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Failed to check setup status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading screen while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <svg
              className="animate-spin h-8 w-8 text-white"
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
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Dashwright
          </h2>
          <p className="text-gray-600">Loading platform...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
