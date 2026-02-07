<?php

namespace App\Support;

class Army
{
    public static function roles(): array
    {
        return config('army.roles');
    }

    public static function stages(): array
    {
        return config('army.stages');
    }

    public static function statuses(): array
    {
        return config('army.statuses');
    }

    public static function hasRole($user, string $role): bool
    {
        if (!$user || !$user->roles) {
            return false;
        }
        $roles = array_map('trim', explode(',', $user->roles));
        return in_array($role, $roles, true);
    }
}
