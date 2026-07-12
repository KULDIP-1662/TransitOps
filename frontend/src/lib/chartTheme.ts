import { useTheme } from '../context/ThemeContext';

/**
 * Chart colours drawn from the validated data-viz palette, stepped per mode.
 * Status hues match the app's badges; ROI uses a diverging good/critical pair.
 */
export function useChartColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    series: dark ? '#3987e5' : '#2a78d6', // blue slot 1
    good: '#0ca30c',
    bad: dark ? '#e66767' : '#d03b3b',
    axis: '#898781',
    grid: dark ? '#2c2c2a' : '#e1e0d9',
    text: dark ? '#ffffff' : '#0b0b0b',
    tooltipBg: dark ? '#1a1a19' : '#ffffff',
    tooltipBorder: dark ? '#2c2c2a' : '#e1e0d9',
    status: {
      Available: dark ? '#199e70' : '#1baf7a',
      'On Trip': dark ? '#3987e5' : '#2a78d6',
      'In Shop': dark ? '#c98500' : '#eda100',
      Retired: '#898781',
    } as Record<string, string>,
  };
}
