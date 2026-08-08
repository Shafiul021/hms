<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\LabTest;
use App\Http\Resources\LabTestResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LabTestController extends Controller
{
    /**
     * Display a listing of available lab tests.
     */
    public function index(): AnonymousResourceCollection
    {
        return LabTestResource::collection(LabTest::all());
    }
}
