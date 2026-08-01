<?php

namespace App\Console\Commands;

use App\Jobs\SendAppointmentEmail;
use App\Models\Appointment;
use Illuminate\Console\Command;

class StressTestEmailQueue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hms:stress-test-email
                            {--count=50 : Number of emails to dispatch}
                            {--appointment= : Specific appointment ID to use (optional)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatch N queued appointment emails to stress-test the queue (Horizon). Uses real appointments from the database.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = (int) $this->option('count');
        $specificId = $this->option('appointment');

        $this->info("=== HMS Queue Stress Test ===");
        $this->line("Dispatching <fg=yellow>{$count}</> appointment emails to the queue...");
        $this->newLine();

        // Resolve appointments to use
        if ($specificId) {
            $appointment = Appointment::with(['patient', 'doctor', 'patient.user'])
                ->find($specificId);

            if (! $appointment) {
                $this->error("Appointment ID {$specificId} not found.");
                return self::FAILURE;
            }

            $appointments = collect(array_fill(0, $count, $appointment));
        } else {
            // Use real appointments, cycling through them if needed
            $pool = Appointment::with(['patient', 'doctor', 'patient.user'])
                ->whereHas('patient.user')
                ->limit(100)
                ->get();

            if ($pool->isEmpty()) {
                $this->error('No appointments with associated user emails found. Run db:seed first.');
                return self::FAILURE;
            }

            // Cycle through available appointments to reach desired count
            $appointments = collect();
            while ($appointments->count() < $count) {
                $appointments = $appointments->merge($pool);
            }
            $appointments = $appointments->take($count);
        }

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $dispatched = 0;
        foreach ($appointments as $appointment) {
            SendAppointmentEmail::dispatch($appointment);
            $dispatched++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✅ Dispatched <fg=green>{$dispatched}</> jobs to the queue.");
        $this->line("   Queue driver: <fg=cyan>" . config('queue.default') . "</>");

        if (config('queue.default') === 'sync') {
            $this->warn('   ⚠  Running on sync driver — all jobs were processed immediately (not via Horizon).');
            $this->line('   Set QUEUE_CONNECTION=redis in .env and run `php artisan horizon` to test async processing.');
        } else {
            $this->line('   Monitor progress at: <href=' . config('app.url') . '/horizon>' . config('app.url') . '/horizon</>');
        }

        return self::SUCCESS;
    }
}
