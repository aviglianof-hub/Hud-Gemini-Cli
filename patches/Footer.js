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
    const [hudQuota, setHudQuota] = useState(null);
    const [debugInfo, setDebugInfo] = useState("INIT");
    const resetTimeRef = useRef(null);
    const mountedRef = useRef(true);

    // === 2. SAFE DESTRUCTURE ===
    const model = uiState.currentModel;
    const targetDir = config.getTargetDir();
    const debugMode = config.getDebugMode();
    const branchName = uiState.branchName;
    const debugMessage = uiState.debugMessage;
    const corgiMode = uiState.corgiMode;
    const errorCount = uiState.errorCount;
    const showErrorDetails = uiState.showErrorDetails;
    const promptTokenCount = (uiState.sessionStats && uiState.sessionStats.lastPromptTokenCount) || 0;
    const isTrustedFolder = uiState.isTrustedFolder;
    const terminalWidth = uiState.terminalWidth;
    const currentIsPro = _isProModel(model);

    // === 3. PROACTIVE QUOTA POLLING (simple, robust, no fancy imports) ===
    useEffect(() => {
        mountedRef.current = true;
        let intervalId = null;

        const poll = async () => {
            if (!mountedRef.current) return;

            // --- STEP 1: Try config.getLastRetrievedQuota() (cached raw server data) ---
            try {
                if (typeof config.getLastRetrievedQuota === 'function') {
                    const cached = config.getLastRetrievedQuota();
                    if (cached && cached.buckets && cached.buckets.length > 0) {
                        const result = _parseBuckets(cached.buckets, currentIsPro);
                        if (result) {
                            setHudQuota(result);
                            setDebugInfo("CACHED");
                            return;
                        }
                    }
                }
            } catch (e) { }

            // --- STEP 2: Try config.refreshUserQuota() (forces server call) ---
            try {
                if (typeof config.refreshUserQuota === 'function') {
                    const response = await config.refreshUserQuota();
                    if (!mountedRef.current) return;
                    if (response && response.buckets && response.buckets.length > 0) {
                        const result = _parseBuckets(response.buckets, currentIsPro);
                        if (result) {
                            setHudQuota(result);
                            setDebugInfo("FRESH");
                            return;
                        }
                        setDebugInfo("NO_MATCH");
                    } else {
                        setDebugInfo("NO_BKTS");
                    }
                } else {
                    setDebugInfo("NO_FN");
                }
            } catch (e) {
                if (mountedRef.current) setDebugInfo("ERR");
            }
        };

        // Poll at: 3s, 8s, 15s, then every 30s
        const t1 = setTimeout(poll, 3000);
        const t2 = setTimeout(poll, 8000);
        const t3 = setTimeout(poll, 15000);
        intervalId = setInterval(poll, 30000);

        return () => {
            mountedRef.current = false;
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            if (intervalId) clearInterval(intervalId);
        };
    }, [config, currentIsPro]);

    // === 4. COUNTDOWN TIMER ===
    useEffect(() => {
        const rt = hudQuota ? hudQuota.resetTime : null;
        if (!rt) {
            setCountdown("");
            resetTimeRef.current = null;
            return;
        }
        const resetMs = new Date(rt).getTime();
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
    }, [hudQuota ? hudQuota.resetTime : null]);

    // === 5. SETTINGS ===
    const showMemoryUsage = config.getDebugMode() || settings.merged.ui.showMemoryUsage;
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

    // === 7. RAM ===
    const tokenLimitVal = tokenLimit(model) || 1048576;
    const ramPercentage = promptTokenCount > 0 ? (promptTokenCount / tokenLimitVal) * 100 : 0;
    let ramColor = "green";
    let ramWarn = "";
    if (ramPercentage >= 80) { ramColor = theme.status.error; ramWarn = " ⚠ RISCHIO ALLUCINAZIONI"; }
    else if (ramPercentage >= 50) { ramColor = "#FFA500"; }
    else if (ramPercentage >= 20) { ramColor = theme.status.warning; }

    // === 8. REQUEST COUNT ===
    const metrics = (uiState.sessionStats && uiState.sessionStats.metrics) ? uiState.sessionStats.metrics : {};
    const modelsMap = metrics.models || {};
    let mStats = model && modelsMap[model] ? modelsMap[model] : null;
    if (!mStats && model) {
        const ml = model.toLowerCase();
        const mk = Object.keys(modelsMap).find(k => k.toLowerCase().includes(ml) || ml.includes(k.toLowerCase()));
        if (mk) mStats = modelsMap[mk];
    }
    if (!mStats && Object.keys(modelsMap).length > 0) mStats = Object.values(modelsMap)[0];
    const requestCount = (mStats && mStats.api && mStats.api.totalRequests) ? mStats.api.totalRequests : 0;

    // === 9. BUDGET (uses remainingFraction directly — 0% is valid!) ===
    let budgetPct = null;
    let budgetColor = "green";
    if (hudQuota && hudQuota.fraction !== undefined) {
        budgetPct = (hudQuota.fraction * 100).toFixed(0);
        const n = Number(budgetPct);
        if (n < 20) budgetColor = theme.status.error;
        else if (n < 50) budgetColor = theme.status.warning;
    }
    const budgetLabel = currentIsPro ? "Pro" : "Flash";

    // === 10. GLOBAL DEBUG HOOK ===
    try {
        const g = typeof globalThis !== 'undefined' ? globalThis : {};
        g.GEMINI_HUD_DATA = {
            budget: budgetPct !== null ? budgetPct + "%" : debugInfo,
            ram: ramPercentage.toFixed(1) + "%",
            reqs: requestCount,
            timer: countdown || "",
            fraction: hudQuota ? hudQuota.fraction : null,
            resetTime: hudQuota ? hudQuota.resetTime : null,
            debug: debugInfo
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
                    _jsxs(Text, { color: ramColor, children: ["RAM:", ramPercentage.toFixed(1), "%", ramWarn] }),
                    budgetPct !== null
                        ? _jsxs(Text, { color: budgetColor, children: [
                            _jsxs(Text, { children: [" | ", budgetLabel, ":", budgetPct, "%"] }),
                            countdown ? _jsxs(Text, { children: [" (", countdown, ")"] }) : null,
                            _jsxs(Text, { children: [" Req:", String(requestCount)] })
                        ] })
                        : _jsxs(Text, { color: theme.text.secondary, children: [
                            _jsxs(Text, { children: [" | ", budgetLabel, ":", debugInfo] }),
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
                !showErrorDetails && errorCount > 0 && (_jsxs(Box, { paddingLeft: 1, flexDirection: "row", children: [
                    _jsx(Text, { color: theme.ui.comment, children: "| " }),
                    _jsx(ConsoleSummaryDisplay, { errorCount: errorCount })
                ] }))
            ] })
        ] }))
    ] }));
};

