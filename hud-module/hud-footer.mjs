/**
 * Gemini CLI HUD — Enhanced Footer Component
 * by F. Avigliano Research Lab
 *
 * Drop-in replacement for Footer.js loaded via ESM hook.
 * Adds: CTX (context window) monitor, always-visible budget %, countdown timer, request counter.
 *
 * This module uses the SAME imports as the original Footer.js from @google/gemini-cli.
 * It is designed to be version-resilient: all uiState access is wrapped in safe checks.
 */
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { shortenPath, tildeifyPath, getDisplayString } from '@google/gemini-cli-core';
import { ConsoleSummaryDisplay } from './ConsoleSummaryDisplay.js';
import process from 'node:process';
import { MemoryUsageDisplay } from './MemoryUsageDisplay.js';
import { ContextUsageDisplay } from './ContextUsageDisplay.js';
import { DebugProfiler } from './DebugProfiler.js';
import { isDevelopment } from '../../utils/installationInfo.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { useVimMode } from '../contexts/VimModeContext.js';
// Safe import of useSessionStats — may not exist in older CLI versions
let _useSessionStats;
try {
    const sc = await import('../contexts/SessionContext.js');
    _useSessionStats = sc.useSessionStats;
} catch (_) {
    _useSessionStats = null;
}

// Safe tokenLimit — try importing, fall back to constant
let _tokenLimit;
try {
    const core = await import('@google/gemini-cli-core');
    _tokenLimit = core.tokenLimit || (() => 1048576);
} catch (_) {
    _tokenLimit = () => 1048576;
}

function _isProModel(m) { return typeof m === 'string' && m.toLowerCase().includes('pro'); }

// Safe property access helper
function _safe(fn, fallback) { try { return fn(); } catch (_) { return fallback; } }

