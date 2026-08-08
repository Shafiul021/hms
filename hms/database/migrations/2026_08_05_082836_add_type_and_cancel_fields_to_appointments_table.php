<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('type')->default('scheduled')->after('id');
            $table->foreignId('rescheduled_from_id')->nullable()->constrained('appointments')->onDelete('set null');
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('cancellation_reason')->nullable();
        });

        // Safely update ENUM column for status to include new states
        DB::statement("ALTER TABLE appointments MODIFY status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'delayed', 'missed') DEFAULT 'pending'");
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['rescheduled_from_id']);
            $table->dropForeign(['cancelled_by']);
            $table->dropColumn(['type', 'rescheduled_from_id', 'cancelled_by', 'cancellation_reason']);
        });

        // Revert ENUM column
        DB::statement("ALTER TABLE appointments MODIFY status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending'");
    }
};
