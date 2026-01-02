import React, { useState } from "react";
import { apiConfig, authConfig, appConfig } from "@/lib/config";

interface TestResult {
  name: string;
  url?: string;
  status?: number;
  statusText?: string;
  responseTime?: string;
  success: boolean;
  headers?: Record<string, string>;
  data?: unknown;
  error?: string;
  errorType?: string;
  note?: string;
  corsHeaders?: Record<string, string | null>;
}

interface TestResults {
  timestamp: string;
  apiUrl: string;
  tests: TestResult[];
}

const AuthDialog = () => {
  return function DebugPopup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [testResults, setTestResults] = useState<TestResults | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const envVars = {
      NEXT_PUBLIC_API_URL:
        apiConfig.clientBaseUrl || "Not set (default: http://localhost:8000/api/v1)",
      NEXTAUTH_URL: authConfig.url || "Not set",
      NEXTAUTH_SECRET: authConfig.secret ? "***SET***" : "Not set",
      NODE_ENV: appConfig.nodeEnv || "Not set",
    };

    const testBackendConnection = async () => {
      setIsTesting(true);
      setTestResults(null);

      const apiUrl = apiConfig.clientBaseUrl;
      const results: TestResults = {
        timestamp: new Date().toISOString(),
        apiUrl,
        tests: [],
      };

      // Test 1: Check if API URL is reachable (health endpoint)
      try {
        const healthUrl = `${apiUrl.replace("/api/v1", "")}/api/health/`;
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(healthUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        results.tests.push({
          name: "Health Check",
          url: healthUrl,
          status: response.status,
          statusText: response.statusText,
          responseTime: `${responseTime}ms`,
          success: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (response.ok) {
          try {
            const data = await response.json();
            results.tests[results.tests.length - 1].data = data;
          } catch {
            results.tests[results.tests.length - 1].data = "Could not parse JSON";
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Network error";
        const errorType = error instanceof Error ? error.name : "Unknown";
        results.tests.push({
          name: "Health Check",
          success: false,
          error: errorMessage,
          errorType,
        });
      }

      // Test 2: Test auth endpoint (should return 405 for GET, but confirms endpoint exists)
      try {
        const authUrl = `${apiUrl}/auth/jwt/create/`;
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(authUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        results.tests.push({
          name: "Auth Endpoint Check",
          url: authUrl,
          status: response.status,
          statusText: response.statusText,
          responseTime: `${responseTime}ms`,
          success: response.status !== 404, // 405 is OK, means endpoint exists
          headers: Object.fromEntries(response.headers.entries()),
          note: response.status === 405 ? "Endpoint exists (405 expected for GET)" : "",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Network error";
        const errorType = error instanceof Error ? error.name : "Unknown";
        results.tests.push({
          name: "Auth Endpoint Check",
          success: false,
          error: errorMessage,
          errorType,
        });
      }

      // Test 3: CORS check
      try {
        const corsUrl = `${apiUrl}/auth/jwt/create/`;
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(corsUrl, {
          method: "OPTIONS",
          headers: {
            Origin: window.location.origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        const corsHeaders = {
          "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
          "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
          "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
        };

        results.tests.push({
          name: "CORS Check",
          url: corsUrl,
          status: response.status,
          responseTime: `${responseTime}ms`,
          success: !!corsHeaders["Access-Control-Allow-Origin"],
          corsHeaders,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Network error";
        const errorType = error instanceof Error ? error.name : "Unknown";
        results.tests.push({
          name: "CORS Check",
          success: false,
          error: errorMessage,
          errorType,
        });
      }

      setTestResults(results);
      setIsTesting(false);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Debug Environment & Backend Connection</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto p-4 flex-1">
            {/* Environment Variables */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Environment Variables</h3>
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key} className="flex items-start">
                    <span className="font-mono text-sm font-semibold w-48 text-gray-700">
                      {key}:
                    </span>
                    <span className="font-mono text-sm text-gray-900 break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Button */}
            <div className="mb-6">
              <button
                onClick={testBackendConnection}
                disabled={isTesting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? "Testing..." : "Test Backend Connection"}
              </button>
            </div>

            {/* Test Results */}
            {testResults && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Results</h3>
                <div className="text-sm text-gray-600 mb-2">
                  Tested at: {new Date(testResults.timestamp).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  API URL: <span className="font-mono">{testResults.apiUrl}</span>
                </div>

                {testResults.tests.map((test, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{test.name}</h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          test.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {test.success ? "✓ Success" : "✗ Failed"}
                      </span>
                    </div>

                    {test.url && (
                      <div className="text-sm mb-2">
                        <span className="font-semibold">URL:</span>{" "}
                        <span className="font-mono text-blue-600 break-all">{test.url}</span>
                      </div>
                    )}

                    {test.status && (
                      <div className="text-sm mb-2">
                        <span className="font-semibold">Status:</span>{" "}
                        <span className="font-mono">
                          {test.status} {test.statusText}
                        </span>
                      </div>
                    )}

                    {test.responseTime && (
                      <div className="text-sm mb-2">
                        <span className="font-semibold">Response Time:</span>{" "}
                        <span className="font-mono">{test.responseTime}</span>
                      </div>
                    )}

                    {test.error && (
                      <div className="text-sm mb-2 text-red-600">
                        <span className="font-semibold">Error:</span> {test.error}
                        {test.errorType && (
                          <span className="ml-2 text-gray-500">({test.errorType})</span>
                        )}
                      </div>
                    )}

                    {test.note && (
                      <div className="text-sm mb-2 text-blue-600">
                        <span className="font-semibold">Note:</span> {test.note}
                      </div>
                    )}

                    {test.data !== undefined && (
                      <details className="mt-2">
                        <summary className="text-sm font-semibold cursor-pointer">
                          Response Data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}

                    {test.headers && (
                      <details className="mt-2">
                        <summary className="text-sm font-semibold cursor-pointer">
                          Response Headers
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(test.headers, null, 2)}
                        </pre>
                      </details>
                    )}

                    {test.corsHeaders && (
                      <details className="mt-2">
                        <summary className="text-sm font-semibold cursor-pointer">
                          CORS Headers
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(test.corsHeaders, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Network Info */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Network Information</h3>
              <div className="bg-gray-50 rounded-md p-4 space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Current Origin:</span>{" "}
                  <span className="font-mono">{window.location.origin}</span>
                </div>
                <div>
                  <span className="font-semibold">Current Path:</span>{" "}
                  <span className="font-mono">{window.location.pathname}</span>
                </div>
                <div>
                  <span className="font-semibold">User Agent:</span>{" "}
                  <span className="font-mono text-xs">{navigator.userAgent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
};

export default AuthDialog;