export const Footer = () => {
    // === 1. ALL HOOKS (fixed order, unconditional) ===
    const uiState = useUIState();
    const config = useConfig();
    const settings = useSettings();
    const { vimEnabled, vimMode } = useVimMode();
    const sessionData = _useSessionStats ? _useSessionStats() : null;
    const [countdown, setCountdown] = useState("");
    const [polledQuota, setPolledQuota] = useState(null);
    const resetTimeRef = useRef(null);
    const mountedRef = useRef(true);

    // === 2. SAFE DESTRUCTURE — resilient to structure changes ===
    const model = _safe(() => uiState.currentModel, '');
    const targetDir = _safe(() => config.getTargetDir(), '.');
    const debugMode = _safe(() => config.getDebugMode(), false);
    const branchName = _safe(() => uiState.branchName, undefined);
    const debugMessage = _safe(() => uiState.debugMessage, '');
    const corgiMode = _safe(() => uiState.corgiMode, false);
    const errorCount = _safe(() => uiState.errorCount, 0);
    const showErrorDetails = _safe(() => uiState.showErrorDetails, false);
    const promptTokenCount = _safe(() => uiState.sessionStats.lastPromptTokenCount, 0);
    const isTrustedFolder = _safe(() => uiState.isTrustedFolder, undefined);
    const terminalWidth = _safe(() => uiState.terminalWidth, 120);

    // Native quota (v0.32+)
    const nativeQuota = _safe(() => uiState.quota.stats, undefined);
    const currentIsPro = _isProModel(model);

    // === 3. PROACTIVE QUOTA POLLING (startup burst + periodic refresh) ===
    useEffect(() => {
        mountedRef.current = true;
        const tryPoll = async () => {
            if (!mountedRef.current) return;
            try {
                if (typeof config.refreshUserQuota === 'function') {
                    const resp = await config.refreshUserQuota();
                    if (!mountedRef.current) return;
                    if (resp && resp.buckets && resp.buckets.length > 0) {
                        const r = _parseBuckets(resp.buckets, currentIsPro);
                        if (r) setPolledQuota(r);
                    }
                }
            } catch (_) { }
        };
        const t1 = setTimeout(tryPoll, 2000);
        const t2 = setTimeout(tryPoll, 8000);
        const t3 = setTimeout(tryPoll, 20000);
        const interval = setInterval(tryPoll, 60000);
        return () => {
            mountedRef.current = false;
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
            clearInterval(interval);
        };
    }, [config, currentIsPro]);

    // === 4. COUNTDOWN TIMER ===
    const activeResetTime = _safe(() => nativeQuota.resetTime, null)
        || _safe(() => polledQuota.resetTime, null);

    useEffect(() => {
        if (!activeResetTime) { setCountdown(""); resetTimeRef.current = null; return; }
        const resetMs = new Date(activeResetTime).getTime();
        resetTimeRef.current = resetMs;
        const calc = () => {
            const diff = resetTimeRef.current - Date.now();
            if (diff <= 0) return "00:00:00";
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        };
        setCountdown(calc());
        const timer = setInterval(() => {
            const v = calc();
            setCountdown(v);
            if (v === "00:00:00") clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [activeResetTime]);

    // === 5. SETTINGS — safe access ===
    const showMemoryUsage = debugMode || _safe(() => settings.merged.ui.showMemoryUsage, false);
    const isFullErrorVerbosity = _safe(() => settings.merged.ui.errorVerbosity, '') === 'full';
    const showErrorSummary = !showErrorDetails && errorCount > 0 && (isFullErrorVerbosity || debugMode);
    const hideCWD = _safe(() => settings.merged.ui.footer.hideCWD, false);
    const hideSandboxStatus = _safe(() => settings.merged.ui.footer.hideSandboxStatus, false);
    const hideModelInfo = _safe(() => settings.merged.ui.footer.hideModelInfo, false);
    const hideContextPercentage = _safe(() => settings.merged.ui.footer.hideContextPercentage, false);

    // === 6. LAYOUT ===
    const pathLength = Math.max(20, Math.floor(terminalWidth * 0.25));
    const displayPath = shortenPath(tildeifyPath(targetDir), pathLength);
    const justifyContent = hideCWD && hideModelInfo ? 'center' : 'space-between';
    const displayVimMode = vimEnabled ? vimMode : undefined;
    const showDebugProfiler = debugMode || isDevelopment;

    // === 7. CTX — context window usage ===
    const tokenLimitVal = _tokenLimit(model) || 1048576;
    const ramPercentage = promptTokenCount > 0 ? (promptTokenCount / tokenLimitVal) * 100 : 0;
    let ramColor = "green";
    let ramWarn = "";
    if (ramPercentage >= 80) { ramColor = theme.status.error; ramWarn = " \u26A0 HALL. RISK"; }
    else if (ramPercentage >= 50) { ramColor = "#FFA500"; }
    else if (ramPercentage >= 20) { ramColor = theme.status.warning; }

    // === 8. REQUEST COUNT (use direct SessionContext for reliable updates) ===
    const sessionMetrics = _safe(() => sessionData.stats.metrics, null)
        || _safe(() => uiState.sessionStats.metrics, {});
    const modelsMap = _safe(() => sessionMetrics.models, {}) || {};
    let mStats = model && modelsMap[model] ? modelsMap[model] : null;
    if (!mStats && model) {
        const ml = model.toLowerCase();
        const mk = Object.keys(modelsMap).find(k => k.toLowerCase().includes(ml) || ml.includes(k.toLowerCase()));
        if (mk) mStats = modelsMap[mk];
    }
    if (!mStats && Object.keys(modelsMap).length > 0) mStats = Object.values(modelsMap)[0];
    const requestCount = _safe(() => mStats.api.totalRequests, 0);

    // === 9. BUDGET (prefer native, use polled as fallback, pick freshest) ===
    let budgetPct = null;
    let budgetColor = "green";
    const nativePct = (nativeQuota && nativeQuota.remaining !== undefined && nativeQuota.limit !== undefined && nativeQuota.limit > 0)
        ? ((nativeQuota.remaining / nativeQuota.limit) * 100) : null;
    const polledPct = (polledQuota && polledQuota.fraction !== undefined)
        ? (polledQuota.fraction * 100) : null;
    if (nativePct !== null && polledPct !== null) {
        budgetPct = Math.min(nativePct, polledPct).toFixed(0);
    } else if (nativePct !== null) {
        budgetPct = nativePct.toFixed(0);
    } else if (polledPct !== null) {
        budgetPct = polledPct.toFixed(0);
    }
    if (budgetPct !== null) {
        const n = Number(budgetPct);
        if (n < 20) budgetColor = theme.status.error;
        else if (n < 50) budgetColor = theme.status.warning;
    }
    const budgetLabel = currentIsPro ? "Pro" : "Flash";

    // === 10. GLOBAL DEBUG HOOK ===
    try {
        globalThis.GEMINI_HUD_DATA = {
            budget: budgetPct !== null ? budgetPct + "%" : "N/A",
            ctx: ramPercentage.toFixed(1) + "%",
            reqs: requestCount,
            timer: countdown || "",
            nativeQuota: nativeQuota || null,
            polledQuota: polledQuota || null,
        };
    } catch (_) { }

    // === 11. RENDER ===
    return (_jsxs(Box, { justifyContent: justifyContent, width: terminalWidth, flexDirection: "row", alignItems: "center", paddingX: 1, children: [
        (showDebugProfiler || displayVimMode || !hideCWD) && (_jsxs(Box, { children: [
            showDebugProfiler && _jsx(DebugProfiler, {}),
            displayVimMode && (_jsxs(Text, { color: theme.text.secondary, children: ["[", displayVimMode, "] "] })),
            !hideCWD && (_jsxs(Text, { color: theme.text.primary, children: [
                displayPath,
                branchName && (_jsxs(Text, { color: theme.text.secondary, children: [" (", branchName, "*)"] }))
            ] })),
            debugMode && (_jsx(Text, { color: theme.status.error, children: ' ' + (debugMessage || '--debug') }))
        ] })),
        !hideSandboxStatus && (_jsx(Box, { flexGrow: 1, alignItems: "center", justifyContent: "center", display: "flex", children:
            isTrustedFolder === false ? (_jsx(Text, { color: theme.status.warning, children: "untrusted" })) :
            process.env['SANDBOX'] && process.env['SANDBOX'] !== 'sandbox-exec' ? (_jsx(Text, { color: "green", children: process.env['SANDBOX'].replace(/^gemini-(?:cli-)?/, '') })) :
            process.env['SANDBOX'] === 'sandbox-exec' ? (_jsxs(Text, { color: theme.status.warning, children: ["macOS Seatbelt", ' ', _jsxs(Text, { color: theme.text.secondary, children: ["(", process.env['SEATBELT_PROFILE'], ")"] })] })) :
            (_jsxs(Text, { color: theme.status.error, children: ["no sandbox", terminalWidth >= 100 && (_jsx(Text, { color: theme.text.secondary, children: " (see /docs)" }))] }))
        })),
        !hideModelInfo && (_jsxs(Box, { alignItems: "center", justifyContent: "flex-end", children: [
            _jsxs(Box, { alignItems: "center", children: [
                _jsxs(Text, { color: theme.text.primary, children: [
                    _jsx(Text, { color: theme.text.secondary, children: "/model " }),
                    getDisplayString(model),
                    !hideContextPercentage && (_jsxs(_Fragment, { children: [
                        ' ',
                        _jsx(ContextUsageDisplay, { promptTokenCount: promptTokenCount, model: model, terminalWidth: terminalWidth })
                    ] })),
                    ' ',
                    _jsxs(Text, { color: ramColor, children: ["CTX:", ramPercentage.toFixed(1), "%", ramWarn] }),
                    budgetPct !== null
                        ? _jsxs(Text, { color: budgetColor, children: [
                            _jsxs(Text, { children: [" | ", budgetLabel, ":", budgetPct, "%"] }),
                            countdown ? _jsxs(Text, { children: [" (", countdown, ")"] }) : null,
                            _jsxs(Text, { children: [" Req:", String(requestCount)] })
                        ] })
                        : _jsxs(Text, { color: theme.text.secondary, children: [
                            _jsxs(Text, { children: [" Req:", String(requestCount)] })
                        ] })
                ] }),
                showMemoryUsage && _jsx(MemoryUsageDisplay, {})
            ] }),
            _jsxs(Box, { alignItems: "center", children: [
                corgiMode && (_jsx(Box, { paddingLeft: 1, flexDirection: "row", children: _jsxs(Text, { children: [
                    _jsx(Text, { color: theme.ui.symbol, children: "| " }),
                    _jsx(Text, { color: theme.status.error, children: "\u25BC" }),
                    _jsx(Text, { color: theme.text.primary, children: "(\u00B4" }),
                    _jsx(Text, { color: theme.status.error, children: "\u1D25" }),
                    _jsx(Text, { color: theme.text.primary, children: "`)" }),
                    _jsx(Text, { color: theme.status.error, children: "\u25BC" })
                ] }) })),
                showErrorSummary && (_jsxs(Box, { paddingLeft: 1, flexDirection: "row", children: [
                    _jsx(Text, { color: theme.ui.comment, children: "| " }),
                    _jsx(ConsoleSummaryDisplay, { errorCount: errorCount })
                ] }))
            ] })
        ] }))
    ] }));
};

// === Bucket parser for fallback polling ===
function _parseBuckets(buckets, isPro) {
    if (!buckets || buckets.length === 0) return null;
    const matching = buckets.filter(b => {
        if (!b.modelId) return false;
        return isPro ? _isProModel(b.modelId) : !_isProModel(b.modelId);
    });
    const toUse = matching.length > 0 ? matching : buckets;
    let bestFraction = -1, bestResetTime, found = false;
    for (const b of toUse) {
        if (b.remainingFraction != null) {
            const frac = Number(b.remainingFraction);
            if (!isNaN(frac) && frac >= 0) {
                if (frac > bestFraction) bestFraction = frac;
                if (b.resetTime && (!bestResetTime || new Date(b.resetTime) > new Date(bestResetTime)))
                    bestResetTime = b.resetTime;
                found = true;
            }
        }
    }
    return found ? { fraction: bestFraction, resetTime: bestResetTime } : null;
}
//# sourceMappingURL=Footer.js.map
