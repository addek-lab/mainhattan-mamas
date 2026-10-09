<?php
// contact.php

// Define the recipient email
$to = "hallo@mainhattan-mamas.de";

// Only process POST requests
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get JSON POST body
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, TRUE);
    
    // Spam-Schutz: Das Feld "website" ist für Menschen unsichtbar. Ist es ausgefüllt,
    // war es ein Bot – wir antworten mit "success", verschicken aber nichts.
    if (!empty($input['website'])) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Nachricht erfolgreich gesendet."]);
        exit;
    }

    // Sanitize and assign variables
    $name = isset($input['name']) ? strip_tags(trim($input["name"])) : '';
    $organization = isset($input['organization']) ? strip_tags(trim($input["organization"])) : '';
    $email = isset($input['email']) ? filter_var(trim($input["email"]), FILTER_SANITIZE_EMAIL) : '';
    $phone = isset($input['phone']) ? strip_tags(trim($input["phone"])) : '';
    $stadtteil = isset($input['stadtteil']) ? strip_tags(trim($input["stadtteil"])) : '';
    $message = isset($input['message']) ? nl2br(strip_tags(trim($input["message"]))) : '';
    $form_type = isset($input['form_type']) ? strip_tags(trim($input["form_type"])) : 'allgemein';
    $time_commitment = isset($input['time_commitment']) ? strip_tags(trim($input["time_commitment"])) : '';
    
    // Handle interests (can be array or string)
    $interest = '';
    if (isset($input['interests']) && is_array($input['interests'])) {
        // Sanitize array values
        $clean_interests = array_map(function($val) { return strip_tags(trim($val)); }, $input['interests']);
        $interest = implode("<br>• ", $clean_interests);
        if ($interest) $interest = "• " . $interest;
    } elseif (isset($input['interest'])) {
        $interest = strip_tags(trim($input["interest"]));
    }

    // Check if basic data is provided
    if (empty($name) || empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Bitte füllen Sie Name und E-Mail korrekt aus."]);
        exit;
    }

    // Prepare email subject and content based on form_type
    $subject_prefix = "Neue Anfrage (Mainhattan Mamas):";
    $form_title = "Neue Kontaktanfrage";
    if ($form_type === 'mitmachen') {
        $subject_prefix = "Neuer Mitmachen-Antrag:";
        $form_title = "Neuer Antrag zum Mitmachen";
    } elseif ($form_type === 'einrichtung') {
        $subject_prefix = "Kooperationsanfrage Einrichtung:";
        $form_title = "Neue Kooperationsanfrage";
    } elseif ($form_type === 'kontakt') {
        $subject_prefix = "Neue Kontaktanfrage:";
        $form_title = "Neue Kontaktanfrage";
    }
    
    // Zeilenumbrüche entfernen (verhindert Header-Injection) und Umlaute korrekt kodieren
    $subject = str_replace(["\r", "\n"], ' ', "$subject_prefix $name");
    if (function_exists('mb_encode_mimeheader')) {
        $subject = mb_encode_mimeheader($subject, 'UTF-8', 'B');
    }
    
    // HTML Email Template
    $email_html = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <title>Neue Anfrage auf Mainhattan Mamas</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F9F6F0; color: #333333; line-height: 1.6; margin: 0; padding: 30px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(44, 74, 59, 0.08); }
            .header { background-color: #2C4A3B; color: #F9F6F0; padding: 35px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 500; letter-spacing: 0.5px; }
            .content { padding: 40px 35px; }
            .field { margin-bottom: 25px; }
            .field:last-child { margin-bottom: 0; }
            .label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px; font-weight: bold; }
            .value { font-size: 16px; color: #2C4A3B; background-color: #F9F6F0; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #C66548; }
            .message-box { background-color: #F3E8E3; padding: 20px; border-radius: 8px; border-left: 4px solid #C66548; font-size: 16px; color: #2C4A3B; line-height: 1.7; }
            .footer { background-color: #F9F6F0; padding: 25px; text-align: center; font-size: 13px; color: #888888; border-top: 1px solid #EAE5DE; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>$form_title</h1>
            </div>
            <div class='content'>
                <div class='field'>
                    <div class='label'>Name / Ansprechperson</div>
                    <div class='value'>$name</div>
                </div>";
                
    if (!empty($organization)) {
        $email_html .= "
                <div class='field'>
                    <div class='label'>Einrichtung / Gemeinde / Praxis</div>
                    <div class='value'>$organization</div>
                </div>";
    }

    $email_html .= "
                <div class='field'>
                    <div class='label'>E-Mail-Adresse</div>
                    <div class='value'><a href='mailto:$email' style='color:#C66548; text-decoration:none;'>$email</a></div>
                </div>";

    if (!empty($phone)) {
        $email_html .= "
                <div class='field'>
                    <div class='label'>Telefonnummer</div>
                    <div class='value'>$phone</div>
                </div>";
    }

    if (!empty($stadtteil)) {
        $email_html .= "
                <div class='field'>
                    <div class='label'>Stadtteil / Ort</div>
                    <div class='value'>$stadtteil</div>
                </div>";
    }

    if (!empty($interest)) {
        $email_html .= "
                <div class='field'>
                    <div class='label'>Interessen / Themen</div>
                    <div class='value' style='line-height:1.8;'>$interest</div>
                </div>";
    }

    if (!empty($time_commitment)) {
        $email_html .= "
                <div class='field'>
                    <div class='label'>Zeitliches Engagement</div>
                    <div class='value'>$time_commitment</div>
                </div>";
    }

    if (!empty($message)) {
        $email_html .= "
                <div class='field'>
                    <div class='label'>Nachricht</div>
                    <div class='message-box'>$message</div>
                </div>";
    }

    $email_html .= "
            </div>
            <div class='footer'>
                Diese E-Mail wurde automatisch über das Kontaktformular auf mainhattan-mamas.de generiert.
            </div>
        </div>
    </body>
    </html>";

    // Build email headers for HTML email
    $headers = "From: webmaster@mainhattan-mamas.de\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    // Send email
    if (mail($to, $subject, $email_html, $headers)) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Nachricht erfolgreich gesendet."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Es gab ein Problem beim Senden der E-Mail."]);
    }

} else {
    // Not a POST request
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Ungültige Anfragemethode."]);
}
?>
