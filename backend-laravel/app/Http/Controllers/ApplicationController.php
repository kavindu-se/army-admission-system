<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Attachment;
use App\Models\ApprovalStep;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $apps = Application::query()
            ->when($user && str_contains($user->roles, 'Applicant'), function ($q) use ($user) {
                $q->where('applicant_id', $user->id);
            })
            ->orderByDesc('created_at')
            ->get();

        return view('applications.index', compact('apps'));
    }

    public function create()
    {
        return view('applications.form', [
            'application' => null,
            'formA' => [],
            'formB' => [],
        ]);
    }

    public function edit(Application $application)
    {
        $this->authorizeApplication($application);
        return view('applications.form', [
            'application' => $application,
            'formA' => $application->form_a_json ?? [],
            'formB' => $application->form_b_json ?? [],
            'attachments' => Attachment::where('application_id', $application->id)
                ->orderByDesc('created_at')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'academic_year' => 'required|string',
            'action' => 'nullable|string',
            'status' => 'nullable|string',
            'current_stage' => 'nullable|string',
            'formA' => 'array',
            'formB' => 'array',
        ]);

        $user = $request->user();
        $applicationNo = 'APP-' . now()->year . '-' . Str::upper(Str::random(6));
        [$status, $stage] = $this->resolveSubmissionState($data, $data['formA'] ?? []);

        $application = Application::create([
            'application_no' => $applicationNo,
            'applicant_id' => $user->id,
            'unit_id' => $user->unit_id ?? 1,
            'rhq_id' => $user->rhq_id ?? 1,
            'regiment_name' => $data['formA']['regiment_name'] ?? null,
            'unit_no' => $data['formA']['unit_name'] ?? null,
            'academic_year' => $data['academic_year'],
            'status' => $status,
            'current_stage' => $stage,
            'form_a_json' => $data['formA'] ?? [],
            'form_b_json' => $data['formB'] ?? [],
        ]);

        return redirect()->route('applications.edit', $application);
    }

    public function update(Request $request, Application $application)
    {
        $this->authorizeApplication($application);
        $data = $request->validate([
            'academic_year' => 'required|string',
            'action' => 'nullable|string',
            'status' => 'nullable|string',
            'current_stage' => 'nullable|string',
            'formA' => 'array',
            'formB' => 'array',
        ]);

        [$status, $stage] = $this->resolveSubmissionState($data, $data['formA'] ?? [], $application);

        $application->update([
            'academic_year' => $data['academic_year'],
            'status' => $status,
            'current_stage' => $stage,
            'regiment_name' => $data['formA']['regiment_name'] ?? $application->regiment_name,
            'unit_no' => $data['formA']['unit_name'] ?? $application->unit_no,
            'form_a_json' => $data['formA'] ?? $application->form_a_json,
            'form_b_json' => $data['formB'] ?? $application->form_b_json,
        ]);

        return redirect()->route('applications.edit', $application)->with('status', $data['action'] === 'submit' ? 'Application submitted.' : 'Draft saved.');
    }

    public function destroy(Application $application)
    {
        $this->authorizeDelete($application);

        $attachments = Attachment::where('application_id', $application->id)->get();
        foreach ($attachments as $attachment) {
            if ($attachment->path && Storage::exists($attachment->path)) {
                Storage::delete($attachment->path);
            }
        }
        Attachment::where('application_id', $application->id)->delete();
        ApprovalStep::where('application_id', $application->id)->delete();
        $application->delete();

        return redirect()->route('dashboard')->with('status', 'Application deleted.');
    }

    public function uploadAttachment(Request $request, Application $application)
    {
        $this->authorizeApplication($application);
        $data = $request->validate([
            'type' => 'required|string',
            'file' => 'required|file|max:5120',
        ]);

        $file = $data['file'];
        $path = $file->store('uploads');

        Attachment::create([
            'application_id' => $application->id,
            'type' => $data['type'],
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
        ]);

        return back();
    }

    public function downloadAttachment(Attachment $attachment)
    {
        $this->authorizeAttachment($attachment);
        if (!Storage::exists($attachment->path)) {
            abort(404);
        }
        return Storage::download($attachment->path, $attachment->filename);
    }

    private function authorizeApplication(Application $application): void
    {
        $user = request()->user();
        if (!$user) {
            abort(403);
        }
        if (str_contains($user->roles, 'Applicant') && $application->applicant_id !== $user->id) {
            abort(403);
        }
    }

    private function authorizeAttachment(Attachment $attachment): void
    {
        $application = Application::findOrFail($attachment->application_id);
        $this->authorizeApplication($application);
    }

    private function authorizeDelete(Application $application): void
    {
        $user = request()->user();
        if (!$user) {
            abort(403);
        }
        if (!str_contains($user->roles, 'Applicant') || $application->applicant_id !== $user->id) {
            abort(403);
        }
        $allowedStages = ['Applicant', 'UnitSubjectClerk'];
        if (!in_array($application->current_stage, $allowedStages, true)) {
            abort(403);
        }
    }

    private function resolveSubmissionState(array $data, array $formA, ?Application $application = null): array
    {
        $action = strtolower($data['action'] ?? 'draft');
        $status = $data['status'] ?? ($application?->status ?? config('army.statuses.DRAFT'));
        $stage = $data['current_stage'] ?? ($application?->current_stage ?? config('army.stages.APPLICANT'));

        if ($action === 'submit') {
            if (empty($formA['applicant_declaration_confirmed'])) {
                abort(422, 'Please confirm the declaration before submitting.');
            }
            $status = config('army.statuses.SUBMITTED') ?? 'submitted_to_unit';
            $stage = config('army.stages.UNIT_CLERK') ?? 'UnitSubjectClerk';
        }

        if ($action === 'draft') {
            $status = config('army.statuses.DRAFT') ?? 'draft';
            $stage = $application?->current_stage ?? config('army.stages.APPLICANT');
        }

        return [$status, $stage];
    }
}
