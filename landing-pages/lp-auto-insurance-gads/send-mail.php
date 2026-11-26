<?php

header('Content-Type: application/json; charset=UTF-8');

function respond($success, $message, $code = 200) {
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method.', 405);
}


if (!empty($_POST['website'])) {
    respond(true, 'Thank you!');
}

function clean($key, $maxLen = 500) {
    $value = isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
    $value = str_replace(["\r", "\n", "%0a", "%0d"], ' ', $value);
    return mb_substr(strip_tags($value), 0, $maxLen);
}

$fullName        = clean('full_name', 150);
$phone           = clean('phone', 30);
$email           = clean('email', 150);
$garagingAddress = clean('garaging_address', 300);
$vehicleInfo     = clean('vehicle_info', 500);
$gclid           = clean('gclid', 300);
$pageUrl         = clean('page_url', 1000);
$additionalInfo  = isset($_POST['additional_info'])
    ? mb_substr(strip_tags(trim((string) $_POST['additional_info'])), 0, 5000)
    : '';


if ($fullName === '' || $phone === '' || $email === '' || $garagingAddress === '' || $vehicleInfo === '') {
    respond(false, 'Please fill in all required fields.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter a valid email address.', 422);
}
$phoneDigits = preg_replace('/\D/', '', $phone);
if (strlen($phoneDigits) === 11 && $phoneDigits[0] === '1') {
    $phoneDigits = substr($phoneDigits, 1);
}
if (!preg_match('/^[2-9]\d{2}[2-9]\d{6}$/', $phoneDigits)) {
    respond(false, 'Please enter a valid 10-digit phone number.', 422);
}

$gclidText = $gclid !== '' ? $gclid : 'N/A (not from a Google Ads click)';
$extraText = $additionalInfo !== '' ? $additionalInfo : 'N/A';
$submitted = date('Y-m-d H:i:s T');
$ip        = $_SERVER['REMOTE_ADDR'] ?? 'N/A';


$to = implode(', ', [
    'jhickman@farmersagent.com',
    'admin@hickmaninsured.com',
    'stephen.jhickman@farmersagency.com',
]);
$bcc = 'support@unbound-it.com';

$fromEmail = 'no-reply@hickmaninsured.com';
$fromName  = 'Hickman Insurance Website';

$subject = 'New Lead - Auto Insurance Landing Page - ' . $fullName;

$body = "New auto insurance quote request received:\n\n"
      . "Name: $fullName\n"
      . "Phone: $phone\n"
      . "Email: $email\n"
      . "Garaging Address: $garagingAddress\n"
      . "Vehicle Information: $vehicleInfo\n\n"
      . "Additional Info (drivers, vehicles, questions):\n$extraText\n\n"
      . "----------------------------------------\n"
      . "GCLID: $gclidText\n"
      . "Page URL: $pageUrl\n"
      . "Submitted: $submitted\n"
      . "IP Address: $ip\n";

$headers  = "From: $fromName <$fromEmail>\r\n";
$headers .= "Reply-To: $fullName <$email>\r\n";
$headers .= "Bcc: $bcc\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

$sent = mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . $fromEmail);

if (!$sent) {
    respond(false, 'Sorry, we could not send your request right now. Please call us directly.', 500);
}

respond(true, 'Thank you! Your auto insurance quote request has been submitted successfully.');
