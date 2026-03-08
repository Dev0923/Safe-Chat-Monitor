import React from 'react'
import { AlertTriangle, Clock, CheckCircle, Shield } from 'lucide-react'

const AlertCard = ({ alert, onResolve }) => {
  const isHigh = alert.riskLevel === 'HIGH'
  const isMedium = alert.riskLevel === 'MEDIUM'

  const riskConfig = {
    HIGH:   { border: 'border-red-500/30',    iconBg: 'bg-red-500/10',    iconColor: 'text-red-400',    badge: 'badge-high'   },
    MEDIUM: { border: 'border-amber-500/30',  iconBg: 'bg-amber-500/10',  iconColor: 'text-amber-400',  badge: 'badge-medium' },
    SAFE:   { border: 'border-emerald-500/30',iconBg: 'bg-emerald-500/10',iconColor: 'text-emerald-400',badge: 'badge-safe'   },
  }

  const cfg = riskConfig[alert.riskLevel] || riskConfig.SAFE

  return (
    <div className={`card ${cfg.border} transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg`}>
      <div className="flex items-start gap-4">
        {/* Risk Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${cfg.iconBg} border ${cfg.border} flex items-center justify-center`}>
          {isHigh
            ? <AlertTriangle className={`w-5 h-5 ${cfg.iconColor}`} />
            : isMedium
              ? <Shield className={`w-5 h-5 ${cfg.iconColor}`} />
              : <CheckCircle className={`w-5 h-5 ${cfg.iconColor}`} />
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-semibold text-sm">{alert.childName}</span>
            <span className={cfg.badge}>{alert.riskLevel}</span>
            <span className="text-gray-500 text-xs ml-auto">{alert.riskScore}/100</span>
          </div>

          <p className="text-gray-300 text-sm mb-1 line-clamp-2">
            "{alert.messageContent}"
          </p>

          {alert.explanation && (
            <p className="text-gray-500 text-xs mb-3 line-clamp-1">{alert.explanation}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
              <Clock className="w-3.5 h-3.5" />
              {new Date(alert.createdAt).toLocaleString()}
            </div>

            <button
              onClick={() => onResolve(alert.id)}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertCard
