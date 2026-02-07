<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->orderByDesc('created_at');
        if ($request->filled('regiment')) {
            $query->where('regiment', $request->string('regiment')->toString());
        }
        if ($request->filled('unit_no')) {
            $query->where('unit_no', $request->string('unit_no')->toString());
        }
        $users = $query->get();
        $editUser = null;
        if ($request->filled('edit')) {
            $editUser = User::find($request->string('edit')->toString());
        }
        $roleOptions = array_values(config('army.roles'));

        $view = $request->routeIs('admin.filter') ? 'admin.filter' : 'admin.users';

        return view($view, compact('users', 'roleOptions', 'editUser'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'service_no' => 'required|string',
            'name' => 'required|string',
            'roles' => 'required|string',
            'regiment' => 'nullable|string',
            'unit_no' => 'nullable|string',
            'unit_id' => 'nullable|integer',
            'rhq_id' => 'nullable|integer',
            'active' => 'nullable|boolean',
        ]);

        User::updateOrCreate(
            ['service_no' => $data['service_no']],
            [
                'name' => $data['name'],
                'roles' => $data['roles'],
                'regiment' => $data['regiment'] ?? null,
                'unit_no' => $data['unit_no'] ?? null,
                'unit_id' => $data['unit_id'] ?? null,
                'rhq_id' => $data['rhq_id'] ?? null,
                'active' => $data['active'] ?? true,
            ]
        );

        return back()->with('status', 'Role assigned.');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'roles' => 'required|string',
            'regiment' => 'nullable|string',
            'unit_no' => 'nullable|string',
            'active' => 'nullable|boolean',
        ]);

        $user->update([
            'name' => $data['name'],
            'roles' => $data['roles'],
            'regiment' => $data['regiment'] ?? null,
            'unit_no' => $data['unit_no'] ?? null,
            'active' => $data['active'] ?? $user->active,
        ]);

        return back()->with('status', 'User updated.');
    }

    public function toggle(User $user)
    {
        $user->update(['active' => !$user->active]);
        return back()->with('status', $user->active ? 'User activated.' : 'User deactivated.');
    }

    public function destroy(User $user)
    {
        if (strtolower($user->service_no) === 'kavindu@gmail.com') {
            return back()->withErrors('Master admin cannot be deleted.');
        }
        $user->delete();
        return back()->with('status', 'User deleted.');
    }
}
