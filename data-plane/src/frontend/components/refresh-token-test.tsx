"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useMemo } from "react"
import { UserApiClient } from "@/lib/api-client/user"

export function RefreshTokenTest() {
  const { data: session, status } = useSession()
  const [testResults, setTestResults] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)
  
  // Initialize UserApiClient once using useMemo
  const userApiClient = useMemo(() => new UserApiClient(), [])

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const clearResults = () => setTestResults([])

  const testApiCall = async () => {
    if (!session) {
      addResult("❌ No session available. Please login first.")
      return
    }

    try {
      addResult("🌐 Making API call...")
      
      const response = await userApiClient.getCurrentUser()
      
      if (response.data) {
        addResult(`✅ API call successful! User: ${response.data.username}`)
      } else {
        addResult(`❌ API call failed: ${response.error}`)
      }
    } catch (error) {
      addResult(`❌ API call error: ${error}`)
    }
  }

  const testMultipleCalls = async () => {
    setIsTesting(true)
    addResult("🔄 Testing multiple API calls...")
    
    for (let i = 1; i <= 5; i++) {
      addResult(`--- Call ${i}/5 ---`)
      await testApiCall()
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds between calls
    }
    
    addResult("✅ Multiple calls test completed!")
    setIsTesting(false)
  }

  if (session?.error === 'RefreshAccessTokenError') {
    addResult("⚠️ Session error detected: RefreshAccessTokenError")
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="border rounded-lg p-4 bg-blue-50">
        <h2 className="text-xl font-bold mb-2">🔄 NextAuth Refresh Token Test</h2>
        <p className="text-sm text-gray-600 mb-4">
          This component tests the NextAuth refresh token logic with 30-second token expiration.
        </p>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => signIn()}
              disabled={status === 'loading' || !!session}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Login
            </button>
            <button
              onClick={() => signOut()}
              disabled={status === 'loading' || !session}
              className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
            >
              Logout
            </button>
          </div>
          
          <div className="text-sm">
            <strong>Status:</strong> {status === 'loading' ? 'Loading...' : session ? 'Logged in' : 'Not logged in'}
            {session?.error && <span className="text-red-600"> (Error: {session.error})</span>}
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">API Testing</h3>
        <div className="flex gap-2 mb-4">
          <button
            onClick={testApiCall}
            disabled={!session || isTesting}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            Test API Call
          </button>
          <button
            onClick={testMultipleCalls}
            disabled={!session || isTesting}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
          >
            Test Multiple Calls (5)
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Clear Log
          </button>
        </div>
        
        <div className="bg-gray-100 p-3 rounded font-mono text-sm max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="text-gray-500">Ready to start testing...</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))
          )}
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-yellow-50">
        <h3 className="text-lg font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click &quot;Login&quot; to authenticate with NextAuth</li>
          <li>Click &quot;Test API Call&quot; to make authenticated requests</li>
          <li>Wait 30+ seconds for the access token to expire</li>
          <li>Click &quot;Test API Call&quot; again to trigger automatic refresh</li>
          <li>Watch the console logs for refresh token activity</li>
          <li>Use &quot;Test Multiple Calls&quot; to simulate real usage patterns</li>
        </ol>
      </div>
    </div>
  )
}
