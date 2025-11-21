# Readmit Watchtower Report

This report summarizes the security audit findings for the Brevpulse codebase.

## Overview of Security Posture

The Brevpulse codebase generally demonstrates a strong commitment to security, leveraging modern best practices and robust frameworks. Key security highlights include:

*   **Strong Authentication:** Passwords are securely hashed using Argon2, and JWTs are implemented with `httpOnly`, `Secure`, and `SameSite` cookies.
*   **Secrets Management:** Environment variables are properly utilized for sensitive keys, preventing hardcoding.
*   **Data Encryption:** Sensitive user data, particularly digest content, is encrypted using AES-256-GCM with unique user-specific keys. Refresh tokens are also hashed before storage.
*   **API Protection:** Rate limiting with Redis is in place, and Paystack webhooks are secured with signature verification and idempotency.
*   **Input Validation:** Comprehensive input validation is applied using Zod and `class-validator`.
*   **Security Headers:** The `helmet` middleware is used to mitigate common web vulnerabilities.
*   **OAuth Security:** OAuth flows include state parameters to prevent CSRF.

While the foundation is strong, a few potential Cross-Site Scripting (XSS) vulnerabilities in email templates require immediate attention to prevent client-side script injection. Addressing these will further enhance the overall security of the application.

## Vulnerability Details

### 1. Cross-Site Scripting (XSS) in User Name in Verification Email

*   **Severity:** Medium
*   **Description:** The `MailService` formats verification emails by directly embedding the user's `name` into an HTML template using string replacement (`%s`). If a malicious user registers with a name containing HTML or JavaScript (e.g., `<script>alert('XSS')</script>`), this content could be rendered and executed when the recipient opens the verification email in their email client. This is a common XSS vector in dynamically generated HTML.
*   **Location:**
    *   `apps/server/src/modules/mail/constants.ts` (template `verifyEmailTemp`)
    *   `apps/server/src/modules/mail/mail.service.ts` (`formatVerificationEmail` function)
*   **Remediation:** Always HTML-escape any user-provided data before embedding it into an HTML context. Modify the `formatVerificationEmail` function to escape the `name` parameter.
    *   **Actionable Steps:**
        1.  Import or implement an HTML escaping utility (e.g., a function that converts `<`, `>`, `&`, `"`, `'` to their respective HTML entities).
        2.  Apply this escaping to `data.name` before it is passed to `verifyEmailTemp.replace('%s', name)`.

### 2. Potential Cross-Site Scripting (XSS) in AI-Generated Digest Content

*   **Severity:** Medium
*   **Description:** The `generateEmailHTML` function constructs the email digest by directly embedding content (`item.title`, `item.description`, and `item.actions[].label`) that originates from third-party integrations and is processed by Google Gemini AI. If the raw input or the AI's output contains unescaped HTML/script content, it could lead to XSS when the email digest is rendered by an email client. While Gemini is instructed to produce clean JSON, it doesn't guarantee content will be sanitised from user provided html/js directly.
*   **Location:**
    *   `apps/server/src/modules/digest/common/email-digest-template.ts` (`generateEmailHTML` function)
    *   `apps/server/src/modules/digest/digest.service.ts` (where `generateEmailHTML` is called after AI processing)
*   **Remediation:** Implement a robust HTML sanitization mechanism for all dynamic content derived from external sources (integrations or AI responses) before it is rendered into the HTML email template.
    *   **Actionable Steps:**
        1.  Sanitize the `rawData` content received from integrations *before* sending it to the Gemini AI. This ensures the AI processes clean input.
        2.  Alternatively, or in addition, sanitize the `item.title`, `item.description`, and `item.actions[].label` fields of the `DigestPayload` *after* receiving the response from Gemini and *before* they are used in `generateEmailHTML`.
        3.  Consider using a battle-tested server-side HTML sanitization library (e.g., `dompurify` if running in a Node.js context that can use it, or a similar library designed for server-side HTML sanitization).

### 3. Inconsistent Environment Variable Access in Paystack Service

*   **Severity:** Low
*   **Description:** In `PaystackService`, the `callback_url` for Paystack checkout is constructed using a direct `process.env.FRONTEND_URL`. This deviates from the established practice within the application of using the centralized `appConfig()` function (e.g., `this.appConf.FRONTEND_DOMAIN`) to access environment variables. While it may function correctly, this inconsistency can lead to maintainability issues and potential misconfigurations if `process.env.FRONTEND_URL` is undefined or accidentally differs from the value provided by `appConfig().FRONTEND_DOMAIN`.
*   **Location:** `apps/server/src/modules/paystack/paystack.service.ts` (in `startCheckout` method)
*   **Remediation:** Align the access method for `FRONTEND_URL` with the rest of the application's configuration practices.
    *   **Actionable Steps:**
        1.  Replace `process.env.FRONTEND_URL` with `this.appConf.FRONTEND_DOMAIN` within the `startCheckout` method of `PaystackService`.

### 4. Missing `Max-Age` Cookie Attribute

*   **Severity:** Low
*   **Description:** The `sendCookies` method in `AuthService` sets authentication cookies (`bp_rtoken`, `bp_atoken`) with an `expires` attribute. While `expires` is functionally correct, including the `maxAge` attribute (in milliseconds) alongside or instead of `expires` can provide clearer, more direct control over cookie expiration and may offer better compatibility or predictability across various client environments and proxies.
*   **Location:** `apps/server/src/modules/auth/auth.service.ts` (`sendCookies` method)
*   **Remediation:** Add the `maxAge` attribute to the cookie options for both `bp_rtoken` and `bp_atoken`.
    *   **Actionable Steps:**
        1.  In `sendCookies`, update the `res.cookie` calls to include `maxAge: this.jwtTokens.refresh.cookieExpiresMs` and `maxAge: this.jwtTokens.access.cookieExpiresMs` respectively.

[![Report was generated by Readmit](https://img.shields.io/badge/Readme%20was%20generated%20by-Readmit-brightred)](https://readmit.vercel.app)
