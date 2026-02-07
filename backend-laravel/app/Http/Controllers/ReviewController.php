<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ApprovalStep;
use App\Models\Attachment;
use App\Models\User;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $roles = $this->rolesArray($user->roles ?? '');
        $viewMode = $request->query('view', 'pending');

        $apps = Application::orderByDesc('created_at')->get();

        $historyRows = [];
        $historySteps = ApprovalStep::query()
            ->where('actor_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        $appMap = Application::whereIn('id', $historySteps->pluck('application_id')->all())
            ->get()
            ->keyBy('id');

        foreach ($historySteps as $step) {
            $app = $appMap->get($step->application_id);
            if (!$app) {
                continue;
            }
            $historyRows[] = [
                'app' => $app,
                'last_action' => $step->action,
                'last_action_at' => $step->created_at,
            ];
        }

        return view('reviews.queue', [
            'apps' => $apps,
            'historyRows' => $historyRows,
            'viewMode' => $viewMode,
            'roles' => $roles,
        ]);
    }

    public function show(Request $request, Application $application)
    {
        $user = $request->user();
        $roles = $this->rolesArray($user->roles ?? '');

        $attachments = Attachment::where('application_id', $application->id)
            ->orderByDesc('created_at')
            ->get();

        $steps = ApprovalStep::query()
            ->where('application_id', $application->id)
            ->orderBy('created_at')
            ->get()
            ->map(function ($step) {
                $actor = User::find($step->actor_id);
                $step->actor_name = $actor?->name;
                $step->actor_roles = $actor?->roles;
                return $step;
            });

        return view('reviews.detail', [
            'application' => $application,
            'attachments' => $attachments,
            'steps' => $steps,
            'roles' => $roles,
        ]);
    }

    public function takeAction(Request $request, Application $application)
    {
        $user = $request->user();
        $data = $request->validate([
            'action' => 'required|string',
            'comment' => 'nullable|string',
        ]);

        $roles = $this->rolesArray($user->roles ?? '');
        $action = strtolower($data['action']);

        $currentStage = $application->current_stage;
        $nextStatus = $application->status;
        $nextStage = $application->current_stage;
        $updates = [
            'cc_approved' => $application->cc_approved,
            'gso1_approved' => $application->gso1_approved,
        ];
        $handled = false;

        $returnToApplicant = function () use (&$nextStatus, &$nextStage) {
            $nextStatus = 'returned';
            $nextStage = 'Applicant';
        };

        $hasRole = function (string $role) use ($roles) {
            return in_array($role, $roles, true);
        };

        if ($action === 'return' && !$hasRole('Applicant')) {
            $returnToApplicant();
            $handled = true;
        } elseif ($hasRole('UnitSubjectClerk') && $application->current_stage === 'UnitSubjectClerk') {
            if ($action === 'return') $returnToApplicant();
            if ($action === 'forward') $nextStage = 'UnitAdjutant';
            $handled = true;
        } elseif ($hasRole('UnitAdjutant') && $application->current_stage === 'UnitAdjutant') {
            if ($action === 'return') $returnToApplicant();
            if ($action === 'forward') $nextStage = 'UnitCO';
            $handled = true;
        } elseif ($hasRole('UnitCO') && $application->current_stage === 'UnitCO') {
            if ($action === 'return') $returnToApplicant();
            if ($action === 'recommend' || $action === 'approve') {
                $nextStatus = 'unit_endorsed';
                $nextStage = 'RHQSubjectClerk';
            }
            if ($action === 'reject') {
                $nextStatus = 'rejected';
                $nextStage = 'Closed';
            }
            $handled = true;
        } elseif ($hasRole('RHQSubjectClerk') && $application->current_stage === 'RHQSubjectClerk') {
            if ($action === 'return') $returnToApplicant();
            if ($action === 'forward') {
                $nextStatus = 'rhq_approved';
                $nextStage = 'GSO1';
            }
            $handled = true;
        } elseif (($hasRole('GSO1') || $hasRole('RHQGSO')) &&
            ($application->current_stage === 'CommandApprovals' || $application->current_stage === 'GSO1')) {
            if ($action === 'return') $returnToApplicant();
            if ($action === 'forward') {
                $updates['gso1_approved'] = true;
                $nextStage = 'CentreCommandant';
            }
            $handled = true;
        } elseif ($hasRole('CentreCommandant') && $application->current_stage === 'CentreCommandant') {
            if ($action === 'return') $returnToApplicant();
            if ($action === 'recommend') {
                $updates['cc_approved'] = true;
                $nextStage = 'DteWelfareClerk';
            }
            $handled = true;
        } elseif ($hasRole('DteWelfareClerk') && $application->current_stage === 'DteWelfareClerk') {
            if ($action === 'return') $returnToApplicant();
            if ($action === 'forward') {
                $nextStage = 'DteWelfareGSO2';
            }
            $handled = true;
        } elseif ($hasRole('DteWelfareGSO2') && $application->current_stage === 'DteWelfareGSO2') {
            if ($action === 'reject') {
                $nextStatus = 'rejected';
                $nextStage = 'Closed';
            }
            if ($action === 'approve') {
                $nextStatus = 'dte_approved';
                $nextStage = 'Closed';
            }
            $handled = true;
        }

        if (!$handled) {
            return back()->withErrors('Action not permitted');
        }

        $application->update([
            'status' => $nextStatus,
            'current_stage' => $nextStage,
            'cc_approved' => $updates['cc_approved'],
            'gso1_approved' => $updates['gso1_approved'],
        ]);

        ApprovalStep::create([
            'application_id' => $application->id,
            'level' => $currentStage,
            'actor_id' => $user->id,
            'action' => $action,
            'comment' => $data['comment'] ?? null,
            'created_at' => now(),
        ]);

        return redirect()->route('review.show', $application);
    }

    private function rolesArray(string $roles): array
    {
        return array_values(array_filter(array_map('trim', preg_split('/,\s*/', $roles))));
    }
}
