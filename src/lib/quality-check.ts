// Validates generated site files and returns a quality score + issues list

export interface QualityIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix?: string;
}

export interface QualityReport {
  score: number; // 0-100
  issues: QualityIssue[];
  passed: boolean; // score >= 70
}

export function checkSiteQuality(files: Record<string, string>): QualityReport {
  const issues: QualityIssue[] = [];
  const appTsx = files['/App.tsx'] || '';
  const indexCss = files['/index.css'] || '';

  // --- CRITICAL ERRORS (each -20 points) ---

  // 1. Missing CSS variables
  if (!indexCss.includes('--bg') || !indexCss.includes('--primary')) {
    issues.push({
      severity: 'error',
      message: 'Missing CSS variables in index.css',
      fix: 'Add :root { --bg: ...; --fg: ...; --primary: ...; } to index.css'
    });
  }

  // 2. No section components used (all inline)
  const sectionImports = (appTsx.match(/from '\/components\/sections\//g) || []).length;
  if (sectionImports < 2) {
    issues.push({
      severity: 'error',
      message: `Only ${sectionImports} section components used — site may be built inline`,
      fix: 'Use pre-built section components (Hero, ServiceCards, etc.) instead of inline code'
    });
  }

  // 3. Placeholder/generic content
  const genericPhrases = ['Lorem ipsum', 'John Doe', 'Jane Doe', 'placeholder', 'Your Business Name', 'Company Name', 'Feature 1', 'Service 1'];
  for (const phrase of genericPhrases) {
    if (appTsx.toLowerCase().includes(phrase.toLowerCase())) {
      issues.push({
        severity: 'error',
        message: `Contains generic placeholder: "${phrase}"`,
        fix: 'Replace with real, specific content'
      });
      break; // Only report first one
    }
  }

  // 4. Broken imports (import X from 'X' without path)
  const badImports = appTsx.match(/from ['"][^./][^'"]*['"]/g) || [];
  const allowedPkgs = ['react', 'lucide-react'];
  const reallyBadImports = badImports.filter(imp => !allowedPkgs.some(pkg => imp.includes(pkg)));
  if (reallyBadImports.length > 0) {
    issues.push({
      severity: 'error',
      message: `Imports from unknown packages: ${reallyBadImports.slice(0, 2).join(', ')}`,
      fix: 'Only import from react, lucide-react, or /components/sections/*'
    });
  }

  // --- WARNINGS (each -10 points) ---

  // 5. No Navbar
  if (!appTsx.includes('<Navbar') && !appTsx.includes('Navbar')) {
    issues.push({ severity: 'warning', message: 'No Navbar — site has no navigation' });
  }

  // 6. No Footer
  if (!appTsx.includes('<Footer') && !appTsx.includes('Footer')) {
    issues.push({ severity: 'warning', message: 'No Footer — site missing footer' });
  }

  // 7. No Hero or equivalent
  if (!appTsx.includes('<Hero') && !appTsx.includes('<VideoHero') && !appTsx.includes('<Banner')) {
    issues.push({ severity: 'warning', message: 'No Hero/Banner — site missing main banner' });
  }

  // 8. Missing accentColor on components
  const componentUsages = (appTsx.match(/<[A-Z]\w+/g) || []).length;
  const accentColorUsages = (appTsx.match(/accentColor=/g) || []).length;
  if (componentUsages > 3 && accentColorUsages < componentUsages * 0.5) {
    issues.push({
      severity: 'warning',
      message: 'Many components missing accentColor prop — colors may not apply correctly'
    });
  }

  // 9. No Google Font import
  if (!indexCss.includes('fonts.googleapis.com') && !indexCss.includes('font-family')) {
    issues.push({ severity: 'warning', message: 'No custom font — using browser default font' });
  }

  // 10. Very short output (under 50 lines)
  if (appTsx.split('\n').length < 50) {
    issues.push({ severity: 'warning', message: 'App.tsx is very short — site may be incomplete' });
  }

  // --- INFO (no point deduction) ---

  // 11. No MetaTags
  if (!appTsx.includes('<MetaTags') && !appTsx.includes('MetaTags')) {
    issues.push({ severity: 'info', message: 'Missing MetaTags — add for better SEO' });
  }

  // 12. Section count
  const sectionCount = sectionImports;
  if (sectionCount > 0 && sectionCount < 5) {
    issues.push({ severity: 'info', message: `Only ${sectionCount} sections — consider adding more content` });
  }

  // Calculate score
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const score = Math.max(0, 100 - errorCount * 20 - warningCount * 10);

  return {
    score,
    issues,
    passed: score >= 70,
  };
}

export function formatQualityReport(report: QualityReport): string {
  if (report.issues.length === 0) return '✅ Site quality check passed (100/100)';

  const lines = [`Quality Score: ${report.score}/100 ${report.passed ? '✅' : '⚠️'}`];

  const errors = report.issues.filter(i => i.severity === 'error');
  const warnings = report.issues.filter(i => i.severity === 'warning');
  const infos = report.issues.filter(i => i.severity === 'info');

  if (errors.length) lines.push(`\n❌ Errors (${errors.length}):`);
  errors.forEach(i => lines.push(`  • ${i.message}`));

  if (warnings.length) lines.push(`\n⚠️ Warnings (${warnings.length}):`);
  warnings.forEach(i => lines.push(`  • ${i.message}`));

  if (infos.length) lines.push(`\n💡 Suggestions:`);
  infos.forEach(i => lines.push(`  • ${i.message}`));

  return lines.join('\n');
}
