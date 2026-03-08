import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Link,
  Shield,
  Search,
  Flag,
  Clock,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { linkSafetyAPI } from '../../services/api';

const panelStyle = {
  background: 'rgba(17,25,40,0.85)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(16px)',
};

const MAX_HISTORY = 12;

const toSafeString = (value) => (typeof value === 'string' ? value : '');

const getHistoryStorageKey = (childKey) =>
  `ask_before_click_history_${childKey || 'unknown'}`;

const loadHistory = (childKey) => {
  try {
    const raw = localStorage.getItem(getHistoryStorageKey(childKey));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveHistory = (childKey, history) => {
  try {
    localStorage.setItem(getHistoryStorageKey(childKey), JSON.stringify(history));
  } catch {
    // Ignore storage issues.
  }
};

const riskMeta = {
  Safe: {
    color: '#86efac',
    border: '1px solid rgba(16,185,129,0.35)',
    background: 'rgba(16,185,129,0.12)',
    icon: CheckCircle,
  },
  Warning: {
    color: '#fcd34d',
    border: '1px solid rgba(245,158,11,0.35)',
    background: 'rgba(245,158,11,0.12)',
    icon: AlertTriangle,
  },
  Dangerous: {
    color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.35)',
    background: 'rgba(239,68,68,0.12)',
    icon: Shield,
  },
};

const normalizeRisk = (riskLevel) => {
  const value = toSafeString(riskLevel).trim().toLowerCase();
  if (value === 'dangerous') return 'Dangerous';
  if (value === 'safe') return 'Safe';
  return 'Warning';
};

export default function AskBeforeYouClickPanel() {
  const { user } = useAuthStore();

  const childId = user?.childId || null;
  const childKey = childId || user?.id || 'unknown';

  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [error, setError] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => loadHistory(childKey));

  useEffect(() => {
    setHistory(loadHistory(childKey));
  }, [childKey]);

  useEffect(() => {
    saveHistory(childKey, history);
  }, [childKey, history]);

  const canReport = useMemo(() => {
    if (!result) return false;
    const level = normalizeRisk(result.riskLevel);
    return level === 'Warning' || level === 'Dangerous';
  }, [result]);

  const addHistoryEntry = (entry) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.normalizedUrl !== entry.normalizedUrl
      );
      return [entry, ...filtered].slice(0, MAX_HISTORY);
    });
  };

  const checkSafety = async () => {
    const rawUrl = toSafeString(urlInput).trim();

    if (!rawUrl) {
      setError('Please paste a website or link first.');
      return;
    }

    setLoading(true);
    setError('');
    setReportMessage('');

    try {
      const response = await linkSafetyAPI.checkLinkSafety(childId, rawUrl);
      const data = response?.data?.data;

      if (!data) {
        throw new Error('No safety result returned');
      }

      const normalized = {
        riskLevel: normalizeRisk(data.riskLevel),
        explanation:
          toSafeString(data.explanation).trim() ||
          'No explanation provided by the assistant.',
        advice:
          toSafeString(data.advice).trim() ||
          'If you are unsure, ask a parent or trusted adult before clicking.',
        normalizedUrl: data.normalizedUrl || rawUrl,
        domain: data.domain || 'unknown',
        source: data.source || 'fallback',
        checkedAt: data.checkedAt || new Date().toISOString(),
      };

      setResult(normalized);

      addHistoryEntry({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        inputUrl: rawUrl,
        ...normalized,
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to check this link right now. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const reportSuspicious = async () => {
    if (!result) return;

    setReporting(true);
    setReportMessage('');

    try {
      await linkSafetyAPI.reportSuspiciousLink({
        childId,
        url: result.normalizedUrl,
        riskLevel: result.riskLevel,
        explanation: result.explanation,
      });
      setReportMessage('Reported to your parent successfully.');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Unable to report this link right now. Please tell your parent directly.';
      setReportMessage(message);
    } finally {
      setReporting(false);
    }
  };

  const selectHistoryItem = (item) => {
    setUrlInput(item.normalizedUrl || item.inputUrl || '');
    setResult({
      riskLevel: normalizeRisk(item.riskLevel),
      explanation: item.explanation,
      advice: item.advice,
      normalizedUrl: item.normalizedUrl,
      domain: item.domain,
      source: item.source || 'fallback',
      checkedAt: item.checkedAt,
    });
    setError('');
    setReportMessage('');
  };

  const activeRisk = normalizeRisk(result?.riskLevel);
  const riskStyle = riskMeta[activeRisk] || riskMeta.Warning;
  const RiskIcon = riskStyle.icon;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-white font-bold text-xl">Ask Before You Click</h2>
        <p className="text-gray-500 text-sm mt-1">
          Not sure if a website is safe? Paste the link below and let the AI
          safety assistant check it for you.
        </p>
      </div>

      <div className="rounded-2xl p-5" style={panelStyle}>
        <div className="space-y-3">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
            Paste website or link here
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div
              className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Link className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com or bit.ly/..."
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
              />
            </div>

            <button
              onClick={checkSafety}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Checking...' : 'Check Safety'}
            </button>
          </div>

          {error && (
            <div className="rounded-xl px-3 py-2 text-xs text-red-300 border border-red-500/30 bg-red-500/10">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={panelStyle}>
        {!result ? (
          <div className="text-center py-6">
            <Search className="w-9 h-9 text-blue-300/70 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Ready to check a link?</p>
            <p className="text-gray-500 text-sm">
              Enter a URL above and click <span className="text-blue-300">Check Safety</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">AI Safety Result</p>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      color: riskStyle.color,
                      background: riskStyle.background,
                      border: riskStyle.border,
                    }}
                  >
                    <RiskIcon className="w-3.5 h-3.5" />
                    Risk Level: {activeRisk}
                  </span>
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Source: {result.source === 'gemini' ? 'Gemini AI' : 'Safety Guard'}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 break-all max-w-full sm:max-w-[380px]">
                {result.normalizedUrl}
              </div>
            </div>

            <div>
              <p className="text-blue-300 font-semibold text-sm mb-1">Explanation</p>
              <p className="text-gray-200 text-sm leading-relaxed">{result.explanation}</p>
            </div>

            <div className="rounded-xl p-3 border border-emerald-500/25 bg-emerald-500/10">
              <p className="text-emerald-300 font-semibold text-sm mb-1">Advice</p>
              <p className="text-gray-100 text-sm leading-relaxed">{result.advice}</p>
            </div>

            {canReport && (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <button
                  onClick={reportSuspicious}
                  disabled={reporting}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 disabled:opacity-60 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  {reporting ? 'Reporting...' : 'Report Suspicious Link'}
                </button>

                {reportMessage && (
                  <p className="text-xs text-gray-300">{reportMessage}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5" style={panelStyle}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">Link Safety History</h3>
          <span className="text-xs text-gray-500">{history.length} checked</span>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No links checked yet.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {history.map((item) => {
              const level = normalizeRisk(item.riskLevel);
              const style = riskMeta[level] || riskMeta.Warning;
              const ItemIcon = style.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => selectHistoryItem(item)}
                  className="w-full text-left rounded-xl p-3 transition-colors hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <span className="text-xs text-blue-300 truncate max-w-[75%]">
                      {item.domain || item.normalizedUrl}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        color: style.color,
                        background: style.background,
                        border: style.border,
                      }}
                    >
                      <ItemIcon className="w-3 h-3" /> {level}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 line-clamp-2">{item.explanation}</p>

                  <div className="mt-1.5 text-[11px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.checkedAt || Date.now()).toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
