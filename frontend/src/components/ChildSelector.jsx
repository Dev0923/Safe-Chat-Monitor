import React from 'react'
import { Users } from 'lucide-react'

const ChildSelector = ({ children, selectedChild, onSelect }) => {
  return (
    <div className="mb-8">
      <div className="card">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold text-base">Select Child</h3>
        </div>

        {children && children.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {children.map(child => {
              const isSelected = selectedChild?.id === child.id
              return (
                <button
                  key={child.id}
                  onClick={() => onSelect(child)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-white/8 bg-white/3 hover:border-emerald-500/30 hover:bg-white/5'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 text-lg font-bold ${
                    isSelected ? 'bg-emerald-500 text-gray-900' : 'bg-white/8 text-gray-300'
                  }`}>
                    {child.name?.charAt(0)?.toUpperCase()}
                  </div>

                  <p className={`font-semibold text-sm mb-1 ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                    {child.name}
                  </p>
                  {child.ageGroup && (
                    <p className="text-xs text-gray-500 mb-3">Age: {child.ageGroup}</p>
                  )}

                  <div className="flex gap-2">
                    {child.totalHighRiskAlerts > 0 && (
                      <span className="badge-high text-xs px-2 py-0.5">
                        {child.totalHighRiskAlerts} High
                      </span>
                    )}
                    {child.totalMediumRiskAlerts > 0 && (
                      <span className="badge-medium text-xs px-2 py-0.5">
                        {child.totalMediumRiskAlerts} Med
                      </span>
                    )}
                    {!child.totalHighRiskAlerts && !child.totalMediumRiskAlerts && (
                      <span className="badge-safe text-xs px-2 py-0.5">Safe</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-500 text-sm">No children added yet.</p>
            <p className="text-gray-600 text-xs mt-1">Go to Settings to add a child.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChildSelector
