export const verifyEmailTemp = `
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: "Geist", sans-serif;
            color: hsl(220, 13%, 18%);
            background-color: hsl(0, 0%, 97.5%);
            padding: 20px;
            margin: 0;
            line-height: 1.6;
        }

        .email-container {
            background-color: hsl(0, 0%, 100%);
            padding: 32px;
            border-radius: 8px;
            max-width: 600px;
            margin: auto;
            box-shadow: 0 10px 25px -5px hsla(220, 13%, 0%, 0.1);
        }

        .button {
            background-color: hsl(142, 76%, 36%);
            color: white;
            padding: 12px 24px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            transition: background-color 0.2s ease;
            border: none;
            cursor: pointer;
        }

        .button:hover {
            background-color: hsl(142, 76%, 32%);
        }

        .welcome-title {
            font-size: 24px;
            font-weight: 700;
            color: hsl(220, 13%, 13%);
            margin: 24px 0 16px 0;
        }

        .greeting {
            margin-bottom: 24px;
        }

        .welcome-text {
            margin-bottom: 24px;
        }

        .verification-section {
            background-color: hsl(220, 14%, 96%);
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid hsl(142, 76%, 36%);
        }

        .verification-text {
            margin-bottom: 12px;
            font-weight: 500;
        }

        .action-section {
            margin: 20px 0 10px 0;
            text-align: center;
        }

        .signature {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid hsl(220, 13%, 91%);
        }

        .team-name {
            font-weight: 600;
        }

        .note {
            font-size: 13px;
            color: hsl(220, 8.9%, 46.1%);
            margin-top: 24px;
        }

        @media (max-width: 600px) {
            .email-container {
                padding: 20px;
                margin: 10px;
            }
            
            body {
                padding: 10px;
            }

            .welcome-title {
                font-size: 20px;
            }
        }
    </style>
</head>

<body>
    <div class="email-container">
        <p class="greeting">Hi %s,</p>

        <h1 class="welcome-title">Welcome to BrevPulse!</h1>

        <p class="welcome-text">
            We're excited to have you onboard! BrevPulse helps you stay informed with a smart daily email digest of what truly matters.
        </p>

        <div class="verification-section">
            <p class="verification-text">Please verify your email address to complete your setup:</p>
            <div class="action-section">
                <a href="%s" class="button">Verify Email</a>
            </div>
        </div>

        <p>Once verified, you can start receiving your daily digest and use BrevPulse without any restrictions.</p>

        <p class="note">This link will expire in 24 hours. If you didn't sign up for BrevPulse, you can safely ignore this email.</p>

        <div class="signature">
            <p>See you in your first digest!<br><br>
                <span class="team-name">The BrevPulse Team</span>
            </p>
        </div>
    </div>
</body>

</html>
`;
