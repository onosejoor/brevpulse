import type {
  DigestPayload,
  DigestPriority,
  DigestSource,
} from '@repo/shared-types/globals';

const sourceIcons: Record<DigestSource, string> = {
  gmail: '✉️',
  calendar: '📅',
  github: '⚡',
  slack: '💬',
  figma: '🎨',
};

const sourceColors: Record<DigestSource, string> = {
  gmail: '#6d28d9',
  calendar: '#6d28d9',
  github: '#6d28d9',
  slack: '#6d28d9',
  figma: '#6d28d9',
};

const priorityColors: Record<DigestPriority, { bg: string; text: string }> = {
  high: { bg: '#fae8ff', text: '#a21caf' }, // purple-100 + purple-800
  medium: { bg: '#fef3c7', text: '#d97706' }, // amber-100 + amber-600
  low: { bg: '#ede9fe', text: '#6d28d9' }, // violet-100 + primary purple
};

export function generateEmailHTML(payload: DigestPayload): string {
  const { items, summary, plan = 'free' } = payload;

  const priorityTag = (priority: DigestPriority) => {
    const colors = priorityColors[priority];
    return `<span class="priority-tag priority-${priority}" style="background-color: ${colors.bg}; color: ${colors.text}; border: 1px solid ${priority === 'low' ? '#d8b4fe' : 'transparent'};">${priority.toUpperCase()}</span>`;
  };

  const itemsHTML = items
    .map(
      (item) => `
    <div class="item-card">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
        <tr>
          <td style="vertical-align: top;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right: 10px; vertical-align: middle;">
                  <div class="source-icon" style="color: ${sourceColors[item.source]}; font-size: 20px;">
                    ${sourceIcons[item.source]}
                  </div>
                </td>
                <td style="vertical-align: middle;">
                  <h3 class="item-title">${item.title}</h3>
                </td>
              </tr>
            </table>
          </td>
          <td style="text-align: right; vertical-align: top; white-space: nowrap; padding-left: 16px;">
            ${priorityTag(item.priority)}
          </td>
        </tr>
      </table>
      ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align: middle;">
            <span class="item-count">${item.count} ${item.count === 1 ? 'item' : 'items'}</span>
          </td>
          ${
            item.actions && item.actions.length > 0
              ? `<td style="text-align: right; vertical-align: middle; padding-left: 12px;">
            ${item.actions.map((action) => `<a href="${action.url}" class="action-btn" style="margin-left: 12px;">${action.label || 'View'}</a>`).join('')}
          </td>`
              : ''
          }
        </tr>
      </table>
    </div>
  `,
    )
    .join('');

  const summaryHTML = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="text-align: center; vertical-align: top; width: 45%;">
          <p class="summary-value" style="color: #6d28d9;">${summary.totalItems}</p>
          <p class="summary-label">Total updates</p>
        </td>
        <td style="text-align: center; vertical-align: middle; width: 10%;">
          <div class="summary-divider"></div>
        </td>
        <td style="text-align: center; vertical-align: top; width: 45%;">
          <p class="summary-value highlight" style="color: #a21caf;">${summary.byPriority.high || 0}</p>
          <p class="summary-label">High priority</p>
        </td>
      </tr>
    </table>
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brevpulse Daily Digest</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      background-color: #fafafa;
      color: #1f2937;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 10px;
    }

    .header {
      text-align: center;
      margin-bottom: 48px;
    }

    .logo {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #6d28d9;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(135deg, #6d28d9, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .header-subtitle {
      font-size: 15px;
      color: #64748b;
      margin-bottom: 20px;
    }

    .plan-badge {
      display: inline-block;
      padding: 6px 14px;
      background-color: #f3e8ff;
      color: #6d28d9;
      border: 1px solid #d8b4fe;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.3px;
      text-transform: capitalize;
    }

    .summary-section {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 4px 12px rgba(109, 40, 217, 0.05);
    }

    .summary-value {
      font-size: 40px;
      font-weight: 800;
      margin-bottom: 4px;
      line-height: 1;
    }

    .summary-value.highlight {
      color: #a21caf;
      font-weight: 900;
    }

    .summary-label {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }

    .summary-divider {
      width: 1px;
      height: 48px;
      background-color: #e2e8f0;
      margin: 0 auto;
    }

    .items-section {
      margin-bottom: 48px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #6d28d9;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 20px;
    }

    .item-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 16px;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .item-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(to bottom, #6d28d9, #a78bfa);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .item-card:hover {
      border-color: #c4b5fd;
      box-shadow: 0 8px 25px rgba(109, 40, 217, 0.08);
    }

    .item-card:hover::before {
      opacity: 1;
    }

    .item-title {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      line-height: 1.4;
    }

    .priority-tag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .item-description {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .item-count {
      font-size: 13px;
      color: #64748b;
      font-weight: 600;
    }

    .action-btn {
      font-size: 13px;
      font-weight: 600;
      color: #6d28d9;
      text-decoration: none;
      padding: 6px 12px;
      border: 1px solid #d8b4fe;
      border-radius: 6px;
      transition: all 0.2s;
      display: inline-block;
    }

    .action-btn:hover {
      background-color: #6d28d9;
      color: white;
      border-color: #6d28d9;
    }

    .footer {
      text-align: center;
      padding-top: 32px;
      border-top: 1px dashed #e2e8f0;
    }

    .footer-text {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 12px;
    }

    .footer-links a {
      color: #6d28d9;
      text-decoration: none;
      margin: 0 10px;
      font-weight: 500;
      transition: color 0.2s;
    }

    .footer-links a:hover {
      color: #4c1d95;
    }

    @media (max-width: 640px) {
      .container { padding: 24px 10px; }
      .header h1 { font-size: 24px; }
      .summary-section { padding: 24px 20px; }
      .summary-value { font-size: 32px; }
      .item-card { padding: 20px; }
    }

    @media (max-width: 480px) {
      .header h1 { font-size: 22px; }
      .summary-divider { width: 48px; height: 1px; }
      .action-btn { font-size: 12px; padding: 5px 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">Brevpulse</div>
      <h1>Daily Digest</h1>
      <p class="header-subtitle">Your daily summary of what matters</p>
      <div class="plan-badge">${plan} plan</div>
    </div>

    <!-- Summary -->
    <div class="summary-section">
      ${summaryHTML}
    </div>

    <!-- Items -->
    <div class="items-section">
      <h2 class="section-title">Today's Updates</h2>
      ${itemsHTML}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">Brevpulse • Privacy-first daily digest</p>
      <div class="footer-links">
        <a href="#">View online</a>
        <span style="color: #cbd5e1;">•</span>
        <a href="#">Preferences</a>
        <span style="color: #cbd5e1;">•</span>
        <a href="#">Unsubscribe</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
