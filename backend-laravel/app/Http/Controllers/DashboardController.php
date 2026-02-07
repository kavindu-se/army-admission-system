<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Attachment;
use App\Models\ApprovalStep;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $roles = $this->rolesArray($user->roles ?? '');
        $isApplicant = in_array('Applicant', $roles, true);
        $isAdmin = in_array('Admin', $roles, true) || in_array('RHQAdmin', $roles, true);

        $appsQuery = Application::query()->orderByDesc('created_at');
        if ($isApplicant) {
            $appsQuery->where('applicant_id', $user->id);
        }
        $apps = $appsQuery->get();

        $attachmentsByApp = Attachment::whereIn('application_id', $apps->pluck('id')->all())
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('application_id');

        $historyRows = [];
        if (!$isApplicant) {
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
        }

        return view('dashboard', [
            'apps' => $apps,
            'attachmentsByApp' => $attachmentsByApp,
            'historyRows' => $historyRows,
            'isApplicant' => $isApplicant,
            'isAdmin' => $isAdmin,
            'roles' => $roles,
        ]);
    }

    private function rolesArray(string $roles): array
    {
        return array_values(array_filter(array_map('trim', preg_split('/,\s*/', $roles))));
    }
}
