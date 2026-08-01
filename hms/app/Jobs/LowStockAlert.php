<?php

namespace App\Jobs;

use App\Models\Medicine;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class LowStockAlert implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Medicine $medicine,
        public int $currentStock
    ) {}

    public function handle(): void
    {
        // Email all admin users
        $admins = User::role('admin')->get();

        foreach ($admins as $admin) {
            Mail::raw(
                "⚠️ Low Stock Alert\n\nMedicine: {$this->medicine->name}\n"
                . "Current Stock: {$this->currentStock} {$this->medicine->unit}\n"
                . "Threshold: {$this->medicine->stock_threshold} {$this->medicine->unit}\n\n"
                . "Please restock this medicine as soon as possible.",
                function ($message) use ($admin) {
                    $message->to($admin->email)
                            ->subject("Low Stock Alert: {$this->medicine->name}");
                }
            );
        }
    }
}
