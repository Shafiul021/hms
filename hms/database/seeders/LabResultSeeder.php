<?php

namespace Database\Seeders;

use App\Models\LabRequest;
use App\Models\LabResult;
use App\Models\User;
use Illuminate\Database\Seeder;

class LabResultSeeder extends Seeder
{
    /**
     * Seed lab results for all 'completed' lab requests.
     */
    public function run(): void
    {
        $completedRequests = LabRequest::where('status', 'completed')->get();
        $technicianId      = User::where('email', 'admin@hms.com')->value('id');

        if ($completedRequests->isEmpty() || !$technicianId) {
            $this->command->warn('LabResultSeeder: no completed lab requests or technician found.');
            return;
        }

        $resultFiles = [
            'results/CBC_report_001.pdf',
            'results/LFT_report_002.pdf',
            'results/RFT_report_003.pdf',
            'results/lipid_panel_004.pdf',
            'results/HbA1c_report_005.pdf',
            'results/urine_analysis_006.pdf',
            'results/thyroid_panel_007.pdf',
        ];

        $notes = [
            'All values within normal range.',
            'Slightly elevated WBC count. Repeat recommended.',
            'ALT mildly elevated. Recheck in 4 weeks.',
            'LDL cholesterol high. Dietary intervention recommended.',
            'HbA1c 8.1% — poor glycaemic control.',
            'Mild proteinuria detected. Further workup advised.',
            'TSH normal. T3/T4 within range.',
        ];

        $count = 0;

        foreach ($completedRequests as $i => $request) {
            LabResult::firstOrCreate(
                ['lab_request_id' => $request->id],
                [
                    'technician_id' => $technicianId,
                    'result_file'   => $resultFiles[$i % count($resultFiles)],
                    'notes'         => $notes[$i % count($notes)],
                    'is_abnormal'   => ($i % 3 === 0), // every 3rd result flagged abnormal
                ]
            );
            $count++;
        }

        $this->command->info($count . ' lab results seeded.');
    }
}
