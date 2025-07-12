import { ref, onMounted, onUnmounted } from 'vue';

export const useThemeDetection = () => {
  const isDarkMode = ref(false);
  const themeWatcher = ref(0);

  // Function to detect theme by checking computed CSS values
  const detectTheme = () => {
    const computedStyle = getComputedStyle(document.documentElement);
    const backgroundColor = computedStyle.getPropertyValue('--color-background').trim();
    
    // If background is dark purple (dark mode) vs white (light mode)
    const newIsDarkMode = backgroundColor.includes('26, 16, 37') || 
                          backgroundColor === '#1a1025' ||
                          document.documentElement.classList.contains('dark-mode') ||
                          (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (newIsDarkMode !== isDarkMode.value) {
      isDarkMode.value = newIsDarkMode;
      themeWatcher.value++; // Force reactive updates
    }
  };

  // Get theme-aware colors for charts
  const getChartColors = () => {
    const computedStyles = window.getComputedStyle(document.documentElement);
    const textColor = computedStyles.getPropertyValue('--color-text').trim() || '#333333';
    const textMutedColor = computedStyles.getPropertyValue('--color-text-muted').trim() || '#666666';
    const gridColor = isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    return {
      textColor,
      textMutedColor,
      gridColor,
      isDarkMode: isDarkMode.value
    };
  };

  // Set up theme change listeners
  onMounted(() => {
    detectTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      themeWatcher.value++;
      detectTheme();
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    // Watch for manual theme changes via MutationObserver
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
    
    // Store references for cleanup
    (window as any)._themeMediaQuery = mediaQuery;
    (window as any)._themeObserver = observer;
    (window as any)._themeHandler = handleThemeChange;
  });

  onUnmounted(() => {
    // Clean up listeners
    if ((window as any)._themeMediaQuery && (window as any)._themeHandler) {
      (window as any)._themeMediaQuery.removeEventListener('change', (window as any)._themeHandler);
    }
    if ((window as any)._themeObserver) {
      (window as any)._themeObserver.disconnect();
    }
    
    // Clean up references
    delete (window as any)._themeMediaQuery;
    delete (window as any)._themeObserver;
    delete (window as any)._themeHandler;
  });

  return {
    isDarkMode,
    themeWatcher,
    detectTheme,
    getChartColors
  };
}; 