// === PURE FUNCTION: Parse raw quota buckets filtered by Pro/Flash category ===
// Uses remainingFraction directly (0.0 = 0%, 0.926 = 92.6%) — handles exhausted budgets correctly
function _parseBuckets(buckets, isPro) {
    if (!buckets || buckets.length === 0) return null;

    // Filter by matching category (Pro models contain "pro" in modelId)
    const matching = buckets.filter(b => {
        if (!b.modelId) return false;
        return isPro ? _isProModel(b.modelId) : !_isProModel(b.modelId);
    });

    const toUse = matching.length > 0 ? matching : buckets;

    // Pick the BEST bucket: highest remainingFraction (most relevant quota)
    let bestFraction = -1;
    let bestResetTime = undefined;
    let found = false;

    for (const b of toUse) {
        if (b.remainingFraction != null) {
            const frac = Number(b.remainingFraction);
            if (!isNaN(frac) && frac >= 0) {
                if (frac > bestFraction) {
                    bestFraction = frac;
                }
                if (b.resetTime) {
                    if (!bestResetTime || new Date(b.resetTime) > new Date(bestResetTime)) {
                        bestResetTime = b.resetTime;
                    }
                }
                found = true;
            }
        }
    }

    return found ? { fraction: bestFraction, resetTime: bestResetTime } : null;
}
//# sourceMappingURL=Footer.js.map
