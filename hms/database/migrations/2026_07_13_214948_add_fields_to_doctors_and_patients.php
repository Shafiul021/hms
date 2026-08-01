<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->after('fee');
            $table->string('address', 255)->nullable()->after('phone');
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->decimal('weight', 5, 2)->nullable()->after('address');
            $table->decimal('height', 5, 2)->nullable()->after('weight');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            $table->dropColumn(['phone', 'address']);
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn(['weight', 'height']);
        });
    }
};
