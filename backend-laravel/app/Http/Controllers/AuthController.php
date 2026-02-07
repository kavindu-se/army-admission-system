<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLogin()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'service_no' => 'required|string',
            'password' => 'required|string',
        ]);

        $adminEmail = env('ADMIN_EMAIL');
        $adminPassword = env('ADMIN_PASSWORD');

        $serviceNo = $data['service_no'];
        $password = $data['password'];

        if ($adminEmail && $adminPassword && $serviceNo === $adminEmail && $password === $adminPassword) {
            $user = User::firstOrCreate(
                ['service_no' => $adminEmail],
                [
                    'name' => env('ADMIN_NAME', 'System Admin'),
                    'roles' => config('army.roles.ADMIN'),
                    'active' => true,
                ]
            );
            if ($user->active === false) {
                return back()->withErrors(['service_no' => 'User inactive']);
            }
            Auth::login($user);
            return redirect()->route('dashboard');
        }

        if ($password !== 'demo123') {
            return back()->withErrors(['service_no' => 'Invalid credentials']);
        }

        $user = User::firstOrCreate(
            ['service_no' => $serviceNo],
            [
                'name' => 'Applicant',
                'roles' => config('army.roles.APPLICANT'),
                'unit_id' => 1,
                'rhq_id' => 1,
                'active' => true,
            ]
        );

        if ($user->active === false) {
            return back()->withErrors(['service_no' => 'User inactive']);
        }

        Auth::login($user);
        return redirect()->route('dashboard');
    }

    public function logout()
    {
        Auth::logout();
        return redirect()->route('login');
    }
}
