// theme.js
const themes = ['classic', 'midnight', 'sunset', 'forest'];

export function initTheme() {
    const savedTheme = localStorage.getItem('chatTheme') || 'classic';
    document.body.setAttribute('data-theme', savedTheme);
}

export function cycleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'classic';
    const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    document.body.setAttribute('data-theme', nextTheme);
    localStorage.setItem('chatTheme', nextTheme);
}

// Internal helper to update the DOM
function applyTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    
    // Optional: Update status bar color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        const colors = { classic: '#0084ff', midnight: '#1a1a1a', sunset: '#ff4e50', forest: '#2d5a27' };
        metaThemeColor.setAttribute('content', colors[themeName] || '#0084ff');
    }
}