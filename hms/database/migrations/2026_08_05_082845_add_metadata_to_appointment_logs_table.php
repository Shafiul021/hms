<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointment_logs', function (Blueprint $table) {
            $table->string('created_type')->nullable()->after('changed_by');
            $table->json('metadata')->nullable()->after('created_type');
        });
    }

    public function down(): void
    {
        Schema::table('appointment_logs', function (Blueprint $table) {
            $table->dropColumn(['created_type', 'metadata']);
        });
    }
};
