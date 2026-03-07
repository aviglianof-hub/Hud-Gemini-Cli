import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { shortenPath, tildeifyPath, getDisplayString, tokenLimit, } from '@google/gemini-cli-core';
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

// Inline Pro detection (no external import needed)
function _isProModel(m) { return typeof m === 'string' && m.toLowerCase().includes('pro'); }

export const Footer = () => {
    // === 1. ALL HOOKS (fixed order) ===
    const uiState = useUIState();
    const config = useConfig();
    const settings = useSettings();
    const { vimEnabled, vimMode } = useVimMode();
    const [countdown, setCountdown] = useState("");
    // Fallback polled quota — used only when native uiState.quota.stats is not yet available
    const [polledQuota, setPolledQuota] = useState(null);
    const resetTimeRef = useRef(null);
    const mountedRef = useRef(true);

    // === 2. DESTRUCTURE (v0.32.1 compatible) ===
    const model = uiState.currentModel;
    const targetDir = config.getTargetDir();
    const debugMode = config.getDebugMode();
    const branchName = uiState.branchName;
    const debugMessage = uiState.debugMessage;
    const corgiMode = uiState.corgiMode;
    const errorCount = uiState.errorCount;
    const showErrorDetails = uiState.showErrorDetails;
    const promptTokenCount = uiState.sessionStats.lastPromptTokenCount;
    const isTrustedFolder = uiState.isTrustedFolder;
    const terminalWidth = uiState.terminalWidth;
    // Native quota (v0.32.1) — populated after first API call via CoreEvent.QuotaChanged
    const nativeQuota = uiState.quota ? uiState.quota.stats : undefined;
    const currentIsPro = _isProModel(model);

    // === 3. STARTUP QUOTA POLL — fires when native quota not yet available ===
    useEffect(() => {
        mountedRef.current = true;

        const tryPoll = async () => {
            if (!mountedRef.current) return;
            // Skip if native quota already has data
            if (nativeQuota && nativeQuota.remaining !== undefined) return;

            try {
                if (typeof config.refreshUserQuota === 'function') {
                    const response = await config.refreshUserQuota();
                    if (!mountedRef.current) return;
                    if (response && response.buckets && response.buckets.length > 0) {
                        const result = _parseBuckets(response.buckets, currentIsPro);
                        if (result) setPolledQuota(result);
                    }
                }
            } catch (e) { }
        };

        // Try at 2s, 6s, 15s — stops trying once native quota fills in
        const t1 = setTimeout(tryPoll, 2000);
        const t2 = setTimeout(tryPoll, 6000);
        const t3 = setTimeout(tryPoll, 15000);

        return () => {
            mountedRef.current = false;
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [config, currentIsPro]);

    // === 4. COUNTDOWN TIMER ===
    // Prefer native quota resetTime; fall back to polled
    const activeResetTime = (nativeQuota && nativeQuota.resetTime)
        ? nativeQuota.resetTime
        : (polledQuota && polledQuota.resetTime ? polledQuota.resetTime : null);

    useEffect(() => {
        if (!activeResetTime) {
            setCountdown("");
            resetTimeRef.current = null;
            return;
        }
        const resetMs = new Date(activeResetTime).getTime();
        resetTimeRef.current = resetMs;
        const calc = () => {
            const diff = resetTimeRef.current - Date.now();
            if (diff <= 0) return "00:00:00";
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        };
        setCountdown(calc());
        const timer = setInterval(() => {
            const v = calc();
            setCountdown(v);
            if (v === "00:00:00") clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [activeResetTime]);

    // === 5. SETTINGS ===
    const showMemoryUsage = config.getDebugMode() || settings.merged.ui.showMemoryUsage;
    const isFullErrorVerbosity = settings.merged.ui.errorVerbosity === 'full';
    const showErrorSummary = !showErrorDetails && errorCount > 0 && (isFullErrorVerbosity || debugMode);
    const hideCWD = settings.merged.ui.footer.hideCWD;
    const hideSandboxStatus = settings.merged.ui.footer.hideSandboxStatus;
    const hideModelInfo = settings.merged.ui.footer.hideModelInfo;
    const hideContextPercentage = settings.merged.ui.footer.hideContextPercentage;

    // === 6. LAYOUT ===
    const pathLength = Math.max(20, Math.floor(terminalWidth * 0.25));
    const displayPath = shortenPath(tildeifyPath(targetDir), pathLength);
    const justifyContent = hideCWD && hideModelInfo ? 'center' : 'space-between';
    const displayVimMode = vimEnabled ? vimMode : undefined;
    const showDebugProfiler = debugMode || isDevelopment;

    // === 7. CTX — context window usage ===
    const tokenLimitVal = tokenLimit(model) || 1048576;
    const ramPercentage = promptTokenCount > 0 ? (promptTokenCount / tokenLimitVal) * 100 : 0;
    let ramColor = "green";
    let ramWarn = "";
    if (ramPercentage >= 80) { ramColor = theme.status.error; ramWarn = " \u26A0 RISCHIO ALLUCINAZIONI"; }
    else if (ramPercentage >= 50) { ramColor = "#FFA500"; }
    else if (ramPercentage >= 20) { ramColor = theme.status.warning; }

    // === 8. REQUEST COUNT ===
    const metrics = uiState.sessionStats.metrics || {};
    const modelsMap = metrics.models || {};
    let mStats = model && modelsMap[model] ? modelsMap[model] : null;
    if (!mStats && model) {
        const ml = model.toLowerCase();
        const mk = Object.keys(modelsMap).find(k => k.toLowerCase().includes(ml) || ml.includes(k.toLowerCase()));
        if (mk) mStats = modelsMap[mk];
    }
    if (!mStats && Object.keys(modelsMap).length > 0) mStats = Object.values(modelsMap)[0];
    const requestCount = (mStats && mStats.api && mStats.api.totalRequests) ? mStats.api.totalRequests : 0;

    // === 9. BUDGET ===
    // Priority: native quota (auto-updated) → polled quota (startup fallback)
    let budgetPct = null;
    let budgetColor = "green";
    if (nativeQuota && nativeQuota.remaining !== undefined && nativeQuota.limit !== undefined && nativeQuota.limit > 0) {
        budgetPct = ((nativeQuota.remaining / nativeQuota.limit) * 100).toFixed(0);
        const n = Number(budgetPct);
        if (n < 20) budgetColor = theme.status.error;
        else if (n < 50) budgetColor = theme.status.warning;
    } else if (polledQuota && polledQuota.fraction !== undefined) {
        budgetPct = (polledQuota.fraction * 100).toFixed(0);
        const n = Number(budgetPct);
        if (n < 20) budgetColor = theme.status.error;
        else if (n < 50) budgetColor = theme.status.warning;
    }
    const budgetLabel = currentIsPro ? "Pro" : "Flash";

    // === 10. GLOBAL DEBUG HOOK ===
    try {
        const g = typeof globalThis !== 'undefined' ? globalThis : {};
        g.GEMINI_HUD_DATA = {
            budget: budgetPct !== null ? budgetPct + "%" : "N/A",
            ram: ramPercentage.toFixed(1) + "%",
            reqs: requestCount,
            timer: countdown || "",
            nativeQuota: nativeQuota || null,
            polledQuota: polledQuota || null,
        };
    } catch (e) { }

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

// === Parse raw quota buckets (fallback polling) ===
function _parseBuckets(buckets, isPro) {
    if (!buckets || buckets.length === 0) return null;
    const matching = buckets.filter(b => {
        if (!b.modelId) return false;
        return isPro ? _isProModel(b.modelId) : !_isProModel(b.modelId);
    });
    const toUse = matching.length > 0 ? matching : buckets;
    let bestFraction = -1;
    let bestResetTime = undefined;
    let found = false;
    for (const b of toUse) {
        if (b.remainingFraction != null) {
            const frac = Number(b.remainingFraction);
            if (!isNaN(frac) && frac >= 0) {
                if (frac > bestFraction) bestFraction = frac;
                if (b.resetTime && (!bestResetTime || new Date(b.resetTime) > new Date(bestResetTime))) {
                    bestResetTime = b.resetTime;
                }
                found = true;
            }
        }
    }
    return found ? { fraction: bestFraction, resetTime: bestResetTime } : null;
}
//# sourceMappingURL=Footer.js.map
