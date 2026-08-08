<?php
use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $req = Request::create('/api/medicines/1/stock', 'PATCH', [
        'batch_no' => 'BTH-' . time(),
        'quantity' => 50,
        'expiry_date' => '2026-12-31'
    ]);
    
    // Fake login as admin
    $admin = \App\Models\User::role('admin')->first();
    if ($admin) {
        $app->make('auth')->login($admin);
    }
    
    $res = app()->handle($req);
    echo "STATUS: " . $res->getStatusCode() . "\n";
    echo "CONTENT: " . $res->getContent() . "\n";
} catch (\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
