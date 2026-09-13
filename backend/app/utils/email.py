import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_password_reset_email(to_email: str, code: str, recipient_name: str = "") -> bool:
    """
    Sends a password reset email via SMTP (e.g. Gmail) containing a verification code.
    Falls back to console output if SMTP credentials are not yet configured.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").replace(" ", "").strip()
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "noreply@airesumeintel.com").strip()
    
    # If SMTP is not yet configured, output cleanly to console so it can be tested
    if not smtp_user or not smtp_password or smtp_password.startswith("your-"):
        print("\n" + "=" * 70)
        print(f"[PASSWORD RESET CODE GENERATED] For: {to_email}")
        print(f">> Verification Code: {code}")
        print("Note: Configure SMTP_USER and SMTP_PASSWORD in backend/.env to send real Gmails")
        print("=" * 70 + "\n")
        return True

    # Prepare message
    message = MIMEMultipart("alternative")
    message["Subject"] = "Password Reset Code - AI Resume Intelligence"
    message["From"] = f"AI Resume Intelligence <{smtp_from}>"
    message["To"] = to_email

    greeting = f"Hello {recipient_name}," if recipient_name else "Hello,"

    text_content = f"""{greeting}

We received a request to reset your password for AI Resume Intelligence.
Your password reset verification code is:

{code}

This code is valid for 15 minutes.
If you did not request this password reset, please ignore this email.
"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }}
        .container {{ max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: white; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }}
        .content {{ padding: 32px 28px; color: #334155; line-height: 1.6; font-size: 15px; text-align: center; }}
        .code-box {{ background-color: #f1f5f9; border: 1px dashed #cbd5e1; display: inline-block; padding: 16px 32px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #1e293b; margin: 24px 0; }}
        .footer {{ padding: 20px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AI Resume Intelligence</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; font-weight: 600; color: #1e293b; text-align: left;">{greeting}</p>
          <p style="text-align: left;">We received a request to reset the password for your AI Resume Intelligence account.</p>
          <p style="text-align: left;">Enter the following verification code to choose a new password. This code will expire in <strong>15 minutes</strong>.</p>
          <div class="code-box">{code}</div>
          <p style="font-size: 13px; color: #94a3b8; margin-top: 24px; text-align: left;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; 2026 AI Resume Intelligence. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    message.attach(MIMEText(text_content, "plain"))
    message.attach(MIMEText(html_content, "html"))

    try:
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_from, to_email, message.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_from, to_email, message.as_string())
        print(f"[EMAIL SENT] Successfully sent password reset email to {to_email}")
        return True
    except Exception as e:
        print(f"[SMTP WARNING] Failed to connect to {smtp_host}: {str(e)}")
        print("\n" + "=" * 70)
        print(f"[CONSOLE FALLBACK] Direct Password Reset Code for {to_email}:")
        print(f">> {code}")
        print("=" * 70 + "\n")
        return True


