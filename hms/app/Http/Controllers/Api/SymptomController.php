<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Symptom;
use Illuminate\Http\Request;

class SymptomController extends Controller
{
    public function index(Request $request)
    {
        $query = Symptom::query();

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        return response()->json([
            'data' => $query->orderBy('name', 'asc')->limit(50)->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:symptoms,name'
        ]);

        $symptom = Symptom::create($validated);

        return response()->json([
            'data' => $symptom,
            'message' => 'Symptom created successfully.'
        ], 201);
    }
}
