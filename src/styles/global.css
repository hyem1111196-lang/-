@import "./tokens.css";

*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.55;
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  letter-spacing: -0.01em;
}

button {
  font: inherit;
  color: inherit;
  cursor: pointer;
  border: none;
  background: none;
}

select {
  font: inherit;
  color: inherit;
}

ul {
  list-style: none;
  padding: 0;
}

:focus-visible {
  outline: 3px solid var(--korail-cyan);
  outline-offset: 2px;
  border-radius: 4px;
}

/* 앱 컨테이너: 모바일 우선, 데스크톱은 분위기 있는 배경 위 가운데 폰 프레임 */
#root {
  min-height: 100dvh;
}

.app-bg {
  min-height: 100dvh;
  background:
    radial-gradient(120% 60% at 50% -10%, rgba(0, 175, 220, 0.18), transparent 60%),
    radial-gradient(90% 50% at 100% 0%, rgba(0, 102, 179, 0.16), transparent 55%),
    linear-gradient(180deg, #0a1d38 0%, #0e2a4d 38%, #11335f 100%);
  display: flex;
  justify-content: center;
}

.app-shell {
  width: 100%;
  max-width: var(--app-max);
  min-height: 100dvh;
  background: var(--bg);
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  overflow: clip;
}

@media (min-width: 520px) {
  .app-shell {
    margin: 18px 0;
    min-height: calc(100dvh - 36px);
    border-radius: var(--r-xl);
  }
}

.app-main {
  flex: 1;
  padding: var(--sp-4) var(--sp-4) calc(var(--nav-h) + var(--safe-b) + var(--sp-5));
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.section-title {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-2);
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-1);
}
.section-title b {
  color: var(--korail-blue);
}

.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
