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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-brand-700 px-8 py-6 text-center">
          <div className="text-4xl mb-2">📄</div>
          <h1 className="text-xl font-bold text-white">Upload Your Resume</h1>
          <p className="text-brand-200 text-sm mt-1">
            Hi {user.name} — We'll extract your skills and experience automatically.
          </p>
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
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'
                }`}
              >
                {file ? (
                  <div>
                    <p className="text-2xl mb-2">📎</p>
                    <p className="font-semibold text-gray-700">{file.name}</p>
                    <p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-4xl mb-3">☁️</p>
                    <p className="font-medium text-gray-700">Drop your PDF here</p>
                    <p className="text-sm text-gray-400 mt-1">or click to browse</p>
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
                <p className="mt-3 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{errorMsg}</p>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || status === 'uploading'}
                className="btn-primary w-full mt-4"
              >
                {status === 'uploading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Analyzing resume…
                  </span>
                ) : 'Upload & Analyze'}
              </button>
            </>
          ) : (
            /* ── Success state ── */
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-5xl">✅</span>
                <h2 className="text-xl font-bold text-gray-800 mt-3">Resume Analyzed!</h2>
                <p className="text-gray-500 text-sm mt-1">Here's what we extracted:</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-600 mb-1">Skills ({result?.skills?.length || 0})</p>
                  <div className="flex flex-wrap gap-1">
                    {(result?.skills || []).slice(0, 20).map((s) => (
                      <span key={s} className="badge">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-6">
                  <div>
                    <p className="font-semibold text-gray-600">Experience</p>
                    <p className="text-brand-700 font-bold">{result?.experience ?? 0} yrs</p>
                  </div>
                  {result?.projects?.length > 0 && (
                    <div>
                      <p className="font-semibold text-gray-600">Projects</p>
                      <p className="text-brand-700 font-bold">{result.projects.length} found</p>
                    </div>
                  )}
                  {result?.certifications?.length > 0 && (
                    <div>
                      <p className="font-semibold text-gray-600">Certifications</p>
                      <p className="text-brand-700 font-bold">{result.certifications.length} found</p>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={goToDashboard} className="btn-primary w-full">
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
