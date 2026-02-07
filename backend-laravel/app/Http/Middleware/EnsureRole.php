<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }
        $roles = array_map('trim', explode(',', $user->roles ?? ''));
        if (!in_array($role, $roles, true)) {
            abort(403);
        }
        return $next($request);
    }
}
