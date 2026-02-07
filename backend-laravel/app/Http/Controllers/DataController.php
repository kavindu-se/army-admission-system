<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DataController extends Controller
{
    public function adminPage()
    {
        $noticePath = config('paths.notice_pdf');
        $schoolsPath = config('paths.schools_csv');
        $tamilPath = config('paths.tamilschools_csv');

        $files = [
            'notice' => [
                'path' => $noticePath,
                'exists' => file_exists($noticePath),
                'size' => file_exists($noticePath) ? filesize($noticePath) : 0,
                'name' => basename($noticePath),
            ],
            'schools' => [
                'path' => $schoolsPath,
                'exists' => file_exists($schoolsPath),
                'size' => file_exists($schoolsPath) ? filesize($schoolsPath) : 0,
                'name' => basename($schoolsPath),
            ],
            'tamilschools' => [
                'path' => $tamilPath,
                'exists' => file_exists($tamilPath),
                'size' => file_exists($tamilPath) ? filesize($tamilPath) : 0,
                'name' => basename($tamilPath),
            ],
        ];

        return view('admin.data', compact('files'));
    }
    public function notice()
    {
        $path = config('paths.notice_pdf');
        if (!file_exists($path)) {
            abort(404);
        }
        return response()->download($path, 'notice.pdf');
    }

    public function uploadNotice(Request $request)
    {
        $data = $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240',
        ]);
        $path = config('paths.notice_pdf');
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        $data['file']->move($dir, 'notice_2026.pdf');
        return back();
    }

    public function schools(Request $request)
    {
        $q = strtolower($request->query('q', ''));
        $medium = strtolower($request->query('medium', ''));
        $path = $medium === 'tamil' ? config('paths.tamilschools_csv') : config('paths.schools_csv');
        if (!file_exists($path)) {
            return response()->json([]);
        }
        $lines = array_filter(array_map('trim', file($path)));
        if (count($lines) && str_contains(strtolower($lines[0]), 'census_no')) {
            $lines = array_slice($lines, 1);
        }
        $rows = [];
        foreach ($lines as $line) {
            $parts = str_getcsv($line);
            $census = trim($parts[0] ?? '');
            $name = trim($parts[1] ?? ($parts[0] ?? ''));
            if ($name === '') {
                continue;
            }
            $rows[] = ['census_no' => $census, 'name' => $name];
        }
        if ($q) {
            $rows = array_values(array_filter($rows, function ($row) use ($q) {
                return str_contains(strtolower($row['name']), $q)
                    || str_contains(strtolower($row['census_no']), $q);
            }));
        }
        return response()->json(array_slice($rows, 0, 50));
    }

    public function uploadSchools(Request $request)
    {
        $data = $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
            'medium' => 'required|string',
        ]);
        $medium = strtolower($data['medium']);
        $path = $medium === 'tamil' ? config('paths.tamilschools_csv') : config('paths.schools_csv');
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        $data['file']->move($dir, basename($path));
        return back();
    }
}
