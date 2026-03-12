import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { smtpSettings, to, subject, html, text } = await req.json();

        if (!smtpSettings || !smtpSettings.enabled) {
            throw new Error("Configuració SMTP no proporcionada o desactivada.");
        }

        const client = new SmtpClient();

        await client.connectTLS({
            hostname: smtpSettings.host,
            port: smtpSettings.port,
            username: smtpSettings.user,
            password: smtpSettings.password,
        });

        await client.send({
            from: `${smtpSettings.fromName} <${smtpSettings.fromEmail}>`,
            to: to,
            subject: subject,
            content: text,
            html: html,
        });

        await client.close();

        return new Response(
            JSON.stringify({ success: true, message: "Email enviat correctament" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
