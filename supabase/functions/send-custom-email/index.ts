
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, type, token, redirectUrl } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let subject: string
    let htmlContent: string

    switch (type) {
      case 'signup':
      case 'email_verification':
        subject = 'Verify your email for KitaabSe'
        htmlContent = generateVerificationEmail(token, email)
        break
      case 'recovery':
        subject = 'Reset your password for KitaabSe'
        htmlContent = generatePasswordResetEmail(token, redirectUrl || '')
        break
      default:
        throw new Error('Invalid email type')
    }

    // Here you would integrate with your preferred email service
    // For now, we'll use a simple fetch to a webhook or email service
    
    console.log('Sending email:', { email, subject, type })
    
    // You can integrate with services like:
    // - Resend
    // - SendGrid
    // - Mailgun
    // - AWS SES
    
    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

function generateVerificationEmail(token: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - KitaabSe</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background-color: #f9fafb;
                margin: 0;
                padding: 0;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(135deg, #f59e0b, #d97706); 
                color: white; 
                padding: 30px; 
                text-align: center; 
            }
            .header h1 { 
                margin: 0; 
                font-size: 28px; 
                font-weight: bold;
            }
            .header p { 
                margin: 10px 0 0 0; 
                opacity: 0.9;
                font-size: 16px;
            }
            .content { 
                padding: 40px 30px; 
            }
            .otp-code { 
                background: #f3f4f6; 
                border: 2px dashed #d1d5db; 
                border-radius: 8px; 
                padding: 20px; 
                text-align: center; 
                margin: 20px 0; 
                font-size: 24px; 
                font-weight: bold; 
                color: #f59e0b;
                letter-spacing: 3px;
            }
            .button { 
                display: inline-block; 
                background: #f59e0b; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold;
                margin: 20px 0;
            }
            .footer { 
                background: #f9fafb; 
                padding: 20px; 
                text-align: center; 
                color: #6b7280; 
                font-size: 14px; 
            }
            .hindi-text {
                font-size: 18px;
                color: #d97706;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📚 KitaabSe</h1>
                <p class="hindi-text">हिन्दी साहित्य की गूंज</p>
                <p>Hindi Literature's Echo</p>
            </div>
            <div class="content">
                <h2>Verify Your Email Address</h2>
                <p>Hello!</p>
                <p>Thank you for joining KitaabSe, your gateway to Hindi literature. To complete your registration, please verify your email address using the code below:</p>
                
                <div class="otp-code">${token}</div>
                
                <p>This verification code will expire in 24 hours. If you didn't create an account with KitaabSe, you can safely ignore this email.</p>
                
                <p>Welcome to the world of Hindi literature!</p>
                
                <p>Best regards,<br>The KitaabSe Team</p>
            </div>
            <div class="footer">
                <p>© 2024 KitaabSe. Bringing Hindi literature to the digital world.</p>
                <p>You received this email because you signed up for KitaabSe.</p>
            </div>
        </div>
    </body>
    </html>
  `
}

function generatePasswordResetEmail(token: string, redirectUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - KitaabSe</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background-color: #f9fafb;
                margin: 0;
                padding: 0;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(135deg, #f59e0b, #d97706); 
                color: white; 
                padding: 30px; 
                text-align: center; 
            }
            .header h1 { 
                margin: 0; 
                font-size: 28px; 
                font-weight: bold;
            }
            .content { 
                padding: 40px 30px; 
            }
            .button { 
                display: inline-block; 
                background: #f59e0b; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold;
                margin: 20px 0;
            }
            .footer { 
                background: #f9fafb; 
                padding: 20px; 
                text-align: center; 
                color: #6b7280; 
                font-size: 14px; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📚 KitaabSe</h1>
                <p>हिन्दी साहित्य की गूंज</p>
            </div>
            <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password for your KitaabSe account.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <a href="${redirectUrl}&token=${token}" class="button">Reset Password</a>
                
                <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <p>Best regards,<br>The KitaabSe Team</p>
            </div>
            <div class="footer">
                <p>© 2024 KitaabSe. Bringing Hindi literature to the digital world.</p>
            </div>
        </div>
    </body>
    </html>
  `
}
