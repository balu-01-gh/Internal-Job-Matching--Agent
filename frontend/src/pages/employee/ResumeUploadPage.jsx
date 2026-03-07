/**
 * ResumeUploadPage.jsx
 * Shown immediately after login/registration if resume has not been uploaded yet.
 * Parses the PDF server-side and stores skills/experience in the DB.
 */

import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'

export default function ResumeUploadPage() {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState('idle')   // idle | uploading | done | error
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function pickFile(f) {
    if (!f) return
    if (!f.name.endsWith('.pdf')) { setErrorMsg('Only PDF files are supported'); return }
    setFile(f)
    setErrorMsg('')
    setStatus('idle')
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    pickFile(e.dataTransfer.files[0])
  }

  async function handleUpload() {
    if (!file) return
    setStatus('uploading')
    setErrorMsg('')
    try {
      const { data } = await authAPI.uploadResume(file)
      // Refresh user in localStorage with updated profile
      const { data: freshUser } = await authAPI.me()
      localStorage.setItem('user', JSON.stringify(freshUser))
      setResult(data)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Upload failed. Please try again.')
      setStatus('error')
    }
  }

  function goToDashboard() {
    const role = user.role
    if (role === 'team_lead') navigate('/team-lead/overview')
    else navigate('/employee/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 via-accent-600 to-brand-800 py-10 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-brand-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>
      
      <div className="w-full max-w-lg relative z-10 mx-4 animate-scale-in">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-accent-400 rounded-3xl blur-xl opacity-30" />
        
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-accent-600 px-8 py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/30">
                <span className="text-4xl">📄</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">Upload Your Resume</h1>
              <p className="text-white/80 text-sm mt-2">
                Hi <span className="font-bold text-white">{user.name}</span> — We'll extract your skills & experience with AI
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-white/70 text-xs">
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-[10px]">1</span>
                  <span>Upload PDF</span>
                </div>
                <span className="text-white/40">→</span>
                <div className="flex items-center gap-1.5 text-white/70 text-xs">
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-[10px]">2</span>
                  <span>AI Analysis</span>
                </div>
                <span className="text-white/40">→</span>
                <div className="flex items-center gap-1.5 text-white/70 text-xs">
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-[10px]">3</span>
                  <span>Get Matched</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {status !== 'done' ? (
              <>
                {/* Drop zone */}
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                    dragging 
                      ? 'border-brand-500 bg-gradient-to-br from-brand-50 to-accent-50 shadow-lg' 
                      : 'border-gray-200 hover:border-brand-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-brand-50/30'
                  }`}
                >
                  {file ? (
                    <div className="animate-scale-in">
                      <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <span className="text-3xl">📎</span>
                      </div>
                      <p className="font-bold text-gray-700 text-lg">{file.name}</p>
                      <p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB • Ready to upload</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-16 h-16 bg-gradient-to-br from-brand-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-4xl">☁️</span>
                      </div>
                      <p className="font-bold text-gray-700">Drop your PDF here</p>
                      <p className="text-sm text-gray-400 mt-1">or click to browse files</p>
                      <p className="text-xs text-gray-300 mt-3">Supports: PDF format only</p>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files[0])}
                />
              </div>

              {errorMsg && (
                <div className="mt-4 flex items-center gap-2 text-danger-600 text-sm bg-gradient-to-r from-danger-50 to-danger-100 px-4 py-3 rounded-xl border border-danger-200">
                  <span>⚠️</span> {errorMsg}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || status === 'uploading'}
                className="btn-primary w-full mt-5 py-3.5 text-base"
              >
                {status === 'uploading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Analyzing resume with AI…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>🚀</span> Upload & Analyze
                  </span>
                )}
              </button>
            </>
          ) : (
            /* ── Success state ── */
            <div className="space-y-5 animate-scale-in">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl animate-bounce-gentle">
                  <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-800">Resume Analyzed!</h2>
                <p className="text-gray-500 text-sm mt-2">Here's what our AI extracted from your resume:</p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-brand-50/30 rounded-2xl p-5 space-y-4 border border-gray-100">
                <div>
                  <p className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 text-xs">🎯</span>
                    Skills ({result?.skills?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(result?.skills || []).slice(0, 15).map((s) => (
                      <span key={s} className="px-3 py-1 bg-gradient-to-r from-brand-100 to-accent-100 text-brand-700 text-xs font-semibold rounded-full">{s}</span>
                    ))}
                    {(result?.skills?.length || 0) > 15 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">+{result.skills.length - 15} more</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                  <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                    <p className="text-2xl font-bold text-brand-600">{result?.experience ?? 0}</p>
                    <p className="text-xs text-gray-500 font-medium">Years Exp</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                    <p className="text-2xl font-bold text-accent-600">{result?.projects?.length || 0}</p>
                    <p className="text-xs text-gray-500 font-medium">Projects</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-xl shadow-sm">
                    <p className="text-2xl font-bold text-success-600">{result?.certifications?.length || 0}</p>
                    <p className="text-xs text-gray-500 font-medium">Certs</p>
                  </div>
                </div>
              </div>

              <button onClick={goToDashboard} className="btn-primary w-full py-3.5 text-base">
                <span className="flex items-center justify-center gap-2">
                  Go to Dashboard <span>→</span>
                </span>
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
