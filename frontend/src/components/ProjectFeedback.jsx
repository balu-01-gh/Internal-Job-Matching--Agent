/**
 * ProjectFeedback.jsx - Feedback and rating system for completed projects
 */

import React, { useState } from 'react'

const RATING_CATEGORIES = {
  technical_execution: 'Technical Execution',
  timeline_adherence: 'Timeline Adherence', 
  communication: 'Team Communication',
  problem_solving: 'Problem Solving',
  code_quality: 'Code Quality',
  overall_satisfaction: 'Overall Satisfaction'
}

function StarRating({ value, onChange, readonly = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange(star)}
          className={`text-2xl transition-colors ${
            star <= value 
              ? 'text-yellow-400' 
              : 'text-gray-300 hover:text-yellow-200'
          } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          disabled={readonly}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ProjectFeedback({ 
  projectId, 
  teamId, 
  onSubmit, 
  existingFeedback = null,
  mode = 'create' // 'create' | 'view' | 'edit'
}) {
  const [ratings, setRatings] = useState(
    existingFeedback?.ratings || Object.keys(RATING_CATEGORIES).reduce((acc, key) => {
      acc[key] = 0
      return acc
    }, {})
  )
  
  const [feedback, setFeedback] = useState({
    strengths: existingFeedback?.strengths || '',
    improvements: existingFeedback?.improvements || '',
    lessons_learned: existingFeedback?.lessons_learned || '',
    would_recommend: existingFeedback?.would_recommend || false,
    additional_comments: existingFeedback?.additional_comments || ''
  })

  const [submitting, setSubmitting] = useState(false)

  const handleRatingChange = (category, rating) => {
    setRatings({ ...ratings, [category]: rating })
  }

  const handleFeedbackChange = (field, value) => {
    setFeedback({ ...feedback, [field]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (mode === 'view') return

    setSubmitting(true)
    try {
      await onSubmit({
        projectId,
        teamId,
        ratings,
        ...feedback,
        submitted_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const readonly = mode === 'view'
  const averageRating = Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / Object.keys(ratings).length

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          {mode === 'create' ? 'Project Feedback' : 
           mode === 'view' ? 'Feedback Review' : 'Edit Feedback'}
        </h3>
        {averageRating > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-brand-600">
              {averageRating.toFixed(1)}
            </span>
            <StarRating value={Math.round(averageRating)} readonly />
            <span className="text-sm text-gray-600">Overall Rating</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Categories */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-4">Rate Performance</h4>
          <div className="space-y-4">
            {Object.entries(RATING_CATEGORIES).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <StarRating 
                  value={ratings[key]} 
                  onChange={(rating) => handleRatingChange(key, rating)}
                  readonly={readonly}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Text Feedback */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What worked well? (Strengths)
            </label>
            <textarea
              value={feedback.strengths}
              onChange={(e) => handleFeedbackChange('strengths', e.target.value)}
              className="input min-h-20"
              placeholder="Describe the team's strengths and what went well..."
              readOnly={readonly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Areas for Improvement
            </label>
            <textarea
              value={feedback.improvements}
              onChange={(e) => handleFeedbackChange('improvements', e.target.value)}
              className="input min-h-20"
              placeholder="What could be improved for future projects..."
              readOnly={readonly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Lessons Learned
            </label>
            <textarea
              value={feedback.lessons_learned}
              onChange={(e) => handleFeedbackChange('lessons_learned', e.target.value)}
              className="input min-h-20"
              placeholder="Important takeaways from this project..."
              readOnly={readonly}
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={feedback.would_recommend}
                onChange={(e) => handleFeedbackChange('would_recommend', e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                disabled={readonly}
              />
              <span className="text-sm font-medium text-gray-700">
                Would recommend this team for similar projects
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments
            </label>
            <textarea
              value={feedback.additional_comments}
              onChange={(e) => handleFeedbackChange('additional_comments', e.target.value)}
              className="input min-h-20"
              placeholder="Any other comments or feedback..."
              readOnly={readonly}
            />
          </div>
        </div>

        {!readonly && (
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Submitting...' : mode === 'edit' ? 'Update Feedback' : 'Submit Feedback'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
          </div>
        )}
      </form>

      {/* Feedback Stats (for view mode) */}
      {readonly && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3">Feedback Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {Object.values(ratings).filter(r => r >= 4).length}
              </div>
              <div className="text-xs text-gray-600">High Ratings</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-brand-600">
                {averageRating.toFixed(1)}/5
              </div>
              <div className="text-xs text-gray-600">Avg Rating</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {feedback.would_recommend ? 'Yes' : 'No'}
              </div>
              <div className="text-xs text-gray-600">Recommended</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {existingFeedback?.submitted_at ? 
                  new Date(existingFeedback.submitted_at).toLocaleDateString() : 
                  'N/A'
                }
              </div>
              <div className="text-xs text-gray-600">Submitted</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}