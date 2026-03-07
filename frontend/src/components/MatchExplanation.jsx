/**
 * MatchExplanation.jsx - Detailed match recommendations and explanations
 */

import React from 'react'
import ScoreBar from './ScoreBar'

function getScoreColor(score) {
  if (score >= 0.8) return 'text-success-600'
  if (score >= 0.6) return 'text-warning-600'
  return 'text-danger-600'
}

function getScoreBg(score) {
  if (score >= 0.8) return 'bg-gradient-to-r from-success-50 to-success-100'
  if (score >= 0.6) return 'bg-gradient-to-r from-warning-50 to-warning-100'
  return 'bg-gradient-to-r from-danger-50 to-danger-100'
}

function getRecommendationText(score) {
  if (score >= 0.85) return 'Excellent Match - Highly Recommended'
  if (score >= 0.7) return 'Good Match - Recommended'
  if (score >= 0.5) return 'Fair Match - Consider with caution'
  return 'Poor Match - Not recommended'
}

function getRecommendationEmoji(score) {
  if (score >= 0.85) return '🌟'
  if (score >= 0.7) return '✅'
  if (score >= 0.5) return '⚠️'
  return '❌'
}

export default function MatchExplanation({ matchData, projectData, teamData }) {
  if (!matchData) {
    return <div className="text-gray-500">No match data available</div>
  }

  const {
    final_score,
    embedding_similarity,
    skill_coverage,
    experience_match,
    team_balance
  } = matchData

  const recommendations = []

  // Generate specific recommendations
  if (skill_coverage < 0.7) {
    recommendations.push({
      type: 'warning',
      message: 'Skill gap detected. Team may need additional training or support.',
      action: 'Consider pairing with senior developers or providing skill development opportunities.'
    })
  }

  if (experience_match < 0.6) {
    recommendations.push({
      type: 'caution',
      message: 'Experience level below project requirements.',
      action: 'Provide additional mentoring or extend project timeline.'
    })
  }

  if (team_balance < 0.5) {
    recommendations.push({
      type: 'info',
      message: 'Limited skill diversity in team.',
      action: 'Consider adding members with complementary skills.'
    })
  }

  if (embedding_similarity > 0.8) {
    recommendations.push({
      type: 'success',
      message: 'Excellent technical alignment with project requirements.',
      action: 'This team shows strong potential for project success.'
    })
  }

  return (
    <div className="space-y-6">
      {/* Overall Recommendation */}
      <div className={`p-5 rounded-xl ${getScoreBg(final_score)} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full -translate-y-8 translate-x-8" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>{getRecommendationEmoji(final_score)}</span>
            Overall Recommendation
          </h3>
          <div className={`text-2xl font-bold ${getScoreColor(final_score)} bg-white/50 px-4 py-1 rounded-xl`}>
            {Math.round(final_score * 100)}%
          </div>
        </div>
        <p className={`text-sm font-semibold ${getScoreColor(final_score)}`}>
          {getRecommendationText(final_score)}
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-4">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center text-white text-xs">📊</span>
          Score Breakdown
        </h4>
        
        <div className="card-gradient p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 flex items-center gap-2">
              <span className="w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-xs">🤖</span>
              AI Similarity Match (40%)
            </span>
            <span className="font-bold text-brand-600">{Math.round(embedding_similarity * 100)}%</span>
          </div>
          <ScoreBar percentage={embedding_similarity * 100} />
          <p className="text-xs text-gray-500 mt-2">
            How well the team's expertise aligns with project requirements using AI analysis
          </p>
        </div>

        <div className="card-gradient p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 flex items-center gap-2">
              <span className="w-5 h-5 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 text-xs">🎯</span>
              Skill Coverage (30%)
            </span>
            <span className="font-bold text-accent-600">{Math.round(skill_coverage * 100)}%</span>
          </div>
          <ScoreBar percentage={skill_coverage * 100} />
          <p className="text-xs text-gray-500 mt-2">
            Percentage of required skills covered by team members
          </p>
        </div>

        <div className="card-gradient p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 flex items-center gap-2">
              <span className="w-5 h-5 bg-success-100 rounded-full flex items-center justify-center text-success-600 text-xs">⏱️</span>
              Experience Match (20%)
            </span>
            <span className="font-bold text-success-600">{Math.round(experience_match * 100)}%</span>
          </div>
          <ScoreBar percentage={experience_match * 100} />
          <p className="text-xs text-gray-500 mt-2">
            How team's average experience compares to project requirements
          </p>
        </div>

        <div className="card-gradient p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 flex items-center gap-2">
              <span className="w-5 h-5 bg-warning-100 rounded-full flex items-center justify-center text-warning-600 text-xs">⚖️</span>
              Team Balance (10%)
            </span>
            <span className="font-bold text-warning-600">{Math.round(team_balance * 100)}%</span>
          </div>
          <ScoreBar percentage={team_balance * 100} />
          <p className="text-xs text-gray-500 mt-2">
            Diversity of skills and balanced expertise across team members
          </p>
        </div>
      </div>

      {/* Specific Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-gradient-to-br from-warning-500 to-danger-500 rounded-lg flex items-center justify-center text-white text-xs">💡</span>
            Recommendations
          </h4>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className={`p-4 rounded-xl border-l-4 shadow-sm ${
                rec.type === 'success' ? 'bg-gradient-to-r from-success-50 to-success-100/50 border-success-500' :
                rec.type === 'warning' ? 'bg-gradient-to-r from-warning-50 to-warning-100/50 border-warning-500' :
                rec.type === 'caution' ? 'bg-gradient-to-r from-danger-50 to-danger-100/50 border-danger-500' :
                'bg-gradient-to-r from-brand-50 to-brand-100/50 border-brand-500'
              }`}>
                <p className="text-sm font-semibold text-gray-800">{rec.message}</p>
                <p className="text-xs text-gray-600 mt-1.5">→ {rec.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Factors */}
      <div>
        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-gradient-to-br from-success-500 to-brand-500 rounded-lg flex items-center justify-center text-white text-xs">✓</span>
          Key Success Factors
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className={`p-4 rounded-xl shadow-sm transition-all hover:shadow-md ${
            final_score > 0.7 
              ? 'bg-gradient-to-br from-success-100 to-success-50 border border-success-200' 
              : 'bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200'
          }`}>
            <div className="font-semibold flex items-center gap-2">
              <span>{final_score > 0.7 ? '✓' : '?'}</span> Technical Fit
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {final_score > 0.7 ? 'Strong alignment' : 'Needs assessment'}
            </div>
          </div>
          <div className={`p-4 rounded-xl shadow-sm transition-all hover:shadow-md ${
            skill_coverage > 0.8 
              ? 'bg-gradient-to-br from-success-100 to-success-50 border border-success-200' 
              : 'bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200'
          }`}>
            <div className="font-semibold flex items-center gap-2">
              <span>{skill_coverage > 0.8 ? '✓' : '?'}</span> Skill Readiness
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {skill_coverage > 0.8 ? 'Well prepared' : 'Training needed'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}